// src/components/ExpenseChart.jsx
// Feature 2: Charts Dashboard using Recharts

import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip
} from "recharts";

const COLORS = ["#7c8cff", "#94a3b8", "#31c48d", "#d89a2b", "#60a5fa", "#aeb8ff", "#cbd5e1", "#64748b", "#e05252"];

const PieTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <p style={{ color: payload[0].payload.fill, fontWeight: 600, marginBottom: 2 }}>{payload[0].name}</p>
      <p style={{ color: "var(--text)" }}>Rs {payload[0].value.toFixed(2)}</p>
    </div>
  );
};

const BarTooltipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <p style={{ color: "var(--muted)", marginBottom: 2, fontSize: "0.8rem" }}>{label}</p>
      <p style={{ color: "var(--accent)", fontWeight: 600 }}>Rs {payload[0]?.value?.toFixed(2)}</p>
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

const ExpenseChart = ({ categoryData = [], monthlyData = [], loading = false }) => {
  if (loading) {
    return (
      <div style={styles.chartsRow}>
        {[1, 2].map(i => (
          <div key={i} style={styles.chartCard}>
            <div style={{ height: 12, width: "38%", background: "var(--surface-2)", borderRadius: 4, marginBottom: 16 }} />
            <div style={{ height: 220, background: "var(--surface-2)", borderRadius: 6 }} />
          </div>
        ))}
      </div>
    );
  }

  const hasCategoryData = categoryData && categoryData.length > 0;
  const hasMonthlyData = monthlyData && monthlyData.some(m => m.total > 0);

  return (
    <div style={styles.chartsRow}>
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Category Breakdown</h3>
        {hasCategoryData ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--surface)" strokeWidth={2} />
                ))}
              </Pie>
              <PieTooltip content={<PieTooltipContent />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={styles.empty}>No expenses this month yet</div>
        )}
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Monthly Trend</h3>
        {hasMonthlyData ? (
          <ResponsiveContainer width="100%" height={260}>
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
              <BarTooltip content={<BarTooltipContent />} cursor={{ fill: "rgba(124,140,255,0.08)" }} />
              <Bar dataKey="total" fill="#7c8cff" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={styles.empty}>No spending data for the last 6 months</div>
        )}
      </div>
    </div>
  );
};

const styles = {
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  chartCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "1.25rem",
  },
  chartTitle: {
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "var(--text)",
    marginBottom: "1rem",
    marginTop: 0,
  },
  tooltip: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "0.85rem",
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "0.5rem 0.75rem",
    marginTop: "0.5rem",
  },
  legendItem: { display: "flex", alignItems: "center", gap: "0.35rem" },
  legendDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  legendLabel: { fontSize: "0.72rem", color: "var(--muted)" },
  empty: {
    height: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--muted)",
    fontSize: "0.88rem",
  },
};

export default ExpenseChart;
