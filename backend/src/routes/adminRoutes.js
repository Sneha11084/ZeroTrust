const express = require('express');
const {
  getStats,
  getChartData,
  getHourlyData,
  getRecentAttempts,
  getBlockedIps,
  unblockIp,
  blockIp,
  makeAdmin,
} = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/make-admin', makeAdmin);
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/chart-data', getChartData);
router.get('/hourly', getHourlyData);
router.get('/recent-attempts', getRecentAttempts);
router.get('/blocked-ips', getBlockedIps);
router.post('/block-ip', blockIp);
router.delete('/blocked-ips/:id', unblockIp);

module.exports = router;
