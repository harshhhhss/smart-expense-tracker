// backend/models/Budget.js
// Stores user-set monthly budgets per category

const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  month: { type: String, required: true }, // "YYYY-MM" format
  income: { type: Number, default: 0 },   // user-declared monthly income
  limits: {
    type: Map,
    of: Number,  // { "Food": 3000, "Travel": 1500, ... }
    default: {}
  }
}, { timestamps: true });

// Compound unique index — one budget doc per user per month
budgetSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);