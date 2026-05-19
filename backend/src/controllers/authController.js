const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('../config/database');
const { sendOTPEmail } = require('../services/emailService');

// ============================================
// REGISTER FUNCTION - Create a new user account
// ============================================
async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);

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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.ip ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const blockedIpResult = await pool.query(
      'SELECT * FROM blocked_ips WHERE ip_address = $1',
      [ipAddress]
    );

    if (blockedIpResult.rows.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Your IP has been blocked due to suspicious activity',
        decision: 'BLOCKED',
      });
    }

    const recentBlockedCountResult = await pool.query(
      `SELECT COUNT(*) FROM login_attempts WHERE ip_address = $1 AND decision = 'BLOCKED' AND timestamp > NOW() - INTERVAL '2 minutes'`,
      [ipAddress]
    );

    if (parseInt(recentBlockedCountResult.rows[0].count, 10) >= 5) {
      const alreadyBlockedResult = await pool.query(
        'SELECT * FROM blocked_ips WHERE ip_address = $1',
        [ipAddress]
      );

      if (alreadyBlockedResult.rows.length === 0) {
        await pool.query(
          'INSERT INTO blocked_ips (ip_address, reason) VALUES ($1, $2)',
          [ipAddress, 'Brute force detected - 5+ failed attempts in 2 minutes']
        );
      }

      return res.status(403).json({
        success: false,
        message: 'Your IP has been blocked due to suspicious activity',
        decision: 'BLOCKED',
      });
    }

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    async function getGeoInfo(address) {
      let country = 'Unknown';
      let city = 'Unknown';

      try {
        if (
          address === '::1' ||
          address === '127.0.0.1' ||
          address.startsWith('192.168.')
        ) {
          country = 'Localhost';
          city = 'Local Network';
        } else {
          const geoResponse = await axios.get(`http://ip-api.com/json/${address}`, {
            timeout: 3000,
          });

          if (geoResponse.data?.status === 'success') {
            country = geoResponse.data.country || 'Unknown';
            city = geoResponse.data.city || 'Unknown';
          }
        }
      } catch (geoError) {
        console.error('Geolocation lookup failed:', geoError?.message || geoError);
      }

      return { country, city };
    }

    if (!passwordMatch) {
      const { country, city } = await getGeoInfo(ipAddress);

      await pool.query(
        'INSERT INTO login_attempts (user_id, ip_address, user_agent, risk_score, decision, country, city) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [user.id, ipAddress, userAgent, 100, 'BLOCKED', country, city]
      );

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        decision: 'BLOCKED',
      });
    }

    const currentHour = new Date().getHours();

    let riskScore = 0;
    const ipCheck = await pool.query(
      'SELECT COUNT(*) FROM login_attempts WHERE user_id = $1 AND ip_address = $2',
      [user.id, ipAddress]
    );

    if (parseInt(ipCheck.rows[0].count, 10) === 0) {
      riskScore += 20;
    }

    if (currentHour >= 0 && currentHour < 5) {
      riskScore += 20;
    }

    let decision;
    if (riskScore <= 30) {
      decision = 'ALLOWED';
    } else if (riskScore <= 70) {
      decision = 'OTP_REQUIRED';
    } else {
      decision = 'BLOCKED';
    }

    const { country, city } = await getGeoInfo(ipAddress);

    await pool.query(
      'INSERT INTO login_attempts (user_id, ip_address, user_agent, risk_score, decision, country, city) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [user.id, ipAddress, userAgent, riskScore, decision, country, city]
    );

    if (decision === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Access blocked - suspicious activity detected',
        decision: 'BLOCKED',
        riskScore,
      });
    }

    if (decision === 'OTP_REQUIRED') {
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await pool.query(
        'INSERT INTO otp_codes (user_id, otp_code, expires_at, used) VALUES ($1, $2, $3, $4)',
        [user.id, otpCode, expiresAt, false]
      );

      await sendOTPEmail(user.email, otpCode);

      return res.status(200).json({
        success: false,
        message: 'OTP sent to your email',
        decision: 'OTP_REQUIRED',
        userId: user.id,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      decision: 'ALLOWED',
      riskScore,
      token,
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

// ============================================
// VERIFY OTP FUNCTION - Complete login with OTP
// ============================================
async function verifyOTP(req, res) {
  try {
    const { userId, otpCode } = req.body;

    if (!userId || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'userId and otpCode are required',
      });
    }

    const otpResult = await pool.query(
      'SELECT * FROM otp_codes WHERE user_id = $1 AND used = false ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    const otpRecord = otpResult.rows[0];

    if (!otpRecord || otpRecord.otp_code !== otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    await pool.query('UPDATE otp_codes SET used = true WHERE id = $1', [otpRecord.id]);

    const userResult = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
    });
  }
}

module.exports = {
  register,
  login,
  verifyOTP,
};
