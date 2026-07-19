// Signals selectors. Every render path in /signals/wellbeing goes through
// these — k-anonymity, range windowing, and segment fan-out live here.
// UI code never touches raw mock arrays.
import { applyKAnonymity, K_MIN, type Result } from "./cohort-selectors";
import {
  getSignalsSnapshot,
  type SeriesBundle, type BandsBundle, type FunnelBundle,
  type CadenceBundle, type TodBundle, type CorrelationPoint, type SignalAlert,
  type Segment,
} from "./dashboard-mock.signals";
import type { ScaleId, BandKey } from "./clinical-scales";

export type RangeKey = "4w" | "12w" | "26w" | "52w" | "ay";

export const RANGE_WEEKS: Record<RangeKey, number> = {
  "4w": 4, "12w": 12, "26w": 26, "52w": 52, ay: 32,
};

export function rangeLabel(r: RangeKey): string {
  return r === "ay" ? "Academic year" : `${RANGE_WEEKS[r]} weeks`;
}

function tail<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

// ── Series ────────────────────────────────────────────────────
export function getSeries(scale: ScaleId, range: RangeKey, seg: Segment): Result<SeriesBundle> {
  const snap = getSignalsSnapshot();
  const wks = RANGE_WEEKS[range];
  const src = scale === "phq9" ? snap.phq9Series : snap.gad7Series;
  const weekLabels = tail(snap.weekLabels, wks);
  const active = tail(snap.activeByWeek, wks);
  const nActive = active.length > 0 ? Math.round(active.reduce((s, v) => s + v, 0) / active.length) : 0;

  let keys: string[];
  let seriesByKey: Record<string, number[]>;
  if (seg === "inst") {
    keys = ["Institution"];
    seriesByKey = { Institution: tail(src.inst, wks) };
  } else if (seg === "school") {
    keys = Object.keys(src.school);
    seriesByKey = Object.fromEntries(keys.map((k) => [k, tail(src.school[k], wks)]));
  } else {
    keys = Object.keys(src.year);
    seriesByKey = Object.fromEntries(keys.map((k) => [k, tail(src.year[k], wks)]));
  }

  const data = weekLabels.map((w, i) => {
    const row: { week: string } & Record<string, number | string> = { week: w };
    for (const k of keys) row[k] = seriesByKey[k][i];
    return row;
  });
  return applyKAnonymity(nActive, { data, keys, n: nActive });
}

// ── Severity bands ─────────────────────────────────────────────
export function getBands(scale: ScaleId, range: RangeKey, band: BandKey | "all"): Result<BandsBundle> {
  const snap = getSignalsSnapshot();
  const wks = RANGE_WEEKS[range];
  const src = scale === "phq9" ? snap.severityBandsPhq9 : snap.severityBandsGad7;
  const labels = tail(snap.weekLabels, wks);
  const nActive = tail(snap.activeByWeek, wks).reduce((s, v) => s + v, 0);

  const data = labels.map((w, i) => {
    const total = Math.max(
      1,
      src.minimal[snap.weeks - wks + i] +
        src.mild[snap.weeks - wks + i] +
        src.moderate[snap.weeks - wks + i] +
        src.modsevere[snap.weeks - wks + i] +
        src.severe[snap.weeks - wks + i],
    );
    const row = { week: w } as { week: string } & Record<BandKey, number>;
    (["minimal", "mild", "moderate", "modsevere", "severe"] as BandKey[]).forEach((k) => {
      const raw = src[k][snap.weeks - wks + i];
      // Suppress a single band cell whose weekly count is below k — cell → 0.
      const safe = raw < K_MIN ? 0 : raw;
      row[k] = Math.round((safe / total) * 1000) / 10; // % with one decimal
    });
    return row;
  });

  // Optional single-band filter — zero the other lanes.
  if (band !== "all") {
    for (const row of data) {
      (["minimal", "mild", "moderate", "modsevere", "severe"] as BandKey[]).forEach((k) => {
        if (k !== band) row[k] = 0;
      });
    }
  }
  return applyKAnonymity(nActive, { data, n: nActive });
}

