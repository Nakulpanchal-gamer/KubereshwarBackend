// routes/enquiries.js
const express = require("express");
const { createEnquiry, getEnquiries, updateEnquiry, deleteEnquiry } = require("../controllers/enquiryController");
const verify = require('../middleware/verifyToken');

const router = express.Router();

// public
router.post("/", createEnquiry);

// protected
router.get("/", verify, getEnquiries);
router.put("/:id", verify, updateEnquiry);
router.delete("/:id", verify, deleteEnquiry);

module.exports = router;
