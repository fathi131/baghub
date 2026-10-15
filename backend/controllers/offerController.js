const Offer = require('../models/Offer');
const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');

const buildOfferFields = async (payload) => {
  const name = String(payload.name || '').trim();
  const { type, targetId, discountType = 'percentage', startDate, expiryDate, description = '' } = payload;
  const discountValue = Number(payload.discountValue);
  const maxDiscount = Number(payload.maxDiscount || 0);

  if (!name || !['product', 'category', 'referral'].includes(type)) {
    const error = new Error('Offer name and a valid offer type are required.');
    error.status = 400;
    throw error;
  }
  if (!['percentage', 'fixed'].includes(discountType)) {
    const error = new Error('Discount type must be percentage or fixed.');
    error.status = 400;
    throw error;
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0 || !Number.isFinite(maxDiscount) || maxDiscount < 0) {
    const error = new Error('Enter a valid discount value and maximum discount.');
    error.status = 400;
    throw error;
  }

  const start = new Date(startDate);
  const expiry = new Date(expiryDate);
  if (!startDate || !expiryDate || Number.isNaN(start.getTime()) || Number.isNaN(expiry.getTime())) {
    const error = new Error('Valid start and expiry dates are required.');
    error.status = 400;
    throw error;
  }
  expiry.setUTCHours(23, 59, 59, 999);
  if (start > expiry) {
    const error = new Error('Expiry date must be on or after the start date.');
    error.status = 400;
    throw error;
  }

  if (type !== 'referral') {
    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      const error = new Error('Select a valid product or category for this offer.');
      error.status = 400;
      throw error;
    }
    const target = type === 'product'
      ? await Product.findById(targetId)
      : await Category.findById(targetId);
    if (!target) {
      const error = new Error(`${type === 'product' ? 'Product' : 'Category'} not found.`);
      error.status = 404;
      throw error;
    }
  }

  return {
    name,
    type,
    targetId: type === 'referral' ? null : targetId,
    targetModel: type === 'product' ? 'Product' : type === 'category' ? 'Category' : null,
    discountType,
    discountValue,
    maxDiscount,
    startDate: start,
    expiryDate: expiry,
    description: String(description).trim()
  };
};

const listOffers = async (req, res) => {
  try {
    const offers = await Offer.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching offers', error: error.message });
  }
};

const createOffer = async (req, res) => {
  try {
    const fields = await buildOfferFields(req.body);
    const offer = await Offer.create(fields);
    res.status(201).json({ success: true, message: 'Offer created successfully', offer });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error creating offer' });
  }
};

const updateOffer = async (req, res) => {
  try {
    const fields = await buildOfferFields(req.body);
    const offer = await Offer.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found.' });
    return res.status(200).json({ success: true, message: 'Offer updated successfully', offer });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Error updating offer' });
  }
};

const updateOfferStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be true or false.' });
    }
    const offer = await Offer.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found.' });
    return res.status(200).json({ success: true, offer });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not update offer status.' });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByIdAndDelete(id);

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    res.status(200).json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting offer', error: error.message });
  }
};

const getApplicableOffers = async (products = []) => {
  if (!products.length) return [];
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const productIds = products.map((product) => product._id).filter(Boolean);
  const categoryIds = products
    .map((product) => product.category?._id || product.category)
    .filter(Boolean);
  const targets = [];
  if (productIds.length) targets.push({ type: 'product', targetId: { $in: productIds } });
  if (categoryIds.length) targets.push({ type: 'category', targetId: { $in: categoryIds } });
  if (!targets.length) return products.map(() => null);

  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    expiryDate: { $gte: startOfToday },
    $or: targets
  }).sort({ createdAt: -1 }).lean();

  return products.map((product) => {
    const productId = String(product._id);
    const categoryId = String(product.category?._id || product.category || '');
    const matchingOffers = offers.filter((offer) => (
      (offer.type === 'product' && String(offer.targetId) === productId) ||
      (offer.type === 'category' && String(offer.targetId) === categoryId)
    ));
    const discountAmount = (offer) => {
      if (offer.discountType === 'fixed') return Number(offer.discountValue || 0);
      const percentageAmount = Number(product.price || 0) * Number(offer.discountValue || 0) / 100;
      return offer.maxDiscount > 0 ? Math.min(percentageAmount, offer.maxDiscount) : percentageAmount;
    };
    matchingOffers.sort((left, right) => {
      const amountDifference = discountAmount(right) - discountAmount(left);
      if (amountDifference !== 0) return amountDifference;
      if (left.type !== right.type) return left.type === 'product' ? -1 : 1;
      return new Date(right.createdAt) - new Date(left.createdAt);
    });
    const best = matchingOffers[0];
    if (!best) return null;
    return {
      name: best.name,
      description: best.description,
      discountType: best.discountType,
      discountValue: best.discountValue,
      maxDiscount: best.maxDiscount,
      expiryDate: best.expiryDate
    };
  });
};

const getApplicableOffer = async (productId, categoryId, price = 0) => {
  const [offer] = await getApplicableOffers([{ _id: productId, category: categoryId, price }]);
  return offer;
};

const getOfferSummary = async (req, res) => {
  try {
    const { productId, categoryId } = req.query;
    const offer = await getApplicableOffer(productId, categoryId);
    res.status(200).json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching offer summary', error: error.message });
  }
};

module.exports = {
  listOffers,
  createOffer,
  updateOffer,
  updateOfferStatus,
  deleteOffer,
  getOfferSummary,
  getApplicableOffer,
  getApplicableOffers
};