// ── Distribution ridgeline (monthly rows) ──────────────────────
export type RidgeRow = {
  monthLabel: string;
  n: number;
  bins: { score: number; density: number }[];
  median: number;
};
export function getRidgeline(scale: ScaleId, range: RangeKey): Result<{ rows: RidgeRow[]; n: number }> {
  const snap = getSignalsSnapshot();
  const wks = RANGE_WEEKS[range];
  const activeTail = tail(snap.activeByWeek, wks);
  const nActive = activeTail.reduce((s, v) => s + v, 0);
  const src = scale === "phq9" ? snap.severityBandsPhq9 : snap.severityBandsGad7;
  const scaleMax = scale === "phq9" ? 27 : 21;

  // Bucket weeks into ~4-week months.
  const monthSize = 4;
  const months: RidgeRow[] = [];
  for (let start = 0; start < wks; start += monthSize) {
    const end = Math.min(wks, start + monthSize);
    const width = end - start;
    if (width <= 0) continue;
    // Sum band shares across the month.
    const shares: Record<BandKey, number> = { minimal: 0, mild: 0, moderate: 0, modsevere: 0, severe: 0 };
    let monthActive = 0;
    for (let i = start; i < end; i++) {
      const idx = snap.weeks - wks + i;
      const total =
        src.minimal[idx] + src.mild[idx] + src.moderate[idx] +
        src.modsevere[idx] + src.severe[idx];
      monthActive += total;
      shares.minimal   += src.minimal[idx];
      shares.mild      += src.mild[idx];
      shares.moderate  += src.moderate[idx];
      shares.modsevere += src.modsevere[idx];
      shares.severe    += src.severe[idx];
    }
    if (monthActive < K_MIN) continue;
    // Build a density: for each score, sum contribution from the band it lives in.
    const bins: { score: number; density: number }[] = [];
    for (let s = 0; s <= scaleMax; s++) {
      let d = 0;
      for (const b of (scale === "phq9"
        ? ["minimal", "mild", "moderate", "modsevere", "severe"] as BandKey[]
        : ["minimal", "mild", "moderate", "severe"] as BandKey[])) {
        const lo = bandBounds(scale, b)[0];
        const hi = bandBounds(scale, b)[1];
        if (s < lo || s > hi) continue;
        const width = hi - lo + 1;
        // Kernel smoothing across the band centre.
        const centre = (lo + hi) / 2;
        const w = Math.exp(-((s - centre) ** 2) / (width * 1.6));
        d += (shares[b] / Math.max(1, monthActive)) * (w / width);
      }
      bins.push({ score: s, density: Math.max(0, d) });
    }
    // Normalize and find median.
    const sum = bins.reduce((a, b) => a + b.density, 0) || 1;
    for (const b of bins) b.density = b.density / sum;
    let cum = 0;
    let median = 0;
    for (const b of bins) {
      cum += b.density;
      if (cum >= 0.5) { median = b.score; break; }
    }
    const monthIndex = months.length + 1;
    months.push({ monthLabel: `M${monthIndex}`, n: monthActive, bins, median });
  }
  return applyKAnonymity(nActive, { rows: months, n: nActive });
}

function bandBounds(scale: ScaleId, key: BandKey): [number, number] {
  if (scale === "phq9") {
    switch (key) {
      case "minimal":   return [0, 4];
      case "mild":      return [5, 9];
      case "moderate":  return [10, 14];
      case "modsevere": return [15, 19];
      case "severe":    return [20, 27];
    }
  }
  switch (key) {
    case "minimal":   return [0, 4];
    case "mild":      return [5, 9];
    case "moderate":  return [10, 14];
    case "modsevere": return [15, 15]; // unused
    case "severe":    return [15, 21];
  }
}

// ── Improvement funnel ─────────────────────────────────────────
export function getFunnel(range: RangeKey): Result<FunnelBundle> {
  const snap = getSignalsSnapshot();
  const wks = RANGE_WEEKS[range];
  const sum = (arr: number[]) => tail(arr, wks).reduce((s, v) => s + v, 0);
  const screened = sum(snap.screenedByWeek);
  const elevated = sum(snap.elevatedByWeek);
  const engaged = sum(snap.engagedByWeek);
  const reassessed = sum(snap.reassessedByWeek);
  const improved = sum(snap.improvedByWeek);
  const steps: FunnelBundle["steps"] = [
    { key: "screened",   label: "Screened",              n: screened,   note: "PHQ-9 or GAD-7 in the window" },
    { key: "elevated",   label: "Elevated (≥ 10)",       n: elevated,   note: "Moderate or higher on either scale" },
    { key: "engaged",    label: "Engaged with care",     n: engaged,    note: "At least one session started" },
    { key: "reassessed", label: "Reassessed",            n: reassessed, note: "Follow-up screening completed" },
    { key: "improved",   label: "Improved (≥ 5-point drop)", n: improved, note: "Reliable change vs baseline" },
  ];
  return applyKAnonymity(screened, { steps, n: screened });
}

