// src/pages/Analytics.jsx
import { useState, useEffect } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import AnomalyPanel from "../components/AnomalyPanel";
import PredictionPanel from "../components/PredictionPanel";
import BudgetPlanner from "../components/BudgetPlanner";
import InsightCard from "../components/InsightCard";
import { Clock, Lightbulb, TrendingDown, TrendingUp, TriangleAlert, Wallet } from "lucide-react";

const Analytics = () => {
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState(null);
  const [anomalySummary, setAnomalySummary] = useState(null);
  const [dateRange, setDateRange] = useState("30d");
  const [insightFilter, setInsightFilter] = useState("all");
  const [anomalySort, setAnomalySort] = useState("severity");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, anomalyRes] = await Promise.all([
          API.get("/advanced/dashboard"),
          API.get("/advanced/anomalies"),
        ]);
        setInsights(dashboardRes.data.dashboard?.insights || []);
        setSummary(dashboardRes.data.dashboard?.summary || null);
        setAnomalySummary(anomalyRes.data.summary || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Date range", dateRange],
      ["This month", summary?.thisMonth || 0],
      ["Last month", summary?.lastMonth || 0],
      ["Month over month", summary?.monthOverMonthChange ?? ""],
      ["Insights", insights.length],
      ["Critical anomalies", anomalySummary?.critical || 0],
      ["Warning anomalies", anomalySummary?.warnings || 0],
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-summary-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const mom = summary?.monthOverMonthChange;
  const dateRangeLabel = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "6m": "Last 6 months",
  }[dateRange];

  return (
    <>
      <Navbar />
      <div className="app-page analytics-page" style={styles.page}>
        <div className="dashboard-header" style={styles.header}>
          <div>
            <h1 style={styles.title}>Analytics</h1>
            <p style={styles.subtitle}>Forecasts, budgets and unusual spending</p>
          </div>
          <div style={styles.headerActions}>
            <label style={styles.selectControl}>
              <span>Date</span>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={styles.select}>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="6m">Last 6 months</option>
              </select>
            </label>
            <label style={styles.selectControl}>
              <span>Insights</span>
              <select value={insightFilter} onChange={(e) => setInsightFilter(e.target.value)} style={styles.select}>
                <option value="all">All types</option>
                <option value="warning">Warnings</option>
                <option value="positive">Positive</option>
                <option value="projection">Projections</option>
                <option value="tip">Tips</option>
              </select>
            </label>
            <label style={styles.selectControl}>
              <span>Risk sort</span>
              <select value={anomalySort} onChange={(e) => setAnomalySort(e.target.value)} style={styles.select}>
                <option value="severity">Severity</option>
                <option value="amount">Amount</option>
                <option value="recent">Latest</option>
              </select>
            </label>
            <button className="action-button" style={styles.exportButton} onClick={handleExport}>
              Export
            </button>
          </div>
        </div>

        <div className="analytics-metrics" style={styles.metricsGrid}>
          <MetricCard label="Current Spend" value={`Rs ${(summary?.thisMonth || 0).toLocaleString("en-IN")}`} detail={dateRangeLabel} icon={Wallet} variant="hero" loading={loading} />
          <MetricCard label="Prior Period" value={`Rs ${(summary?.lastMonth || 0).toLocaleString("en-IN")}`} detail="comparison baseline" icon={Clock} loading={loading} />
          <MetricCard label="Spend Delta" value={mom !== null && mom !== undefined ? `${mom > 0 ? "+" : ""}${mom}%` : "-"} detail="month over month" icon={mom > 0 ? TrendingUp : TrendingDown} loading={loading} />
          <MetricCard label="Risk Signals" value={(anomalySummary?.critical || 0) + (anomalySummary?.warnings || 0)} detail={`${anomalySummary?.critical || 0} critical`} icon={TriangleAlert} loading={loading} />
          <MetricCard label="Insights" value={insights.length} detail="active recommendations" icon={Lightbulb} loading={loading} />
        </div>

        <div className="analytics-flow" style={styles.flowTop}>
          <section style={styles.widePanel}>
            <PredictionPanel />
          </section>
          <section style={styles.sidePanel}>
            <AnomalyPanel sortBy={anomalySort} />
          </section>
        </div>

        <div className="analytics-flow analytics-flow-bottom" style={styles.flowBottom}>
          <section style={styles.widePanel}>
            <BudgetPlanner />
          </section>
          <section style={styles.sidePanel}>
            <InsightCard insights={insights} loading={loading} filter={insightFilter} />
          </section>
        </div>
      </div>
    </>
  );
};

