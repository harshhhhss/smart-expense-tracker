// server.js — Updated to include all 5 advanced features
// ADD these lines to your existing server.js (marked with // ← ADD)

require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcryptjs");
const mongoose = require("mongoose");

const { classifyExpense, predictNextMonth, detectAnomalies, generateBudgetRecommendations } = require("./utils/analytics");
const { detectCategory } = require("./utils/autoCategory");

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => { console.error(err); process.exit(1); });

// ── Models ────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true },
  password: { type: String, select: false }
}, { timestamps: true });

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12); next();
});
userSchema.methods.matchPassword = async function(p) { return bcrypt.compare(p, this.password); };
const User = mongoose.model("User", userSchema);

const CATEGORIES = ["Food","Travel","Shopping","Entertainment","Health","Utilities","Education","Personal Care","Other"];

const expenseSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount:      { type: Number, required: true },
  category:    { type: String, enum: CATEGORIES, required: true },
  description: { type: String, default: "" },
  date:        { type: Date, default: Date.now },
  autoTagged:  { type: Boolean, default: false },
}, { timestamps: true });
const Expense = mongoose.model("Expense", expenseSchema);

// ← ADD: Budget model
const budgetSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month:  { type: String, required: true },
  income: { type: Number, default: 0 },
  limits: { type: Map, of: Number, default: {} }
}, { timestamps: true });
budgetSchema.index({ user: 1, month: 1 }, { unique: true });
const Budget = mongoose.model("Budget", budgetSchema);

// ← ADD: SharedGroup model
const sharedExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount:      { type: Number, required: true },
  paidBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  category:    { type: String, default: "Other" },
  date:        { type: Date, default: Date.now },
  splits: [{
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount:    Number,
    settled:   { type: Boolean, default: false },
    settledAt: Date
  }]
}, { timestamps: true });

const sharedGroupSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  emoji:      { type: String, default: "👥" },
  owner:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{
    user:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role:     { type: String, enum: ["admin","member","viewer"], default: "member" },
    joinedAt: { type: Date, default: Date.now }
  }],
  inviteCode: { type: String, unique: true, default: () => Math.random().toString(36).substring(2,10).toUpperCase() },
  expenses:   [sharedExpenseSchema],
  isActive:   { type: Boolean, default: true }
}, { timestamps: true });
const SharedGroup = mongoose.model("SharedGroup", sharedGroupSchema);

// ── Auth ──────────────────────────────────────────────────────────────────────
const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ message: "No token" });
  try {
    const { id } = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    req.user = await User.findById(id);
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch { res.status(401).json({ message: "Invalid token" }); }
};

// ── Auth Routes ───────────────────────────────────────────────────────────────
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
    if (await User.findOne({ email })) return res.status(409).json({ message: "Email already exists" });
    const user = await User.create({ name, email, password });
    res.status(201).json({ success: true, token: genToken(user._id), user: { _id: user._id, name: user.name, email: user.email } });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: "Invalid credentials" });
    res.json({ success: true, token: genToken(user._id), user: { _id: user._id, name: user.name, email: user.email } });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.get("/api/auth/me", protect, (req, res) => {
  res.json({ success: true, user: { _id: req.user._id, name: req.user.name, email: req.user.email } });
});

// ── Expense Routes ────────────────────────────────────────────────────────────
app.get("/api/expenses/categories", protect, (req, res) => {
  res.json({ success: true, categories: CATEGORIES });
});

app.get("/api/expenses/dashboard", protect, async (req, res) => {
  try {
    const now = new Date();
    const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth] = await Promise.all([
      Expense.find({ user: req.user._id, date: { $gte: monthStart } }).sort({ date: -1 }),
      Expense.find({ user: req.user._id, date: { $gte: lastMonthStart, $lte: lastMonthEnd } })
    ]);

    const thisTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
    const lastTotal = lastMonth.reduce((s, e) => s + e.amount, 0);
    const catBreakdown = thisMonth.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
    const categoryData = Object.entries(catBreakdown).map(([category, total]) => ({ category, total: Math.round(total*100)/100, percentage: thisTotal > 0 ? Math.round(total/thisTotal*10000)/100 : 0 })).sort((a,b) => b.total - a.total);

    res.json({ success: true, dashboard: { summary: { thisMonth: thisTotal, lastMonth: lastTotal, monthOverMonthChange: lastTotal > 0 ? Math.round((thisTotal-lastTotal)/lastTotal*10000)/100 : null, totalExpensesThisMonth: thisMonth.length }, categoryBreakdown: categoryData, recentExpenses: thisMonth.slice(0,5), insights: [] } });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.get("/api/expenses", protect, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
    res.json({ success: true, expenses });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.post("/api/expenses", protect, async (req, res) => {
  try {
    let { amount, category, description, date } = req.body;
    if (!amount) return res.status(400).json({ message: "Amount required" });
    let autoTagged = false;
    if (description && (!category || category === "Other")) {
      const detected = detectCategory(description);
      if (detected) { category = detected; autoTagged = true; }
    }
    if (!category) category = "Other";
    const expense = await Expense.create({ user: req.user._id, amount: Number(amount), category, description: description || "", date: date ? new Date(date) : new Date(), autoTagged });
    res.status(201).json({ success: true, expense, autoTagged });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.put("/api/expenses/:id", protect, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: "Not found" });
    const { amount, category, description, date } = req.body;
    if (amount !== undefined) expense.amount = Number(amount);
    if (category !== undefined) expense.category = category;
    if (description !== undefined) expense.description = description;
    if (date !== undefined) expense.date = new Date(date);
    await expense.save();
    res.json({ success: true, expense });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.delete("/api/expenses/:id", protect, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: "Not found" });
    res.json({ success: true, deletedId: req.params.id });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// ── Insights Route ────────────────────────────────────────────────────────────
const { generateInsights, generateChartData } = require("./utils/insights");
app.get("/api/insights", protect, async (req, res) => {
  try {
    const since = new Date(); since.setDate(since.getDate() - 60);
    const expenses = await Expense.find({ user: req.user._id, date: { $gte: since } }).sort({ date: -1 });
    res.json({ success: true, insights: generateInsights(expenses), chartData: generateChartData(expenses) });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.post("/api/expenses/detect-category", protect, (req, res) => {
  const category = detectCategory(req.body.description) || "Other";
  res.json({ success: true, category });
});

// ── ← ADD: Advanced Routes (all 5 features) ──────────────────────────────────
const advancedRoutes = require("./routes/advancedRoutes");
app.use("/api/advanced", advancedRoutes(Expense, User, SharedGroup, Budget, protect));

// ── Health + Error ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "OK" }));
app.use((err, req, res, next) => res.status(500).json({ success: false, message: err.message }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));