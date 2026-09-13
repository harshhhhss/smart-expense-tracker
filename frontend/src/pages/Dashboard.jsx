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
import { CalendarDays, Clock, Receipt, TrendingDown, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [chartData, setChartData] = useState({ categoryData: [], monthlyData: [] });
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState(null);
  const [editingExp, setEditingExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
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
      setFetchError(null);
      const fetchedExpenses = expRes.data.expenses || [];
      setExpenses(fetchedExpenses);
      setSummary(dashRes.data.dashboard?.summary || null);
      setChartData(dashRes.data.dashboard?.chartData || { categoryData: [], monthlyData: [] });
      setBudgets(budgetRes.data.budget || null);
    } catch (err) {
      console.error(err);
      setFetchError(
        err.response?.data?.message ||
          "Could not load your dashboard. Check that the server is running and try again."
      );
      toast.showError("Couldn't load your dashboard");
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
            <p style={styles.subtitle}>{monthLabel}</p>
          </div>
          <div style={styles.headerActions}>
            <NotificationSummary count={budgetAlerts.length} />
            <button className="action-button" style={styles.addButton} onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Add Expense"}
            </button>
          </div>
        </div>

        {fetchError && (
          <div style={styles.errorBanner} role="alert">
            <div style={styles.errorBannerBody}>
              <strong style={styles.errorBannerTitle}>Could not load dashboard data</strong>
              <span style={styles.errorBannerText}>{fetchError}</span>
            </div>
            <button className="ghost-button" style={styles.errorBannerRetry} onClick={fetchExpenses}>
              Retry
            </button>
          </div>
        )}

        <div className="summary-grid" style={styles.summaryGrid}>
          <SummaryCard
            label="This Month"
            value={`Rs ${(summary?.thisMonth || 0).toFixed(2)}`}
            sub={`${summary?.totalExpensesThisMonth || 0} transactions`}
            icon={CalendarDays}
            variant="hero"
            loading={loading}
          />
          <SummaryCard
            label="Last Month"
            value={`Rs ${(summary?.lastMonth || 0).toFixed(2)}`}
            icon={Clock}
            loading={loading}
          />
          <SummaryCard
            label="Change"
            value={pctChange !== null && pctChange !== undefined ? `${pctChange > 0 ? "+" : ""}${pctChange}%` : "-"}
            valueColor={pctChange > 0 ? "var(--danger)" : "var(--success)"}
            icon={pctChange > 0 ? TrendingUp : TrendingDown}
            loading={loading}
          />
          <SummaryCard
            label="Total Expenses"
            value={summary?.totalExpenses ?? expenses.length}
            sub="all time"
            icon={Receipt}
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

// The month-to-date figure is the one number the page exists for, so it
// drops its border and sits straight on the page ground while the
// supporting stats stay in bordered cards.
const SummaryCard = ({ label, value, sub, icon: Icon, valueColor, loading, variant = "default" }) => {
  const isHero = variant === "hero";
  return (
    <div
      className={isHero ? undefined : "product-card"}
      style={{ ...styles.card, ...(isHero ? styles.cardHero : null) }}
    >
      <div style={styles.cardTopline}>
        {Icon && <Icon size={14} strokeWidth={1.9} style={styles.cardIcon} aria-hidden="true" />}
        <div style={styles.cardLabel}>{label}</div>
      </div>
      {loading ? (
        <div style={styles.loadingSkeleton} />
      ) : (
        <div style={{ ...styles.cardValue, ...(isHero ? styles.cardValueHero : null), color: valueColor }}>
          {value}
        </div>
      )}
      {sub && <div style={styles.cardSub}>{sub}</div>}
    </div>
  );
};

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
    fontSize: "var(--text-h1)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
    color: "var(--text)",
    margin: 0,
  },
  subtitle: {
    color: "var(--muted)",
    fontSize: "var(--text-sub)",
    margin: "0.3rem 0 0 0",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    flexWrap: "wrap",
  },
  addButton: {
    background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
    color: "var(--on-accent)",
    border: "1px solid transparent",
    padding: "0.6rem 0.88rem",
    borderRadius: "8px",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "var(--card-shadow)",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.8rem",
    flexWrap: "wrap",
    background: "color-mix(in srgb, var(--danger) 9%, var(--surface))",
    border: "1px solid color-mix(in srgb, var(--danger) 32%, transparent)",
    borderRadius: "8px",
    padding: "0.7rem 0.85rem",
    marginBottom: "0.85rem",
  },
  errorBannerBody: {
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    minWidth: 0,
  },
  errorBannerTitle: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "var(--danger)",
  },
  errorBannerText: {
    fontSize: "0.78rem",
    color: "var(--muted-strong)",
  },
  errorBannerRetry: {
    padding: "0.42rem 0.8rem",
    borderRadius: "8px",
    border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
    background: "transparent",
    color: "var(--danger)",
    fontFamily: "inherit",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "0.875rem",
    marginBottom: "1.25rem",
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
    fontWeight: 600,
    textDecoration: "none",
    boxShadow: "var(--card-shadow)",
  },
  notificationIcon: {
    display: "grid",
    placeItems: "center",
    color: "var(--muted)",
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
    color: "var(--on-accent)",
    fontVariantNumeric: "tabular-nums",
    fontSize: "0.7rem",
    fontWeight: 700,
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    minHeight: "112px",
    padding: "1rem 1rem 0.95rem",
  },
  cardHero: {
    background: "transparent",
    border: "1px solid transparent",
    boxShadow: "none",
    paddingLeft: 0,
    paddingRight: "1.25rem",
  },
  cardTopline: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.6rem",
  },
  cardIcon: {
    color: "var(--muted)",
    flexShrink: 0,
  },
  cardLabel: {
    fontSize: "var(--text-label)",
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "var(--ls-label)",
    fontWeight: 600,
  },
  cardValueHero: {
    fontSize: "clamp(2.25rem, 3.4vw, 2.75rem)",
  },
  cardValue: {
    fontSize: "var(--text-stat)",
    color: "var(--text)",
    fontWeight: 700,
    marginBottom: "0.35rem",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.03em",
    lineHeight: 1.05,
  },
  cardSub: {
    fontSize: "var(--text-sub)",
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
