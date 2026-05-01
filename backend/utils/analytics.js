export const getTotal = (expenses = []) =>
  expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

export const getCategoryBreakdown = (expenses = []) =>
  expenses.reduce((breakdown, expense) => {
    const category = expense.category || "Other";
    breakdown[category] = (breakdown[category] || 0) + Number(expense.amount || 0);
    return breakdown;
  }, {});

export const getCategoryData = (expenses = []) =>
  Object.entries(getCategoryBreakdown(expenses)).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2))
  }));

export const getTopCategory = (expenses = []) => {
  const entries = Object.entries(getCategoryBreakdown(expenses));
  if (!entries.length) return { category: "None", amount: 0 };

  const [category, amount] = entries.sort((a, b) => b[1] - a[1])[0];
  return { category, amount: Number(amount.toFixed(2)) };
};

export const getMonthlyData = (expenses = [], monthsBack = 6) => {
  const now = new Date();
  const buckets = [];

  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleString("default", { month: "short", year: "2-digit" }),
      total: 0
    });
  }

  expenses.forEach((expense) => {
    const date = new Date(expense.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) bucket.total += Number(expense.amount || 0);
  });

  return buckets.map(({ month, total }) => ({
    month,
    total: Number(total.toFixed(2))
  }));
};

export const getCurrentMonthExpenses = (expenses = []) => {
  const now = new Date();
  return expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
};

export const getDashboardSummary = (expenses = []) => {
  const now = new Date();
  const thisMonth = expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
  });

  const thisMonthTotal = getTotal(thisMonth);
  const lastMonthTotal = getTotal(lastMonth);
  const change = lastMonthTotal
    ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
    : thisMonthTotal > 0
      ? 100
      : 0;

  return {
    total: Number(getTotal(expenses).toFixed(2)),
    thisMonth: Number(thisMonthTotal.toFixed(2)),
    lastMonth: Number(lastMonthTotal.toFixed(2)),
    monthOverMonthChange: change,
    totalExpensesThisMonth: thisMonth.length,
    totalExpenses: expenses.length,
    topCategory: getTopCategory(thisMonth.length ? thisMonth : expenses)
  };
};

export const detectAnomalies = (expenses = []) => {
  if (expenses.length < 3) return [];

  const average = getTotal(expenses) / expenses.length;
  const grouped = getCategoryBreakdown(expenses);

  return expenses
    .filter((expense) => Number(expense.amount) > average * 2)
    .map((expense) => {
      const categoryAverage = grouped[expense.category] / expenses.filter((item) => item.category === expense.category).length;
      const severity = Number(expense.amount) > average * 3 ? "critical" : "warning";
      return {
        _id: expense._id,
        type: "transaction_spike",
        category: expense.category,
        description: expense.description,
        amount: Number(expense.amount),
        date: expense.date,
        severity,
        message: `${expense.category} spend is higher than your usual Rs ${Math.round(categoryAverage || average)} pattern.`
      };
    });
};

export const predictMonthlySpending = (expenses = []) => {
  const now = new Date();
  const currentMonthExpenses = getCurrentMonthExpenses(expenses);
  const spentSoFar = getTotal(currentMonthExpenses);
  const currentDay = Math.max(now.getDate(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const predictedMonthlySpend = Math.round((spentSoFar / currentDay) * daysInMonth);

  return {
    spentSoFar: Number(spentSoFar.toFixed(2)),
    predictedMonthlySpend,
    predicted: predictedMonthlySpend,
    lower: Math.max(0, Math.round(predictedMonthlySpend * 0.85)),
    upper: Math.round(predictedMonthlySpend * 1.15),
    confidence: expenses.length >= 12 ? 82 : expenses.length >= 6 ? 68 : 45,
    trend: getTrend(expenses),
    dataPoints: expenses.length
  };
};

export const getTrend = (expenses = []) => {
  const monthly = getMonthlyData(expenses, 6).filter((item) => item.total > 0);
  if (monthly.length < 2) return "insufficient_data";
  const first = monthly[0].total;
  const last = monthly[monthly.length - 1].total;
  if (last > first * 1.1) return "increasing";
  if (last < first * 0.9) return "decreasing";
  return "stable";
};
