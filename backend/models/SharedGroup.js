import mongoose from "mongoose";

const splitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, default: 0 },
    settled: { type: Boolean, default: false }
  },
  { _id: false }
);

const groupExpenseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, default: "Miscellaneous" },
    date: { type: Date, default: Date.now },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    splits: [splitSchema]
  },
  { timestamps: true }
);

const sharedGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    emoji: {
      type: String,
      default: "Group"
    },
    inviteCode: {
      type: String,
      unique: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    expenses: [groupExpenseSchema]
  },
  { timestamps: true }
);

export default mongoose.model("SharedGroup", sharedGroupSchema);
