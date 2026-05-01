import mongoose from "mongoose";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Travel",
  "Utilities",
  "Personal Care",
  "Other"
];

const expenseSchema = new mongoose.Schema(
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
      enum: categories,
      default: "Other"
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    date: {
      type: Date,
      default: Date.now
    },
    autoTagged: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
