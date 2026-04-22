// src/components/ExpenseChart.jsx
// Feature 2: Charts Dashboard using Recharts
// Shows Pie chart (category breakdown) + Bar chart (monthly spending)

import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip
} from "recharts";

const COLORS = ["#6c63ff","#ff6584","#43e97b","#f7971e","#38bdf8","#a78bfa","#fb7185","#34d399","#fbbf24"];

// Custom tooltip for pie chart
const PieTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <p style={{ color: payload[0].payload.fill, fontWeight: 600, marginBottom: 2 }}>{payload[0].name}</p>
      <p style={{ color: "#e8e8f0" }}>₹{payload[0].value.toFixed(2)}</p>
    </div>
  );
};

// Custom tooltip for bar chart
const BarTooltipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <p style={{ color: "#8888aa", marginBottom: 2, fontSize: "0.8rem" }}>{label}</p>
      <p style={{ color: "#6c63ff", fontWeight: 600 }}>₹{payload[0]?.value?.toFixed(2)}</p>
    </div>
  );
};

// Custom legend renderer
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
            <div style={{ height: 14, width: "40%", background: "rgba(255,255,255,0.06)", borderRadius: 6, marginBottom: 16 }} />
            <div style={{ height: 220, background: "rgba(255,255,255,0.03)", borderRadius: 10 }} />
          </div>
        ))}
      </div>
    );
  }

  const hasCategoryData = categoryData && categoryData.length > 0;
  const hasMonthlyData  = monthlyData && monthlyData.some(m => m.total > 0);

  return (
    <div style={styles.chartsRow}>

      {/* ── PIE CHART: Category Breakdown ── */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>🍕 Category Breakdown</h3>
        {hasCategoryData ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
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

      {/* ── BAR CHART: Monthly Spending Trend ── */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>📈 Monthly Trend</h3>
        {hasMonthlyData ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#8888aa", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#8888aa", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(1)+"k" : v}`}
              />
              <BarTooltip content={<BarTooltipContent />} cursor={{ fill: "rgba(108,99,255,0.08)" }} />
              <Bar dataKey="total" fill="#6c63ff" radius={[6, 6, 0, 0]} maxBarSize={48} />
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
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "2rem",
  },
  chartCard: {
    background: "#1a1d27",
    border: "1px solid #2a2d3e",
    borderRadius: "14px",
    padding: "1.5rem",
  },
  chartTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#8888aa",
    marginBottom: "1rem",
    marginTop: 0,
  },
  tooltip: {
    background: "#1a1d27",
    border: "1px solid #2a2d3e",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "0.85rem",
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  legendItem: { display: "flex", alignItems: "center", gap: "0.3rem" },
  legendDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  legendLabel: { fontSize: "0.75rem", color: "#8888aa" },
  empty: {
    height: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#555577",
    fontSize: "0.9rem",
  },
};

export default ExpenseChart;