// Single source of truth for category and chart colours.
//
// Every value here is a CSS custom property defined in
// styles/design-system.css, so consumers re-colour automatically when
// data-theme flips -- no JS re-render or theme lookup required.

// Category -> palette slot. Mirrors the enum in backend/models/Expense.js.
// Each category keeps a stable slot so a colour means the same thing in
// the pie chart, the transaction badges and anywhere added later.
export const CATEGORY_COLORS = {
  Food: "var(--chart-3)",
  Transport: "var(--chart-8)",
  Shopping: "var(--chart-6)",
  Entertainment: "var(--chart-4)",
  Bills: "var(--chart-9)",
  Work: "var(--chart-12)",
  Health: "var(--chart-5)",
  Education: "var(--chart-7)",
  Travel: "var(--chart-1)",
  Utilities: "var(--chart-2)",
  "Personal Care": "var(--chart-11)",
  Miscellaneous: "var(--chart-10)",
};

export const FALLBACK_COLOR = "var(--chart-10)";

export const categoryColor = (category) =>
  CATEGORY_COLORS[category] || FALLBACK_COLOR;

// Ordered series palette for charts that colour by index rather than by
// category name (e.g. an arbitrary set of slices).
export const CHART_SERIES = Array.from(
  { length: 12 },
  (_, i) => `var(--chart-${i + 1})`
);

export const seriesColor = (index) =>
  CHART_SERIES[index % CHART_SERIES.length];

// Translucent tint of any colour.
//
// Use this instead of string-concatenating a hex alpha suffix. The old
// `${color}40` idiom silently produced invalid CSS such as
// "var(--danger)40" whenever `color` was a custom property, so the
// declaration was dropped and the tint never rendered. color-mix()
// works for both hex literals and var() references.
export const tint = (color, percent) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;
