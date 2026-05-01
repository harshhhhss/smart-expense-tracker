import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addGroupExpense,
  createGroup,
  getAdvancedAnalytics,
  getAnomalies,
  getBudget,
  getBudgetRecommendation,
  getDashboard,
  getGroupDetail,
  getGroups,
  getPrediction,
  joinGroup,
  setBudget,
  settleGroupExpense
} from "../controllers/advancedController.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, getDashboard);
router.get("/analytics", authMiddleware, getAdvancedAnalytics);
router.get("/budget", authMiddleware, getBudget);
router.post("/budget", authMiddleware, setBudget);
router.get("/budget/recommend", authMiddleware, getBudgetRecommendation);
router.get("/predict", authMiddleware, getPrediction);
router.get("/anomalies", authMiddleware, getAnomalies);
router.get("/groups", authMiddleware, getGroups);
router.post("/groups", authMiddleware, createGroup);
router.post("/groups/join", authMiddleware, joinGroup);
router.get("/groups/:id", authMiddleware, getGroupDetail);
router.post("/groups/:id/expenses", authMiddleware, addGroupExpense);
router.patch("/groups/:id/expenses/:expenseId/settle", authMiddleware, settleGroupExpense);

export default router;
