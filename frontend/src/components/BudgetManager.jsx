import { useState, useEffect } from "react";
import API from "../api/axios";
import useToast from "../hooks/useToast";

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Education", "Travel", "Utilities", "Personal Care"];

const BudgetManager = ({ refreshTrigger, expenses }) => {
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [income, setIncome] = useState(0);
  const [categoryLimits, setCategoryLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadBudget();
  }, [refreshTrigger]);

  const loadBudget = async () => {
    try {
      const res = await API.get("/advanced/budget");
      const budget = res.data.budget || {};
      setMonthlyLimit(budget.monthlyLimit || 0);
      setIncome(budget.income || 0);
      setCategoryLimits(budget.limits || {});
    } catch (err) {
      console.error(err);
      toast.showError("Failed to load budget");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    setSaving(true);
    try {
      await API.post("/advanced/budget", {
        monthlyLimit: Number(monthlyLimit) || 0,
        income: Number(income) || 0,
        limits: categoryLimits
      });
      toast.showSuccess("Budget updated successfully!");
    } catch (err) {
      toast.showError(err.response?.data?.message || "Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryLimitChange = (category, value) => {
    setCategoryLimits(prev => ({
      ...prev,
      [category]: Number(value) || 0
    }));
  };

  const getCurrentMonthSpent = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= monthStart && expDate <= monthEnd;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getCategorySpent = (category) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return exp.category === category && expDate >= monthStart && expDate <= monthEnd;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  if (loading) return <div style={styles.loading}>Loading budget...</div>;

  const currentMonthSpent = getCurrentMonthSpent();
  const monthlyBudgetPercent = monthlyLimit > 0 ? (currentMonthSpent / monthlyLimit) * 100 : 0;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Budget Management</h2>

      {/* Overall Budget */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Monthly Budget</h3>
        <div style={styles.grid}>
          <div>
            <label style={styles.label}>Monthly Income</label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              style={styles.input}
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <label style={styles.label}>Monthly Limit</label>
            <input
              type="number"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              style={styles.input}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {monthlyLimit > 0 && (
          <div style={styles.progress}>
            <div style={styles.progressLabel}>
              <span>Current Month: ₹{currentMonthSpent.toFixed(2)} / ₹{monthlyLimit.toFixed(2)}</span>
              <span style={{ color: monthlyBudgetPercent > 100 ? "var(--danger)" : "var(--text)" }}>
                {monthlyBudgetPercent.toFixed(0)}%
              </span>
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${Math.min(monthlyBudgetPercent, 100)}%`,
                  background: monthlyBudgetPercent > 100 ? "var(--danger)" : monthlyBudgetPercent > 80 ? "var(--warning)" : "var(--success)"
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Limits */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Category Budgets</h3>
        <div style={styles.categoryGrid}>
          {CATEGORIES.map(category => {
            const limit = categoryLimits[category] || 0;
            const spent = getCategorySpent(category);
            const percent = limit > 0 ? (spent / limit) * 100 : 0;

            return (
              <div key={category} style={styles.categoryItem}>
                <div style={styles.categoryHeader}>
                  <span style={styles.categoryName}>{category}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>₹{spent.toFixed(2)}</span>
                </div>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => handleCategoryLimitChange(category, e.target.value)}
                  style={styles.categoryInput}
                  placeholder="Limit"
                  min="0"
                />
                {limit > 0 && (
                  <div style={styles.categoryProgress}>
                    <div
                      style={{
                        ...styles.categoryProgressFill,
                        width: `${Math.min(percent, 100)}%`,
                        background: percent > 100 ? "var(--danger)" : percent > 80 ? "var(--warning)" : "var(--success)"
                      }}
                    />
                    <span style={styles.categoryPercent}>{percent.toFixed(0)}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        style={styles.saveBtn}
        onClick={handleSaveBudget}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Budget Settings"}
      </button>
    </div>
  );
};

const styles = {
  container: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "2rem",
    marginBottom: "2rem"
  },
  title: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "var(--text)",
    margin: "0 0 1.5rem 0"
  },
  section: {
    marginBottom: "2rem"
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--text)",
    margin: "0 0 1rem 0"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem"
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--muted)",
    marginBottom: "0.4rem",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  input: {
    width: "100%",
    padding: "0.7rem",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: "0.95rem",
    boxSizing: "border-box"
  },
  progress: {
    marginTop: "1rem"
  },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
    color: "var(--text)",
    marginBottom: "0.5rem"
  },
  progressBar: {
    width: "100%",
    height: "8px",
    background: "var(--surface-2)",
    borderRadius: "4px",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    transition: "width 0.3s ease"
  },
  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem"
  },
  categoryItem: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "1rem"
  },
  categoryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem"
  },
  categoryName: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "var(--text)"
  },
  categoryInput: {
    width: "100%",
    padding: "0.5rem",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: "0.85rem",
    marginBottom: "0.5rem",
    boxSizing: "border-box"
  },
  categoryProgress: {
    position: "relative",
    height: "6px",
    background: "var(--surface)",
    borderRadius: "3px",
    overflow: "hidden"
  },
  categoryProgressFill: {
    height: "100%",
    transition: "width 0.3s ease"
  },
  categoryPercent: {
    position: "absolute",
    right: "4px",
    top: "-18px",
    fontSize: "0.65rem",
    color: "var(--muted)"
  },
  saveBtn: {
    width: "100%",
    padding: "0.9rem",
    background: "var(--accent)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.95rem"
  },
  loading: {
    textAlign: "center",
    color: "var(--muted)",
    padding: "2rem"
  }
};

export default BudgetManager;
