import Expense from "../models/Expense.js";
import { detectCategory } from "../utils/autoCategory.js";

const normalizeExpenseInput = (body) => {
  const description = body.description?.trim() || "";
  const autoDetected = !body.category || body.category === "Auto";
  const category = autoDetected ? detectCategory(description) : body.category;

  return {
    amount: Number(body.amount),
    category,
    description,
    date: body.date ? new Date(body.date) : new Date(),
    autoTagged: autoDetected
  };
};

export const addExpense = async (req, res, next) => {
  try {
    const input = normalizeExpenseInput(req.body);

    if (!input.amount || input.amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const expense = await Expense.create({
      user: req.user._id,
      ...input
    });

    res.status(201).json({ expense });
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1, createdAt: -1 });
    res.json({ expenses });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const input = normalizeExpenseInput(req.body);

    if (!input.amount || input.amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      input,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted", id: req.params.id });
  } catch (error) {
    next(error);
  }
};

export const detectExpenseCategory = async (req, res) => {
  const detected = detectCategory(req.body.description || "");
  const allowedCategories = ["Food", "Travel", "Shopping", "Entertainment", "Health", "Utilities", "Education", "Personal Care", "Miscellaneous"];
  const category = allowedCategories.includes(detected) ? detected : "Miscellaneous";
  res.json({ category });
};
