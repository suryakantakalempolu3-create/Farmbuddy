const express = require("express");
const Product = require("../models/Product");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/products  — public, get all products
// ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    let filter = {};

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .populate("farmerId", "username farmName location")
      .sort({ createdAt: -1 });

    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products." });
  }
});

// ─────────────────────────────────────────────
// GET /api/products/my  — farmer: get own products
// ─────────────────────────────────────────────
router.get("/my", protect, restrictTo("farmer"), async (req, res) => {
  try {
    const products = await Product.find({ farmerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your products." });
  }
});

// ─────────────────────────────────────────────
// GET /api/products/:id  — public, single product
// ─────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "farmerId",
      "username farmName location phone"
    );
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch product." });
  }
});

// ─────────────────────────────────────────────
// POST /api/products  — farmer only: add product
// ─────────────────────────────────────────────
router.post("/", protect, restrictTo("farmer"), async (req, res) => {
  try {
    const { name, price, category, description, imageUrl, stock } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: "Name and price are required." });
    }

    const product = await Product.create({
      name,
      price:       Number(price),
      category:    category    || "general",
      description: description || "",
      imageUrl:    imageUrl    || "",
      stock:       Number(stock || 0),
      farmerId:    req.user._id,
      farmerName:  req.user.username,
    });

    res.status(201).json({ message: "Product added.", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add product." });
  }
});

// ─────────────────────────────────────────────
// PUT /api/products/:id  — farmer: update own product
// ─────────────────────────────────────────────
router.put("/:id", protect, restrictTo("farmer"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    if (product.farmerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own products." });
    }

    const allowed = ["name", "price", "category", "description", "imageUrl", "stock"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    await product.save();
    res.json({ message: "Product updated.", product });
  } catch (err) {
    res.status(500).json({ message: "Failed to update product." });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/products/:id  — farmer: delete own product
// ─────────────────────────────────────────────
router.delete("/:id", protect, restrictTo("farmer"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });

    if (product.farmerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own products." });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product." });
  }
});

module.exports = router;
