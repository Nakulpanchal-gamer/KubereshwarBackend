const express = require("express");
const { getCategories, createCategory, deleteCategory, updateCategory } = require("../controllers/categoryController");
const verify = require('../middleware/verifyToken');

const router = express.Router();

// public
router.get("/", getCategories);

// protected (standard REST)
router.post("/", verify, createCategory);
router.put("/:id", verify, updateCategory);
router.delete("/:id", verify, deleteCategory);

module.exports = router;
