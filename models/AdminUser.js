// models/AdminUser.js
const mongoose = require("mongoose");

const AdminUserSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

AdminUserSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model("AdminUser", AdminUserSchema);
