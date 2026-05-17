import mongoose from "mongoose";

const recurringExpenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"]
    },
    category: {
      type: String,
      required: true,
      enum: ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Education", "Travel", "Utilities", "Personal Care", "Miscellaneous"]
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"],
      default: "monthly"
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    lastCreated: {
      type: Date,
      default: null
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("RecurringExpense", recurringExpenseSchema);
