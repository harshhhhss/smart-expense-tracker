// src/components/KpiTile.jsx
// One tile shape for every headline figure in the app. Enterprise
// dashboards favour a uniform grid over asymmetric emphasis: the reader
// scans a row of equals instead of being steered toward a single number.
//
// Every tile is identical in size, padding and type. Only the icon, the
// chip tone and the optional trend/sub line vary.

import { TrendingDown, TrendingUp } from "lucide-react";

const TONE_CHIP = {
  accent: { color: "var(--accent)", background: "var(--accent-soft)" },
  warning: { color: "var(--warning)", background: "var(--warning-soft)" },
  success: { color: "var(--success)", background: "var(--success-soft)" },
  danger: { color: "var(--danger)", background: "var(--danger-soft)" },
  neutral: { color: "var(--muted-strong)", background: "var(--surface-3)" },
};

export const KpiTile = ({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
  trend,
  trendInverted = false,
  loading,
}) => {
  const chip = TONE_CHIP[tone] || TONE_CHIP.neutral;
  const hasTrend =
    trend !== null && trend !== undefined && Number.isFinite(Number(trend));
  const up = Number(trend) > 0;
  const TrendIcon = up ? TrendingUp : TrendingDown;
  // Spending up is bad; for metrics where up is good, pass trendInverted.
  const goodDirection = trendInverted ? up : !up;

  return (
    <div style={s.tile}>
      <div style={s.top}>
        <span style={{ ...s.chip, ...chip }}>
          {Icon && <Icon size={13} strokeWidth={2} aria-hidden="true" />}
        </span>
        <span style={s.label}>{label}</span>
      </div>
      {loading ? (
        <div style={s.skeleton} />
      ) : (
        <div style={s.value} title={typeof value === "string" ? value : undefined}>
          {value}
        </div>
      )}
      <div style={s.foot}>
        {hasTrend && (
          <span
            style={{
              ...s.trend,
              color: goodDirection ? "var(--success)" : "var(--danger)",
            }}
          >
            <TrendIcon size={12} strokeWidth={2.2} aria-hidden="true" />
            {up ? "+" : ""}
            {trend}%
          </span>
        )}
        {sub && <span style={s.sub}>{sub}</span>}
      </div>
    </div>
  );
};

const s = {
  tile: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "var(--space-3) var(--space-4)",
    minWidth: 0,
  },
  top: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    marginBottom: "var(--space-2)",
  },
  chip: {
    display: "grid",
    placeItems: "center",
    width: 22,
    height: 22,
    borderRadius: "var(--radius-sm)",
    flexShrink: 0,
  },
  label: {
    fontSize: "var(--text-label)",
    fontWeight: 600,
    letterSpacing: "var(--ls-label)",
    textTransform: "uppercase",
    color: "var(--muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  value: {
    fontSize: "1.375rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "var(--text)",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.15,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  skeleton: {
    height: "1.375rem",
    width: "76%",
    background: "var(--surface-2)",
    borderRadius: 3,
  },
  foot: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    marginTop: "var(--space-1)",
    minHeight: 16,
  },
  trend: {
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    fontSize: "var(--text-label)",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
  sub: {
    fontSize: "var(--text-label)",
    color: "var(--muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};

// Shared grid wrapper so every page's tile row has identical rhythm.
export const KpiGrid = ({ children }) => (
  <div style={gridStyle}>{children}</div>
);

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 176px), 1fr))",
  gap: "var(--space-3)",
  marginBottom: "var(--space-5)",
};

export default KpiTile;
