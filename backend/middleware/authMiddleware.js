// ─────────────────────────────────────────────
//  controllers/authController.js
// ─────────────────────────────────────────────
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── Helper: generate a signed JWT ──
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ── Helper: build standard auth response ──
const authResponse = (res, statusCode, user) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
};

// ════════════════════════════════════════════
//  POST /api/auth/signup
// ════════════════════════════════════════════
const signup = async (req, res) => {
  const { name, email, password } = req.body;

  // ── Validate required fields ──
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email, and password");
  }

  // ── Check if email is already registered ──
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  // ── Create the user (password hashed by pre-save hook in User model) ──
  const user = await User.create({ name, email, password });

  // ── Respond with token ──
  authResponse(res, 201, user);
};

// ════════════════════════════════════════════
//  POST /api/auth/login
// ════════════════════════════════════════════
const login = async (req, res) => {
  const { email, password } = req.body;

  // ── Validate input ──
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  // ── Find user — explicitly select password (it's excluded by default) ──
  const user = await User.findOne({ email }).select("+password");

  // ── Generic error message prevents email enumeration attacks ──
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // ── Respond with token ──
  authResponse(res, 200, user);
};

// ════════════════════════════════════════════
//  GET /api/auth/me  (protected)
// ════════════════════════════════════════════
const getMe = async (req, res) => {
  // req.user is already attached by the protect middleware
  res.json({
    success: true,
    user: req.user.toSafeObject(),
  });
};

// ════════════════════════════════════════════
//  PUT /api/auth/profile  (protected)
// ════════════════════════════════════════════
const updateProfile = async (req, res) => {
  const { name, password } = req.body;

  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (password) {
    if (password.length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters");
    }
    user.password = password; // pre-save hook will re-hash
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser.toSafeObject(),
  });
};

module.exports = { signup, login, getMe, updateProfile };