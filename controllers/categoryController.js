// controllers/categoryController.js
const Category = require("../models/Category");
const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const { normalizeImageField } = require("./_utils");

exports.createCategory = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.image) body.image = normalizeImageField(body.image);

    const category = new Category(body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.image !== undefined) updates.image = normalizeImageField(updates.image);

    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: "Not found" });

    // capture before delete
    const pubId = cat?.image?.publicId || null;
    const imgUrl = cat?.image?.url || null;

    await Category.findByIdAndDelete(req.params.id);

    // Attempt cleanup if we have publicId and it's no longer referenced
    if (pubId) {
      const stillByCat = await Category.exists({ "image.publicId": pubId });
      const stillByProd = await Product.exists({ "images.publicId": pubId });
      if (!stillByCat && !stillByProd) {
        try {
          await cloudinary.uploader.destroy(pubId);
        } catch (e) {
          console.warn(`Cloudinary destroy failed for ${pubId}:`, e?.message || e);
        }
      }
    } else if (imgUrl) {
      // Legacy (string URL) → cannot safely map back to public_id; skip deletion.
    }

    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
