// src/pages/Dashboard.jsx — Simplified for better UX
import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import ExpenseChart from "../components/ExpenseChart";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
import FilterPanel from "../components/FilterPanel";
import ExportPanel from "../components/ExportPanel";
import useToast from "../hooks/useToast";
import useBudgetAlert from "../hooks/useBudgetAlert";

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [chartData, setChartData] = useState({ categoryData: [], monthlyData: [] });
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState(null);
  const [editingExp, setEditingExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    startDate: "",
    endDate: ""
  });
  const toast = useToast();
  const { checkBudgetStatus } = useBudgetAlert(expenses, budgets);

  const fetchExpenses = useCallback(async () => {
    try {
      const [expRes, dashRes, budgetRes] = await Promise.all([
        API.get("/expenses", { params: filters }),
        API.get("/advanced/dashboard"),
        API.get("/advanced/budget"),
      ]);
      const fetchedExpenses = expRes.data.expenses || [];
      setExpenses(fetchedExpenses);
      setSummary(dashRes.data.dashboard?.summary || null);
      setChartData(dashRes.data.dashboard?.chartData || { categoryData: [], monthlyData: [] });
      setBudgets(budgetRes.data.budget || null);
      
      // Check budget status after fetching
      setTimeout(() => checkBudgetStatus(), 500);
    } catch (err) {
      console.error(err);
      toast.showError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filters, toast, checkBudgetStatus]);

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
            className="action-button"
            style={styles.addButton}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "Add Expense"}
          </button>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryGrid}>
          <SummaryCard
            label="This Month"
            value={`Rs ${(summary?.thisMonth || 0).toFixed(2)}`}
            sub={`${summary?.totalExpensesThisMonth || 0} transactions`}
            color="var(--accent)"
            loading={loading}
          />
          <SummaryCard
            label="Last Month"
            value={`Rs ${(summary?.lastMonth || 0).toFixed(2)}`}
            color="var(--muted)"
            loading={loading}
          />
          <SummaryCard
            label="Change"
            value={pctChange !== null && pctChange !== undefined ? `${pctChange > 0 ? "+" : ""}${pctChange}%` : "-"}
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

        <div style={styles.controlsGrid}>
          <FilterPanel
            onFiltersChange={setFilters}
            isOpen={filterOpen}
            onToggle={() => setFilterOpen(!filterOpen)}
          />
          <ExportPanel expenses={expenses} summary={summary} />
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
  <div className="product-card" style={styles.card}>
    <div style={styles.cardTopline}>
      <div style={{ ...styles.cardIndicator, background: color }} />
      <div style={styles.cardLabel}>{label}</div>
    </div>
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
    width: 'min(100% - 48px, 1560px)',
    maxWidth: '1560px',
    margin: '0 auto',
    padding: '1.75rem 0 3rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.55rem',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
    letterSpacing: 0,
  },
  subtitle: {
    color: 'var(--muted)',
    fontSize: '0.9rem',
    margin: '0.25rem 0 0 0',
  },
  addButton: {
    background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
    color: '#fff',
    border: '1px solid transparent',
    padding: '0.68rem 1rem',
    borderRadius: 'var(--radius)',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: 'var(--card-shadow)',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
    gap: '0.9rem',
    marginBottom: '1.25rem',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    minHeight: '110px',
    padding: '1.05rem',
  },
  cardTopline: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  cardIndicator: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
  },
  cardLabel: {
    fontSize: '0.72rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    fontWeight: 700,
  },
  cardValue: {
    fontSize: '1.45rem',
    fontWeight: 700,
    marginBottom: '0.25rem',
    fontFamily: '"DM Mono", monospace',
    letterSpacing: 0,
  },
  cardSub: {
    fontSize: '0.78rem',
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
    marginBottom: '1.5rem',
  },
  controlsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: '0.9rem',
    alignItems: 'start',
    marginBottom: '1.25rem',
  },
  chartSection: {
    marginBottom: '1.25rem',
  },
  expensesSection: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '1rem',
  },
};

export default Dashboard;
