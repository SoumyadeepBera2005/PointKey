const express = require('express');
const { authMiddleware, optionalAuth, requireRole } = require('../middlewares/authMiddleware');
const { uploadMiddleware } = require('../middlewares/uploadMiddleware');
const { createReport, reportQueue, resolveReport, reviewOwnerVerification,
  revenue, listUsers, getUserActivity, setUserStatus, permanentDeleteUser, verificationQueue, verifyProperty, pendingProperties,
  faceVerify, listAllProperties, adminUpdateBookingStatus, adminUpdateProperty, adminDeleteProperty } = require('../controllers/adminController');
const { rate, myReceivedRatings } = require('../controllers/ratingController');

const router = express.Router();

// Face verification (owner onboarding) — multipart
router.post(
  '/owner/face-verify',
  authMiddleware,
  requireRole('OWNER'),
  uploadMiddleware.fields([{ name: 'id_card_image', maxCount: 1 }, { name: 'live_selfie', maxCount: 1 }]),
  faceVerify
);

// Ratings
router.post('/ratings', authMiddleware, rate);
router.get('/ratings/received', authMiddleware, myReceivedRatings);

// Reports (any signed-in user) / admin queue
router.post('/reports', authMiddleware, createReport);
router.get('/admin/reports', optionalAuth, reportQueue);
router.patch('/admin/reports/:id', optionalAuth, resolveReport);

// Admin: verification + property verification queues
router.get('/admin/verification-queue', optionalAuth, verificationQueue);
router.post('/admin/owner-verifications/:id/review', optionalAuth, reviewOwnerVerification);
router.get('/admin/properties/pending', optionalAuth, pendingProperties);
router.post('/admin/properties/:id/verify', optionalAuth, verifyProperty);

// Admin: all properties management (booked, unbooked, modify, delete)
router.get('/admin/properties', optionalAuth, listAllProperties);
router.patch('/admin/properties/:id/booking', optionalAuth, adminUpdateBookingStatus);
router.put('/admin/properties/:id', optionalAuth, adminUpdateProperty);
router.delete('/admin/properties/:id', optionalAuth, adminDeleteProperty);

// Admin: users + revenue
router.get('/admin/users', optionalAuth, listUsers);
router.get('/admin/users/:id/activity', optionalAuth, getUserActivity);
router.patch('/admin/users/:id/status', optionalAuth, setUserStatus);
router.delete('/admin/users/:id/permanent', optionalAuth, permanentDeleteUser);
router.get('/admin/revenue', optionalAuth, revenue);

module.exports = router;
