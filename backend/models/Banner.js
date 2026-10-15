const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'main' },
  title: { type: String, default: '', trim: true },
  subtitle: { type: String, default: '', trim: true },
  imageUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
