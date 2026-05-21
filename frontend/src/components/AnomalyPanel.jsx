// src/components/AnomalyPanel.jsx
// Feature 3: Displays detected spending anomalies with severity indicators

import { useState, useEffect } from "react";
import API from "../api/axios";

const SEVERITY_CONFIG = {
  critical: { color: "var(--danger)", label: "Critical" },
  warning: { color: "var(--warning)", label: "Warning" },
};

const AnomalyPanel = ({ sortBy = "severity" }) => {
  const [anomalies, setAnomalies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get("/advanced/anomalies");
        setAnomalies(data.anomalies || []);
        setSummary(data.summary);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="product-card" style={s.card}>
      <div style={s.shimmer} />
    </div>
  );

  if (!anomalies.length) return (
    <div className="product-card" style={s.card}>
      <div style={s.header}>
        <div>
          <span style={s.title}>Anomaly Detection</span>
          <p style={s.subtitle}>90-day spending scan</p>
        </div>
        <span style={{ ...s.badge, background: "rgba(49,196,141,0.1)", color: "var(--success)", borderColor: "rgba(49,196,141,0.28)" }}>
          All Clear
        </span>
      </div>
      <div style={s.emptyState}>
        <p style={s.emptyMsg}>No unusual spending detected in the last 90 days.</p>
      </div>
    </div>
  );

  const sortedAnomalies = [...anomalies].sort((a, b) => {
    if (sortBy === "amount") return Number(b.amount || 0) - Number(a.amount || 0);
    if (sortBy === "recent") return String(b.month || b.category || "").localeCompare(String(a.month || a.category || ""));
    const severityRank = { critical: 2, warning: 1 };
    return (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
  });
  const visible = expanded ? sortedAnomalies : sortedAnomalies.slice(0, 3);

  return (
    <div className="product-card" style={s.card}>
      <div style={s.header}>
        <div>
          <span style={s.title}>Anomaly Detection</span>
          <p style={s.subtitle}>90-day spending scan</p>
        </div>
        <div style={s.badgeGroup}>
          {summary?.critical > 0 && (
            <span style={{ ...s.badge, background: "rgba(224,82,82,0.1)", color: "var(--danger)", borderColor: "rgba(224,82,82,0.28)" }}>
              {summary.critical} Critical
            </span>
          )}
          {summary?.warnings > 0 && (
            <span style={{ ...s.badge, background: "rgba(216,154,43,0.1)", color: "var(--warning)", borderColor: "rgba(216,154,43,0.28)" }}>
              {summary.warnings} Warning
            </span>
          )}
        </div>
      </div>

      <div style={s.table}>
        <div style={s.tableHead}>
          <span>Signal</span>
          <span>Severity</span>
          <span style={{ textAlign: "right" }}>Amount</span>
        </div>
        {visible.map((a, i) => {
          const cfg = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.warning;
          return (
            <div key={i} style={s.row}>
              <div style={s.signalCell}>
                <span style={{ ...s.statusDot, background: cfg.color }} />
                <div>
                  <div style={s.itemLabel}>
                    {a.type === "monthly_spike" ? `Monthly Spike - ${a.month}` : a.category}
                  </div>
                  <div style={s.itemMsg}>{a.message}</div>
                </div>
              </div>
              <span style={{ ...s.severityPill, color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}12` }}>
                {cfg.label}
              </span>
              <div style={{ ...s.amount, color: cfg.color }}>
                Rs {Number(a.amount).toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>

      {sortedAnomalies.length > 3 && (
        <button className="ghost-button" style={s.expandBtn} onClick={() => setExpanded(e => !e)}>
          {expanded ? "Show less" : `Show ${sortedAnomalies.length - 3} more`}
        </button>
      )}
    </div>
  );
};

const s = {
  card: {
    background: "color-mix(in srgb, var(--surface) 96%, transparent)", border: "1px solid var(--border)",
    borderRadius: "8px", padding: "0.78rem",
  },
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: "0.58rem", gap: "0.75rem"
  },
  title: { fontSize: "0.9rem", fontWeight: 850, color: "var(--text)" },
  subtitle: { fontSize: "0.72rem", color: "var(--muted)", margin: "0.12rem 0 0" },
  badgeGroup: { display: "flex", gap: "0.38rem", flexWrap: "wrap", justifyContent: "flex-end" },
  badge: {
    fontSize: "0.68rem", fontWeight: 800,
    padding: "2px 8px", borderRadius: "999px", border: "1px solid"
  },
  table: {
    borderTop: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
  },
  tableHead: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 76px 82px",
    gap: "0.6rem",
    padding: "0.48rem 0",
    color: "var(--muted)",
    fontSize: "0.64rem",
    fontWeight: 850,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 76px 82px",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.58rem 0",
    borderTop: "1px solid color-mix(in srgb, var(--border) 52%, transparent)",
  },
  signalCell: { display: "flex", alignItems: "flex-start", gap: "0.5rem", minWidth: 0 },
  statusDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0, marginTop: 5 },
  itemLabel: { fontSize: "0.78rem", fontWeight: 800, marginBottom: "0.12rem", color: "var(--text)" },
  itemMsg: { fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.35 },
  severityPill: {
    justifySelf: "start",
    fontSize: "0.62rem",
    fontWeight: 850,
    padding: "1px 6px",
    borderRadius: "999px",
    border: "1px solid",
  },
  amount: { fontFamily: '"DM Mono", monospace', fontWeight: 850, fontSize: "0.78rem", flexShrink: 0, textAlign: "right" },
  expandBtn: {
    marginTop: "0.62rem", width: "100%", background: "transparent",
    border: "1px solid var(--border)", color: "var(--accent)", fontSize: "0.82rem",
    cursor: "pointer", padding: "0.42rem", fontFamily: "inherit", borderRadius: "6px"
  },
  shimmer: { height: 112, borderRadius: 6, background: "var(--surface-2)" },
  emptyState: { borderTop: "1px solid var(--border)", padding: "0.7rem 0 0.15rem" },
  emptyMsg: { fontSize: "0.8rem", color: "var(--muted)", margin: 0, fontWeight: 650 }
};

export default AnomalyPanel;
