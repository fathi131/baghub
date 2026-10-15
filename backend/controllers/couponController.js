const Coupon = require('../models/Coupon');

const listCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching coupons', error: error.message });
  }
};

const listAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      expiryDate: { $gte: startOfToday }
    }).sort({ expiryDate: 1, createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching available coupons', error: error.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      startDate,
      expiryDate,
      description,
      isActive
    } = req.body;

    if (!code || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Code, discount value, and expiry date are required.' });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    if (!normalizedCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is invalid.' });
    }

    const exists = await Coupon.findOne({ code: normalizedCode });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    const parsedDiscountValue = Number(discountValue);
    if (parsedDiscountValue <= 0) {
      return res.status(400).json({ success: false, message: 'Discount value must be greater than zero.' });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: parsedDiscountValue,
      maxDiscount: Number(maxDiscount || 0),
      minOrderAmount: Number(minOrderAmount || 0),
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: new Date(expiryDate),
      description: description || '',
      isActive: isActive !== false
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating coupon', error: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting coupon', error: error.message });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, orderAmount } = req.body;
    const amount = Number(orderAmount || 0);

    if (!couponCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = await Coupon.findOne({
      code: String(couponCode).trim().toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const now = new Date();
    const expiryDate = new Date(coupon.expiryDate);
    expiryDate.setUTCHours(23, 59, 59, 999);
    if (now < new Date(coupon.startDate) || now > expiryDate) {
      return res.status(400).json({ success: false, message: 'Coupon is not valid for the current date.' });
    }

    if (amount < Number(coupon.minOrderAmount || 0)) {
      return res.status(400).json({ success: false, message: `Minimum order value for this coupon is ₹${coupon.minOrderAmount}.` });
    }

    let discountAmount = 0;

    if (coupon.discountType === 'fixed') {
      discountAmount = Number(coupon.discountValue || 0);
    } else {
      discountAmount = (amount * Number(coupon.discountValue || 0)) / 100;
      if (coupon.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountAmount: Number(discountAmount.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error applying coupon', error: error.message });
  }
};

module.exports = {
  listCoupons,
  listAvailableCoupons,
  createCoupon,
  deleteCoupon,
  applyCoupon
};
