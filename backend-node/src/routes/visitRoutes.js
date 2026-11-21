const express = require('express');
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');
const {
  requestVisit, myVisits, ownerRequests, updateVisitStatus, visitHistory,
} = require('../controllers/visitController');

const router = express.Router();
router.post('/request', authMiddleware, requireRole('TENANT'), requestVisit);
router.get('/mine', authMiddleware, myVisits);
router.get('/owner-requests', authMiddleware, requireRole('OWNER'), ownerRequests);
router.patch('/:id/status', authMiddleware, updateVisitStatus);
router.get('/history/:propertyId', authMiddleware, requireRole('OWNER', 'ADMIN'), visitHistory);
module.exports = router;
