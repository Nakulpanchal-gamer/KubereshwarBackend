// routes/adminRoutes.js
const express = require("express");
const { requestAdminOtp, verifyAdminOtp, loginAdmin } = require("../controllers/adminController");
const router = express.Router();

router.post("/otp/request", requestAdminOtp);
router.post("/otp/verify",  verifyAdminOtp);

module.exports = router;
