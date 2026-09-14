// src/components/AnomalyPanel.jsx
// Feature 3: Displays detected spending anomalies with severity indicators

import { useState, useEffect } from "react";
import API from "../api/axios";
import { CircleAlert, TriangleAlert } from "lucide-react";

// Severity is carried by an icon as well as a colour, so it survives a
// greyscale print and reads for colour-blind users.
const SEVERITY_CONFIG = {
  critical: { color: "var(--danger)", label: "Critical", Icon: TriangleAlert },
  warning: { color: "var(--warning)", label: "Warning", Icon: CircleAlert },
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
    <div className="widget" style={s.card}>
      <div style={s.shimmer} />
    </div>
  );

  if (!anomalies.length) return (
    <div className="widget" style={s.card}>
      <div style={s.header}>
        <div>
          <span style={s.title}>Anomaly Detection</span>
          <p style={s.subtitle}>Unusually large transactions</p>
        </div>
        <span style={{ ...s.badge, background: "var(--success-soft)", color: "var(--success)", borderColor: "color-mix(in srgb, var(--success) 28%, transparent)" }}>
          All Clear
        </span>
      </div>
      <div style={s.emptyState}>
        <p style={s.emptyMsg}>Nothing unusual so far.</p>
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
    <div className="widget" style={s.card}>
      <div style={s.header}>
        <div>
          <span style={s.title}>Anomaly Detection</span>
          <p style={s.subtitle}>Unusually large transactions</p>
        </div>
        <div style={s.badgeGroup}>
          {summary?.critical > 0 && (
            <span style={{ ...s.badge, background: "var(--danger-soft)", color: "var(--danger)", borderColor: "color-mix(in srgb, var(--danger) 28%, transparent)" }}>
              {summary.critical} Critical
            </span>
          )}
          {summary?.warnings > 0 && (
            <span style={{ ...s.badge, background: "var(--warning-soft)", color: "var(--warning)", borderColor: "color-mix(in srgb, var(--warning) 28%, transparent)" }}>
              {summary.warnings} Warning
            </span>
          )}
        </div>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: 34 }} aria-label="Severity" />
              <th style={s.th}>Category</th>
              <th style={s.th}>Signal</th>
              <th style={s.th}>Date</th>
              <th style={{ ...s.th, textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a, i) => {
              const cfg = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.warning;
              return (
                <tr key={a._id || i} style={s.tr}>
                  <td style={{ ...s.td, textAlign: "center" }} title={cfg.label}>
                    <cfg.Icon size={14} strokeWidth={2} style={{ color: cfg.color }} aria-label={cfg.label} />
                  </td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{a.category}</td>
                  <td style={{ ...s.td, color: "var(--muted)" }}>{a.message}</td>
                  <td style={{ ...s.td, color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td style={{ ...s.td, ...s.tdAmount, color: cfg.color }}>
                    Rs {Number(a.amount).toFixed(0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
  title: { fontSize: "var(--text-h2)", fontWeight: 600, color: "var(--text)" },
  subtitle: { fontSize: "0.72rem", color: "var(--muted)", margin: "0.12rem 0 0" },
  badgeGroup: { display: "flex", gap: "0.38rem", flexWrap: "wrap", justifyContent: "flex-end" },
  badge: {
    fontSize: "0.68rem", fontWeight: 600,
    padding: "2px 8px", borderRadius: "999px", border: "1px solid"
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sub)" },
  th: {
    textAlign: "left",
    padding: "0.4rem 0.55rem",
    fontSize: "var(--text-label)",
    fontWeight: 600,
    letterSpacing: "var(--ls-label)",
    textTransform: "uppercase",
    color: "var(--muted)",
    background: "var(--surface-2)",
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid var(--border)" },
  td: { padding: "0.45rem 0.55rem", color: "var(--text)", verticalAlign: "middle" },
  tdAmount: { textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" },
  itemLabel: { fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.12rem", color: "var(--text)" },
  itemMsg: { fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.35 },
  expandBtn: {
    marginTop: "0.62rem", width: "100%", background: "transparent",
    border: "1px solid var(--border)", color: "var(--accent)", fontSize: "0.82rem",
    cursor: "pointer", padding: "0.42rem", fontFamily: "inherit", borderRadius: "6px"
  },
  shimmer: { height: 112, borderRadius: 6, background: "var(--surface-2)" },
  emptyState: { borderTop: "1px solid var(--border)", padding: "0.7rem 0 0.15rem" },
  emptyMsg: { fontSize: "0.8rem", color: "var(--muted)", margin: 0, fontWeight: 600 }
};

export default AnomalyPanel;
