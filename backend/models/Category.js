const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false } // Soft delete flag
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);