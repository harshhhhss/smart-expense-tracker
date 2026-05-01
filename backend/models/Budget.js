import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    monthlyLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    income: {
      type: Number,
      default: 0,
      min: 0
    },
    limits: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model("Budget", budgetSchema);
