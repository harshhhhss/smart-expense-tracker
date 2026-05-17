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
  const trends = analyzeTrends(expenses);
  const categoryAnalysis = analyzeCategoryTrends(expenses);
  
  const insights = [
    {
      type: "summary",
      title: "Total Spend",
      message: `You have tracked ₹${total.toFixed(2)} across ${expenses.length} expenses.`
    },
    {
      type: "info",
      title: "Top Category",
      message: `${topCategory.category} is your biggest category at ₹${topCategory.amount.toFixed(2)}.`
    },
    {
      type: "projection",
      title: "Month Forecast",
      message: `Your current pace points to about ₹${prediction.predictedMonthlySpend} this month.`
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

  // Add trend analysis
  if (trends.isIncreasing) {
    insights.push({
      type: "warning",
      title: "Spending Trend",
      message: `Your spending is increasing. Last month you spent ₹${trends.lastMonthTotal.toFixed(2)}, this month it's ₹${trends.thisMonthTotal.toFixed(2)}.`
    });
  } else if (trends.isDecreasing) {
    insights.push({
      type: "positive",
      title: "Spending Trend",
      message: `Great job! Your spending is decreasing. Last month: ₹${trends.lastMonthTotal.toFixed(2)}, this month: ₹${trends.thisMonthTotal.toFixed(2)}.`
    });
  }

  // Add savings opportunity
  if (categoryAnalysis.opportunityCategory) {
    insights.push({
      type: "info",
      title: "Savings Opportunity",
      message: `${categoryAnalysis.opportunityCategory} spending is notably high. Consider cutting back to save money.`
    });
  }

  // Add spending pattern
  if (categoryAnalysis.mostFrequent) {
    insights.push({
      type: "info",
      title: "Spending Pattern",
      message: `${categoryAnalysis.mostFrequent} is your most frequent expense (${categoryAnalysis.mostFrequentCount} times).`
    });
  }

  return insights;
};

const analyzeTrends = (expenses) => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthExpenses = expenses.filter(exp => new Date(exp.date) >= thisMonthStart);
  const lastMonthExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate >= lastMonthStart && expDate <= lastMonthEnd;
  });

  const thisMonthTotal = thisMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const percentChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  return {
    thisMonthTotal,
    lastMonthTotal,
    percentChange,
    isIncreasing: percentChange > 5,
    isDecreasing: percentChange < -5,
    isStable: Math.abs(percentChange) <= 5
  };
};

const analyzeCategoryTrends = (expenses) => {
  const categoryCount = {};
  const categoryTotal = {};

  expenses.forEach(exp => {
    categoryCount[exp.category] = (categoryCount[exp.category] || 0) + 1;
    categoryTotal[exp.category] = (categoryTotal[exp.category] || 0) + exp.amount;
  });

  const mostFrequent = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
  const topByAmount = Object.entries(categoryTotal).sort((a, b) => b[1] - a[1])[0];

  // Find opportunity (high spending category)
  let opportunityCategory = null;
  if (topByAmount && topByAmount[1] > 10000) {
    opportunityCategory = topByAmount[0];
  }

  return {
    mostFrequent: mostFrequent?.[0],
    mostFrequentCount: mostFrequent?.[1],
    topByAmount: topByAmount?.[0],
    topByAmountTotal: topByAmount?.[1],
    opportunityCategory
  };
};
