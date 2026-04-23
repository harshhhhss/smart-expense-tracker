// src/pages/Dashboard.jsx — Updated with all 5 advanced features
// Add AnomalyPanel, PredictionPanel, BudgetPlanner to your existing Dashboard

import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import InsightCard from "../components/InsightCard";
import ExpenseChart from "../components/ExpenseChart";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
// ← ADD these three imports
import AnomalyPanel   from "../components/AnomalyPanel";
import PredictionPanel from "../components/PredictionPanel";
import BudgetPlanner  from "../components/BudgetPlanner";

const Dashboard = () => {
  const [expenses,    setExpenses]    = useState([]);
  const [insights,    setInsights]    = useState([]);
  const [chartData,   setChartData]   = useState({ categoryData: [], monthlyData: [] });
  const [summary,     setSummary]     = useState(null);
  const [editingExp,  setEditingExp]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [insightLoad, setInsightLoad] = useState(true);
  const [activeTab,   setActiveTab]   = useState("dashboard"); // dashboard | analytics | budget

  const fetchExpenses = useCallback(async () => {
    try {
      const [expRes, dashRes] = await Promise.all([
        API.get("/expenses"),
        API.get("/expenses/dashboard"),
      ]);
      setExpenses(expRes.data.expenses || []);
      setSummary(dashRes.data.dashboard?.summary || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    setInsightLoad(true);
    try {
      const { data } = await API.get("/insights");
      setInsights(data.insights || []);
      setChartData(data.chartData || { categoryData: [], monthlyData: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setInsightLoad(false);
    }
  }, []);

  useEffect(() => { fetchExpenses(); fetchInsights(); }, []);

  const handleRefresh = () => { fetchExpenses(); fetchInsights(); setEditingExp(null); };

  const now = new Date();
  const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });
  const pctChange  = summary?.monthOverMonthChange;

  return (
    <>
      <Navbar />
      <div style={s.page}>

        {/* ── Title Row with Tab Navigation ── */}
        <div style={s.titleRow}>
          <div>
            <h1 style={s.title}>Dashboard</h1>
            <p style={s.subtitle}>{monthLabel}</p>
          </div>
          <div style={s.tabNav}>
            {[
              { id: "dashboard", label: "📊 Overview" },
              { id: "analytics", label: "🔬 Analytics" },
              { id: "budget",    label: "💼 Budget"   },
            ].map(tab => (
              <button key={tab.id}
                style={{ ...s.tabBtn, ...(activeTab === tab.id ? s.tabBtnActive : {}) }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Summary Cards (always visible) ── */}
        <div style={s.summaryGrid}>
          <SummaryCard label="This Month"     value={`₹${(summary?.thisMonth || 0).toFixed(2)}`}    sub={`${summary?.totalExpensesThisMonth || 0} transactions`} color="#6c63ff" loading={loading} />
          <SummaryCard label="Last Month"     value={`₹${(summary?.lastMonth || 0).toFixed(2)}`}    color="#8888aa" loading={loading} />
          <SummaryCard label="Month Change"   value={pctChange !== null && pctChange !== undefined ? `${pctChange > 0 ? "+" : ""}${pctChange}%` : "—"} color={pctChange > 0 ? "#ef4444" : "#43e97b"} loading={loading} />
          <SummaryCard label="Total Expenses" value={expenses.length} sub="all time" color="#f59e0b" loading={loading} />
        </div>

        {/* ══════════════════════════════════════
            TAB: OVERVIEW (charts + insights + CRUD)
        ══════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <>
            <ExpenseChart categoryData={chartData.categoryData} monthlyData={chartData.monthlyData} loading={insightLoad} />
            <InsightCard  insights={insights} loading={insightLoad} />
            <div style={s.bottomRow}>
              <ExpenseForm
                onExpenseAdded={handleRefresh}
                editingExpense={editingExp}
                onCancelEdit={() => setEditingExp(null)}
              />
              <ExpenseList
                expenses={expenses}
                onRefresh={handleRefresh}
                onEdit={(exp) => { setEditingExp(exp); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            TAB: ANALYTICS (prediction + anomalies)
        ══════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <div style={s.analyticsGrid}>
            <div style={{ gridColumn: "1 / -1" }}>
              <PredictionPanel />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <AnomalyPanel />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            TAB: BUDGET (recommendation engine)
        ══════════════════════════════════════ */}
        {activeTab === "budget" && (
          <BudgetPlanner />
        )}

      </div>
    </>
  );
};

const SummaryCard = ({ label, value, sub, color, loading }) => (
  <div style={s.card}>
    <div style={s.cardLabel}>{label}</div>
    {loading
      ? <div style={{ height: 32, width: "70%", background: "rgba(255,255,255,0.06)", borderRadius: 6, margin: "4px 0" }} />
      : <div style={{ ...s.cardValue, color }}>{value}</div>
    }
    {sub && <div style={s.cardSub}>{sub}</div>}
  </div>
);

const s = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" },
  titleRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" },
  title: { fontSize: "1.5rem", fontWeight: 700, color: "#e8e8f0", margin: 0 },
  subtitle: { color: "#8888aa", fontSize: "0.88rem", marginTop: "0.2rem", marginBottom: 0 },
  tabNav: { display: "flex", gap: "0.25rem", background: "#0f1117", borderRadius: "10px", padding: "4px" },
  tabBtn: { padding: "0.45rem 1rem", borderRadius: "8px", border: "none", background: "transparent", color: "#8888aa", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },
  tabBtnActive: { background: "#1a1d27", color: "#e8e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" },
  card: { background: "#1a1d27", border: "1px solid #2a2d3e", borderRadius: "14px", padding: "1.25rem 1.5rem" },
  cardLabel: { fontSize: "0.75rem", color: "#8888aa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" },
  cardValue: { fontSize: "1.7rem", fontWeight: 700, fontFamily: "monospace", marginBottom: "0.2rem" },
  cardSub: { fontSize: "0.75rem", color: "#555577" },
  bottomRow: { display: "grid", gridTemplateColumns: "380px 1fr", gap: "1rem", alignItems: "start" },
  analyticsGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "1rem" },
};

export default Dashboard;