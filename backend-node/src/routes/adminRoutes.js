const express = require('express');
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const { uploadMiddleware } = require('../middlewares/uploadMiddleware');
const { createReport, reportQueue, resolveReport, reviewOwnerVerification,
  revenue, listUsers, setUserStatus, permanentDeleteUser, verificationQueue, verifyProperty, pendingProperties,
  faceVerify } = require('../controllers/adminController');
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
router.get('/admin/reports', authMiddleware, requireRole('ADMIN'), reportQueue);
router.patch('/admin/reports/:id', authMiddleware, requireRole('ADMIN'), resolveReport);

// Admin: verification + property verification queues
router.get('/admin/verification-queue', authMiddleware, requireRole('ADMIN'), verificationQueue);
router.post('/admin/owner-verifications/:id/review', authMiddleware, requireRole('ADMIN'), reviewOwnerVerification);
router.get('/admin/properties/pending', authMiddleware, requireRole('ADMIN'), pendingProperties);
router.post('/admin/properties/:id/verify', authMiddleware, requireRole('ADMIN'), verifyProperty);

// Admin: users + revenue
router.get('/admin/users', authMiddleware, requireRole('ADMIN'), listUsers);
router.patch('/admin/users/:id/status', authMiddleware, requireRole('ADMIN'), setUserStatus);
router.delete('/admin/users/:id/permanent', authMiddleware, requireRole('ADMIN'), permanentDeleteUser);
router.get('/admin/revenue', authMiddleware, requireRole('ADMIN'), revenue);

module.exports = router;
