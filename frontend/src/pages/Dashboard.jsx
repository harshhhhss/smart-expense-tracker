// src/pages/Dashboard.jsx
// Integrates: Insights (Feature 1) + Charts (Feature 2) + AutoCategory via ExpenseForm (Feature 3)

import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import InsightCard from "../components/InsightCard";
import ExpenseChart from "../components/ExpenseChart";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";

const Dashboard = () => {
  const [expenses,    setExpenses]    = useState([]);
  const [insights,    setInsights]    = useState([]);
  const [chartData,   setChartData]   = useState({ categoryData: [], monthlyData: [] });
  const [summary,     setSummary]     = useState(null);
  const [editingExp,  setEditingExp]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [insightLoad, setInsightLoad] = useState(true);

  // ── Fetch expenses + dashboard summary ──
  const fetchExpenses = useCallback(async () => {
    try {
      const [expRes, dashRes] = await Promise.all([
        API.get("/expenses"),
        API.get("/expenses/dashboard"),
      ]);
      setExpenses(expRes.data.expenses || []);
      setSummary(dashRes.data.dashboard?.summary || null);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch AI-like insights + chart data ──
  const fetchInsights = useCallback(async () => {
    setInsightLoad(true);
    try {
      const { data } = await API.get("/insights");
      setInsights(data.insights || []);
      setChartData(data.chartData || { categoryData: [], monthlyData: [] });
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setInsightLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchInsights();
  }, [fetchExpenses, fetchInsights]);

  // Called after add/edit/delete — refreshes everything
  const handleRefresh = () => {
    fetchExpenses();
    fetchInsights();
    setEditingExp(null);
  };

  const now = new Date();
  const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <>
      <Navbar />
      <div style={styles.page}>

        {/* ── Page Title ── */}
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>{monthLabel}</p>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div style={styles.summaryGrid}>
          <SummaryCard
            label="This Month"
            value={`₹${(summary?.thisMonth || 0).toFixed(2)}`}
            sub={`${summary?.totalExpensesThisMonth || 0} transactions`}
            color="#6c63ff"
            loading={loading}
          />
          <SummaryCard
            label="Last Month"
            value={`₹${(summary?.lastMonth || 0).toFixed(2)}`}
            color="#8888aa"
            loading={loading}
          />
          <SummaryCard
            label="Month Change"
            value={
              summary?.monthOverMonthChange !== null && summary?.monthOverMonthChange !== undefined
                ? `${summary.monthOverMonthChange > 0 ? "+" : ""}${summary.monthOverMonthChange}%`
                : "—"
            }
            color={summary?.monthOverMonthChange > 0 ? "#ff6584" : "#43e97b"}
            loading={loading}
          />
          <SummaryCard
            label="Total Expenses"
            value={expenses.length}
            sub="all time"
            color="#f7971e"
            loading={loading}
          />
        </div>

        {/* ── FEATURE 2: Charts ── */}
        <ExpenseChart
          categoryData={chartData.categoryData}
          monthlyData={chartData.monthlyData}
          loading={insightLoad}
        />

        {/* ── FEATURE 1: Smart Insights ── */}
        <InsightCard insights={insights} loading={insightLoad} />

        {/* ── Bottom: Form + List ── */}
        <div style={styles.bottomRow}>
          {/* FEATURE 3: Form with auto-category */}
          <ExpenseForm
            onExpenseAdded={handleRefresh}
            editingExpense={editingExp}
            onCancelEdit={() => setEditingExp(null)}
          />

          <ExpenseList
            expenses={expenses}
            onRefresh={handleRefresh}
            onEdit={(exp) => {
              setEditingExp(exp);
              // Scroll to form on mobile
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>

      </div>
    </>
  );
};

// ── Small reusable summary card ──
const SummaryCard = ({ label, value, sub, color, loading }) => (
  <div style={styles.card}>
    <div style={styles.cardLabel}>{label}</div>
    {loading
      ? <div style={{ height: 32, width: "70%", background: "rgba(255,255,255,0.06)", borderRadius: 6, margin: "4px 0" }} />
      : <div style={{ ...styles.cardValue, color }}>{value}</div>
    }
    {sub && <div style={styles.cardSub}>{sub}</div>}
  </div>
);

const styles = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" },
  titleRow: { marginBottom: "1.5rem" },
  title: { fontSize: "1.6rem", fontWeight: 700, color: "#e8e8f0", margin: 0 },
  subtitle: { color: "#8888aa", fontSize: "0.88rem", marginTop: "0.2rem", marginBottom: 0 },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  card: {
    background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "14px", padding: "1.25rem 1.5rem",
  },
  cardLabel: { fontSize: "0.75rem", color: "#8888aa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" },
  cardValue: { fontSize: "1.7rem", fontWeight: 700, fontFamily: "monospace", marginBottom: "0.2rem" },
  cardSub: { fontSize: "0.75rem", color: "#555577" },
  bottomRow: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: "1rem",
    alignItems: "start",
  },
};

export default Dashboard;