// controllers/productController.js
const Product = require("../models/Product");
const Category = require("../models/Category");
const cloudinary = require("../config/cloudinary");
const { normalizeImageArray } = require("./_utils");

exports.getProducts = async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};
  const products = await Product.find(filter).populate("category");
  res.json(products);
};

exports.getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");
  res.json(product);
};

exports.createProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.images) body.images = normalizeImageArray(body.images);

    const product = new Product(body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.images !== undefined) updates.images = normalizeImageArray(updates.images);

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.status(404).json({ message: "Not found" });

    // collect unique publicIds before delete
    const pubIds = (prod.images || [])
      .map(i => i?.publicId)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);

    await Product.findByIdAndDelete(req.params.id);

    // For each publicId, destroy only if no other doc references it
    for (const pid of pubIds) {
      const stillByProd = await Product.exists({ "images.publicId": pid });
      const stillByCat  = await Category.exists({ "image.publicId": pid });
      if (!stillByProd && !stillByCat) {
        try {
          await cloudinary.uploader.destroy(pid);
        } catch (e) {
          console.warn(`Cloudinary destroy failed for ${pid}:`, e?.message || e);
        }
      }
    }

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
