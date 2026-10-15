const mongoose = require('mongoose');


const variantSchema = new mongoose.Schema(
  {
    size: { type: String, default: '', trim: true },
    color: { type: String, default: '', trim: true },
    material: { type: String, default: '', trim: true },
    sku: { type: String, default: '', trim: true, sparse: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: 0 },
    stockCount: { type: Number, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true }
  },
  { _id: true, timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number },
    discount: { type: String },
    stockCount: { type: Number, required: true, default: 0 },
    maxQuantityLimit: { type: Number, default: 5 },
    images: [{ type: String, required: true }],
    description: { type: String, trim: true },
    highlights: [{ type: String }],

    
    variants: [variantSchema],

    isBlocked: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);