// Current Spend is what this page is about, so it loses its container and
// sits on the page ground; the rest stay in bordered cards.
const MetricCard = ({ label, value, detail, icon: Icon, loading, variant = 'default' }) => (
  <div
    className={variant === 'hero' ? undefined : 'product-card'}
    style={{ ...styles.metricCard, ...(variant === 'hero' ? styles.metricCardHero : null) }}
  >
    <div style={styles.metricTopline}>
      {Icon && <Icon size={14} strokeWidth={1.9} style={styles.metricIcon} aria-hidden="true" />}
      <div style={styles.metricLabel}>{label}</div>
    </div>
    {loading ? <div style={styles.metricSkeleton} /> : (
      <div style={{ ...styles.metricValue, ...(variant === 'hero' ? styles.metricValueHero : null) }}>{value}</div>
    )}
    <div style={styles.metricDetail}>{detail}</div>
  </div>
);

const styles = {
  page: {
    maxWidth: 'none',
    minHeight: '100vh',
    padding: '1.15rem 0 2.2rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '0.95rem',
    minHeight: 58,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '1.34rem',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    color: 'var(--muted)',
    fontSize: '0.82rem',
    margin: '0.18rem 0 0 0',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  selectControl: {
    minWidth: 132,
    display: 'grid',
    gap: '0.2rem',
    color: 'var(--muted)',
    fontSize: '0.62rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  select: {
    height: 34,
    background: 'color-mix(in srgb, var(--surface) 94%, transparent)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    padding: '0 0.62rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    outline: 'none',
    textTransform: 'none',
    letterSpacing: 0,
  },
  exportButton: {
    alignSelf: 'end',
    height: 34,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--muted-strong)',
    borderRadius: 8,
    padding: '0 0.9rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(150px, 1fr))',
    gap: '0.875rem',
    marginBottom: '1.25rem',
  },
  metricCardHero: {
    background: 'transparent',
    border: '1px solid transparent',
    boxShadow: 'none',
    paddingLeft: 0,
  },
  metricValueHero: {
    fontSize: 'clamp(2rem, 3vw, 2.5rem)',
  },
  metricCard: {
    minHeight: 118,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '1rem 1rem 0.95rem',
  },
  metricTopline: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.6rem',
  },
  metricIcon: {
    color: 'var(--muted)',
    flexShrink: 0,
  },
  metricLabel: {
    color: 'var(--muted)',
    fontSize: 'var(--text-label)',
    fontWeight: 600,
    letterSpacing: 'var(--ls-label)',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: 'var(--text)',
    fontVariantNumeric: "tabular-nums",
    fontSize: 'var(--text-stat)',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.05,
  },
  metricDetail: {
    color: 'var(--muted)',
    fontSize: 'var(--text-sub)',
    marginTop: '0.24rem',
  },
  metricSkeleton: {
    width: '76%',
    height: 22,
    background: 'var(--surface-2)',
    borderRadius: 4,
  },
  flowTop: {
    display: 'grid',
    gridTemplateColumns: 'minmax(540px, 1.18fr) minmax(420px, 0.82fr)',
    gap: '0.72rem',
    alignItems: 'stretch',
    marginBottom: '0.72rem',
  },
  flowBottom: {
    display: 'grid',
    gridTemplateColumns: 'minmax(540px, 1.08fr) minmax(420px, 0.92fr)',
    gap: '0.72rem',
    alignItems: 'start',
  },
  widePanel: {
    minWidth: 0,
  },
  sidePanel: {
    minWidth: 0,
  },
};

export default Analytics;
