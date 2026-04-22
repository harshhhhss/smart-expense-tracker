require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { generateInsights, generateChartData } = require("./utils/insights");
const { detectCategory } = require("./utils/autoCategory");

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true }));
app.use(express.json());

// ── DB ────────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => { console.error(err); process.exit(1); });

// ── User Model ────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, select: false }
}, { timestamps: true });

userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = async function(p) {
  return bcrypt.compare(p, this.password);
};
const User = mongoose.model("User", userSchema);

// ── Expense Model ─────────────────────────────────────────────────────────────
const CATEGORIES = ["Food","Travel","Shopping","Entertainment","Health","Utilities","Education","Personal Care","Other"];

const expenseSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount:      { type: Number, required: true },
  category:    { type: String, enum: CATEGORIES, required: true },
  description: { type: String, default: "" },
  date:        { type: Date, default: Date.now },
  autoTagged:  { type: Boolean, default: false }, // true if category was auto-detected
}, { timestamps: true });

const Expense = mongoose.model("Expense", expenseSchema);

// ── Helpers ───────────────────────────────────────────────────────────────────
const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// JWT protect middleware — verifies token and attaches req.user
const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ── AUTH ROUTES ───────────────────────────────────────────────────────────────

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
    if (await User.findOne({ email })) return res.status(409).json({ message: "Email already exists" });
    const user = await User.create({ name, email, password });
    res.status(201).json({
      success: true,
      token: genToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "All fields required" });
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({
      success: true,
      token: genToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// GET /api/auth/me
app.get("/api/auth/me", protect, (req, res) => {
  res.json({ success: true, user: { _id: req.user._id, name: req.user.name, email: req.user.email } });
});

// ── EXPENSE ROUTES ────────────────────────────────────────────────────────────

// GET /api/expenses/categories
app.get("/api/expenses/categories", protect, (req, res) => {
  res.json({ success: true, categories: CATEGORIES });
});

// GET /api/expenses/dashboard — summary + recent + insights
app.get("/api/expenses/dashboard", protect, async (req, res) => {
  try {
    const now = new Date();
    const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd  = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth] = await Promise.all([
      Expense.find({ user: req.user._id, date: { $gte: monthStart } }).sort({ date: -1 }),
      Expense.find({ user: req.user._id, date: { $gte: lastMonthStart, $lte: lastMonthEnd } })
    ]);

    const thisTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
    const lastTotal = lastMonth.reduce((s, e) => s + e.amount, 0);

    const categoryBreakdown = thisMonth.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount; return acc;
    }, {});

    const categoryData = Object.entries(categoryBreakdown)
      .map(([category, total]) => ({
        category,
        total: Math.round(total * 100) / 100,
        percentage: thisTotal > 0 ? Math.round(total / thisTotal * 10000) / 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    const insights = [];
    if (lastTotal > 0) {
      const p = ((thisTotal - lastTotal) / lastTotal * 100).toFixed(0);
      insights.push(Number(p) > 0
        ? `You spent ${Math.abs(p)}% more this month vs last month.`
        : `You spent ${Math.abs(p)}% less this month vs last month.`
      );
    }
    if (categoryData.length > 0) insights.push(`Top category: ${categoryData[0].category} at ₹${categoryData[0].total.toFixed(2)}`);
    if (thisMonth.length > 0) insights.push(`Daily average: ₹${(thisTotal / now.getDate()).toFixed(2)}/day this month.`);

    res.json({
      success: true,
      dashboard: {
        summary: {
          thisMonth: thisTotal,
          lastMonth: lastTotal,
          monthOverMonthChange: lastTotal > 0 ? Math.round((thisTotal - lastTotal) / lastTotal * 10000) / 100 : null,
          totalExpensesThisMonth: thisMonth.length
        },
        categoryBreakdown: categoryData,
        recentExpenses: thisMonth.slice(0, 5),
        insights
      }
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// GET /api/expenses — all expenses with optional filters
app.get("/api/expenses", protect, async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const filter = { user: req.user._id };
    if (category && category !== "All") filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59); filter.date.$lte = e; }
    }
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json({ success: true, expenses });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// POST /api/expenses — create expense with auto-category detection
app.post("/api/expenses", protect, async (req, res) => {
  try {
    let { amount, category, description, date } = req.body;
    if (!amount) return res.status(400).json({ message: "Amount is required" });

    // FEATURE 3: Auto-detect category from description if not provided or is "Other"
    let autoTagged = false;
    if (description && (!category || category === "Other")) {
      const detected = detectCategory(description);
      if (detected) {
        category = detected;
        autoTagged = true;
      }
    }

    // Fallback to "Other" if still no category
    if (!category) category = "Other";

    const expense = await Expense.create({
      user: req.user._id,
      amount: Number(amount),
      category,
      description: description || "",
      date: date ? new Date(date) : new Date(),
      autoTagged
    });

    res.status(201).json({
      success: true,
      expense,
      autoTagged, // tell frontend if category was auto-detected
      message: autoTagged ? `Category auto-detected as "${category}"` : "Expense added"
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/expenses/:id
app.put("/api/expenses/:id", protect, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    let { amount, category, description, date } = req.body;

    // Re-run auto-detection if description changed and category not explicitly set
    if (description && description !== expense.description && (!category || category === expense.category)) {
      const detected = detectCategory(description);
      if (detected) { category = detected; expense.autoTagged = true; }
    }

    if (amount      !== undefined) expense.amount      = Number(amount);
    if (category    !== undefined) expense.category    = category;
    if (description !== undefined) expense.description = description;
    if (date        !== undefined) expense.date        = new Date(date);

    await expense.save();
    res.json({ success: true, expense });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/expenses/:id
app.delete("/api/expenses/:id", protect, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ success: true, deletedId: req.params.id });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// ── INSIGHTS ROUTE (FEATURE 1) ────────────────────────────────────────────────

// GET /api/insights — AI-like spending insights
app.get("/api/insights", protect, async (req, res) => {
  try {
    // Fetch all expenses for the last 60 days for analysis
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const expenses = await Expense.find({
      user: req.user._id,
      date: { $gte: since }
    }).sort({ date: -1 });

    const insights    = generateInsights(expenses);
    const chartData   = generateChartData(expenses);

    res.json({ success: true, insights, chartData });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// ── AUTO CATEGORY DETECT ROUTE ────────────────────────────────────────────────

// POST /api/expenses/detect-category — preview category from description
app.post("/api/expenses/detect-category", protect, (req, res) => {
  const { description } = req.body;
  const category = detectCategory(description) || "Other";
  res.json({ success: true, category });
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "OK", time: new Date() }));

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  res.status(res.statusCode !== 200 ? res.statusCode : 500).json({
    success: false,
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));