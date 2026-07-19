// Chart accessibility helpers — build plain-English summaries from the same
// numbers a chart renders, then attach as role="img" + aria-label.

export type Point = { label: string; value: number };

function fmt(n: number, unit?: string) {
  const rounded = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return unit ? `${rounded}${unit}` : `${rounded}`;
}

export function describeSeries(name: string, points: Point[], unit = ""): string {
  if (!points || points.length === 0) return `${name}: no data available.`;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const first = points[0];
  const last = points[points.length - 1];
  const delta = last.value - first.value;
  const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return [
    `${name}, ${points.length} points from ${first.label} to ${last.label}.`,
    `Average ${fmt(avg, unit)}, range ${fmt(min, unit)} to ${fmt(max, unit)}.`,
    `Trend ${dir}${dir !== "flat" ? ` by ${fmt(Math.abs(delta), unit)}` : ""}.`,
  ].join(" ");
}

export function describeCategories(
  name: string,
  points: Point[],
  unit = ""
): string {
  if (!points || points.length === 0) return `${name}: no data.`;
  const sorted = [...points].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 3).map((p) => `${p.label} ${fmt(p.value, unit)}`);
  return `${name}: ${points.length} categories. Highest — ${top.join(", ")}.`;
}

export function chartA11yProps(label: string) {
  return { role: "img" as const, "aria-label": label };
}
