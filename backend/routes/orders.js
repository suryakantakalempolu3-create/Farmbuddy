const express = require("express");
const Order   = require("../models/Order");
const Product = require("../models/Product");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/orders  — customer: place an order
// ─────────────────────────────────────────────
router.post("/", protect, restrictTo("customer"), async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    // Validate each item and compute total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for: ${product.name}` });
      }

      orderItems.push({
        productId: product._id,
        farmerId:  product.farmerId,
        name:      product.name,
        price:     product.price,
        quantity:  item.quantity,
      });

      total += product.price * item.quantity;

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      customerId: req.user._id,
      items:      orderItems,
      total,
      status:     "pending",
    });

    res.status(201).json({ message: "Order placed successfully.", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to place order." });
  }
});

// ─────────────────────────────────────────────
// GET /api/orders/my  — customer: their own orders
// ─────────────────────────────────────────────
router.get("/my", protect, restrictTo("customer"), async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders." });
  }
});

// ─────────────────────────────────────────────
// GET /api/orders/farmer  — farmer: orders containing their products
// ─────────────────────────────────────────────
router.get("/farmer", protect, restrictTo("farmer"), async (req, res) => {
  try {
    const orders = await Order.find({ "items.farmerId": req.user._id })
      .populate("customerId", "username email phone")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch farmer orders." });
  }
});

// ─────────────────────────────────────────────
// GET /api/orders/:id  — get single order
// ─────────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "customerId",
      "username email"
    );
    if (!order) return res.status(404).json({ message: "Order not found." });

    // Only allow the customer who placed it or a farmer whose item is in it
    const isCustomer = order.customerId._id.toString() === req.user._id.toString();
    const isFarmer   = order.items.some(
      (i) => i.farmerId.toString() === req.user._id.toString()
    );

    if (!isCustomer && !isFarmer) {
      return res.status(403).json({ message: "Access denied." });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order." });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/orders/:id/status  — farmer: update order status
// ─────────────────────────────────────────────
router.patch("/:id/status", protect, restrictTo("farmer"), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Use: ${validStatuses.join(", ")}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    const isFarmer = order.items.some(
      (i) => i.farmerId.toString() === req.user._id.toString()
    );
    if (!isFarmer) {
      return res.status(403).json({ message: "You can only update orders containing your products." });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Order status updated.", order });
  } catch (err) {
    res.status(500).json({ message: "Failed to update order status." });
  }
});

module.exports = router;
