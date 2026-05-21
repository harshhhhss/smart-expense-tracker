// src/pages/Analytics.jsx
import { useState, useEffect } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import AnomalyPanel from "../components/AnomalyPanel";
import PredictionPanel from "../components/PredictionPanel";
import BudgetPlanner from "../components/BudgetPlanner";
import InsightCard from "../components/InsightCard";

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
            <p style={styles.subtitle}>Forecasts, risk signals, and budget controls</p>
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
          <MetricCard label="Current Spend" value={`Rs ${(summary?.thisMonth || 0).toLocaleString("en-IN")}`} detail={dateRangeLabel} tone="accent" loading={loading} />
          <MetricCard label="Prior Period" value={`Rs ${(summary?.lastMonth || 0).toLocaleString("en-IN")}`} detail="comparison baseline" tone="neutral" loading={loading} />
          <MetricCard label="Spend Delta" value={mom !== null && mom !== undefined ? `${mom > 0 ? "+" : ""}${mom}%` : "-"} detail="month over month" tone={mom > 0 ? "danger" : "success"} loading={loading} />
          <MetricCard label="Risk Signals" value={(anomalySummary?.critical || 0) + (anomalySummary?.warnings || 0)} detail={`${anomalySummary?.critical || 0} critical`} tone="warning" loading={loading} />
          <MetricCard label="Insights" value={insights.length} detail="active recommendations" tone="success" loading={loading} />
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

const MetricCard = ({ label, value, detail, tone = "neutral", loading }) => (
  <div className="product-card" style={{ ...styles.metricCard, ...styles.metricTone[tone] }}>
    <div style={styles.metricLabel}>{label}</div>
    {loading ? <div style={styles.metricSkeleton} /> : <div style={styles.metricValue}>{value}</div>}
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
    fontWeight: 850,
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
    fontWeight: 850,
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
    fontWeight: 750,
    outline: 'none',
    textTransform: 'none',
    letterSpacing: 0,
  },
  exportButton: {
    alignSelf: 'end',
    height: 34,
    background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
    border: '1px solid transparent',
    color: '#fff',
    borderRadius: 8,
    padding: '0 0.9rem',
    fontSize: '0.8rem',
    fontWeight: 850,
    cursor: 'pointer',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(150px, 1fr))',
    gap: '0.72rem',
    marginBottom: '0.72rem',
  },
  metricCard: {
    minHeight: 92,
    background: 'color-mix(in srgb, var(--surface) 96%, transparent)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '0.78rem',
  },
  metricTone: {
    accent: { boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--accent) 22%, transparent), var(--card-shadow)' },
    neutral: {},
    danger: { borderColor: 'color-mix(in srgb, var(--danger) 26%, var(--border))' },
    warning: { borderColor: 'color-mix(in srgb, var(--warning) 28%, var(--border))' },
    success: { borderColor: 'color-mix(in srgb, var(--success) 24%, var(--border))' },
  },
  metricLabel: {
    color: 'var(--muted)',
    fontSize: '0.66rem',
    fontWeight: 850,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '0.28rem',
  },
  metricValue: {
    color: 'var(--text)',
    fontFamily: '"DM Mono", monospace',
    fontSize: '1.15rem',
    fontWeight: 900,
    lineHeight: 1.15,
  },
  metricDetail: {
    color: 'var(--muted)',
    fontSize: '0.72rem',
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
