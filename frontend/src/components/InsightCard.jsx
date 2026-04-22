// src/components/InsightCard.jsx
// Displays AI-like spending insights as animated cards

const TYPE_CONFIG = {
  summary:    { icon: "📊", color: "#6c63ff", bg: "rgba(108,99,255,0.08)",  border: "rgba(108,99,255,0.25)" },
  warning:    { icon: "⚠️", color: "#f7971e", bg: "rgba(247,151,30,0.08)",  border: "rgba(247,151,30,0.25)" },
  positive:   { icon: "✅", color: "#43e97b", bg: "rgba(67,233,123,0.08)",  border: "rgba(67,233,123,0.25)" },
  info:       { icon: "💡", color: "#38bdf8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.25)" },
  alert:      { icon: "🔍", color: "#ff6584", bg: "rgba(255,101,132,0.08)", border: "rgba(255,101,132,0.25)" },
  projection: { icon: "📅", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)" },
  tip:        { icon: "💰", color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)" },
};

const InsightCard = ({ insights = [], loading = false }) => {
  if (loading) {
    return (
      <div style={styles.section}>
        <h3 style={styles.heading}>💡 Smart Insights</h3>
        <div style={styles.grid}>
          {[1,2,3].map(i => (
            <div key={i} style={{ ...styles.card, background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" }}>
              <div style={{ height: 12, width: "60%", background: "rgba(255,255,255,0.06)", borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 10, width: "90%", background: "rgba(255,255,255,0.04)", borderRadius: 6 }} />
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
        <h3 style={styles.heading}>💡 Smart Insights</h3>
        <span style={styles.badge}>{insights.length} insights</span>
      </div>
      <div style={styles.grid}>
        {insights.map((insight, i) => {
          // Support both object format {type,title,message} and plain string
          const isString = typeof insight === "string";
          const type     = isString ? "info" : (insight.type || "info");
          const title    = isString ? null   : insight.title;
          const message  = isString ? insight : insight.message;
          const cfg      = TYPE_CONFIG[type] || TYPE_CONFIG.info;

          return (
            <div
              key={i}
              style={{
                ...styles.card,
                background: cfg.bg,
                borderColor: cfg.border,
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <div style={styles.cardHeader}>
                <span style={styles.icon}>{cfg.icon}</span>
                {title && <span style={{ ...styles.title, color: cfg.color }}>{title}</span>}
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
  section: { marginBottom: "2rem" },
  headingRow: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" },
  heading: { fontSize: "1rem", fontWeight: 600, color: "#e8e8f0", margin: 0 },
  badge: {
    fontSize: "0.72rem", fontWeight: 600,
    background: "rgba(108,99,255,0.15)", color: "#6c63ff",
    padding: "2px 8px", borderRadius: "20px", border: "1px solid rgba(108,99,255,0.3)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "0.75rem",
  },
  card: {
    border: "1px solid",
    borderRadius: "12px",
    padding: "1rem 1.25rem",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" },
  icon: { fontSize: "1.1rem" },
  title: { fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" },
  message: { fontSize: "0.86rem", color: "#c8c8d8", lineHeight: 1.6, margin: 0 },
};

export default InsightCard;