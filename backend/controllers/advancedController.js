import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";
import SharedGroup from "../models/SharedGroup.js";
import {
  detectAnomalies,
  getCategoryBreakdown,
  getCategoryData,
  getDashboardSummary,
  getMonthlyData,
  getTotal,
  predictMonthlySpending
} from "../utils/analytics.js";
import { generateInsights } from "../utils/insights.js";

const categories = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Education", "Travel", "Utilities", "Personal Care", "Miscellaneous"];

const getUserExpenses = (userId) => Expense.find({ user: userId }).sort({ date: -1 });

const budgetToObject = (budget) => ({
  _id: budget?._id,
  monthlyLimit: budget?.monthlyLimit || 0,
  income: budget?.income || 0,
  limits: budget?.limits ? Object.fromEntries(budget.limits) : {}
});

const makeInviteCode = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export const getDashboard = async (req, res, next) => {
  try {
    const expenses = await getUserExpenses(req.user._id);
    const budget = await Budget.findOne({ user: req.user._id });
    const currentMonth = expenses.filter((expense) => {
      const date = new Date(expense.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    res.json({
      dashboard: {
        summary: getDashboardSummary(expenses),
        chartData: {
          categoryData: getCategoryData(currentMonth.length ? currentMonth : expenses),
          monthlyData: getMonthlyData(expenses)
        },
        insights: generateInsights(expenses, budget),
        prediction: predictMonthlySpending(expenses),
        anomalies: detectAnomalies(expenses)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdvancedAnalytics = getDashboard;

export const getBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ user: req.user._id });
    const expenses = await getUserExpenses(req.user._id);
    const currentSpend = getCategoryBreakdown(expenses);
    const limit = budget?.monthlyLimit || 0;
    const spent = getTotal(expenses);

    res.json({
      budget: budgetToObject(budget),
      currentSpend,
      status: {
        limit,
        spent,
        remaining: Math.max(limit - spent, 0),
        percentage: limit ? Math.round((spent / limit) * 100) : 0,
        exceeded: limit > 0 && spent > limit
      }
    });
  } catch (error) {
    next(error);
  }
};

export const setBudget = async (req, res, next) => {
  try {
    const limits = req.body.limits || {};
    const monthlyLimit = req.body.monthlyLimit ?? Object.values(limits).reduce((sum, value) => sum + Number(value || 0), 0);

    if (monthlyLimit < 0 || Number(req.body.income || 0) < 0) {
      return res.status(400).json({ message: "Budget values cannot be negative" });
    }

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id },
      {
        monthlyLimit: Number(monthlyLimit) || 0,
        income: Number(req.body.income) || 0,
        limits
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ budget: budgetToObject(budget) });
  } catch (error) {
    next(error);
  }
};

export const getBudgetRecommendation = async (req, res, next) => {
  try {
    const expenses = await getUserExpenses(req.user._id);
    const budget = await Budget.findOne({ user: req.user._id });
    const spend = getCategoryBreakdown(expenses);
    const avgMonthlySpend = Math.round(getTotal(expenses) / Math.max(getMonthlyData(expenses).filter((m) => m.total > 0).length, 1));
    const estimatedIncome = Number(req.query.income || budget?.income || Math.max(avgMonthlySpend * 1.35, 0));
    const needsBudget = Math.round(estimatedIncome * 0.5);
    const wantsBudget = Math.round(estimatedIncome * 0.3);
    const savingsBudget = Math.round(estimatedIncome * 0.2);

    const recommendations = categories.map((category) => {
      const currentAvg = Math.round(spend[category] || 0);
      const base = ["Bills", "Utilities", "Health", "Education"].includes(category) ? needsBudget / 4 : wantsBudget / 6;
      const recommendedBudget = Math.max(Math.round(base), Math.round(currentAvg * 0.9), 500);
      const status = currentAvg > recommendedBudget * 1.15 ? "overspending" : currentAvg > recommendedBudget ? "slightly_over" : currentAvg < recommendedBudget * 0.5 ? "underspending" : "on_track";
      return {
        category,
        currentAvg,
        recommendedBudget,
        status,
        advice: status === "overspending" ? "Reduce this category or raise the budget if it is essential." : "This limit looks reasonable for your current pattern."
      };
    });

    const savingsRate = estimatedIncome ? Math.max(0, Math.round(((estimatedIncome - avgMonthlySpend) / estimatedIncome) * 100)) : 0;

    res.json({
      avgMonthlySpend,
      estimatedIncome,
      savingsRate,
      healthScore: Math.max(0, Math.min(100, savingsRate * 2 + (avgMonthlySpend <= estimatedIncome ? 30 : 0))),
      allocation: {
        needs: { actual: Math.round((spend.Bills || 0) + (spend.Utilities || 0) + (spend.Health || 0) + (spend.Education || 0)), budget: needsBudget },
        wants: { actual: Math.round(avgMonthlySpend), budget: wantsBudget },
        savings: { actual: Math.max(estimatedIncome - avgMonthlySpend, 0), budget: savingsBudget }
      },
      recommendations
    });
  } catch (error) {
    next(error);
  }
};

export const getPrediction = async (req, res, next) => {
  try {
    const expenses = await getUserExpenses(req.user._id);
    res.json({
      prediction: predictMonthlySpending(expenses),
      history: getMonthlyData(expenses)
    });
  } catch (error) {
    next(error);
  }
};

export const getAnomalies = async (req, res, next) => {
  try {
    const expenses = await getUserExpenses(req.user._id);
    const anomalies = detectAnomalies(expenses);
    res.json({
      anomalies,
      summary: {
        total: anomalies.length,
        critical: anomalies.filter((item) => item.severity === "critical").length,
        warnings: anomalies.filter((item) => item.severity !== "critical").length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getGroups = async (req, res, next) => {
  try {
    const groups = await SharedGroup.find({ members: req.user._id })
      .populate("members", "name email")
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 });
    res.json({ groups });
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    if (!req.body.name?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    let inviteCode = makeInviteCode();
    while (await SharedGroup.exists({ inviteCode })) inviteCode = makeInviteCode();

    const group = await SharedGroup.create({
      name: req.body.name.trim(),
      emoji: req.body.emoji || "Group",
      inviteCode,
      createdBy: req.user._id,
      members: [req.user._id],
      expenses: []
    });

    res.status(201).json({ group });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const group = await SharedGroup.findOne({ inviteCode: req.body.inviteCode });
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.some((id) => id.equals(req.user._id))) {
      group.members.push(req.user._id);
      await group.save();
    }

    res.json({ group });
  } catch (error) {
    next(error);
  }
};

export const getGroupDetail = async (req, res, next) => {
  try {
    const group = await SharedGroup.findOne({ _id: req.params.id, members: req.user._id })
      .populate("members", "name email")
      .populate("createdBy", "name email")
      .populate("expenses.paidBy", "name email")
      .populate("expenses.splits.user", "name email");

    if (!group) return res.status(404).json({ message: "Group not found" });

    const totalSpend = group.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const balances = group.members.map((member) => {
      const paid = group.expenses
        .filter((expense) => expense.paidBy?._id?.equals(member._id))
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      const owed = group.expenses.reduce((sum, expense) => {
        const split = expense.splits.find((item) => item.user?._id?.equals(member._id));
        return sum + (split && !split.settled ? Number(split.amount || 0) : 0);
      }, 0);
      return { user: member, balance: Number((paid - owed).toFixed(2)) };
    });

    res.json({ group, totalSpend, balances });
  } catch (error) {
    next(error);
  }
};

export const addGroupExpense = async (req, res, next) => {
  try {
    const group = await SharedGroup.findOne({ _id: req.params.id, members: req.user._id });
    if (!group) return res.status(404).json({ message: "Group not found" });

    const amount = Number(req.body.amount);
    if (!req.body.description || !amount || amount <= 0) {
      return res.status(400).json({ message: "Description and valid amount are required" });
    }

    const splitAmount = Number((amount / group.members.length).toFixed(2));
    group.expenses.push({
      description: req.body.description,
      amount,
      category: req.body.category || "Miscellaneous",
      date: req.body.date ? new Date(req.body.date) : new Date(),
      paidBy: req.user._id,
      splits: group.members.map((member) => ({
        user: member,
        amount: splitAmount,
        settled: member.equals(req.user._id)
      }))
    });

    await group.save();
    res.status(201).json({ group });
  } catch (error) {
    next(error);
  }
};

export const settleGroupExpense = async (req, res, next) => {
  try {
    const group = await SharedGroup.findOne({ _id: req.params.id, members: req.user._id });
    if (!group) return res.status(404).json({ message: "Group not found" });

    const expense = group.expenses.id(req.params.expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const split = expense.splits.find((item) => item.user.equals(req.user._id));
    if (split) split.settled = true;

    await group.save();
    res.json({ group });
  } catch (error) {
    next(error);
  }
};
