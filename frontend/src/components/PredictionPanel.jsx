// src/components/PredictionPanel.jsx
// Feature 2: Shows spending prediction for next month using linear regression

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import API from "../api/axios";

const TREND_CONFIG = {
  increasing:        { color: "#ef4444", icon: "📈", label: "Trending Up" },
  decreasing:        { color: "#43e97b", icon: "📉", label: "Trending Down" },
  stable:            { color: "#6c63ff", icon: "➡️", label: "Stable" },
  insufficient_data: { color: "#8888aa", icon: "❓", label: "Need more data" },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: "#1a1d27", border: "1px solid #2a2d3e", borderRadius: 8, padding: "8px 12px" }}>
      <div style={{ color: "#8888aa", fontSize: "0.75rem", marginBottom: 2 }}>{label}</div>
      <div style={{ color: d.color, fontWeight: 700, fontFamily: "monospace" }}>
        ₹{Number(d.value).toFixed(0)}
      </div>
    </div>
  );
};

const PredictionPanel = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await API.get("/advanced/predict");
        setData(res);
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

  if (!data || !data.prediction || data.prediction.dataPoints < 2) {
    return (
      <div style={s.card}>
        <div style={s.title}>🔮 Spending Prediction</div>
        <p style={s.empty}>Add expenses over 2+ months to see predictions.</p>
      </div>
    );
  }

  const { prediction, history } = data;
  const trendCfg = TREND_CONFIG[prediction.trend] || TREND_CONFIG.stable;

  // Build chart data — history + predicted point
  const nextMonthLabel = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleString("default", { month: "short", year: "2-digit" });
  })();

  const chartData = [
    ...history.map(h => ({ month: h.month, actual: h.total, predicted: null })),
    { month: nextMonthLabel, actual: null, predicted: prediction.predicted }
  ];

  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.title}>🔮 Spending Prediction</span>
        <span style={{ ...s.trendBadge, color: trendCfg.color, borderColor: trendCfg.color + "40", background: trendCfg.color + "15" }}>
          {trendCfg.icon} {trendCfg.label}
        </span>
      </div>

      {/* Main prediction number */}
      <div style={s.predictionBox}>
        <div style={s.predLabel}>Next Month Forecast</div>
        <div style={s.predAmount}>₹{prediction.predicted.toLocaleString("en-IN")}</div>
        <div style={s.predRange}>
          Range: ₹{prediction.lower.toLocaleString()} – ₹{prediction.upper.toLocaleString()}
        </div>
        <div style={s.confidence}>
          <div style={{ ...s.confBar, width: `${prediction.confidence}%` }} />
          <span style={s.confLabel}>{prediction.confidence}% confidence</span>
        </div>
      </div>

      {/* Sparkline chart */}
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c63ff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6c63ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="predictGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fill: "#666688", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="actual"    stroke="#6c63ff" fill="url(#actualGrad)"  strokeWidth={2} dot={false} connectNulls={false} />
          <Area type="monotone" dataKey="predicted" stroke="#f59e0b" fill="url(#predictGrad)" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} strokeDasharray="5 3" connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>

      <div style={s.legend}>
        <span style={s.legendItem}><span style={{ ...s.dot, background: "#6c63ff" }} />Actual</span>
        <span style={s.legendItem}><span style={{ ...s.dot, background: "#f59e0b" }} />Forecast</span>
      </div>
    </div>
  );
};

const s = {
  card: { background: "#1a1d27", border: "1px solid #2a2d3e", borderRadius: "14px", padding: "1.25rem 1.5rem" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" },
  title: { fontSize: "0.92rem", fontWeight: 600, color: "#e8e8f0" },
  trendBadge: { fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", border: "1px solid" },
  predictionBox: { marginBottom: "1rem" },
  predLabel: { fontSize: "0.75rem", color: "#8888aa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" },
  predAmount: { fontSize: "2rem", fontWeight: 700, fontFamily: "monospace", color: "#e8e8f0", lineHeight: 1.2 },
  predRange: { fontSize: "0.78rem", color: "#666688", marginTop: "0.2rem", marginBottom: "0.5rem" },
  confidence: { display: "flex", alignItems: "center", gap: "0.5rem" },
  confBar: {
    height: 4, borderRadius: 2,
    background: "linear-gradient(90deg, #6c63ff, #f59e0b)",
    transition: "width 0.5s ease"
  },
  confLabel: { fontSize: "0.72rem", color: "#8888aa" },
  legend: { display: "flex", gap: "1rem", marginTop: "0.5rem" },
  legendItem: { display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#8888aa" },
  dot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block" },
  shimmer: { height: 220, borderRadius: 10, background: "rgba(255,255,255,0.04)" },
  empty: { fontSize: "0.85rem", color: "#666688", margin: 0 }
};

export default PredictionPanel;