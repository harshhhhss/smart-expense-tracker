// backend/utils/analytics.js
// Pure JS implementations of: NLP categorization, spending prediction,
// anomaly detection, and budget recommendation engine

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 1: NLP-BASED EXPENSE CATEGORIZATION
// Uses weighted keyword matching + bigram context detection
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_RULES = {
  Food: {
    weight: 1,
    keywords: [
      "pizza","burger","food","lunch","dinner","breakfast","cafe","coffee","tea",
      "restaurant","swiggy","zomato","hotel","snack","biryani","dosa","sandwich",
      "juice","meal","eat","tiffin","bakery","dessert","icecream","chai","maggi",
      "noodles","pasta","sushi","chicken","mutton","veg","thali","paratha","roti",
      "dominos","kfc","mcdonalds","subway","barbeque","dhaba","canteen","mess"
    ],
    patterns: [/\bfood\b/i, /\beat(ing|s)?\b/i, /\brestaurant\b/i, /order(ed)?\s+from/i]
  },
  Travel: {
    weight: 1,
    keywords: [
      "uber","ola","bus","train","metro","cab","auto","taxi","flight","ticket",
      "travel","trip","petrol","fuel","diesel","toll","parking","rapido","redbus",
      "irctc","railway","airport","commute","ride","booking","highway","turnpike",
      "lyft","grab","bolt","bicycle","scooter","ferry","ship","cruise","visa"
    ],
    patterns: [/\bflight\b/i, /\btrain\b/i, /\bcab\b/i, /ticket(s)?\s+to/i]
  },
  Shopping: {
    weight: 1,
    keywords: [
      "amazon","flipkart","myntra","mall","shop","clothes","shirt","dress","shoes",
      "bag","grocery","supermarket","market","dmart","reliance","store","purchase",
      "order","delivery","fashion","jeans","jacket","watch","accessory","meesho",
      "ajio","snapdeal","nykaa","cosmetics","electronics","gadget","appliance","ikea"
    ],
    patterns: [/\bshop(ping)?\b/i, /\bbuy(ing)?\b/i, /\border(ed)?\b/i]
  },
  Entertainment: {
    weight: 1,
    keywords: [
      "netflix","prime","hotstar","spotify","movie","cinema","pvr","inox","game",
      "concert","show","theatre","disney","youtube","music","stream","party",
      "event","ticket","fun","outing","club","bar","bowling","arcade","bookmyshow",
      "hulu","appletv","hbo","zee5","sonyliv","gaming","steam","playstation","xbox"
    ],
    patterns: [/\bwatch(ing|ed)?\b/i, /\bplay(ing|ed)?\b/i, /\bstream(ing)?\b/i]
  },
  Health: {
    weight: 1.2, // higher weight — health is important to classify correctly
    keywords: [
      "doctor","hospital","medicine","pharmacy","clinic","health","medical","gym",
      "fitness","yoga","apollo","vaccine","test","lab","diagnostic","tablet","chemist",
      "prescription","insurance","dental","eye","physiotherapy","ayurveda","pilates",
      "meditating","wellness","therapy","psychiatrist","dietician","blood","xray","mri"
    ],
    patterns: [/\bdoctor\b/i, /\bhospital\b/i, /\bmedicine\b/i, /\bclinic\b/i]
  },
  Utilities: {
    weight: 1,
    keywords: [
      "electricity","water","wifi","internet","broadband","gas","recharge","mobile",
      "phone","bill","postpaid","airtel","jio","bsnl","vi","maintenance","rent",
      "emi","subscription","tax","society","housekeeping","maid","cook","plumber",
      "electrician","carpenter","cable","dth","landline","deposit","municipal"
    ],
    patterns: [/\bbill\b/i, /\brecharge\b/i, /\bsubscription\b/i, /\brent\b/i]
  },
  Education: {
    weight: 1.1,
    keywords: [
      "course","udemy","coursera","book","college","school","fees","tuition","class",
      "exam","study","library","notebook","pen","stationery","coaching","lecture",
      "workshop","seminar","certificate","degree","internship","training","skillshare",
      "pluralsight","edx","nptel","byju","unacademy","vedantu","whiteboard","marker"
    ],
    patterns: [/\bcourse\b/i, /\bfee(s)?\b/i, /\bexam\b/i, /\bclass(es)?\b/i]
  },
  "Personal Care": {
    weight: 1,
    keywords: [
      "salon","haircut","spa","parlour","nykaa","cosmetic","makeup","skincare",
      "shampoo","soap","grooming","perfume","deodorant","cream","lotion","barber",
      "facial","waxing","manicure","pedicure","hygiene","razor","toothpaste","lipstick"
    ],
    patterns: [/\bsalon\b/i, /\bgrooming\b/i, /\bskincare\b/i]
  }
};

