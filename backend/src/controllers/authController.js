const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// ============================================
// REGISTER FUNCTION - Create a new user account
// ============================================
async function register(req, res) {
  try {
    const { email, password } = req.body;

    // Validate that email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check if email already exists in database
    const emailCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash the password using bcryptjs
    // bcrypt makes passwords unreadable even to database admins
    // 10 is the "salt rounds" - higher number = more secure but slower
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user to database
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, hashedPassword]
    );

    const newUser = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
}

// ============================================
// LOGIN FUNCTION - Authenticate user and detect fraud
// ============================================
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate that email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Get user from database by email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    // If no user found, return generic error (don't reveal which emails exist)
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = userResult.rows[0];

    // Compare provided password with stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // ===== FRAUD DETECTION: Calculate Risk Score =====
    // Extract IP address from request
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.ip ||
      'unknown';

    // Extract User-Agent (what device/browser they're using)
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Get current hour (0-23, where 0 is midnight)
    const currentHour = new Date().getHours();

    let riskScore = 0;

    // Check if login is from a NEW IP address (unknown IP adds 20 points)
    const ipCheck = await pool.query(
      'SELECT COUNT(*) FROM login_attempts WHERE user_id = $1 AND ip_address = $2',
      [user.id, ipAddress]
    );

    if (parseInt(ipCheck.rows[0].count) === 0) {
      riskScore += 20; // Unknown IP = suspicious
    }

    // Check if login is during unusual hours (12am-5am adds 20 points)
    if (currentHour >= 0 && currentHour < 5) {
      riskScore += 20; // Late night login = more suspicious
    }

    // ===== DECISION LOGIC: Based on risk score =====
    let decision;
    if (riskScore <= 30) {
      decision = 'ALLOWED';
    } else if (riskScore <= 70) {
      decision = 'OTP_REQUIRED'; // Require extra verification
    } else {
      decision = 'BLOCKED'; // Too suspicious
    }

    // Save login attempt to database (for fraud tracking and analysis)
    const country = 'Unknown'; // In a real app, use IP geolocation API
    const city = 'Unknown';

    await pool.query(
      'INSERT INTO login_attempts (user_id, ip_address, user_agent, risk_score, decision, country, city) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [user.id, ipAddress, userAgent, riskScore, decision, country, city]
    );

    // If login is blocked, reject it
    if (decision === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Access blocked - suspicious activity detected',
        decision: 'BLOCKED',
        riskScore: riskScore,
      });
    }

    // If OTP is required, don't return JWT yet - ask for extra verification
    if (decision === 'OTP_REQUIRED') {
      return res.status(200).json({
        success: false,
        message: 'OTP verification required',
        decision: 'OTP_REQUIRED',
        riskScore: riskScore,
        userId: user.id,
      });
    }

    // LOGIN ALLOWED - Create JWT token
    // JWT contains user info and expires in 24 hours
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      decision: 'ALLOWED',
      riskScore: riskScore,
      token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
}

// Export both functions so routes can use them
module.exports = {
  register,
  login,
};
