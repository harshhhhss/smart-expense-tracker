// src/components/AnomalyPanel.jsx
// Feature 3: Displays detected spending anomalies with severity indicators

import { useState, useEffect } from "react";
import API from "../api/axios";

const SEVERITY_CONFIG = {
  critical: { color: "var(--danger)", bg: "rgba(224,82,82,0.08)", border: "rgba(224,82,82,0.24)", label: "Critical" },
  warning: { color: "var(--warning)", bg: "rgba(216,154,43,0.08)", border: "rgba(216,154,43,0.24)", label: "Warning" },
};

const AnomalyPanel = () => {
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
        <span style={s.title}>Anomaly Detection</span>
        <span style={{ ...s.badge, background: "rgba(49,196,141,0.1)", color: "var(--success)", borderColor: "rgba(49,196,141,0.28)" }}>
          All Clear
        </span>
      </div>
      <div style={s.emptyState}>
        <div className="empty-illustration" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 7 10 17l-5-5" />
          </svg>
        </div>
        <p style={s.emptyMsg}>No unusual spending detected in the last 90 days.</p>
      </div>
    </div>
  );

  const visible = expanded ? anomalies : anomalies.slice(0, 3);

  return (
    <div className="product-card" style={s.card}>
      <div style={s.header}>
        <span style={s.title}>Anomaly Detection</span>
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

      <div style={s.list}>
        {visible.map((a, i) => {
          const cfg = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.warning;
          return (
            <div key={i} style={{ ...s.item, background: cfg.bg, borderColor: cfg.border }}>
              <div style={s.itemLeft}>
                <span style={{ ...s.severityBar, background: cfg.color }} />
                <div>
                  <div style={{ ...s.itemLabel, color: cfg.color }}>
                    {a.type === "monthly_spike" ? `Monthly Spike - ${a.month}` : a.category}
                  </div>
                  <div style={s.itemMsg}>{a.message}</div>
                </div>
              </div>
              <div style={{ ...s.amount, color: cfg.color }}>
                Rs {Number(a.amount).toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>

      {anomalies.length > 3 && (
        <button className="ghost-button" style={s.expandBtn} onClick={() => setExpanded(e => !e)}>
          {expanded ? "Show less" : `Show ${anomalies.length - 3} more`}
        </button>
      )}
    </div>
  );
};

const s = {
  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: "1.1rem",
  },
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: "1rem", gap: "0.75rem"
  },
  title: { fontSize: "0.96rem", fontWeight: 800, color: "var(--text)" },
  badgeGroup: { display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" },
  badge: {
    fontSize: "0.68rem", fontWeight: 800,
    padding: "2px 8px", borderRadius: "999px", border: "1px solid"
  },
  list: { display: "flex", flexDirection: "column", gap: "0.55rem" },
  item: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.75rem 0.85rem", borderRadius: "7px", border: "1px solid",
  },
  itemLeft: { display: "flex", alignItems: "flex-start", gap: "0.7rem", flex: 1 },
  severityBar: { width: 3, minHeight: 34, borderRadius: 2, flexShrink: 0, marginTop: 1 },
  itemLabel: { fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.2rem" },
  itemMsg: { fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.45 },
  amount: { fontFamily: "monospace", fontWeight: 700, fontSize: "0.86rem", flexShrink: 0, marginLeft: "0.75rem" },
  expandBtn: {
    marginTop: "0.75rem", width: "100%", background: "transparent",
    border: "1px solid var(--border)", color: "var(--accent)", fontSize: "0.82rem",
    cursor: "pointer", padding: "0.5rem", fontFamily: "inherit", borderRadius: "6px"
  },
  shimmer: { height: 120, borderRadius: 6, background: "var(--surface-2)" },
  emptyState: { textAlign: "center", padding: "1.5rem 0.5rem 1rem" },
  emptyMsg: { fontSize: "0.84rem", color: "var(--muted)", margin: 0, fontWeight: 650 }
};

export default AnomalyPanel;
