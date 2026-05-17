const ActivityFeed = ({ expenses }) => {
  // Transform expenses into activity items
  const activities = (expenses || [])
    .slice(0, 20)
    .map(exp => ({
      id: exp._id,
      type: "expense",
      action: "Added expense",
      category: exp.category,
      amount: exp.amount,
      description: exp.description,
      timestamp: new Date(exp.createdAt || exp.date),
      autoTagged: exp.autoTagged
    }));

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!activities.length) {
    return (
      <div style={styles.empty}>
        <div className="empty-illustration" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l3 2" />
            <circle cx="12" cy="12" r="8" />
          </svg>
        </div>
        <div style={styles.emptyText}>No activity yet</div>
      </div>
    );
  }

  return (
    <div className="product-card" style={styles.container}>
      <h3 style={styles.title}>Recent Activity</h3>
      <div style={styles.feed}>
        {activities.map((activity, idx) => (
          <div key={activity.id} style={styles.item}>
            <div style={styles.timeline}>
              <div style={styles.dot} />
              {idx < activities.length - 1 && <div style={styles.line} />}
            </div>

            <div style={styles.content}>
              <div style={styles.header}>
                <span style={styles.action}>{activity.action}</span>
                <span style={styles.time}>{formatTime(activity.timestamp)}</span>
              </div>

              <div style={styles.details}>
                <span style={{ ...styles.category, borderColor: getCategoryColor(activity.category) }}>
                  {activity.category}
                </span>
                <span style={styles.amount}>Rs {activity.amount.toFixed(2)}</span>
              </div>

              {activity.description && (
                <div style={styles.description}>{activity.description}</div>
              )}

              {activity.autoTagged && (
                <div style={styles.badge}>Auto-tagged</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getCategoryColor = (category) => {
  const colors = {
    "Food": "#d89a2b",
    "Transport": "#60a5fa",
    "Shopping": "#94a3b8",
    "Entertainment": "#aeb8ff",
    "Bills": "#7c8cff",
    "Health": "#31c48d",
    "Education": "#cbd5e1",
    "Travel": "#60a5fa",
    "Utilities": "#7c8cff",
    "Personal Care": "#94a3b8",
    "Miscellaneous": "#9ca3af"
  };
  return colors[category] || "#9ca3af";
};

const styles = {
  container: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "1.1rem",
    marginBottom: "2rem"
  },
  title: {
    fontSize: "0.98rem",
    fontWeight: 800,
    color: "var(--text)",
    margin: "0 0 1rem 0"
  },
  feed: {
    position: "relative"
  },
  item: {
    display: "flex",
    marginBottom: "1.5rem",
    position: "relative"
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginRight: "1rem",
    minWidth: "24px"
  },
  dot: {
    width: "8px",
    height: "8px",
    background: "var(--accent)",
    borderRadius: "50%",
    marginTop: "4px",
    zIndex: 1
  },
  line: {
    width: "2px",
    flex: 1,
    background: "var(--border)",
    marginTop: "12px",
    minHeight: "60px"
  },
  content: {
    flex: 1,
    paddingBottom: "1rem"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem"
  },
  action: {
    fontSize: "0.95rem",
    fontWeight: 750,
    color: "var(--text)"
  },
  time: {
    fontSize: "0.75rem",
    color: "var(--muted)"
  },
  details: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    marginBottom: "0.5rem"
  },
  category: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text)",
    border: "1px solid",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px"
  },
  amount: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--text)",
    fontFamily: '"DM Mono", monospace'
  },
  description: {
    fontSize: "0.85rem",
    color: "var(--muted)",
    fontStyle: "italic",
    marginBottom: "0.5rem"
  },
  badge: {
    display: "inline-block",
    fontSize: "0.7rem",
    background: "rgba(124, 140, 255, 0.08)",
    color: "var(--accent)",
    padding: "0.2rem 0.5rem",
    borderRadius: "3px",
    fontWeight: 500
  },
  empty: {
    textAlign: "center",
    padding: "3rem 1rem",
    color: "var(--muted)"
  },
  emptyText: {
    fontSize: "0.95rem"
  }
};

export default ActivityFeed;
