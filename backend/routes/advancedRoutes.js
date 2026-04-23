// backend/routes/advancedRoutes.js
// Mounts all 5 advanced feature routes under /api/advanced/*

const express = require("express");
const router  = express.Router();

// We'll inline controllers here to keep the drop-in simple
// In a larger app, split into controllers/analyticsController.js etc.

const { classifyExpense, predictNextMonth, detectAnomalies, generateBudgetRecommendations } = require("../utils/analytics");

// These are pulled from your existing server.js context via dependency injection
// Pass them in when mounting: require('./routes/advancedRoutes')(Expense, User, SharedGroup, Budget, protect)
module.exports = (Expense, User, SharedGroup, Budget, protect) => {

  // ═══════════════════════════════════════════════════════════
  // FEATURE 1: NLP CATEGORIZATION
  // POST /api/advanced/classify
  // ═══════════════════════════════════════════════════════════
  router.post("/classify", protect, async (req, res) => {
    try {
      const { description } = req.body;
      if (!description) return res.status(400).json({ message: "Description required" });

      const result = classifyExpense(description);
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // Bulk classify existing expenses that are "Other"
  // POST /api/advanced/classify/bulk
  router.post("/classify/bulk", protect, async (req, res) => {
    try {
      const expenses = await Expense.find({
        user: req.user._id,
        category: "Other",
        description: { $ne: "" }
      });

      const updates = [];
      for (const expense of expenses) {
        const result = classifyExpense(expense.description);
        if (result.category !== "Other" && result.confidence > 50) {
          expense.category  = result.category;
          expense.autoTagged = true;
          updates.push(expense.save());
        }
      }

      await Promise.all(updates);
      res.json({ success: true, updated: updates.length, total: expenses.length });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // FEATURE 2: SPENDING PREDICTION
  // GET /api/advanced/predict
  // ═══════════════════════════════════════════════════════════
  router.get("/predict", protect, async (req, res) => {
    try {
      // Aggregate monthly totals using MongoDB aggregation pipeline
      const monthlyAgg = await Expense.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: {
              year:  { $year: "$date" },
              month: { $month: "$date" }
            },
            total: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 } // max 12 months of history
      ]);

      const MONTHS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const monthlyTotals = monthlyAgg.map(m => ({
        month: `${MONTHS[m._id.month]} ${String(m._id.year).slice(2)}`,
        total: Math.round(m.total * 100) / 100,
        count: m.count
      }));

      const prediction = predictNextMonth(monthlyTotals);

      // Also predict per category
      const categoryAgg = await Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) }
          }
        },
        {
          $group: {
            _id: {
              category: "$category",
              year:  { $year: "$date" },
              month: { $month: "$date" }
            },
            total: { $sum: "$amount" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);

      // Group by category for per-category predictions
      const catHistory = {};
      categoryAgg.forEach(item => {
        const cat = item._id.category;
        if (!catHistory[cat]) catHistory[cat] = [];
        catHistory[cat].push({ month: `${item._id.month}/${item._id.year}`, total: item.total });
      });

      const categoryPredictions = Object.entries(catHistory)
        .map(([category, history]) => ({
          category,
          ...predictNextMonth(history)
        }))
        .filter(p => p.predicted > 0)
        .sort((a, b) => b.predicted - a.predicted);

      res.json({
        success: true,
        history: monthlyTotals,
        prediction,
        categoryPredictions
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // FEATURE 3: ANOMALY DETECTION
  // GET /api/advanced/anomalies
  // ═══════════════════════════════════════════════════════════
  router.get("/anomalies", protect, async (req, res) => {
    try {
      // Fetch last 90 days for anomaly detection
      const since = new Date();
      since.setDate(since.getDate() - 90);

      const expenses = await Expense.find({
        user: req.user._id,
        date: { $gte: since }
      }).sort({ date: -1 });

      const anomalies = detectAnomalies(expenses);

      // Summary stats
      const critical = anomalies.filter(a => a.severity === "critical").length;
      const warnings = anomalies.filter(a => a.severity === "warning").length;

      res.json({
        success: true,
        anomalies,
        summary: { total: anomalies.length, critical, warnings },
        analyzedExpenses: expenses.length
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // FEATURE 4: BUDGET RECOMMENDATION ENGINE
  // GET  /api/advanced/budget/recommend
  // GET  /api/advanced/budget              (get saved budget)
  // POST /api/advanced/budget              (save budget limits)
  // ═══════════════════════════════════════════════════════════

  // Get AI-generated budget recommendations
  router.get("/budget/recommend", protect, async (req, res) => {
    try {
      const { income } = req.query; // optional declared income

      // Fetch 3 months of expenses for analysis
      const since = new Date();
      since.setMonth(since.getMonth() - 3);
      const expenses = await Expense.find({ user: req.user._id, date: { $gte: since } });

      const recommendations = generateBudgetRecommendations(
        expenses,
        income ? Number(income) : null
      );

      res.json({ success: true, ...recommendations });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // Get current month's saved budget
  router.get("/budget", protect, async (req, res) => {
    try {
      const month = new Date().toISOString().substring(0, 7); // "YYYY-MM"
      const budget = await Budget.findOne({ user: req.user._id, month });

      // Also fetch current month spending vs limits
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const expenses   = await Expense.find({ user: req.user._id, date: { $gte: monthStart } });

      const catSpend = {};
      expenses.forEach(e => {
        catSpend[e.category] = (catSpend[e.category] || 0) + Number(e.amount);
      });

      res.json({
        success: true,
        budget: budget || { limits: {}, income: 0 },
        currentSpend: catSpend,
        month
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // Save/update budget limits
  router.post("/budget", protect, async (req, res) => {
    try {
      const { limits, income } = req.body;
      const month = new Date().toISOString().substring(0, 7);

      const budget = await Budget.findOneAndUpdate(
        { user: req.user._id, month },
        { limits: new Map(Object.entries(limits || {})), income: income || 0 },
        { upsert: true, new: true }
      );

      res.json({ success: true, budget });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // FEATURE 5: SHARED EXPENSE / FRIEND SYSTEM
  // ═══════════════════════════════════════════════════════════

  // GET /api/advanced/groups — list user's groups
  router.get("/groups", protect, async (req, res) => {
    try {
      const groups = await SharedGroup.find({
        "members.user": req.user._id,
        isActive: true
      })
      .populate("members.user", "name email")
      .populate("expenses.paidBy", "name")
      .sort({ updatedAt: -1 });

      res.json({ success: true, groups });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // POST /api/advanced/groups — create a new group
  router.post("/groups", protect, async (req, res) => {
    try {
      const { name, emoji } = req.body;
      if (!name) return res.status(400).json({ message: "Group name required" });

      const group = await SharedGroup.create({
        name,
        emoji: emoji || "👥",
        owner: req.user._id,
        members: [{ user: req.user._id, role: "admin" }]
      });

      res.status(201).json({ success: true, group });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // POST /api/advanced/groups/join — join via invite code
  router.post("/groups/join", protect, async (req, res) => {
    try {
      const { inviteCode } = req.body;
      const group = await SharedGroup.findOne({ inviteCode, isActive: true });
      if (!group) return res.status(404).json({ message: "Invalid invite code" });

      const alreadyMember = group.members.some(m => m.user.toString() === req.user._id.toString());
      if (alreadyMember) return res.status(409).json({ message: "Already a member" });

      group.members.push({ user: req.user._id, role: "member" });
      await group.save();

      res.json({ success: true, group });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // GET /api/advanced/groups/:id — get group details + balances
  router.get("/groups/:id", protect, async (req, res) => {
    try {
      const group = await SharedGroup
        .findById(req.params.id)
        .populate("members.user", "name email")
        .populate("expenses.paidBy", "name email")
        .populate("expenses.splits.user", "name email");

      if (!group) return res.status(404).json({ message: "Group not found" });

      const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ message: "Not a member of this group" });

      // Calculate balances: who owes whom
      const balances = {}; // { userId: netBalance }
      group.members.forEach(m => { balances[m.user._id.toString()] = 0; });

      group.expenses.forEach(expense => {
        const payerId = expense.paidBy._id.toString();
        balances[payerId] = (balances[payerId] || 0) + expense.amount;

        expense.splits.forEach(split => {
          const splitUserId = split.user._id?.toString() || split.user.toString();
          if (!split.settled) {
            balances[splitUserId] = (balances[splitUserId] || 0) - split.amount;
          }
        });
      });

      // Convert to readable format
      const balanceSummary = group.members.map(m => ({
        user:    { _id: m.user._id, name: m.user.name, email: m.user.email },
        balance: Math.round((balances[m.user._id.toString()] || 0) * 100) / 100,
        status:  (balances[m.user._id.toString()] || 0) > 0 ? "owed" :
                 (balances[m.user._id.toString()] || 0) < 0 ? "owes" : "settled"
      }));

      res.json({
        success: true,
        group,
        balances: balanceSummary,
        totalSpend: group.expenses.reduce((s, e) => s + e.amount, 0)
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // POST /api/advanced/groups/:id/expenses — add group expense
  router.post("/groups/:id/expenses", protect, async (req, res) => {
    try {
      const { description, amount, category, splitType, customSplits, date } = req.body;
      const group = await SharedGroup.findById(req.params.id);
      if (!group) return res.status(404).json({ message: "Group not found" });

      const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ message: "Not a member" });

      const totalAmount  = Number(amount);
      const memberCount  = group.members.length;
      const equalShare   = Math.round((totalAmount / memberCount) * 100) / 100;

      // Calculate splits
      let splits = [];
      if (splitType === "custom" && customSplits) {
        splits = customSplits.map(s => ({ user: s.userId, amount: Number(s.amount), settled: false }));
      } else {
        // Equal split among all members
        splits = group.members.map((m, i) => ({
          user: m.user,
          // Handle rounding — last person gets remainder
          amount: i === memberCount - 1
            ? Math.round((totalAmount - equalShare * (memberCount - 1)) * 100) / 100
            : equalShare,
          settled: m.user.toString() === req.user._id.toString() // payer is auto-settled
        }));
      }

      group.expenses.push({
        description,
        amount: totalAmount,
        paidBy: req.user._id,
        category: category || "Other",
        date:   date ? new Date(date) : new Date(),
        splits
      });

      await group.save();
      res.status(201).json({ success: true, expense: group.expenses[group.expenses.length - 1] });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // PATCH /api/advanced/groups/:id/expenses/:expId/settle — mark split as settled
  router.patch("/groups/:id/expenses/:expId/settle", protect, async (req, res) => {
    try {
      const group = await SharedGroup.findById(req.params.id);
      if (!group) return res.status(404).json({ message: "Group not found" });

      const expense = group.expenses.id(req.params.expId);
      if (!expense) return res.status(404).json({ message: "Expense not found" });

      const split = expense.splits.find(s => s.user.toString() === req.user._id.toString());
      if (!split) return res.status(404).json({ message: "Split not found for this user" });

      split.settled   = true;
      split.settledAt = new Date();
      await group.save();

      res.json({ success: true, message: "Marked as settled" });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // DELETE /api/advanced/groups/:id — deactivate group
  router.delete("/groups/:id", protect, async (req, res) => {
    try {
      const group = await SharedGroup.findById(req.params.id);
      if (!group) return res.status(404).json({ message: "Group not found" });
      if (group.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Only group owner can delete" });
      }
      group.isActive = false;
      await group.save();
      res.json({ success: true, message: "Group archived" });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  return router;
};