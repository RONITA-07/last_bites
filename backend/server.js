// ⚠️ MUST be first — load env vars before anything else uses them
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const { createClient } = require('@supabase/supabase-js');
const FoodListing = require('./models/FoodListing');

// Supabase client (env vars now loaded before this runs)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS — allow all origins (Vercel, localhost, etc.)
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('(.*)', cors(corsOptions)); // preflight for all routes — Node 24 compatible

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API Endpoints
app.use('/api/auth', require('./routes/auth'));
app.use('/api/food', require('./routes/food'));
app.use('/api/order', require('./routes/order'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    supabase_url: process.env.SUPABASE_URL ? '✅ set' : '❌ missing',
  });
});

// Auto-Expiry Engine: periodic interval checking pickup windows
setInterval(async () => {
  try {
    const now = new Date();
    const availableListings = await FoodListing.find({ status: 'available' });
    const expiredListings = availableListings.filter(
      item => new Date(item.pickup_time) < now
    );
    for (let listing of expiredListings) {
      await FoodListing.findByIdAndUpdate(listing._id, {
        $set: { status: 'expired' },
      });
      console.log(
        `[Auto-Expiry Engine]: Listing "${listing.title}" (ID: ${listing._id}) has expired.`
      );
    }
  } catch (err) {
    console.error('[Auto-Expiry Engine] Error:', err.message);
  }
}, 30000);

// Bootstrap DB connection & start server
async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.error('[DB] Connection failed — starting server without DB:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`==================================================================`);
    console.log(`  Last Bite Backend Server running on http://localhost:${PORT}`);
    console.log(`==================================================================`);
  });
}

startServer();
