const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['product', 'category', 'referral'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetModel',
      default: null
    },
    targetModel: {
      type: String,
      enum: ['Product', 'Category', 'User'],
      default: null
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);
