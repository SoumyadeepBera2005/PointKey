const express = require('express');
const { signup, login, verifyLoginOtp, forgotPassword, resetPassword, adminLogin, sendOtp, verifyOtp, me, updateProfile } = require('../controllers/authController');
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
module.exports = router;
