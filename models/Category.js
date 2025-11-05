// models/Category.js
const mongoose = require("mongoose");

const ImageRefSchema = new mongoose.Schema({
  url:      { type: String, required: true, trim: true },
  publicId: { type: String, default: null, trim: true }
}, { _id: false });

const CategorySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  // was: String; now an object. Kept optional/nullable.
  image:       { type: ImageRefSchema, default: null }
}, { timestamps: true });

CategorySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Category", CategorySchema);
