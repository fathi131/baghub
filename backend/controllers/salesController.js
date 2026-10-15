const Order = require('../models/Order');

const toDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getDateRange = (period, customStart, customEnd) => {
  const now = new Date();
  const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

  if (period === 'custom') {
    const start = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = customEnd ? endOfDay(new Date(customEnd)) : endOfDay(new Date());
    return {
      start: start < end ? start : new Date(now.getFullYear(), now.getMonth(), 1),
      end: end > start ? end : endOfDay(new Date())
    };
  }

  if (period === 'daily') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { start, end: endOfDay(now) };
  }

  if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end: endOfDay(now) };
  }

  if (period === 'yearly') {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const getSalesReport = async (req, res) => {
  try {
    const period = req.query.period || 'monthly';
    const customStart = toDateOnly(req.query.startDate);
    const customEnd = toDateOnly(req.query.endDate);
    const { start, end } = getDateRange(period, customStart, customEnd);

    const orders = await Order.find({
      orderDate: { $gte: start, $lte: end }
    }).sort({ orderDate: -1 }).lean();

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + Number(order.discount || 0), 0);
    const couponDeduction = orders
      .filter((order) => order.couponCode)
      .reduce((sum, order) => sum + Number(order.discount || 0), 0);
    const refundedAmount = orders
      .filter((order) => ['cancelled', 'returned'].includes(order.status))
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    const normalizedOrders = orders.map((order) => ({
      _id: order._id,
      orderId: order.orderId,
      username: order.shippingAddress?.name || 'Customer',
      address: [
        order.shippingAddress?.houseName,
        order.shippingAddress?.locality,
        order.shippingAddress?.city,
        order.shippingAddress?.state,
        order.shippingAddress?.pincode
      ].filter(Boolean).join(', '),
      quantity: order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0,
      price: Number(order.subtotal || 0),
      discounted: Number(order.discount || 0),
      paymentMethod: order.paymentMethod || 'Cash On Delivery',
      status: order.status || 'pending',
      date: order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : '',
      totalAmount: Number(order.totalAmount || 0),
      couponCode: order.couponCode || ''
    }));

    res.status(200).json({
      success: true,
      period,
      summary: {
      netRevenue: totalRevenue,        
      totalOrders: orders.length,
      totalDiscount,
      couponDeduction,
      refundedAmount
      },
      orders: normalizedOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales report',
      error: error.message
    });
  }
};

module.exports = {
  getSalesReport
};
