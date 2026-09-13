// src/components/PredictionPanel.jsx
// Projects the current month's spend from the pace set so far. Not a
// regression -- see ARCHITECTURE.md for the actual arithmetic.

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import API from "../api/axios";
import { tint } from "../theme/palette";

const TREND_CONFIG = {
  increasing: { color: "var(--danger)", label: "Trending Up" },
  decreasing: { color: "var(--success)", label: "Trending Down" },
  stable: { color: "var(--accent)", label: "Stable" },
  insufficient_data: { color: "var(--muted)", label: "Need more data" },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px" }}>
      <div style={{ color: "var(--muted)", fontSize: "0.75rem", marginBottom: 2 }}>{label}</div>
      <div style={{ color: d.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        Rs {Number(d.value).toFixed(0)}
      </div>
    </div>
  );
};

const PredictionPanel = () => {
  const [data, setData] = useState(null);
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
        <div style={s.title}>Spending Forecast</div>
        <p style={s.empty}>Add a few more expenses and a forecast will appear here.</p>
      </div>
    );
  }

  const { prediction, history } = data;
  const trendCfg = TREND_CONFIG[prediction.trend] || TREND_CONFIG.stable;

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
        <span style={s.title}>Spending Forecast</span>
        <span style={{ ...s.trendBadge, color: trendCfg.color, borderColor: tint(trendCfg.color, 32), background: tint(trendCfg.color, 12) }}>
          {trendCfg.label}
        </span>
      </div>

      <div style={s.predictionBox}>
        <div style={s.predLabel}>Next Month Forecast</div>
        <div style={s.predAmount}>Rs {prediction.predicted.toLocaleString("en-IN")}</div>
        <div style={s.predRange}>
          Range: Rs {prediction.lower.toLocaleString()} - Rs {prediction.upper.toLocaleString()}
        </div>
        <div style={s.confidence}>
          <div style={s.confTrack}>
            <div style={{ ...s.confBar, width: `${prediction.confidence}%` }} />
          </div>
          <span style={s.confLabel}>{prediction.confidence}% confidence</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={96}>
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="predictGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--warning)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="actual" stroke="var(--accent)" fill="url(#actualGrad)" strokeWidth={2} dot={false} connectNulls={false} />
          <Area type="monotone" dataKey="predicted" stroke="var(--warning)" fill="url(#predictGrad)" strokeWidth={2} dot={{ fill: "var(--warning)", r: 3 }} strokeDasharray="4 3" connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>

      <div style={s.legend}>
        <span style={s.legendItem}><span style={{ ...s.dot, background: "var(--accent)" }} />Actual</span>
        <span style={s.legendItem}><span style={{ ...s.dot, background: "var(--warning)" }} />Forecast</span>
      </div>
    </div>
  );
};

const s = {
  card: { background: "color-mix(in srgb, var(--surface) 96%, transparent)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.78rem" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.62rem", gap: "0.75rem" },
  title: { fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" },
  trendBadge: { fontSize: "0.66rem", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", border: "1px solid" },
  predictionBox: { marginBottom: "0.62rem", display: "grid", gridTemplateColumns: "minmax(160px, auto) 1fr", gap: "0.8rem", alignItems: "end" },
  predLabel: { fontSize: "var(--text-label)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "var(--ls-label)", marginBottom: "0.18rem", fontWeight: 600 },
  predAmount: { fontSize: "var(--text-stat)", fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", color: "var(--text)", lineHeight: 1.2 },
  predRange: { fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.12rem", marginBottom: 0 },
  confidence: { display: "flex", alignItems: "center", gap: "0.55rem" },
  confTrack: { flex: 1, height: 4, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" },
  confBar: {
    height: "100%", borderRadius: 999,
    background: "var(--accent)",
    transition: "width 0.5s ease"
  },
  confLabel: { fontSize: "0.7rem", color: "var(--muted)", whiteSpace: "nowrap" },
  legend: { display: "flex", gap: "1rem", marginTop: "0.35rem" },
  legendItem: { display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: "var(--muted)" },
  dot: { width: 7, height: 7, borderRadius: "50%", display: "inline-block" },
  shimmer: { height: 190, borderRadius: 6, background: "var(--surface-2)" },
  empty: { fontSize: "0.85rem", color: "var(--muted)", margin: "0.5rem 0 0" }
};

export default PredictionPanel;
