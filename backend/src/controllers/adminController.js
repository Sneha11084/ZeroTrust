const pool = require('../config/database');

function formatNumber(value) {
  return Number(value) || 0;
}

async function getStats(req, res) {
  try {
    const totalsResult = await pool.query(`
      SELECT
        COUNT(*) AS total_logins,
        SUM(CASE WHEN decision = 'ALLOWED' THEN 1 ELSE 0 END) AS safe_logins,
        SUM(CASE WHEN decision = 'OTP_REQUIRED' THEN 1 ELSE 0 END) AS suspicious_logins,
        SUM(CASE WHEN decision = 'BLOCKED' THEN 1 ELSE 0 END) AS blocked_logins,
        COALESCE(AVG(risk_score), 0) AS avg_risk_score
      FROM login_attempts;
    `);

    const activeUsersResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) AS active_users
      FROM login_attempts
      WHERE timestamp >= NOW() - INTERVAL '24 HOURS';
    `);

    const totals = totalsResult.rows[0];
    const activeUsers = activeUsersResult.rows[0].active_users || 0;

    const totalLogins = formatNumber(totals.total_logins);
    const safeLogins = formatNumber(totals.safe_logins);
    const suspiciousLogins = formatNumber(totals.suspicious_logins);
    const blockedLogins = formatNumber(totals.blocked_logins);
    const avgRiskScore = Number(parseFloat(totals.avg_risk_score).toFixed(2)) || 0;

    const blockedRatio = totalLogins > 0 ? (blockedLogins / totalLogins) * 100 : 0;
    let threatLevel = 'LOW';
    if (blockedRatio > 30) {
      threatLevel = 'HIGH';
    } else if (blockedRatio >= 10) {
      threatLevel = 'MEDIUM';
    }

    return res.json({
      totalLogins,
      safeLogins,
      suspiciousLogins,
      blockedLogins,
      avgRiskScore,
      activeUsers: Number(activeUsers),
      threatLevel,
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch admin statistics',
    });
  }
}

async function getChartData(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        date_trunc('day', timestamp)::date AS day,
        decision,
        COUNT(*) AS count
      FROM login_attempts
      WHERE timestamp >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY day, decision
      ORDER BY day ASC;
    `);

    const series = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      series.push({
        date: key,
        ALLOWED: 0,
        OTP_REQUIRED: 0,
        BLOCKED: 0,
      });
    }

    result.rows.forEach((row) => {
      const dayKey = row.day.toISOString().slice(0, 10);
      const entry = series.find((item) => item.date === dayKey);
      if (entry) {
        entry[row.decision] = Number(row.count);
      }
    });

    return res.json(series);
  } catch (err) {
    console.error('Error fetching chart data:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch chart data',
    });
  }
}

async function getHourlyData(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM timestamp)::integer AS hour,
        COUNT(*) AS count
      FROM login_attempts
      WHERE timestamp >= NOW() - INTERVAL '24 HOURS'
      GROUP BY hour
      ORDER BY hour ASC;
    `);

    const hourly = Array.from({ length: 24 }, (_, index) => ({
      hour: index,
      count: 0,
    }));

    result.rows.forEach((row) => {
      hourly[row.hour] = {
        hour: row.hour,
        count: Number(row.count),
      };
    });

    return res.json(hourly);
  } catch (err) {
    console.error('Error fetching hourly data:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch hourly data',
    });
  }
}

async function getRecentAttempts(req, res) {
  try {
    const result = await pool.query(`
      SELECT *
      FROM login_attempts
      ORDER BY timestamp DESC
      LIMIT 20;
    `);

    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching recent login attempts:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch recent login attempts',
    });
  }
}

async function getBlockedIps(req, res) {
  try {
    const result = await pool.query(`
      SELECT *
      FROM blocked_ips
      ORDER BY blocked_at DESC;
    `);

    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching blocked IPs:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch blocked IPs',
    });
  }
}

async function unblockIp(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      DELETE FROM blocked_ips
      WHERE id = $1
      RETURNING *;
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blocked IP not found',
      });
    }

    return res.json({
      success: true,
      message: 'Blocked IP removed',
      removed: result.rows[0],
    });
  } catch (err) {
    console.error('Error unblocking IP:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to unblock IP',
    });
  }
}

async function blockIp(req, res) {
  try {
    const { ipAddress, reason } = req.body;

    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required',
      });
    }

    const existing = await pool.query(
      'SELECT * FROM blocked_ips WHERE ip_address = $1',
      [ipAddress]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'IP address is already blocked',
      });
    }

    const result = await pool.query(
      'INSERT INTO blocked_ips (ip_address, reason) VALUES ($1, $2) RETURNING *',
      [ipAddress, reason || 'Manually blocked by administrator']
    );

    return res.status(201).json({
      success: true,
      message: 'IP blocked successfully',
      blockedIp: result.rows[0],
    });
  } catch (err) {
    console.error('Error blocking IP:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to block IP',
    });
  }
}

module.exports = {
  getStats,
  getChartData,
  getHourlyData,
  getRecentAttempts,
  getBlockedIps,
  unblockIp,
  blockIp,
};
