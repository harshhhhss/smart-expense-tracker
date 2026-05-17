// src/components/ExpenseChart.jsx
// Feature 2: Charts Dashboard using Recharts

import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip
} from "recharts";

const COLORS = ["#0f8f7a", "#2357c6", "#b86b00", "#6d5bd0", "#256f9c", "#0f8f69", "#7a869a", "#475569", "#c2413a"];

const PieTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <p style={{ color: payload[0].payload.fill, fontWeight: 800, marginBottom: 2 }}>{payload[0].name}</p>
      <p style={{ color: "var(--expense-amount)", fontFamily: '"DM Mono", monospace', fontWeight: 900 }}>Rs {payload[0].value.toFixed(2)}</p>
    </div>
  );
};

const BarTooltipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <p style={{ color: "var(--muted)", marginBottom: 2, fontSize: "0.8rem" }}>{label}</p>
      <p style={{ color: "var(--expense-amount)", fontFamily: '"DM Mono", monospace', fontWeight: 900 }}>Rs {payload[0]?.value?.toFixed(2)}</p>
    </div>
  );
};

const renderLegend = (props) => {
  const { payload } = props;
  return (
    <div style={styles.legend}>
      {payload.map((entry, i) => (
        <div key={i} style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: entry.color }} />
          <span style={styles.legendLabel}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const EmptyChart = ({ children }) => (
  <div style={styles.empty}>
    <div className="empty-illustration" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V5M4 19h16" />
        <path d="M8 16v-4M12 16V8M16 16v-6" />
      </svg>
    </div>
    <span>{children}</span>
  </div>
);

const ExpenseChart = ({ categoryData = [], monthlyData = [], loading = false }) => {
  if (loading) {
    return (
      <div style={styles.chartsRow}>
        {[1, 2].map(i => (
          <div key={i} className="product-card" style={styles.chartCard}>
            <div style={{ height: 12, width: "38%", background: "var(--surface-2)", borderRadius: 4, marginBottom: 16 }} />
            <div style={{ height: 220, background: "var(--surface-2)", borderRadius: 6 }} />
          </div>
        ))}
      </div>
    );
  }

  const hasCategoryData = categoryData && categoryData.length > 0;
  const hasMonthlyData = monthlyData && monthlyData.some(m => m.total > 0);
  const categoryTotal = categoryData.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <div style={styles.chartsRow}>
      <div className="product-card" style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>Category Breakdown</h3>
          <span style={styles.chartMeta}>Rs {categoryTotal.toFixed(0)} tracked</span>
        </div>
        {hasCategoryData ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={66}
                outerRadius={92}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--surface)" strokeWidth={4} />
                ))}
              </Pie>
              <PieTooltip content={<PieTooltipContent />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart>No expenses this month yet</EmptyChart>
        )}
      </div>

      <div className="product-card" style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>Monthly Trend</h3>
          <span style={styles.chartMeta}>Last 6 months</span>
        </div>
        {hasMonthlyData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 8, right: 10, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `Rs ${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`}
              />
              <BarTooltip content={<BarTooltipContent />} cursor={{ fill: "var(--accent-soft)" }} />
              <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={46} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart>No spending data for the last 6 months</EmptyChart>
        )}
      </div>
    </div>
  );
};

const styles = {
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
    gap: "0.9rem",
    marginBottom: "1.25rem",
  },
  chartCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "1rem",
    minHeight: 360,
  },
  chartHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "0.55rem",
  },
  chartTitle: {
    fontSize: "0.96rem",
    fontWeight: 800,
    color: "var(--text)",
    margin: 0,
  },
  chartMeta: {
    color: "var(--muted)",
    fontSize: "0.74rem",
    fontWeight: 750,
  },
  tooltip: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "0.58rem 0.72rem",
    fontSize: "0.82rem",
    boxShadow: "var(--card-hover-shadow)",
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "0.45rem 0.7rem",
    marginTop: "0.5rem",
  },
  legendItem: { display: "flex", alignItems: "center", gap: "0.35rem" },
  legendDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  legendLabel: { fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600 },
  empty: {
    height: 260,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--muted)",
    fontSize: "0.84rem",
    fontWeight: 650,
  },
};

export default ExpenseChart;
