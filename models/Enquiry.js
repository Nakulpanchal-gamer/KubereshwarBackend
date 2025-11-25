// models/Enquiry.js
const mongoose = require("mongoose");

const EnquirySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // optional - legacy single product
  name:    { type: String, required: true, trim: true },
  email:   { type: String, trim: true }, // optional - either email or phone required
  phone:   { type: String, trim: true, default: "" },
  message: { type: String, trim: true }, // optional

  // Category and product selection (new fields)
  categoryId: { type: String, trim: true }, // optional
  categoryName: { type: String, trim: true }, // optional
  productIds: [{ type: String }], // array of product IDs
  allProductsOfCategory: { type: Boolean, default: false }, // if true, enquiry is for entire category

  // light-weight admin handling
  status:  { type: String, enum: ["new", "in_progress", "closed"], default: "new" },
  isRead:  { type: Boolean, default: false }
}, { timestamps: true });

EnquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Enquiry", EnquirySchema);
