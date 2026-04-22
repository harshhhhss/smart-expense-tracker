// utils/insights.js
// Generates human-readable spending insights from raw expense data
// No external AI API — pure logic-based analysis

/**
 * Main insights generator
 * @param {Array} allExpenses - all user expenses (any time range)
 * @returns {Array<{type, title, message, meta}>} - array of insight objects
 */
const generateInsights = (allExpenses) => {
  const insights = [];
  const now = new Date();

  if (!allExpenses || allExpenses.length === 0) {
    return [{ type: "info", title: "No Data Yet", message: "Add your first expense to start seeing personalized insights.", meta: {} }];
  }

  // ── Date helpers ──────────────────────────────────────────
  const startOf = (offsetMonths = 0) => new Date(now.getFullYear(), now.getMonth() - offsetMonths, 1);
  const endOf   = (offsetMonths = 0) => new Date(now.getFullYear(), now.getMonth() - offsetMonths + 1, 0, 23, 59, 59);

  const thisMonthStart = startOf(0);
  const lastMonthStart = startOf(1);
  const lastMonthEnd   = endOf(1);

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setMilliseconds(-1);

  // ── Filter helpers ─────────────────────────────────────────
  const inRange = (expenses, start, end) =>
    expenses.filter(e => { const d = new Date(e.date); return d >= start && d <= end; });

  const sumAmount = (expenses) =>
    expenses.reduce((s, e) => s + Number(e.amount), 0);

  const byCategory = (expenses) =>
    expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + Number(e.amount); return acc; }, {});

  const fmt = (n) => `₹${Number(n).toFixed(2)}`;
  const pct = (a, b) => b === 0 ? null : Math.round(((a - b) / b) * 100);

  // ── Expense slices ─────────────────────────────────────────
  const thisMonth  = inRange(allExpenses, thisMonthStart, now);
  const lastMonth  = inRange(allExpenses, lastMonthStart, lastMonthEnd);
  const thisWeek   = inRange(allExpenses, thisWeekStart, now);
  const lastWeek   = inRange(allExpenses, lastWeekStart, lastWeekEnd);

  const thisMonthTotal = sumAmount(thisMonth);
  const lastMonthTotal = sumAmount(lastMonth);
  const thisWeekTotal  = sumAmount(thisWeek);
  const lastWeekTotal  = sumAmount(lastWeek);

  // ════════════════════════════════════════════
  // INSIGHT 1 — Monthly Summary
  // ════════════════════════════════════════════
  insights.push({
    type: "summary",
    title: "Monthly Overview",
    message: thisMonthTotal > 0
      ? `You've spent ${fmt(thisMonthTotal)} this month across ${thisMonth.length} transaction${thisMonth.length !== 1 ? "s" : ""}.`
      : "No expenses recorded this month yet.",
    meta: { amount: thisMonthTotal, count: thisMonth.length }
  });

  // ════════════════════════════════════════════
  // INSIGHT 2 — Month-over-Month Change
  // ════════════════════════════════════════════
  const monthPct = pct(thisMonthTotal, lastMonthTotal);
  if (monthPct !== null) {
    const isUp = monthPct > 0;
    insights.push({
      type: isUp ? "warning" : "positive",
      title: isUp ? "Spending Increased" : "Spending Decreased",
      message: isUp
        ? `You've spent ${Math.abs(monthPct)}% more this month (${fmt(thisMonthTotal)}) compared to last month (${fmt(lastMonthTotal)}). Try to cut back!`
        : `Great job! You spent ${Math.abs(monthPct)}% less this month (${fmt(thisMonthTotal)}) vs last month (${fmt(lastMonthTotal)}).`,
      meta: { change: monthPct, thisMonth: thisMonthTotal, lastMonth: lastMonthTotal }
    });
  }

  // ════════════════════════════════════════════
  // INSIGHT 3 — Week-over-Week Change
  // ════════════════════════════════════════════
  const weekPct = pct(thisWeekTotal, lastWeekTotal);
  if (weekPct !== null && thisWeekTotal > 0) {
    const isUp = weekPct > 0;
    insights.push({
      type: isUp ? "warning" : "positive",
      title: isUp ? "Weekly Spending Up" : "Weekly Spending Down",
      message: isUp
        ? `You spent ${Math.abs(weekPct)}% more this week (${fmt(thisWeekTotal)}) vs last week (${fmt(lastWeekTotal)}).`
        : `You spent ${Math.abs(weekPct)}% less this week (${fmt(thisWeekTotal)}) vs last week (${fmt(lastWeekTotal)}).`,
      meta: { change: weekPct, thisWeek: thisWeekTotal, lastWeek: lastWeekTotal }
    });
  }

  // ════════════════════════════════════════════
  // INSIGHT 4 — Top Spending Category
  // ════════════════════════════════════════════
  const catTotals = byCategory(thisMonth);
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

  if (sortedCats.length > 0) {
    const [topCat, topAmt] = sortedCats[0];
    const topPct = thisMonthTotal > 0 ? Math.round((topAmt / thisMonthTotal) * 100) : 0;
    insights.push({
      type: "info",
      title: "Top Spending Category",
      message: `${topCat} is your biggest expense this month at ${fmt(topAmt)} — that's ${topPct}% of your total spending.`,
      meta: { category: topCat, amount: topAmt, percentage: topPct }
    });
  }

  // ════════════════════════════════════════════
  // INSIGHT 5 — Category Distribution
  // ════════════════════════════════════════════
  if (sortedCats.length >= 2) {
    const dist = sortedCats.slice(0, 3).map(([cat, amt]) => {
      const p = thisMonthTotal > 0 ? Math.round((amt / thisMonthTotal) * 100) : 0;
      return `${cat} (${p}%)`;
    }).join(", ");
    insights.push({
      type: "info",
      title: "Spending Distribution",
      message: `Your top categories this month: ${dist}. Diversifying helps you spot overspending faster.`,
      meta: { breakdown: sortedCats.slice(0, 3).map(([cat, amt]) => ({ cat, amt })) }
    });
  }

  // ════════════════════════════════════════════
  // INSIGHT 6 — Unusual Single Expense
  // ════════════════════════════════════════════
  if (thisMonth.length >= 4) {
    const amounts = thisMonth.map(e => Number(e.amount));
    const avg = sumAmount(thisMonth) / thisMonth.length;
    const unusual = thisMonth
      .filter(e => Number(e.amount) > avg * 2.5)
      .sort((a, b) => Number(b.amount) - Number(a.amount))[0];

    if (unusual) {
      insights.push({
        type: "alert",
        title: "Unusual Expense Detected",
        message: `${fmt(unusual.amount)} on "${unusual.description || unusual.category}" is ${Math.round(Number(unusual.amount) / avg)}x your average transaction (${fmt(avg)}). Was this planned?`,
        meta: { expense: unusual, avgAmount: avg }
      });
    }
  }

  // ════════════════════════════════════════════
  // INSIGHT 7 — Daily Average & Month Projection
  // ════════════════════════════════════════════
  if (thisMonth.length > 0) {
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAvg = thisMonthTotal / dayOfMonth;
    const projected = dailyAvg * daysInMonth;

    insights.push({
      type: "projection",
      title: "Month-End Projection",
      message: `At your current pace of ${fmt(dailyAvg)}/day, you'll spend ~${fmt(projected)} by end of ${now.toLocaleString("default", { month: "long" })}. ${projected > lastMonthTotal && lastMonthTotal > 0 ? "That's more than last month!" : ""}`,
      meta: { dailyAvg, projected, daysRemaining: daysInMonth - dayOfMonth }
    });
  }

  // ════════════════════════════════════════════
  // INSIGHT 8 — Frequent Small Purchases
  // ════════════════════════════════════════════
  if (thisMonth.length >= 5) {
    const smallThreshold = 200;
    const smallExpenses = thisMonth.filter(e => Number(e.amount) < smallThreshold);
    const smallTotal = sumAmount(smallExpenses);

    if (smallExpenses.length >= 5) {
      insights.push({
        type: "tip",
        title: "Small Purchases Adding Up",
        message: `You made ${smallExpenses.length} small purchases (under ₹${smallThreshold}) totaling ${fmt(smallTotal)} this month. These small amounts add up quickly!`,
        meta: { count: smallExpenses.length, total: smallTotal }
      });
    }
  }

  return insights;
};

/**
 * Generates chart-ready data: category breakdown + monthly trend
 */
const generateChartData = (allExpenses) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Category pie data (this month)
  const thisMonth = allExpenses.filter(e => new Date(e.date) >= monthStart);
  const catMap = thisMonth.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});

  const categoryData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  // Monthly bar data (last 6 months)
  const monthlyMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlyMap[key] = 0;
  }

  allExpenses.forEach(e => {
    const d = new Date(e.date);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (monthlyMap.hasOwnProperty(key)) {
      monthlyMap[key] += Number(e.amount);
    }
  });

  const monthlyData = Object.entries(monthlyMap).map(([month, total]) => ({
    month,
    total: Math.round(total * 100) / 100
  }));

  return { categoryData, monthlyData };
};

module.exports = { generateInsights, generateChartData };