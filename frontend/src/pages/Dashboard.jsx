// src/pages/Dashboard.jsx — Simplified for better UX
import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import ExpenseChart from "../components/ExpenseChart";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [chartData, setChartData] = useState({ categoryData: [], monthlyData: [] });
  const [summary, setSummary] = useState(null);
  const [editingExp, setEditingExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const [expRes, dashRes] = await Promise.all([
        API.get("/expenses"),
        API.get("/advanced/dashboard"),
      ]);
      setExpenses(expRes.data.expenses || []);
      setSummary(dashRes.data.dashboard?.summary || null);
      setChartData(dashRes.data.dashboard?.chartData || { categoryData: [], monthlyData: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleRefresh = () => {
    fetchExpenses();
    setEditingExp(null);
    setShowForm(false);
  };

  const now = new Date();
  const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });
  const pctChange = summary?.monthOverMonthChange;

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>{monthLabel}</p>
          </div>
          <button
            style={styles.addButton}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Add Expense'}
          </button>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryGrid}>
          <SummaryCard
            label="This Month"
            value={`₹${(summary?.thisMonth || 0).toFixed(2)}`}
            sub={`${summary?.totalExpensesThisMonth || 0} transactions`}
            color="var(--accent)"
            loading={loading}
          />
          <SummaryCard
            label="Last Month"
            value={`₹${(summary?.lastMonth || 0).toFixed(2)}`}
            color="var(--muted)"
            loading={loading}
          />
          <SummaryCard
            label="Change"
            value={pctChange !== null && pctChange !== undefined ? `${pctChange > 0 ? "+" : ""}${pctChange}%` : "—"}
            color={pctChange > 0 ? "var(--danger)" : "var(--success)"}
            loading={loading}
          />
          <SummaryCard
            label="Total Expenses"
            value={expenses.length}
            sub="all time"
            color="var(--warning)"
            loading={loading}
          />
        </div>

        {/* Add Expense Form */}
        {showForm && (
          <div style={styles.formSection}>
            <ExpenseForm
              onExpenseAdded={handleRefresh}
              editingExpense={editingExp}
              onCancelEdit={() => setEditingExp(null)}
            />
          </div>
        )}

        {/* Chart */}
        <div style={styles.chartSection}>
          <ExpenseChart
            categoryData={chartData.categoryData}
            monthlyData={chartData.monthlyData}
            loading={loading}
          />
        </div>

        {/* Recent Expenses */}
        <div style={styles.expensesSection}>
          <h2 style={styles.sectionTitle}>Recent Expenses</h2>
          <ExpenseList
            expenses={expenses.slice(0, 10)} // Show only recent 10
            onRefresh={handleRefresh}
            onEdit={(exp) => {
              setEditingExp(exp);
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>
    </>
  );
};

const SummaryCard = ({ label, value, sub, color, loading }) => (
  <div style={styles.card}>
    <div style={styles.cardLabel}>{label}</div>
    {loading ? (
      <div style={styles.loadingSkeleton} />
    ) : (
      <div style={{ ...styles.cardValue, color }}>{value}</div>
    )}
    {sub && <div style={styles.cardSub}>{sub}</div>}
  </div>
);

const styles = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    color: 'var(--muted)',
    fontSize: '1rem',
    margin: '0.5rem 0 0 0',
  },
  addButton: {
    background: 'var(--accent)',
    color: 'var(--text)',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius)',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '1.5rem',
  },
  cardLabel: {
    fontSize: '0.875rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
    fontWeight: 600,
  },
  cardValue: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '0.25rem',
  },
  cardSub: {
    fontSize: '0.875rem',
    color: 'var(--muted)',
  },
  loadingSkeleton: {
    height: '2rem',
    width: '70%',
    background: 'var(--surface-2)',
    borderRadius: '4px',
    margin: '0.25rem 0',
  },
  formSection: {
    marginBottom: '3rem',
  },
  chartSection: {
    marginBottom: '3rem',
  },
  expensesSection: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '1rem',
  },
};

export default Dashboard;
