// src/components/InsightCard.jsx
// Displays spending insights as compact product cards

const TYPE_CONFIG = {
  summary: { color: "var(--accent)", bg: "rgba(124,140,255,0.08)", border: "rgba(124,140,255,0.22)" },
  warning: { color: "var(--warning)", bg: "rgba(216,154,43,0.08)", border: "rgba(216,154,43,0.22)" },
  positive: { color: "var(--success)", bg: "rgba(49,196,141,0.08)", border: "rgba(49,196,141,0.22)" },
  info: { color: "var(--accent)", bg: "rgba(124,140,255,0.06)", border: "var(--border)" },
  alert: { color: "var(--danger)", bg: "rgba(224,82,82,0.08)", border: "rgba(224,82,82,0.22)" },
  projection: { color: "var(--accent-2)", bg: "rgba(174,184,255,0.08)", border: "rgba(174,184,255,0.22)" },
  tip: { color: "var(--warning)", bg: "rgba(216,154,43,0.08)", border: "rgba(216,154,43,0.22)" },
};

const InsightCard = ({ insights = [], loading = false }) => {
  if (loading) {
    return (
      <div style={styles.section}>
        <h3 style={styles.heading}>Spending Insights</h3>
        <div style={styles.grid}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...styles.card, background: "var(--surface-2)" }}>
              <div style={{ height: 10, width: "45%", background: "var(--surface)", borderRadius: 4, marginBottom: 10 }} />
              <div style={{ height: 10, width: "90%", background: "var(--surface)", borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!insights || insights.length === 0) return null;

  return (
    <div style={styles.section}>
      <div style={styles.headingRow}>
        <h3 style={styles.heading}>Spending Insights</h3>
        <span style={styles.badge}>{insights.length}</span>
      </div>
      <div style={styles.grid}>
        {insights.map((insight, i) => {
          const isString = typeof insight === "string";
          const type = isString ? "info" : (insight.type || "info");
          const title = isString ? "Insight" : insight.title;
          const message = isString ? insight : insight.message;
          const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;

          return (
            <div
              key={i}
              style={{
                ...styles.card,
                background: cfg.bg,
                borderColor: cfg.border,
              }}
            >
              <div style={styles.cardHeader}>
                <span style={{ ...styles.statusDot, background: cfg.color }} />
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
  section: { marginBottom: "1.5rem" },
  headingRow: { display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.9rem" },
  heading: { fontSize: "0.95rem", fontWeight: 600, color: "var(--text)", margin: 0 },
  badge: {
    fontSize: "0.7rem", fontWeight: 600,
    background: "rgba(124,140,255,0.1)", color: "var(--accent)",
    padding: "2px 7px", borderRadius: "999px", border: "1px solid rgba(124,140,255,0.22)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "0.75rem",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "0.9rem 1rem",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.45rem" },
  statusDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  title: { fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" },
  message: { fontSize: "0.84rem", color: "var(--text)", lineHeight: 1.55, margin: 0 },
};

export default InsightCard;
