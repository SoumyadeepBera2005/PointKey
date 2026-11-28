const express = require('express');
const { optionalAuth, authMiddleware, requireRole, requireActiveAccount } = require('../middlewares/authMiddleware');
const { applyPropertyPrivacy } = require('../middlewares/privacyGuard');
const { uploadMiddleware } = require('../middlewares/uploadMiddleware');
const { searchProperties } = require('../controllers/searchController');
const {
  getProperty, myListings, createProperty, setBookingStatus, deleteProperty, addMedia,
} = require('../controllers/propertyController');

const router = express.Router();
router.get('/search', searchProperties);
router.get('/owner/my-listings', authMiddleware, myListings);
router.get('/my', authMiddleware, myListings);
router.get('/:id', optionalAuth, applyPropertyPrivacy, getProperty);
// নতুন প্রপার্টি যে কোনো রেজিস্টার্ড ও অ্যাক্টিভ ইউজার (টেন্যান্ট/ওনার) পোস্ট করতে পারবেন। পোস্ট করলে টেন্যান্ট স্বয়ংক্রিয়ভাবে TENANT+OWNER হিসেবে গণ্য হবে।
router.post('/', authMiddleware, requireActiveAccount, createProperty);
router.patch('/:id/booking-status', authMiddleware, setBookingStatus);
router.delete('/:id', authMiddleware, deleteProperty);
router.post('/:id/media', authMiddleware, requireRole('OWNER'), uploadMiddleware.single('file'), addMedia);
module.exports = router;
