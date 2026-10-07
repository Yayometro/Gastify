// "value as a percentage of total", rounded to one decimal, for chart tooltips.
// A zero, missing or non-numeric total gives "0.0" instead of "NaN"/"Infinity"
// (bugs 22, 25, 146, 147), and the figure is ROUNDED instead of cut with
// String(...).slice(0, 4) (bug 140: 12.96 used to show as "12.9").
export function percentOf(value: number | null | undefined, total: number | null | undefined): string {
  const v = Number(value);
  const t = Number(total);
  if (!Number.isFinite(v) || !Number.isFinite(t) || t === 0) return "0.0";
  return ((v / t) * 100).toFixed(1);
}
