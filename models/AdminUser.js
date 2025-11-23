// models/AdminUser.js
const mongoose = require("mongoose");

const AdminUserSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },

  // OTP-based login
  otpCodeHash:       { type: String, default: null },
  otpExpiresAt:      { type: Date,   default: null },
  otpSentAt:         { type: Date,   default: null },  // simple throttle
  otpAttemptCounter: { type: Number, default: 0 },     // lockout control
}, { timestamps: true });

AdminUserSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model("AdminUser", AdminUserSchema);
