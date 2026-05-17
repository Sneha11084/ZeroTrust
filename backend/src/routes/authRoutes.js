const express = require('express');
const { register, login } = require('../controllers/authController');

// Create a router object
// A router is like a mini-application that handles specific routes
const router = express.Router();

// POST /register endpoint
// Receives: { email, password }
// Returns: New user info or error message
router.post('/register', register);

// POST /login endpoint
// Receives: { email, password }
// Returns: JWT token (if approved) or fraud alert
router.post('/login', login);

// Export the router so server.js can use it
module.exports = router;
