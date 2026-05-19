const pool = require('../config/database');

async function getMyLoginHistory(req, res) {
  try {
    const { id: userId } = req.user;
    const result = await pool.query(
      `SELECT * FROM login_attempts WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10`,
      [userId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user login history:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch login history',
    });
  }
}

async function getMyProfile(req, res) {
  try {
    const { id: userId } = req.user;
    const result = await pool.query(
      `SELECT email, created_at FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch user profile',
    });
  }
}

module.exports = {
  getMyLoginHistory,
  getMyProfile,
};
