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
import { CalendarDays, Clock, Receipt, Tag, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import TopBar from "../components/TopBar";
import KpiTile, { KpiGrid } from "../components/KpiTile";

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
      <TopBar alertCount={budgetAlerts.length} />
      <div className="app-page" style={styles.page}>
        <div className="dashboard-header" style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>{monthLabel}</p>
          </div>
          <div style={styles.headerActions}>
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

        <KpiGrid>
          <KpiTile
            label="This month"
            value={"Rs " + (summary?.thisMonth || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            icon={CalendarDays}
            tone="accent"
            trend={pctChange}
            loading={loading}
          />
          <KpiTile
            label="Last month"
            value={"Rs " + (summary?.lastMonth || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            icon={Clock}
            loading={loading}
          />
          <KpiTile
            label="Transactions"
            value={summary?.totalExpensesThisMonth ?? 0}
            sub="this month"
            icon={Receipt}
            loading={loading}
          />
          <KpiTile
            label="Top category"
            value={summary?.topCategory?.category || "None"}
            sub={"Rs " + (summary?.topCategory?.amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            icon={Tag}
            tone="warning"
            loading={loading}
          />
          <KpiTile
            label="All-time spend"
            value={"Rs " + (summary?.total || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            icon={Wallet}
            loading={loading}
          />
          <KpiTile
            label="All-time count"
            value={summary?.totalExpenses ?? expenses.length}
            sub="expenses logged"
            icon={Receipt}
            loading={loading}
          />
        </KpiGrid>

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

// One tile shape for every figure on the page. Enterprise dashboards
// favour a uniform grid over asymmetric emphasis: the reader scans a row
// of equals instead of being steered toward a single number.

// Supporting figures: no container of their own, separated by a rule
// rather than a border, so they read as subordinate to the hero.


const styles = {
  page: {
    maxWidth: "var(--app-content-max)",
    padding: "1.15rem 0 2.2rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "var(--space-4)",
    flexWrap: "wrap",
    gap: "var(--space-3)",
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
    gap: "var(--space-2)",
    flexWrap: "wrap",
  },
  addButton: {
    background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
    color: "var(--on-accent)",
    border: "1px solid transparent",
    padding: "0.6rem 0.88rem",
    borderRadius: "8px",
    fontSize: "var(--text-body)",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "var(--card-shadow)",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--space-3)",
    flexWrap: "wrap",
    background: "color-mix(in srgb, var(--danger) 9%, var(--surface))",
    border: "1px solid color-mix(in srgb, var(--danger) 32%, transparent)",
    borderRadius: "8px",
    padding: "0.7rem 0.85rem",
    marginBottom: "var(--space-3)",
  },
  errorBannerBody: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-1)",
    minWidth: 0,
  },
  errorBannerTitle: {
    fontSize: "var(--text-body)",
    fontWeight: 600,
    color: "var(--danger)",
  },
  errorBannerText: {
    fontSize: "var(--text-sub)",
    color: "var(--muted-strong)",
  },
  errorBannerRetry: {
    padding: "0.42rem 0.8rem",
    borderRadius: "8px",
    border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)",
    background: "transparent",
    color: "var(--danger)",
    fontFamily: "inherit",
    fontSize: "var(--text-sub)",
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 176px), 1fr))",
    gap: "var(--space-3)",
    marginBottom: "var(--space-5)",
  },
  kpiTile: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "var(--space-3) var(--space-4)",
    minWidth: 0,
  },
  kpiTop: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    marginBottom: "var(--space-2)",
  },
  kpiChip: {
    display: "grid",
    placeItems: "center",
    width: 22,
    height: 22,
    borderRadius: "var(--radius-sm)",
    flexShrink: 0,
  },
  kpiLabel: {
    fontSize: "var(--text-label)",
    fontWeight: 600,
    letterSpacing: "var(--ls-label)",
    textTransform: "uppercase",
    color: "var(--muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  kpiValue: {
    fontSize: "1.375rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "var(--text)",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.15,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  kpiSkeleton: {
    height: "1.375rem",
    width: "76%",
    background: "var(--surface-2)",
    borderRadius: 3,
  },
  kpiFoot: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    marginTop: "var(--space-1)",
    minHeight: 16,
  },
  kpiTrend: {
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    fontSize: "var(--text-label)",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
  kpiSub: {
    fontSize: "var(--text-label)",
    color: "var(--muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  formSection: {
    marginBottom: "var(--space-5)",
  },
  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "var(--space-3)",
    alignItems: "start",
    marginBottom: "var(--space-3)",
  },
  chartSection: {
    marginBottom: "var(--space-3)",
  },
  expensesSection: {
    marginBottom: "var(--space-6)",
  },
};

export default Dashboard;
