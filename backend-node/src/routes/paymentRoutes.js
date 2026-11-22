const express = require('express');
const { authMiddleware, requireActiveAccount } = require('../middlewares/authMiddleware');
const {
  checkout, verify, webhook, myRefunds, requestRefund, receipts,
} = require('../controllers/paymentController');

const router = express.Router();
// পেমেন্ট চেকআউট করার আগে ইউজার এক্টিভ কিনা যাচাই করা হয় (সাসপেন্ডেড হলে পেমেন্ট বন্ধ থাকবে)
router.post('/checkout', authMiddleware, requireActiveAccount, checkout);
router.post('/verify', authMiddleware, verify);
router.post('/webhook', webhook); // signature-verified internally
router.get('/my-refunds', authMiddleware, myRefunds);
router.post('/:id/refund', authMiddleware, requestRefund);
router.get('/receipts', authMiddleware, receipts);
module.exports = router;
