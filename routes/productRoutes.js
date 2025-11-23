const express = require("express");
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require("../controllers/productController");
const router = express.Router();
const verify = require("../middleware/verifyToken")

//public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

//admin routes
router.post("/", verify, createProduct);
router.put("/:id", verify, updateProduct);
router.delete("/:id", verify, deleteProduct);

module.exports = router;
