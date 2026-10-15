const express = require('express');
const router = express.Router();
const { isUser } = require('../middlewares/authMiddleware');
const {
  addReview,
  getProductReviews,
  checkCanReview
} = require('../controllers/reviewController');

router.get('/product/:productId', getProductReviews);
router.post('/add', isUser, addReview);
router.get('/can-review', isUser, checkCanReview);

module.exports = router;