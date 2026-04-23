// src/components/AnomalyPanel.jsx
// Feature 3: Displays detected spending anomalies with severity indicators

import { useState, useEffect } from "react";
import API from "../api/axios";

const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  icon: "🔴", label: "Critical" },
  warning:  { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: "🟡", label: "Warning"  },
};

const AnomalyPanel = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(false);

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
    <div style={s.card}>
      <div style={s.shimmer} />
    </div>
  );

  if (!anomalies.length) return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.title}>🛡️ Anomaly Detection</span>
        <span style={{ ...s.badge, background: "rgba(67,233,123,0.1)", color: "#43e97b", borderColor: "rgba(67,233,123,0.3)" }}>
          All Clear
        </span>
      </div>
      <p style={s.emptyMsg}>No unusual spending detected in the last 90 days.</p>
    </div>
  );

  const visible = expanded ? anomalies : anomalies.slice(0, 3);

  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.title}>⚡ Anomaly Detection</span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {summary?.critical > 0 && (
            <span style={{ ...s.badge, background: "rgba(239,68,68,0.1)", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>
              {summary.critical} Critical
            </span>
          )}
          {summary?.warnings > 0 && (
            <span style={{ ...s.badge, background: "rgba(245,158,11,0.1)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)" }}>
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
                <span style={s.itemIcon}>{cfg.icon}</span>
                <div>
                  <div style={{ ...s.itemLabel, color: cfg.color }}>
                    {a.type === "monthly_spike" ? `Monthly Spike — ${a.month}` : a.category}
                  </div>
                  <div style={s.itemMsg}>{a.message}</div>
                </div>
              </div>
              <div style={{ ...s.amount, color: cfg.color }}>
                ₹{Number(a.amount).toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>

      {anomalies.length > 3 && (
        <button style={s.expandBtn} onClick={() => setExpanded(e => !e)}>
          {expanded ? "Show less ↑" : `Show ${anomalies.length - 3} more ↓`}
        </button>
      )}
    </div>
  );
};

const s = {
  card: {
    background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "14px", padding: "1.25rem 1.5rem",
  },
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: "1rem"
  },
  title: { fontSize: "0.92rem", fontWeight: 600, color: "#e8e8f0" },
  badge: {
    fontSize: "0.72rem", fontWeight: 600,
    padding: "2px 8px", borderRadius: "20px", border: "1px solid"
  },
  list: { display: "flex", flexDirection: "column", gap: "0.6rem" },
  item: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid",
  },
  itemLeft: { display: "flex", alignItems: "flex-start", gap: "0.6rem", flex: 1 },
  itemIcon: { fontSize: "0.9rem", marginTop: "1px", flexShrink: 0 },
  itemLabel: { fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.2rem" },
  itemMsg: { fontSize: "0.78rem", color: "#9999bb", lineHeight: 1.4 },
  amount: { fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0, marginLeft: "0.5rem" },
  expandBtn: {
    marginTop: "0.75rem", width: "100%", background: "transparent",
    border: "none", color: "#6c63ff", fontSize: "0.82rem",
    cursor: "pointer", padding: "0.4rem", fontFamily: "inherit"
  },
  shimmer: { height: 120, borderRadius: 10, background: "rgba(255,255,255,0.04)" },
  emptyMsg: { fontSize: "0.85rem", color: "#666688", margin: 0 }
};

export default AnomalyPanel;