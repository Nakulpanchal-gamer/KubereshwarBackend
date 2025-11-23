// controllers/adminController.js
const AdminUser = require("../models/AdminUser");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendSystemEmail } = require("../utils/mailer");

const {
  JWT_SECRET,
  ADMIN_USERNAME,
  ADMIN_EMAIL,
  OTP_TTL_MIN = "5",
  OTP_LENGTH = "6",
  OTP_COOLDOWN_SEC = "30",
  OTP_MAX_ATTEMPTS = "5",
} = process.env;

const OTP_TTL_MIN_N      = Number(OTP_TTL_MIN);
const OTP_LENGTH_N       = Number(OTP_LENGTH);
const OTP_COOLDOWN_SEC_N = Number(OTP_COOLDOWN_SEC);
const OTP_MAX_ATTEMPTS_N = Number(OTP_MAX_ATTEMPTS);

function generateNumericOtp(len) {
  const digits = "0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += digits[Math.floor(Math.random() * 10)];
  return out;
}
const sha256 = s => crypto.createHash("sha256").update(s).digest("hex");

// STEP 1: request OTP
exports.requestAdminOtp = async (req, res) => {
  const username = (ADMIN_USERNAME || "").toLowerCase().trim();
  console.log("[OTP] request received", { username: ADMIN_USERNAME ? "***" : "(missing)" });
  const generic = { message: "If the account exists, an OTP has been sent." };
  if (!username) return res.status(200).json(generic);

  // ✅ find the admin FIRST (you were missing this line)
  const admin = await AdminUser.findOne({ username });
  // Always return generic to avoid enumeration
  if (!admin) {
    console.warn("[OTP] admin not found for username env; check ADMIN_USERNAME and DB record");
    return res.status(200).json(generic);
  }

  // throttle
  const now = new Date();
  if (admin.otpSentAt && (now - admin.otpSentAt) / 1000 < OTP_COOLDOWN_SEC_N) {
    return res.status(429).json({ message: "Please wait before requesting a new OTP." });
  }

  const otp = generateNumericOtp(OTP_LENGTH_N);
  admin.otpCodeHash       = sha256(otp);
  admin.otpExpiresAt      = new Date(Date.now() + OTP_TTL_MIN_N * 60 * 1000);
  admin.otpSentAt         = now;
  admin.otpAttemptCounter = 0;
  await admin.save();

  // ✅ fixed recipient (ADMIN_EMAIL preferred; fallback to ADMIN_USERNAME)
  const toAddress = (ADMIN_EMAIL || ADMIN_USERNAME || username).trim();
  console.log("[OTP] prepared OTP for admin; attempting to send email", { to: toAddress ? "***" : "(missing)" });

  const subject = "Your Admin Login OTP";
  const text = `Your OTP is: ${otp}\nIt expires in ${OTP_TTL_MIN_N} minutes.\nIf you did not request this, ignore this email.`;
  const html = `
    <div style="font:14px/1.5 -apple-system,Segoe UI,Roboto,Arial;">
      <p>Your OTP is</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:2px;">${otp}</p>
      <p>This code expires in ${OTP_TTL_MIN_N} minutes.</p>
      <p>If you did not request this, ignore this email.</p>
    </div>
  `;

  // send email asynchronously so the API responds instantly even if SMTP is slow
  sendSystemEmail({ to: toAddress, subject, text, html })
    .then(() => console.log("[OTP] email dispatch success"))
    .catch(err => console.error("[OTP] email failed:", err?.message || err));

  return res.status(200).json(generic);
};

// STEP 2: verify OTP -> JWT
exports.verifyAdminOtp = async (req, res) => {
  const username = (ADMIN_USERNAME || "").toLowerCase().trim();
  const otp = String(req.body?.otp || "").trim();
  if (!username || !otp) return res.status(400).json({ message: "Invalid request" });

  const admin = await AdminUser.findOne({ username });
  if (!admin || !admin.otpCodeHash || !admin.otpExpiresAt) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (admin.otpAttemptCounter >= OTP_MAX_ATTEMPTS_N) {
    return res.status(429).json({ message: "Too many attempts. Request a new OTP." });
  }
  if (admin.otpExpiresAt <= new Date()) {
    return res.status(400).json({ message: "OTP expired. Request a new one." });
  }
  if (sha256(otp) !== admin.otpCodeHash) {
    admin.otpAttemptCounter += 1;
    await admin.save();
    return res.status(400).json({ message: "Invalid OTP" });
  }

  admin.otpCodeHash = null;
  admin.otpExpiresAt = null;
  admin.otpAttemptCounter = 0;
  await admin.save();

  const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: "1d" });
  return res.json({ token });
};
