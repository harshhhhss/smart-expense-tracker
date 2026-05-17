import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createRecurringExpense,
  getRecurringExpenses,
  updateRecurringExpense,
  deleteRecurringExpense,
  processRecurringExpenses
} from "../controllers/recurringExpenseController.js";

const router = express.Router();

router.post("/", authMiddleware, createRecurringExpense);
router.get("/", authMiddleware, getRecurringExpenses);
router.put("/:id", authMiddleware, updateRecurringExpense);
router.delete("/:id", authMiddleware, deleteRecurringExpense);
router.post("/process", processRecurringExpenses); // Call this from a cron job

export default router;
