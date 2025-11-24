// controllers/adminController.js
const AdminUser = require("../models/AdminUser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const {
  JWT_SECRET,
  ADMIN_USERNAME,
} = process.env;

// Password-based login
exports.loginAdmin = async (req, res) => {
  const username = (ADMIN_USERNAME || "").toLowerCase().trim();
  const password = String(req.body?.password || "").trim();

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const admin = await AdminUser.findOne({ username });
  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: "1d" });
  return res.json({ token });
};

// Password reset
exports.resetPassword = async (req, res) => {
  const username = (ADMIN_USERNAME || "").toLowerCase().trim();
  const newPassword = String(req.body?.password || "").trim();

  if (!username || !newPassword) {
    return res.status(400).json({ message: "Password is required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const admin = await AdminUser.findOne({ username });
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  admin.passwordHash = passwordHash;
  await admin.save();

  return res.json({ message: "Password reset successfully" });
};
