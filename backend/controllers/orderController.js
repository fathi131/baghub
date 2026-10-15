const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/userModel');
const Offer = require('../models/Offer');
const Cart = require('../models/Cart'); 
const PDFDocument = require('pdfkit');

const createOrderId = () => `ORD-${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const creditWalletForUser = async (userId, amount, reason, orderId = '') => {
  if (!userId || !amount || Number(amount) <= 0) return;

  const transaction = {
    type: 'credit',
    amount: Number(amount),
    reason,
    orderId,
    createdAt: new Date()
  };
  const filter = { _id: userId };
  if (orderId) {
    filter.walletTransactions = {
      $not: { $elemMatch: { reason, orderId } }
    };
  }

  await User.updateOne(filter, {
    $inc: { walletBalance: Number(amount) },
    $push: { walletTransactions: { $each: [transaction], $position: 0 } }
  });
};

const getReferralRewardAmount = async (subtotal) => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const offer = await Offer.findOne({
    type: 'referral',
    isActive: true,
    startDate: { $lte: now },
    expiryDate: { $gte: startOfToday }
  }).sort({ createdAt: -1 });
  if (!offer) return 0;

  let amount = offer.discountType === 'fixed'
    ? Number(offer.discountValue || 0)
    : Number(subtotal || 0) * Number(offer.discountValue || 0) / 100;
  if (offer.discountType === 'percentage' && Number(offer.maxDiscount) > 0) {
    amount = Math.min(amount, Number(offer.maxDiscount));
  }
  return Number(amount.toFixed(2));
};

const creditReferralWallet = async (userId, amount, reason, orderId) => {
  const user = await User.findById(userId);
  if (!user) return;
  const alreadyCredited = user.walletTransactions.some(
    (transaction) => transaction.reason === reason && transaction.orderId === orderId
  );
  if (alreadyCredited) return;

  user.walletBalance = Number(user.walletBalance || 0) + amount;
  user.walletTransactions.unshift({ type: 'credit', amount, reason, orderId, createdAt: new Date() });
  await user.save();
};

const rewardReferralForDeliveredOrder = async (order) => {
  const referredUser = await User.findById(order.userId);
  if (!referredUser?.referredBy || referredUser.referralRewardEarned) return;

  const amount = await getReferralRewardAmount(order.subtotal);
  if (amount <= 0) return;

  const referrer = await User.findById(referredUser.referredBy);
  if (!referrer) return;

  await creditReferralWallet(referredUser._id, amount, 'Referral welcome reward', order.orderId);
  await creditReferralWallet(referrer._id, amount, 'Referral reward', order.orderId);
  referredUser.referralRewardEarned = true;
  referredUser.referralRewardAmount = amount;
  referredUser.referralRewardedAt = new Date();
  await referredUser.save();
};

const deductWalletForUser = async (userId, amount, reason, orderId = '') => {
  if (!userId || !amount || Number(amount) <= 0) return;

  const user = await User.findById(userId);
  if (!user) return;

  if (Number(user.walletBalance || 0) < Number(amount)) {
    throw new Error('Insufficient wallet balance');
  }

  user.walletBalance = Number(user.walletBalance || 0) - Number(amount);
  user.walletTransactions.unshift({
    type: 'debit',
    amount: Number(amount),
    reason,
    orderId,
    createdAt: new Date()
  });

  await user.save();
};

const createOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const {
      items = [],
      shippingAddress,
      paymentMethod = 'Cash On Delivery',
      subtotal = 0,
      tax = 0,
      shippingFee = 0,
      discount = 0,
      couponCode = ''
    } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!items.length || !shippingAddress) {
      return res.status(400).json({ message: 'Order items and shipping address are required' });
    }

    const normalizedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      if ((product.stockCount || 0) < Number(item.quantity || 0)) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const quantity = Number(item.quantity || 1);
      const price = Number(product.price || 0);
      const total = price * quantity;

      calculatedSubtotal += total;
      normalizedItems.push({
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || '',
        quantity,
        price,
        total
      });
    }

    const finalTax = Number(tax || 0);
    const finalShippingFee = Number(shippingFee || 0);
    const finalDiscount = Number(discount || 0);
    const totalAmount = Math.max(0, calculatedSubtotal + finalTax + finalShippingFee - finalDiscount);

     if (paymentMethod === 'Wallet') {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (Number(user.walletBalance || 0) < totalAmount) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
    }

    const order = await Order.create({
      userId,
      orderId: createOrderId(),
      paymentMethod,
      status: 'pending',
      items: normalizedItems,
      shippingAddress,
      subtotal: calculatedSubtotal || Number(subtotal || 0),
      tax: finalTax,
      shippingFee: finalShippingFee,
      discount: finalDiscount,
      totalAmount,
      couponCode
    });

    if (paymentMethod === 'Wallet') {
      await deductWalletForUser(userId, totalAmount, 'Order payment', order.orderId);
      order.status = 'pending';
      await order.save();
    }

    await Promise.all(
      normalizedItems.map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stockCount: -item.quantity } })
      )
    );
      await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [] } }
    );

    res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

const getUserOrderById = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

const cancelUserOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;
    const { reason = '' } = req.body;

    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['cancelled', 'delivered'].includes(order.status)) {
      return res.status(400).json({ message: `Order is already ${order.status}` });
    }

    await Promise.all(
      order.items.map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stockCount: item.quantity } })
      )
    );

    order.status = 'cancelled';
    order.cancelReason = reason;
    await order.save();

    if (order.totalAmount > 0) {
      await creditWalletForUser(userId, order.totalAmount, 'Order cancellation refund', order.orderId);
    }

    res.status(200).json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};

const returnUserOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;
    const { reason = '' } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Return reason is required' });
    }

    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be returned' });
    }

    order.status = 'return requested';
    order.returnReason = reason;
    await order.save();

    res.status(200).json({ success: true, message: 'Return request created successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting return', error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all orders', error: error.message });
  }
};

const getAdminOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'processing', 'shipped', 'out for delivery', 'delivered', 'cancelled', 'return requested', 'returned'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = order.deliveredAt || new Date();
    }

    if (status === 'returned' && order.totalAmount > 0) {
      await creditWalletForUser(order.userId, order.totalAmount, 'Return refund approved', order.orderId);
    }

    await order.save();

    if (status === 'delivered') {
      try {
        await rewardReferralForDeliveredOrder(order);
      } catch (rewardError) {
        console.error('Referral reward error:', rewardError.message);
      }
    }

    res.status(200).json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};


const downloadInvoice = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);

    doc.pipe(res);

    
    doc.fontSize(24).fillColor('#03544c').text('BagHub', { align: 'center' });
    doc.fontSize(10).fillColor('#333').text('Tax Invoice', { align: 'center' });
    doc.moveDown(2);

    
    doc.fontSize(12).fillColor('#03544c').text('Order Details', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(`Order ID: ${order.orderId}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.moveDown();

    
    doc.fontSize(12).fillColor('#03544c').text('Shipping Address', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(order.shippingAddress?.name || 'Customer');
    doc.text(order.shippingAddress?.houseName || '');
    doc.text(order.shippingAddress?.locality || '');
    doc.text(
      `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.pincode || ''}`
    );
    doc.text(order.shippingAddress?.phone || '');
    doc.moveDown();

    
    doc.fontSize(12).fillColor('#03544c').text('Items', { underline: true });
    doc.moveDown(0.5);

    order.items.forEach((item, index) => {
      doc.fontSize(10).fillColor('#333');
      doc.text(`${index + 1}. ${item.name}`);
      doc.text(`   Qty: ${item.quantity} × ₹${item.price} = ₹${item.total}`, { indent: 20 });
      doc.moveDown(0.3);
    });

    doc.moveDown();

    
    doc.fontSize(10).fillColor('#333');
    doc.text(`Subtotal: ₹${order.subtotal || 0}`, { align: 'right' });
    doc.text(`Discount: -₹${order.discount || 0}`, { align: 'right' });
    doc.text(`Shipping: ₹${order.shippingFee || 0}`, { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#03544c').text(`Total: ₹${order.totalAmount || 0}`, { align: 'right' });

    doc.moveDown(3);
    doc.fontSize(8).fillColor('#666').text('Thank you for shopping with BagHub!', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Invoice error:', error);
    res.status(500).json({ message: 'Could not generate invoice', error: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getUserOrderById,
  cancelUserOrder,
  returnUserOrder,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  downloadInvoice
  
};
