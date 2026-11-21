const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  checkout, verify, webhook, myRefunds, requestRefund, receipts,
} = require('../controllers/paymentController');

const router = express.Router();
router.post('/checkout', authMiddleware, checkout);
router.post('/verify', authMiddleware, verify);
router.post('/webhook', webhook); // signature-verified internally
router.get('/my-refunds', authMiddleware, myRefunds);
router.post('/:id/refund', authMiddleware, requestRefund);
router.get('/receipts', authMiddleware, receipts);
module.exports = router;
