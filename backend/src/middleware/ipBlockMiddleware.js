const pool = require('../config/database');

async function ipBlockMiddleware(req, res, next) {
  try {
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.ip ||
      'unknown';

    const blockedResult = await pool.query(
      'SELECT * FROM blocked_ips WHERE ip_address = $1',
      [ipAddress]
    );

    if (blockedResult.rows.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Your IP has been blocked due to suspicious activity',
        decision: 'BLOCKED',
      });
    }

    next();
  } catch (err) {
    console.error('IP block middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error validating IP block',
    });
  }
}

module.exports = ipBlockMiddleware;
