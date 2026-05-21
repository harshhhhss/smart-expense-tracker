import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
    endDate: "",
  });
  const toast = useToast();
  const { budgetAlerts } = useBudgetAlert(expenses, budgets);

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
    } catch (err) {
      console.error(err);
      toast.showError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

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
      <div className="app-page" style={styles.page}>
        <div className="dashboard-header" style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>Live expense command center for {monthLabel}</p>
          </div>
          <div style={styles.headerActions}>
            <NotificationSummary count={budgetAlerts.length} />
            <button className="action-button" style={styles.addButton} onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Add Expense"}
            </button>
          </div>
        </div>

        <div className="summary-grid" style={styles.summaryGrid}>
          <SummaryCard
            label="This Month"
            value={`Rs ${(summary?.thisMonth || 0).toFixed(2)}`}
            sub={`${summary?.totalExpensesThisMonth || 0} transactions`}
            color="var(--accent)"
            tone="primary"
            loading={loading}
          />
          <SummaryCard
            label="Last Month"
            value={`Rs ${(summary?.lastMonth || 0).toFixed(2)}`}
            color="var(--muted)"
            tone="neutral"
            loading={loading}
          />
          <SummaryCard
            label="Change"
            value={pctChange !== null && pctChange !== undefined ? `${pctChange > 0 ? "+" : ""}${pctChange}%` : "-"}
            color={pctChange > 0 ? "var(--danger)" : "var(--success)"}
            tone={pctChange > 0 ? "danger" : "success"}
            loading={loading}
          />
          <SummaryCard
            label="Total Expenses"
            value={expenses.length}
            sub="all time"
            color="var(--warning)"
            tone="warning"
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

        {showForm && (
          <div style={styles.formSection}>
            <ExpenseForm
              onExpenseAdded={handleRefresh}
              editingExpense={editingExp}
              onCancelEdit={() => setEditingExp(null)}
            />
          </div>
        )}

        <div style={styles.chartSection}>
          <ExpenseChart
            categoryData={chartData.categoryData}
            monthlyData={chartData.monthlyData}
            loading={loading}
          />
        </div>

        <div style={styles.expensesSection}>
          <ExpenseList
            expenses={expenses.slice(0, 10)}
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

const SummaryCard = ({ label, value, sub, color, loading, tone = "neutral" }) => (
  <div className="product-card" style={{ ...styles.card, ...styles.cardTone[tone] }}>
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

const NotificationSummary = ({ count }) => (
  <Link to="/notifications" className="ghost-button" style={styles.notificationSummary}>
    <span style={styles.notificationIcon}>
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
    </span>
    <span style={styles.notificationText}>
      {count > 0 ? `${count} budget notification${count === 1 ? "" : "s"}` : "No budget notifications"}
    </span>
    {count > 0 && <span style={styles.notificationBadge}>{count}</span>}
  </Link>
);

const styles = {
  page: {
    maxWidth: "var(--app-content-max)",
    padding: "1.15rem 0 2.2rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.95rem",
    flexWrap: "wrap",
    gap: "0.8rem",
    minHeight: 58,
  },
  title: {
    fontSize: "1.34rem",
    fontWeight: 850,
    color: "var(--text)",
    margin: 0,
    letterSpacing: 0,
  },
  subtitle: {
    color: "var(--muted)",
    fontSize: "0.82rem",
    margin: "0.18rem 0 0 0",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    flexWrap: "wrap",
  },
  addButton: {
    background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
    color: "#fff",
    border: "1px solid transparent",
    padding: "0.6rem 0.88rem",
    borderRadius: "8px",
    fontSize: "0.82rem",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "var(--card-shadow)",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "0.72rem",
    marginBottom: "0.85rem",
  },
  notificationSummary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    margin: 0,
    padding: "0.42rem 0.56rem",
    borderRadius: "999px",
    border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
    background: "color-mix(in srgb, var(--surface) 92%, transparent)",
    color: "var(--muted-strong)",
    fontSize: "0.74rem",
    fontWeight: 750,
    textDecoration: "none",
    boxShadow: "var(--card-shadow)",
  },
  notificationIcon: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    color: "var(--accent)",
    background: "var(--accent-soft)",
  },
  notificationText: {
    whiteSpace: "nowrap",
  },
  notificationBadge: {
    minWidth: 20,
    height: 20,
    padding: "0 0.35rem",
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "var(--warning)",
    color: "#fff",
    fontFamily: '"DM Mono", monospace',
    fontSize: "0.7rem",
    fontWeight: 900,
  },
  card: {
    background: "color-mix(in srgb, var(--surface) 96%, transparent)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    minHeight: "86px",
    padding: "0.76rem 0.82rem",
  },
  cardTone: {
    primary: {
      background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--surface)), var(--surface))",
    },
    neutral: {},
    danger: {
      background: "linear-gradient(135deg, color-mix(in srgb, var(--danger) 9%, var(--surface)), var(--surface))",
    },
    success: {
      background: "linear-gradient(135deg, color-mix(in srgb, var(--success) 10%, var(--surface)), var(--surface))",
    },
    warning: {
      background: "linear-gradient(135deg, color-mix(in srgb, var(--warning) 9%, var(--surface)), var(--surface))",
    },
  },
  cardTopline: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.28rem",
  },
  cardIndicator: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
  cardLabel: {
    fontSize: "0.66rem",
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 700,
  },
  cardValue: {
    fontSize: "1.18rem",
    fontWeight: 900,
    marginBottom: "0.15rem",
    fontFamily: '"DM Mono", monospace',
    letterSpacing: 0,
  },
  cardSub: {
    fontSize: "0.72rem",
    color: "var(--muted)",
  },
  loadingSkeleton: {
    height: "2rem",
    width: "70%",
    background: "var(--surface-2)",
    borderRadius: "4px",
    margin: "0.25rem 0",
  },
  formSection: {
    marginBottom: "1.5rem",
  },
  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "0.72rem",
    alignItems: "start",
    marginBottom: "0.85rem",
  },
  chartSection: {
    marginBottom: "0.85rem",
  },
  expensesSection: {
    marginBottom: "2rem",
  },
};

export default Dashboard;
