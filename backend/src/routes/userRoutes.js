const express = require('express');
const {
  getMyLoginHistory,
  getMyProfile,
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/my-history', authMiddleware, getMyLoginHistory);
router.get('/profile', authMiddleware, getMyProfile);

module.exports = router;
