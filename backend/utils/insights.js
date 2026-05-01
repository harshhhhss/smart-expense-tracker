import {
  getTotal,
  getTopCategory,
  detectAnomalies,
  predictMonthlySpending
} from "./analytics.js";

export const generateInsights = (expenses = [], budget = null) => {
  if (!expenses.length) {
    return [
      {
        type: "info",
        title: "Start Tracking",
        message: "Add your first expense to unlock category trends, forecasts, and budget insights."
      }
    ];
  }

  const total = getTotal(expenses);
  const topCategory = getTopCategory(expenses);
  const anomalies = detectAnomalies(expenses);
  const prediction = predictMonthlySpending(expenses);
  const insights = [
    {
      type: "summary",
      title: "Total Spend",
      message: `You have tracked Rs ${total.toFixed(2)} across ${expenses.length} expenses.`
    },
    {
      type: "info",
      title: "Top Category",
      message: `${topCategory.category} is your biggest category at Rs ${topCategory.amount.toFixed(2)}.`
    },
    {
      type: "projection",
      title: "Month Forecast",
      message: `Your current pace points to about Rs ${prediction.predictedMonthlySpend} this month.`
    }
  ];

  if (budget?.monthlyLimit > 0) {
    const pct = Math.round((prediction.spentSoFar / budget.monthlyLimit) * 100);
    insights.push({
      type: pct > 85 ? "warning" : "positive",
      title: "Budget Pace",
      message: `You have used ${pct}% of your monthly budget.`
    });
  }

  if (anomalies.length) {
    insights.push({
      type: "warning",
      title: "Unusual Spend",
      message: `${anomalies.length} transaction(s) are much higher than your normal spending pattern.`
    });
  }

  return insights;
};
