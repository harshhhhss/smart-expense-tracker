// src/components/InsightCard.jsx
// Displays spending insights as a compact grouped panel

const TYPE_CONFIG = {
  summary: { color: "var(--accent)", label: "Summary" },
  warning: { color: "var(--warning)", label: "Watch" },
  positive: { color: "var(--success)", label: "Good" },
  info: { color: "var(--accent)", label: "Info" },
  alert: { color: "var(--danger)", label: "Alert" },
  projection: { color: "var(--accent-2)", label: "Projection" },
  tip: { color: "var(--warning)", label: "Tip" },
};

const InsightCard = ({ insights = [], loading = false }) => {
  if (loading) {
    return (
      <div className="product-card" style={styles.panel}>
        <div style={styles.headingRow}>
          <h3 style={styles.heading}>Spending Insights</h3>
        </div>
        <div style={styles.loadingRows}>
          {[1, 2, 3].map(i => (
            <div key={i} style={styles.loadingRow}>
              <div style={{ height: 8, width: "24%", background: "var(--surface-2)", borderRadius: 4 }} />
              <div style={{ height: 8, width: "64%", background: "var(--surface-2)", borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!insights || insights.length === 0) return null;

  return (
    <div className="product-card" style={styles.panel}>
      <div style={styles.headingRow}>
        <div>
          <h3 style={styles.heading}>Spending Insights</h3>
          <p style={styles.subheading}>Prioritized spending signals</p>
        </div>
        <span style={styles.badge}>{insights.length}</span>
      </div>
      <div style={styles.rows}>
        {insights.map((insight, i) => {
          const isString = typeof insight === "string";
          const type = isString ? "info" : (insight.type || "info");
          const title = isString ? "Insight" : insight.title;
          const message = isString ? insight : insight.message;
          const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;

          return (
            <div
              key={i}
              style={styles.row}
            >
              <div style={styles.rowTop}>
                <span style={{ ...styles.typePill, color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}12` }}>
                  {cfg.label}
                </span>
                {title && <span style={styles.title}>{title}</span>}
              </div>
              <p style={styles.message}>{message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  panel: {
    background: "color-mix(in srgb, var(--surface) 96%, transparent)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "0.78rem",
  },
  headingRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.6rem", marginBottom: "0.55rem" },
  heading: { fontSize: "0.9rem", fontWeight: 850, color: "var(--text)", margin: 0 },
  subheading: { fontSize: "0.72rem", color: "var(--muted)", margin: "0.12rem 0 0" },
  badge: {
    fontSize: "0.68rem", fontWeight: 800,
    background: "var(--accent-soft)", color: "var(--accent)",
    padding: "2px 7px", borderRadius: "999px", border: "1px solid rgba(124,140,255,0.22)"
  },
  rows: {
    borderTop: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
  },
  row: {
    padding: "0.62rem 0",
    borderBottom: "1px solid color-mix(in srgb, var(--border) 58%, transparent)",
  },
  rowTop: { display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.26rem", minWidth: 0 },
  typePill: {
    minWidth: 58,
    textAlign: "center",
    fontSize: "0.62rem",
    fontWeight: 850,
    padding: "1px 6px",
    borderRadius: "999px",
    border: "1px solid",
    flexShrink: 0,
  },
  title: { fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  message: { fontSize: "0.8rem", color: "var(--text)", lineHeight: 1.42, margin: 0 },
  loadingRows: { display: "grid", borderTop: "1px solid var(--border)" },
  loadingRow: {
    display: "flex",
    gap: "0.7rem",
    padding: "0.72rem 0",
    borderBottom: "1px solid color-mix(in srgb, var(--border) 58%, transparent)",
  },
};

export default InsightCard;
