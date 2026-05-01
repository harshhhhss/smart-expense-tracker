import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  detectExpenseCategory
} from "../controllers/expenseController.js";

const router = express.Router();

router.post("/detect-category", authMiddleware, detectExpenseCategory);
router.get("/", authMiddleware, getExpenses);
router.post("/", authMiddleware, addExpense);
router.put("/:id", authMiddleware, updateExpense);
router.delete("/:id", authMiddleware, deleteExpense);

export default router;
