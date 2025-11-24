const express = require("express");
const { loginAdmin, resetPassword } = require("../controllers/adminController");

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/reset-password", resetPassword);

module.exports = router;
