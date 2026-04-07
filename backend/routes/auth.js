const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Helper: sign a JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role, farmName, location, phone, farmId } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "username, email, password, and role are required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered. Please login." });
    }

    const user = await User.create({
      username,
      email,
      password,
      role,
      farmName: farmName || "",
      location: location || "",
      phone:    phone    || "",
      farmId:   farmId   || "",
    });

    const token = signToken(user._id);

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        role:     user.role,
        farmName: user.farmName,
        location: user.location,
        phone:    user.phone,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken(user._id);

    res.json({
      message: "Login successful.",
      token,
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        role:     user.role,
        farmName: user.farmName,
        location: user.location,
        phone:    user.phone,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
