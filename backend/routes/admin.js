const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'admin_settings.json');

// Helper to read admin settings
function readSettings() {
  if (!fs.existsSync(path.dirname(SETTINGS_FILE))) {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    const defaultSettings = {
      adCoinsValue: 15,
      activeAds: [
        {
          id: 'ad_1',
          title: 'EcoBite Organic Surplus Box',
          company: 'EcoBite Groceries',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fruits-and-vegetables-in-a-market-stall-42284-large.mp4', // Safe public royalty-free dummy stock video link
          duration: 5, // 5 second count timer
          description: 'Save 70% on premium organic surpluses! Watch to earn reward coins.'
        },
        {
          id: 'ad_2',
          title: 'SaveFood Solar Baking',
          company: 'Solar Bakeries Inc.',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-freshly-baked-breads-in-baskets-40439-large.mp4',
          duration: 5,
          description: 'Delicious zero-carbon artisan breads. Fuel your day sustainably!'
        },
        {
          id: 'ad_3',
          title: 'RescueMeals Community Kitchens',
          company: 'RescueMeals Foundation',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-salad-in-a-kitchen-42171-large.mp4',
          duration: 5,
          description: 'Every coin you donate feeds a hungry family. Join our community!'
        }
      ]
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch (e) {
    return { adCoinsValue: 15, activeAds: [] };
  }
}

// Helper to write admin settings
function writeSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// GET Admin Settings
router.get('/settings', (req, res) => {
  try {
    const settings = readSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Update Admin Settings
router.post('/settings', (req, res) => {
  try {
    const { adCoinsValue, activeAds } = req.body;
    const settings = readSettings();

    if (adCoinsValue !== undefined) {
      settings.adCoinsValue = Math.max(1, parseInt(adCoinsValue));
    }
    if (activeAds !== undefined && Array.isArray(activeAds)) {
      settings.activeAds = activeAds;
    }

    writeSettings(settings);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET All Users data for verification panel
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    // Exclude password hashes for security
    const safeUsers = users.map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Toggle User Verification Status
router.post('/users/verify', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedVerification = !user.isVerified;
    const updated = await User.findByIdAndUpdate(userId, { 
      $set: { isVerified: updatedVerification } 
    });

    res.json({ success: true, userId, isVerified: updatedVerification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Toggle Legend Badge Status
router.post('/users/legend', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedLegend = !user.isLegend;
    await User.findByIdAndUpdate(userId, { 
      $set: { isLegend: updatedLegend } 
    });

    res.json({ success: true, userId, isLegend: updatedLegend });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
