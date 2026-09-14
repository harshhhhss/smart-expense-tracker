import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import useBudgetAlert from "../hooks/useBudgetAlert";
import useToast from "../hooks/useToast";
import TopBar from "../components/TopBar";
import KpiTile, { KpiGrid } from "../components/KpiTile";
import { Bell, CircleAlert, TriangleAlert, Wallet } from "lucide-react";

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
  const criticalCount = budgetAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = totalCount - criticalCount;
  const monthlyLimit = Number(budgets?.monthlyLimit || 0);
  const trackedCategories = budgets?.limits ? Object.keys(budgets.limits).length : 0;
  const monthSpend = expenses.reduce((sum, e) => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      ? sum + Number(e.amount || 0)
      : sum;
  }, 0);

  return (
    <>
      <Navbar />
      <TopBar alertCount={budgetAlerts.length} />
      <div className="app-page" style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Notifications</h1>
            <p style={styles.subtitle}>Budget and system alerts</p>
          </div>
        </div>

        <KpiGrid>
          <KpiTile label="Active alerts" value={totalCount} icon={Bell} tone={totalCount > 0 ? "warning" : "neutral"} sub="needing attention" loading={loading} />
          <KpiTile label="Critical" value={criticalCount} icon={TriangleAlert} tone="danger" sub="over limit" loading={loading} />
          <KpiTile label="Warnings" value={warningCount} icon={CircleAlert} tone="warning" sub="approaching limit" loading={loading} />
          <KpiTile label="Month spend" value={"Rs " + monthSpend.toLocaleString("en-IN", { maximumFractionDigits: 0 })} icon={Wallet} tone="accent" loading={loading} />
          <KpiTile label="Monthly limit" value={monthlyLimit > 0 ? "Rs " + monthlyLimit.toLocaleString("en-IN") : "Not set"} icon={Wallet} loading={loading} />
          <KpiTile label="Tracked categories" value={trackedCategories} icon={Wallet} sub="with limits" loading={loading} />
        </KpiGrid>

        <section className="widget" style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Alerts</h2>
              <p style={styles.panelSub}>Budget limits and account messages</p>
            </div>
            {totalCount > 0 && <span style={styles.countBadge}>{totalCount}</span>}
          </div>

          {loading ? (
            <div style={styles.loading}>Loading alerts...</div>
          ) : totalCount === 0 ? (
            <EmptyState message="Nothing needs your attention. Budget and account alerts will appear here." />
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
      </div>
    </>
  );
};

const NotificationItem = ({ alert, onDismiss }) => {
  // critical -> danger, warning -> warning. Same mapping as AnomalyPanel.
  const isCritical = alert.severity === "critical";
  const severityColor = isCritical ? "var(--danger)" : "var(--warning)";

  return (
    <div style={styles.item}>
      <div style={{ ...styles.statusRail, background: severityColor }} />
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
              background: severityColor,
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

const EmptyState = ({ message }) => (
  <div style={styles.empty}>
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--success)", flexShrink: 0 }}>
      <path d="M20 7 10 17l-5-5" />
    </svg>
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
    gap: "var(--space-4)",
    marginBottom: "var(--space-5)",
  },
  title: {
    fontSize: "var(--text-h1)",
    fontWeight: 600,
    color: "var(--text)",
    margin: 0,
  },
  subtitle: {
    color: "var(--muted)",
    fontSize: "var(--text-body)",
    margin: "0.25rem 0 0",
  },
  headerPill: {
    color: "var(--muted-strong)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 999,
    padding: "0.45rem 0.7rem",
    fontSize: "var(--text-sub)",
    fontWeight: 600,
  },
  panel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "1rem",
    marginBottom: "var(--space-4)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "var(--space-4)",
    paddingBottom: "0.85rem",
    borderBottom: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
  },
  panelTitle: {
    color: "var(--text)",
    fontSize: "var(--text-h2)",
    fontWeight: 600,
    margin: 0,
  },
  panelSub: {
    color: "var(--muted)",
    fontSize: "var(--text-sub)",
    margin: "0.2rem 0 0",
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    color: "var(--on-accent)",
    background: "var(--warning)",
    fontVariantNumeric: "tabular-nums",
    fontSize: "var(--text-label)",
    fontWeight: 700,
  },
  list: {
    display: "grid",
    gap: "var(--space-3)",
    paddingTop: "0.85rem",
  },
  item: {
    display: "grid",
    gridTemplateColumns: "6px minmax(0, 1fr) auto",
    gap: "var(--space-3)",
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
    gap: "var(--space-4)",
    marginBottom: "var(--space-2)",
  },
  itemTitle: {
    color: "var(--text)",
    fontSize: "var(--text-body)",
    fontWeight: 600,
  },
  itemMessage: {
    color: "var(--muted)",
    fontSize: "var(--text-sub)",
    fontWeight: 600,
    marginTop: "var(--space-1)",
  },
  percent: {
    color: "var(--warning)",
    fontVariantNumeric: "tabular-nums",
    fontSize: "var(--text-body)",
    fontWeight: 700,
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
    fontSize: "var(--text-label)",
    fontWeight: 600,
    marginTop: "var(--space-2)",
  },
  dismiss: {
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--muted-strong)",
    borderRadius: "var(--radius-sm)",
    padding: "0.45rem 0.65rem",
    cursor: "pointer",
    fontSize: "var(--text-sub)",
    fontWeight: 600,
  },
  loading: {
    color: "var(--muted)",
    padding: "2rem 1rem",
    textAlign: "center",
    fontSize: "var(--text-body)",
  },
  empty: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    padding: "0.9rem 0.2rem",
  },
  emptyText: {
    color: "var(--muted)",
    fontSize: "var(--text-body)",
    margin: 0,
  },
};

export default Notifications;
