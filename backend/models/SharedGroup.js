// backend/models/SharedGroup.js
// Feature 5: Shared Expense / Friend System
// Groups allow multiple users to track shared expenses together

const mongoose = require("mongoose");

const sharedExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  amount:      { type: Number, required: true, min: 0.01 },
  paidBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category:    { type: String, default: "Other" },
  date:        { type: Date, default: Date.now },
  // Who owes what (split details)
  splits: [{
    user:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount:   { type: Number, required: true },
    settled:  { type: Boolean, default: false },
    settledAt:{ type: Date }
  }]
}, { timestamps: true });

const sharedGroupSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, maxlength: 80 },
  emoji:   { type: String, default: "👥" },
  // Creator / admin
  owner:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // All members (including owner)
  members: [{
    user:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    nickname: { type: String, default: "" },
    role:     { type: String, enum: ["admin", "member", "viewer"], default: "member" },
    joinedAt: { type: Date, default: Date.now }
  }],
  // Invite code for joining
  inviteCode: {
    type: String,
    unique: true,
    default: () => Math.random().toString(36).substring(2, 10).toUpperCase()
  },
  expenses:  [sharedExpenseSchema],
  isActive:  { type: Boolean, default: true }
}, { timestamps: true });

// Virtual: total group spending
sharedGroupSchema.virtual("totalSpend").get(function() {
  return this.expenses.reduce((s, e) => s + e.amount, 0);
});

module.exports = mongoose.model("SharedGroup", sharedGroupSchema);