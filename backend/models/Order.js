const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, required: true, unique: true },
    paymentMethod: { type: String, default: 'Cash On Delivery' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'out for delivery', 'delivered', 'cancelled', 'return requested', 'returned'],
      default: 'pending'
    },
    items: [orderItemSchema],
    shippingAddress: {
      name: String,
      phone: String,
      houseName: String,
      locality: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    cancelReason: { type: String, default: '' },
    returnReason: { type: String, default: '' },
    orderDate: { type: Date, default: Date.now },
    deliveredAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
