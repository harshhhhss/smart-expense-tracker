const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email, and password");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error("Email already exists");
  }
  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);
  res.status(201).json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email } });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  const token = generateToken(user._id);
  res.status(200).json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email } });
};

const getMe = async (req, res) => {
  const user = req.user;
  res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email } });
};

const updateProfile = async (req, res) => {
  const { name, password } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (password) {
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }
    user.password = password;
  }
  const updated = await user.save();
  res.json({ success: true, user: { _id: updated._id, name: updated.name, email: updated.email } });
};

module.exports = { signup, login, getMe, updateProfile };
