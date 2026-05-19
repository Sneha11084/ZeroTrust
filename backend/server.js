require('dotenv').config();
const express = require('express');
const cors = require('cors');
const createTables = require('./src/config/createTables');

// Import the database connection (this connects to PostgreSQL when imported)
const pool = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database - create tables when server starts
createTables();

// Register auth routes with /api/auth prefix
// This makes the endpoints: /api/auth/register and /api/auth/login
app.use('/api/auth', authRoutes);

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
