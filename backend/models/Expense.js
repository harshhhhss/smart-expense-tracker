// ─────────────────────────────────────────────
//  models/Expense.js — Expense Schema & Model
// ─────────────────────────────────────────────
const mongoose = require("mongoose");

// ── Predefined expense categories ──
const CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Education",
  "Personal Care",
  "Other",
];

const expenseSchema = new mongoose.Schema(
  {
    // Reference to the user who owns this expense
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster queries by user
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
      // Store as float with 2 decimal precision
      get: (v) => Math.round(v * 100) / 100,
    },
    category: {
      type: String,
      enum: {
        values: CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      required: [true, "Category is required"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Description cannot exceed 300 characters"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    // Enable getters (for the amount rounding above)
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// ── Compound index: user + date for efficient dashboard queries ──
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

// ── Static: expose categories list ──
expenseSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model("Expense", expenseSchema);