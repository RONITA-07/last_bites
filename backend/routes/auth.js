const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'decarb_secret_key_2026';

// ── Geocode helper — free Nominatim API, no key required ─────────────────────
async function geocodeAddress(area, locality, pincode, state) {
  try {
    const query = [area, locality, pincode, state, 'India'].filter(Boolean).join(', ');
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'decarb-io-app/1.0' } });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn('[Geocode] Nominatim failed, using pincode fallback:', e.message);
  }
  // Fallback: India center + pincode-derived offset so records differ geographically
  const offset = (parseInt(pincode || '0') % 1000) / 10000;
  return { lat: 20.5937 + offset, lng: 78.9629 + offset };
}

// ── Register Route ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { role, name, email, password, address, gstin, ngo_id, certificate } = req.body;

    if (!role || !name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    if (!['customer', 'restaurant', 'ngo'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Address fields are optional — default to empty strings
    const area     = address?.area     || '';
    const locality = address?.locality || '';
    const pincode  = address?.pincode  || '';
    const state    = address?.state    || '';

    // Duplicate email check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Geocode address to lat/lng for proximity features
    const coords = await geocodeAddress(area, locality, pincode, state);
    console.log(`[Geocode] ${name} → lat: ${coords.lat}, lng: ${coords.lng}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      role,
      name,
      email,
      password: hashedPassword,
      address: { area, locality, pincode, state },
      location: coords,
      ...(gstin   && { gstin }),
      ...(ngo_id  && { ngo_id, certificate })
    });

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        role: newUser.role,
        name: newUser.name,
        email: newUser.email,
        address: newUser.address,
        location: newUser.location,
        walletBalance: newUser.walletBalance || 0,
        coinsBalance: newUser.coinsBalance || 0
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Login Route ────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Normalize: treat email as case-insensitive identifier

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        address: user.address,
        location: user.location,
        walletBalance: user.walletBalance || 0,
        coinsBalance: user.coinsBalance || 0
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET Wallet Balance
router.get('/wallet/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ walletBalance: user.walletBalance || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Top-up Wallet
router.post('/wallet/topup', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid userId or amount' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const newBalance = Number((Number(user.walletBalance || 0) + Number(amount)).toFixed(2));
    await User.findByIdAndUpdate(userId, { $set: { walletBalance: newBalance } });
    res.json({ walletBalance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Pay using Wallet
router.post('/wallet/pay', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid userId or amount' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const currentBalance = Number(user.walletBalance || 0);
    const cost = Number(amount);
    if (currentBalance < cost) {
      return res.status(400).json({ error: 'Insufficient wallet balance.' });
    }
    
    const newBalance = Number((currentBalance - cost).toFixed(2));
    await User.findByIdAndUpdate(userId, { $set: { walletBalance: newBalance } });
    res.json({ walletBalance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Coins Balance
router.get('/coins/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ coinsBalance: user.coinsBalance || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Redeem Coins
router.post('/coins/redeem', async (req, res) => {
  try {
    const { userId, coinsToRedeem } = req.body;
    if (!userId || isNaN(Number(coinsToRedeem)) || Number(coinsToRedeem) <= 0) {
      return res.status(400).json({ error: 'Invalid userId or coinsToRedeem' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentCoins = Number(user.coinsBalance || 0);
    const toRedeem = Math.floor(Number(coinsToRedeem));
    if (currentCoins < toRedeem) {
      return res.status(400).json({ error: 'Insufficient coin balance.' });
    }

    const newCoins = currentCoins - toRedeem;
    await User.findByIdAndUpdate(userId, { $set: { coinsBalance: newCoins } });
    res.json({ coinsBalance: newCoins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
