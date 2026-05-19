require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const createTables = require('./src/config/createTables');

// Import the database connection (this connects to PostgreSQL when imported)
const pool = require('./src/config/database');
const ipBlockMiddleware = require('./src/middleware/ipBlockMiddleware');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const googleAuthRoutes = require('./src/routes/googleAuthRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(ipBlockMiddleware);

require('./src/config/passport');

// Initialize database - create tables when server starts
createTables();

// Register auth routes with /api/auth prefix
// This makes the endpoints: /api/auth/register and /api/auth/login
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);

// Register admin routes with /api/admin prefix
app.use('/api/admin', adminRoutes);

// Register user routes with /api/user prefix
app.use('/api/user', userRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ZeroTrust backend is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`ZeroTrust server running on port ${PORT}`);
});