/**
 * Classifies expense description using weighted keyword + pattern matching
 * Returns { category, confidence, method }
 */
const classifyExpense = (description) => {
  if (!description || description.trim().length === 0) {
    return { category: "Other", confidence: 0, method: "default" };
  }

  const lower = description.toLowerCase().trim();
  const words = lower.split(/[\s,.\-_/]+/).filter(w => w.length > 1);

  const scores = {};

  for (const [category, rule] of Object.entries(CATEGORY_RULES)) {
    let score = 0;

    // Keyword matching (exact word = 2pts, substring = 1pt)
    for (const keyword of rule.keywords) {
      if (words.includes(keyword)) score += 2 * rule.weight;
      else if (lower.includes(keyword)) score += 1 * rule.weight;
    }

    // Regex pattern matching (3pts each — more specific)
    for (const pattern of rule.patterns) {
      if (pattern.test(lower)) score += 3 * rule.weight;
    }

    if (score > 0) scores[category] = score;
  }

  if (Object.keys(scores).length === 0) {
    return { category: "Other", confidence: 0, method: "default" };
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topCategory, topScore] = sorted[0];
  const totalScore = sorted.reduce((s, [, v]) => s + v, 0);
  const confidence = Math.min(100, Math.round((topScore / totalScore) * 100));

  return {
    category: topCategory,
    confidence,
    method: "nlp",
    alternatives: sorted.slice(1, 3).map(([cat, sc]) => ({
      category: cat,
      confidence: Math.round((sc / totalScore) * 100)
    }))
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 2: MONTHLY SPENDING PREDICTION
// Uses weighted moving average + linear regression for trend detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple linear regression: y = mx + b
 * Returns slope (m) and intercept (b)
 */
const linearRegression = (points) => {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0 };

  const sumX  = points.reduce((s, p) => s + p.x, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

/**
 * Exponentially weighted moving average
 * Recent months carry more weight (alpha = 0.4)
 */
const ewma = (values, alpha = 0.4) => {
  if (values.length === 0) return 0;
  return values.reduce((acc, val, i) => {
    if (i === 0) return val;
    return alpha * val + (1 - alpha) * acc;
  });
};

/**
 * Predicts next month's spending using hybrid: 60% EWMA + 40% linear regression
 * @param {Array} monthlyTotals - [{month: "Jan 24", total: 5200}, ...]
 * @returns {Object} prediction with confidence band
 */
const predictNextMonth = (monthlyTotals) => {
  if (!monthlyTotals || monthlyTotals.length < 2) {
    return { predicted: 0, lower: 0, upper: 0, trend: "insufficient_data", confidence: 0 };
  }

  const values = monthlyTotals.map(m => m.total);
  const points = values.map((y, x) => ({ x, y }));

  // Weighted moving average prediction
  const ewmaPred = ewma(values);

  // Linear regression prediction
  const { slope, intercept } = linearRegression(points);
  const nextX = values.length;
  const regressionPred = Math.max(0, intercept + slope * nextX);

  // Hybrid prediction
  const predicted = Math.round(0.6 * ewmaPred + 0.4 * regressionPred);

  // Standard deviation for confidence band
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Trend direction
  const recentSlope = values.length >= 3
    ? values[values.length - 1] - values[values.length - 3]
    : slope;

  const trend = Math.abs(recentSlope) < mean * 0.05
    ? "stable"
    : recentSlope > 0 ? "increasing" : "decreasing";

  // Confidence: higher with more data points, lower with high variance
  const dataConfidence = Math.min(values.length / 6, 1); // max confidence at 6 months
  const varianceRatio  = stdDev / (mean || 1);
  const confidence     = Math.round(dataConfidence * (1 - Math.min(varianceRatio, 0.8)) * 100);

  return {
    predicted,
    lower:  Math.max(0, Math.round(predicted - stdDev)),
    upper:  Math.round(predicted + stdDev),
    trend,
    confidence,
    slope: Math.round(slope),
    dataPoints: values.length
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 3: ANOMALY DETECTION
// Z-score based detection at both transaction and monthly level
// ─────────────────────────────────────────────────────────────────────────────

const zScore = (value, mean, stdDev) => {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
};

/**
 * Detects anomalous expenses using Z-score per category
 * Z > 2.0 = warning, Z > 3.0 = critical
 * @param {Array} expenses - all user expenses
 * @returns {Array} flagged anomalies with severity + explanation
 */
const detectAnomalies = (expenses) => {
  if (!expenses || expenses.length < 5) return [];

  const anomalies = [];

  // Group by category
  const byCategory = expenses.reduce((acc, e) => {
    const cat = e.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(Number(e.amount));
    return acc;
  }, {});

  // Per-category Z-score anomaly detection
  for (const [category, amounts] of Object.entries(byCategory)) {
    if (amounts.length < 3) continue; // need at least 3 data points

    const mean   = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length);

    // Check each expense in this category
    const catExpenses = expenses.filter(e => e.category === category);
    for (const expense of catExpenses) {
      const z = zScore(Number(expense.amount), mean, stdDev);

      if (Math.abs(z) > 2.0) {
        const severity = Math.abs(z) > 3.0 ? "critical" : "warning";
        anomalies.push({
          expenseId:   expense._id,
          category,
          amount:      Number(expense.amount),
          date:        expense.date,
          description: expense.description || "",
          zScore:      Math.round(z * 100) / 100,
          severity,
          avgForCategory: Math.round(mean),
          message: `₹${Number(expense.amount).toFixed(0)} on ${category} is ${Math.abs(z).toFixed(1)}x standard deviations ${z > 0 ? "above" : "below"} your average of ₹${Math.round(mean)}`
        });
      }
    }
  }

  // Detect monthly spending spike
  const monthlyMap = {};
  expenses.forEach(e => {
    const key = new Date(e.date).toISOString().substring(0, 7); // YYYY-MM
    monthlyMap[key] = (monthlyMap[key] || 0) + Number(e.amount);
  });

  const monthlyValues = Object.values(monthlyMap);
  if (monthlyValues.length >= 3) {
    const mean   = monthlyValues.reduce((s, v) => s + v, 0) / monthlyValues.length;
    const stdDev = Math.sqrt(monthlyValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / monthlyValues.length);

    for (const [month, total] of Object.entries(monthlyMap)) {
      const z = zScore(total, mean, stdDev);
      if (z > 2.0) {
        anomalies.push({
          type:     "monthly_spike",
          month,
          amount:   Math.round(total),
          zScore:   Math.round(z * 100) / 100,
          severity: z > 3.0 ? "critical" : "warning",
          avgMonthly: Math.round(mean),
          message: `${month} had a spending spike of ₹${Math.round(total)} — ${z.toFixed(1)}σ above your monthly average of ₹${Math.round(mean)}`
        });
      }
    }
  }

  // Sort by severity then z-score
  return anomalies
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
      return Math.abs(b.zScore) - Math.abs(a.zScore);
    })
    .slice(0, 10); // max 10 anomalies to avoid noise
};

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE 4: BUDGET RECOMMENDATION ENGINE
// Rule-based with 50/30/20 heuristics + personal spending pattern analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates personalised budget recommendations
 * Based on: 50/30/20 rule + actual spending patterns + trend analysis
 * @param {Array} expenses - last 3 months of expenses
 * @param {Number} declaredIncome - optional user-declared monthly income
 * @returns {Object} budget plan + category recommendations
 */
const generateBudgetRecommendations = (expenses, declaredIncome = null) => {
  if (!expenses || expenses.length === 0) {
    return { error: "Insufficient data", recommendations: [] };
  }

  // Aggregate last 3 months
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const recent = expenses.filter(e => new Date(e.date) >= threeMonthsAgo);

  if (recent.length === 0) return { error: "Insufficient recent data", recommendations: [] };

  // Monthly totals
  const monthlyMap = {};
  recent.forEach(e => {
    const key = new Date(e.date).toISOString().substring(0, 7);
    monthlyMap[key] = (monthlyMap[key] || 0) + Number(e.amount);
  });
  const monthlyValues   = Object.values(monthlyMap);
  const avgMonthlySpend = monthlyValues.reduce((s, v) => s + v, 0) / Math.max(monthlyValues.length, 1);

  // Category totals (monthly average)
  const catMap = {};
  recent.forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
  });
  const months = Math.max(Object.keys(monthlyMap).length, 1);
  const catMonthlyAvg = Object.fromEntries(
    Object.entries(catMap).map(([k, v]) => [k, v / months])
  );

  // Infer income if not provided (assume spending = ~70% of income)
  const estimatedIncome = declaredIncome || Math.round(avgMonthlySpend / 0.7);

  // 50/30/20 rule buckets
  const needsAllocation   = estimatedIncome * 0.50; // essentials
  const wantsAllocation   = estimatedIncome * 0.30; // discretionary
  const savingsAllocation = estimatedIncome * 0.20; // savings/investment

  // Classify categories into needs vs wants
  const NEEDS_CATEGORIES  = ["Food", "Health", "Utilities", "Education"];
  const WANTS_CATEGORIES  = ["Shopping", "Entertainment", "Travel", "Personal Care"];

  const currentNeeds  = NEEDS_CATEGORIES.reduce((s, c) => s + (catMonthlyAvg[c] || 0), 0);
  const currentWants  = WANTS_CATEGORIES.reduce((s, c) => s + (catMonthlyAvg[c] || 0), 0);
  const currentSavings = Math.max(0, estimatedIncome - avgMonthlySpend);

  // Per-category recommendations
  const recommendations = [];

  for (const [category, avgSpend] of Object.entries(catMonthlyAvg)) {
    const isNeed   = NEEDS_CATEGORIES.includes(category);
    const bucket   = isNeed ? needsAllocation : wantsAllocation;
    const catShare = avgSpend / avgMonthlySpend;

    // Recommended budget for this category (proportional within bucket)
    const bucketShare    = avgSpend / (isNeed ? currentNeeds || 1 : currentWants || 1);
    const recommendedBudget = Math.round(bucket * bucketShare);
    const variance          = avgSpend - recommendedBudget;
    const overspendPct      = recommendedBudget > 0 ? Math.round((variance / recommendedBudget) * 100) : 0;

    let status = "on_track";
    let advice = "";

    if (overspendPct > 20) {
      status = "overspending";
      advice = `Consider reducing ${category} by ₹${Math.abs(Math.round(variance))} to align with budget.`;
    } else if (overspendPct > 0) {
      status = "slightly_over";
      advice = `${category} is slightly above target. A small reduction would help.`;
    } else if (overspendPct < -30) {
      status = "underspending";
      advice = `${category} spend is well under budget — good discipline!`;
    } else {
      advice = `${category} is within a healthy range.`;
    }

    recommendations.push({
      category,
      currentAvg:      Math.round(avgSpend),
      recommendedBudget,
      variance:         Math.round(variance),
      overspendPct,
      status,
      advice,
      type:            isNeed ? "need" : "want"
    });
  }

  // Overall health score (0-100)
  const savingsRate     = currentSavings / estimatedIncome;
  const wantsRatio      = currentWants / estimatedIncome;
  const needsRatio      = currentNeeds / estimatedIncome;
  const healthScore     = Math.round(
    Math.min(100, Math.max(0,
      (savingsRate >= 0.2 ? 40 : savingsRate * 200) +
      (wantsRatio  <= 0.3 ? 30 : Math.max(0, 30 - (wantsRatio - 0.3) * 100)) +
      (needsRatio  <= 0.5 ? 30 : Math.max(0, 30 - (needsRatio - 0.5) * 60))
    ))
  );

  return {
    estimatedIncome:  Math.round(estimatedIncome),
    avgMonthlySpend:  Math.round(avgMonthlySpend),
    currentSavings:   Math.round(currentSavings),
    savingsRate:      Math.round(savingsRate * 100),
    healthScore,
    allocation: {
      needs:   { budget: Math.round(needsAllocation),   actual: Math.round(currentNeeds) },
      wants:   { budget: Math.round(wantsAllocation),   actual: Math.round(currentWants) },
      savings: { budget: Math.round(savingsAllocation), actual: Math.round(currentSavings) }
    },
    recommendations: recommendations.sort((a, b) => b.overspendPct - a.overspendPct),
    topAdvice: recommendations.filter(r => r.status === "overspending").slice(0, 3)
  };
};

module.exports = { classifyExpense, predictNextMonth, detectAnomalies, generateBudgetRecommendations };