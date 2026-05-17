import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import useBudgetAlert from "../hooks/useBudgetAlert";
import useToast from "../hooks/useToast";

const Notifications = () => {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { budgetAlerts, dismissBudgetAlert } = useBudgetAlert(expenses, budgets);

  const fetchNotifications = useCallback(async () => {
    try {
      const [expRes, budgetRes] = await Promise.all([
        API.get("/expenses"),
        API.get("/advanced/budget"),
      ]);
      setExpenses(expRes.data.expenses || []);
      setBudgets(budgetRes.data.budget || null);
    } catch (err) {
      console.error(err);
      toast.showError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const systemAlerts = useMemo(() => {
    if (loading) return [];
    return [];
  }, [loading]);

  const totalCount = budgetAlerts.length + systemAlerts.length;

  return (
    <>
      <Navbar />
      <div className="app-page" style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Notifications</h1>
            <p style={styles.subtitle}>Budget and system updates in one place</p>
          </div>
          <div style={styles.headerPill}>{totalCount} active</div>
        </div>

        <section className="product-card" style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Budget alerts</h2>
              <p style={styles.panelSub}>Current-month budget thresholds and category limits</p>
            </div>
            {budgetAlerts.length > 0 && <span style={styles.countBadge}>{budgetAlerts.length}</span>}
          </div>

          {loading ? (
            <div style={styles.loading}>Loading notifications...</div>
          ) : budgetAlerts.length === 0 ? (
            <EmptyState title="No budget alerts" message="Your spending is currently within configured budget limits." />
          ) : (
            <div style={styles.list}>
              {budgetAlerts.map(alert => (
                <NotificationItem
                  key={alert.id}
                  alert={alert}
                  onDismiss={() => dismissBudgetAlert(alert.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="product-card" style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>System alerts</h2>
              <p style={styles.panelSub}>Account, sync, and app-level messages</p>
            </div>
          </div>
          <EmptyState title="No system alerts" message="Everything looks normal right now." />
        </section>
      </div>
    </>
  );
};

const NotificationItem = ({ alert, onDismiss }) => {
  const isWarning = alert.severity === "warning";

  return (
    <div style={styles.item}>
      <div style={{ ...styles.statusRail, background: isWarning ? "var(--danger)" : "var(--warning)" }} />
      <div style={styles.itemBody}>
        <div style={styles.itemTop}>
          <div>
            <div style={styles.itemTitle}>{alert.category}</div>
            <div style={styles.itemMessage}>{alert.message}</div>
          </div>
          <div style={styles.percent}>{Math.min(alert.percent, 999)}%</div>
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${Math.min(alert.percent, 100)}%`,
              background: isWarning ? "var(--danger)" : "var(--warning)",
            }}
          />
        </div>
        <div style={styles.meta}>
          Rs {alert.spent.toFixed(0)} spent of Rs {alert.limit.toFixed(0)}
        </div>
      </div>
      <button
        type="button"
        className="ghost-button"
        style={styles.dismiss}
        onClick={onDismiss}
        aria-label={`Dismiss ${alert.category} notification`}
      >
        Dismiss
      </button>
    </div>
  );
};

const EmptyState = ({ title, message }) => (
  <div style={styles.empty}>
    <div className="empty-illustration" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 7 10 17l-5-5" />
      </svg>
    </div>
    <h3 style={styles.emptyTitle}>{title}</h3>
    <p style={styles.emptyText}>{message}</p>
  </div>
);

const styles = {
  page: {
    maxWidth: "var(--app-content-max)",
    padding: "1.75rem 0 3rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.25rem",
  },
  title: {
    fontSize: "1.55rem",
    fontWeight: 800,
    color: "var(--text)",
    margin: 0,
  },
  subtitle: {
    color: "var(--muted)",
    fontSize: "0.9rem",
    margin: "0.25rem 0 0",
  },
  headerPill: {
    color: "var(--muted-strong)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 999,
    padding: "0.45rem 0.7rem",
    fontSize: "0.78rem",
    fontWeight: 800,
  },
  panel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "1rem",
    marginBottom: "1rem",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    paddingBottom: "0.85rem",
    borderBottom: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
  },
  panelTitle: {
    color: "var(--text)",
    fontSize: "1rem",
    fontWeight: 800,
    margin: 0,
  },
  panelSub: {
    color: "var(--muted)",
    fontSize: "0.8rem",
    margin: "0.2rem 0 0",
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    color: "#fff",
    background: "var(--warning)",
    fontFamily: '"DM Mono", monospace',
    fontSize: "0.72rem",
    fontWeight: 900,
  },
  list: {
    display: "grid",
    gap: "0.65rem",
    paddingTop: "0.85rem",
  },
  item: {
    display: "grid",
    gridTemplateColumns: "6px minmax(0, 1fr) auto",
    gap: "0.8rem",
    alignItems: "center",
    padding: "0.78rem",
    borderRadius: "var(--radius)",
    background: "var(--surface-2)",
    border: "1px solid color-mix(in srgb, var(--border) 72%, transparent)",
  },
  statusRail: {
    width: 6,
    alignSelf: "stretch",
    minHeight: 54,
    borderRadius: 999,
  },
  itemBody: {
    minWidth: 0,
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "0.45rem",
  },
  itemTitle: {
    color: "var(--text)",
    fontSize: "0.9rem",
    fontWeight: 850,
  },
  itemMessage: {
    color: "var(--muted)",
    fontSize: "0.78rem",
    fontWeight: 650,
    marginTop: "0.12rem",
  },
  percent: {
    color: "var(--warning)",
    fontFamily: '"DM Mono", monospace',
    fontSize: "0.86rem",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    background: "var(--surface-3)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  meta: {
    color: "var(--muted)",
    fontSize: "0.74rem",
    fontWeight: 700,
    marginTop: "0.4rem",
  },
  dismiss: {
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--muted-strong)",
    borderRadius: "var(--radius-sm)",
    padding: "0.45rem 0.65rem",
    cursor: "pointer",
    fontSize: "0.76rem",
    fontWeight: 800,
  },
  loading: {
    color: "var(--muted)",
    padding: "2rem 1rem",
    textAlign: "center",
    fontSize: "0.88rem",
  },
  empty: {
    textAlign: "center",
    padding: "2.5rem 1rem",
  },
  emptyTitle: {
    color: "var(--text)",
    fontSize: "0.98rem",
    fontWeight: 800,
    margin: "0 0 0.25rem",
  },
  emptyText: {
    color: "var(--muted)",
    fontSize: "0.84rem",
    margin: 0,
  },
};

export default Notifications;
