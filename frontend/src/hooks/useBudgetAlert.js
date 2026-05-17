import { useCallback, useMemo, useState } from "react";

export const useBudgetAlert = (expenses, budgets) => {
  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);

  const budgetAlerts = useMemo(() => {
    if (!budgets || !expenses || expenses.length === 0) return [];

    const alerts = [];
    const seen = new Set();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const thisMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= monthStart && expDate <= monthEnd;
    });

    const thisMonthTotal = thisMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const monthlyLimit = Number(budgets.monthlyLimit || 0);

    if (monthlyLimit > 0) {
      const percentUsed = (thisMonthTotal / monthlyLimit) * 100;
      if (percentUsed >= 80) {
        alerts.push({
          id: "monthly",
          category: "Monthly budget",
          severity: percentUsed >= 90 ? "warning" : "notice",
          spent: thisMonthTotal,
          limit: monthlyLimit,
          percent: Math.round(percentUsed),
          message: percentUsed >= 90 ? "Monthly budget is close to its limit" : "Monthly budget is above 80%",
        });
        seen.add("monthly");
      }
    }

    if (budgets.limits && Object.keys(budgets.limits).length > 0) {
      const categorySpending = {};
      thisMonthExpenses.forEach(exp => {
        categorySpending[exp.category] = (categorySpending[exp.category] || 0) + Number(exp.amount || 0);
      });

      Object.entries(budgets.limits).forEach(([category, rawLimit]) => {
        const limit = Number(rawLimit || 0);
        const spent = categorySpending[category] || 0;
        const id = `category:${category}`;
        if (limit > 0 && spent >= limit * 0.9 && !seen.has(id)) {
          const percent = (spent / limit) * 100;
          alerts.push({
            id,
            category,
            severity: spent > limit ? "warning" : "notice",
            spent,
            limit,
            percent: Math.round(percent),
            message: spent > limit ? "Category budget exceeded" : "Category budget is above 90%",
          });
          seen.add(id);
        }
      });
    }

    return alerts.filter(alert => !dismissedAlertIds.includes(alert.id));
  }, [expenses, budgets, dismissedAlertIds]);

  const dismissBudgetAlert = useCallback((id) => {
    setDismissedAlertIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const checkBudgetStatus = useCallback(() => budgetAlerts, [budgetAlerts]);

  return { budgetAlerts, dismissBudgetAlert, checkBudgetStatus };
};

export default useBudgetAlert;
