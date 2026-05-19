const express = require('express');
const {
  getStats,
  getChartData,
  getHourlyData,
  getRecentAttempts,
  getBlockedIps,
  unblockIp,
  blockIp,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', authMiddleware, getStats);
router.get('/chart-data', authMiddleware, getChartData);
router.get('/hourly', authMiddleware, getHourlyData);
router.get('/recent-attempts', authMiddleware, getRecentAttempts);
router.get('/blocked-ips', authMiddleware, getBlockedIps);
router.post('/block-ip', authMiddleware, blockIp);
router.delete('/blocked-ips/:id', authMiddleware, unblockIp);

module.exports = router;
