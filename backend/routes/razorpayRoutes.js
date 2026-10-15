const express = require('express');
const router = express.Router();
const { isUser } = require('../middlewares/authMiddleware');
const {
  createRazorpayOrder,
  verifyRazorpayPayment
} = require('../controllers/razorpayController');

router.post('/create-order', isUser, createRazorpayOrder);
router.post('/verify', isUser, verifyRazorpayPayment);

module.exports = router;