const express = require('express');
const { register, login, verifyOTP } = require('../controllers/authController');

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

// POST /verify-otp endpoint
// Receives: { userId, otpCode }
// Verifies the OTP and returns a JWT if valid
router.post('/verify-otp', verifyOTP);

// Export the router so server.js can use it
module.exports = router;
