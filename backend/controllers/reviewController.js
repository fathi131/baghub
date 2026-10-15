const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');


const addReview = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { productId, orderId, rating, title, comment } = req.body;

    
    if (!productId || !orderId || !rating || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const ratingNum = Number(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    
    const productInOrder = order.items.some(
      (item) => String(item.productId) === String(productId)
    );
    if (!productInOrder) {
      return res.status(400).json({ message: 'Product not in this order' });
    }

    
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be reviewed' });
    }

    
    const existing = await Review.findOne({ productId, userId, orderId });
    if (existing) {
      return res.status(400).json({ message: 'You already reviewed this product for this order' });
    }

    const review = await Review.create({
      productId,
      userId,
      orderId,
      rating: ratingNum,
      title: title || '',
      comment,
      isVerifiedPurchase: true
    });

    await review.populate('userId', 'name profileImage');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('addReview error:', error);
    res.status(500).json({ message: 'Could not submit review', error: error.message });
  }
};


const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId })
      .populate('userId', 'name profileImage')
      .sort({ createdAt: -1 })
      .lean();

    
    const totalCount = reviews.length;
    const avgRating =
      totalCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
        : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      reviews,
      avgRating: Number(avgRating.toFixed(1)),
      totalCount,
      distribution
    });
  } catch (error) {
    console.error('getProductReviews error:', error);
    res.status(500).json({ message: 'Could not load reviews', error: error.message });
  }
};


const checkCanReview = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { productId, orderId } = req.query;

    if (!productId || !orderId) {
      return res.status(400).json({ message: 'Product ID and Order ID required' });
    }

    const existing = await Review.findOne({ productId, userId, orderId });

    res.status(200).json({
      success: true,
      canReview: !existing,
      alreadyReviewed: !!existing
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addReview,
  getProductReviews,
  checkCanReview
};