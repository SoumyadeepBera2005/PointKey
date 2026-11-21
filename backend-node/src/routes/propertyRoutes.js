const express = require('express');
const { optionalAuth, authMiddleware, requireRole } = require('../middlewares/authMiddleware');
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
router.post('/', authMiddleware, requireRole('OWNER'), createProperty);
router.patch('/:id/booking-status', authMiddleware, setBookingStatus);
router.delete('/:id', authMiddleware, deleteProperty);
router.post('/:id/media', authMiddleware, requireRole('OWNER'), uploadMiddleware.single('file'), addMedia);
module.exports = router;
