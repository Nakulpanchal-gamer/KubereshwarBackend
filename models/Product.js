// models/Product.js
const mongoose = require("mongoose");

const ImageRefSchema = new mongoose.Schema({
  url:      { type: String, required: true, trim: true },
  publicId: { type: String, default: null, trim: true }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

  shortDesc:   { type: String, default: "", maxlength: 240, trim: true },
  description: { type: String, default: "" },

  specs: [{
    key:   { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true }
  }],

  // was: [String]; now: [{ url, publicId }]
  images: { type: [ImageRefSchema], default: [] }
}, { timestamps: true });

ProductSchema.index({ name: "text", shortDesc: "text", description: "text" });

module.exports = mongoose.model("Product", ProductSchema);
