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
router.get('/owner/my-listings', authMiddleware, requireRole('OWNER'), myListings);
router.get('/:id', optionalAuth, applyPropertyPrivacy, getProperty);
// নতুন প্রপার্টি অ্যাড করার আগে ওনার অ্যাক্টিভ কিনা (সাসপেন্ডেড বা ব্লকড নয়) তা যাচাই করা হয়
router.post('/', authMiddleware, requireRole('OWNER'), requireActiveAccount, createProperty);
router.patch('/:id/booking-status', authMiddleware, setBookingStatus);
router.delete('/:id', authMiddleware, deleteProperty);
router.post('/:id/media', authMiddleware, requireRole('OWNER'), uploadMiddleware.single('file'), addMedia);
module.exports = router;
