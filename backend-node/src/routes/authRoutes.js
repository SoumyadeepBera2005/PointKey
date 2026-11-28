const express = require('express');
const {
  signup,
  login,
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
  adminLogin,
  sendOtp,
  verifyOtp,
  me,
  updateProfile,
  submitUnblockAppeal,
  getNotifications,
  markNotificationsRead,
} = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/admin/login', adminLogin);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', authMiddleware, me);
router.patch('/profile', authMiddleware, updateProfile);

// ইউজার নোটিফিকেশন এন্ডপয়েন্ট
router.get('/notifications', authMiddleware, getNotifications);
router.post('/notifications/read', authMiddleware, markNotificationsRead);
router.patch('/notifications/read-all', authMiddleware, markNotificationsRead);

// ইউজার আনব্লক আপিল আবেদন সাবমিট এন্ডপয়েন্ট
router.post('/unblock-appeal', authMiddleware, submitUnblockAppeal);

module.exports = router;