// ── Session cadence ────────────────────────────────────────────
export function getCadence(range: RangeKey): Result<CadenceBundle> {
  const snap = getSignalsSnapshot();
  const wks = RANGE_WEEKS[range];
  const data = tail(snap.sessionCadence, wks);
  const totalStarts = data.reduce((s, d) => s + d.starts, 0);
  return applyKAnonymity(totalStarts, { data, n: totalStarts });
}

// ── Time-of-day heatmap ────────────────────────────────────────
export function getTod(): Result<TodBundle> {
  const snap = getSignalsSnapshot();
  const n = snap.todHeatmap.flat().reduce((s, v) => s + v, 0);
  return applyKAnonymity(n, { grid: snap.todHeatmap, n });
}

// ── Assessment completion ─────────────────────────────────────
export function getAssessmentCompletion(range: RangeKey): Result<{ completed: number; active: number; pct: number }> {
  const snap = getSignalsSnapshot();
  const wks = RANGE_WEEKS[range];
  const active = tail(snap.activeByWeek, wks).reduce((s, v) => s + v, 0);
  const completed = tail(snap.reassessedByWeek, wks).reduce((s, v) => s + v, 0) * 3; // approx unique
  const pct = active > 0 ? Math.round((completed / active) * 1000) / 10 : 0;
  return applyKAnonymity(active, { completed: Math.min(completed, active), active, pct });
}

// ── Correlations ──────────────────────────────────────────────
export function getCorrelations(): Result<{ points: CorrelationPoint[] }> {
  const snap = getSignalsSnapshot();
  const points = snap.deptCorrelationPoints;
  const nTotal = points.reduce((s, p) => s + p.n, 0);
  return applyKAnonymity(nTotal, { points });
}

/** Pearson correlation. Returns 0 for n<3 or zero variance. */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : Math.round((num / denom) * 100) / 100;
}

// ── Alerts feed ───────────────────────────────────────────────
export function getAlerts(): SignalAlert[] {
  return getSignalsSnapshot().signalAlerts;
}

// ── Headline stats ────────────────────────────────────────────
export type HeadlineStat = { value: number | null; delta: number | null; suppressed: boolean };
export function getHeadlineStats(range: RangeKey): {
  meanPhq9: HeadlineStat;
  meanGad7: HeadlineStat;
  moderatePlusPct: HeadlineStat;
  improvedPct: HeadlineStat;
  nActive: number;
} {
  const snap = getSignalsSnapshot();
  const wks = RANGE_WEEKS[range];
  const nActive = tail(snap.activeByWeek, wks).reduce((s, v) => s + v, 0);
  const suppressed = nActive < K_MIN;
  const mean = (arr: number[], w: number) => {
    const t = tail(arr, w);
    return Math.round((t.reduce((s, v) => s + v, 0) / t.length) * 10) / 10;
  };
  const phq9Now = mean(snap.phq9Series.inst, wks);
  const phq9Prev = mean(snap.phq9Series.inst.slice(0, Math.max(1, snap.weeks - wks)), Math.min(wks, snap.weeks - wks));
  const gad7Now = mean(snap.gad7Series.inst, wks);
  const gad7Prev = mean(snap.gad7Series.inst.slice(0, Math.max(1, snap.weeks - wks)), Math.min(wks, snap.weeks - wks));

  const bandsPhq9 = snap.severityBandsPhq9;
  const modPlusNow = tail(bandsPhq9.moderate, wks).reduce((s, v) => s + v, 0)
                   + tail(bandsPhq9.modsevere, wks).reduce((s, v) => s + v, 0)
                   + tail(bandsPhq9.severe, wks).reduce((s, v) => s + v, 0);
  const activeSum = tail(snap.activeByWeek, wks).reduce((s, v) => s + v, 0);
  const modPct = activeSum > 0 ? Math.round((modPlusNow / activeSum) * 1000) / 10 : 0;

  const reassessed = tail(snap.reassessedByWeek, wks).reduce((s, v) => s + v, 0);
  const improved = tail(snap.improvedByWeek, wks).reduce((s, v) => s + v, 0);
  const improvedPct = reassessed > 0 ? Math.round((improved / reassessed) * 1000) / 10 : 0;

  return {
    meanPhq9: { value: suppressed ? null : phq9Now, delta: suppressed ? null : Math.round((phq9Now - phq9Prev) * 10) / 10, suppressed },
    meanGad7: { value: suppressed ? null : gad7Now, delta: suppressed ? null : Math.round((gad7Now - gad7Prev) * 10) / 10, suppressed },
    moderatePlusPct: { value: suppressed ? null : modPct, delta: null, suppressed },
    improvedPct: { value: reassessed < K_MIN ? null : improvedPct, delta: null, suppressed: reassessed < K_MIN },
    nActive,
  };
}
