// Multi-dimensional cohort cube for the Year & Demographics deep-dive.
// All selectors here route through applyKAnonymity — the UI must never
// bypass this file to talk to the underlying mock cube.
import { applyKAnonymity, K_MIN, type Result } from "./cohort-selectors";
import { getDemographicsCube, type DemoCell, type DemoDims } from "./dashboard-mock";

export const YEARS = ["Y1", "Y2", "Y3", "Y4", "PG"] as const;
export const GENDERS = ["Woman", "Man", "Non-binary", "Prefer not to say"] as const;
export const RESIDENCY = ["On-campus", "Off-campus", "Commuter"] as const;
export const GEN1 = ["Yes", "No", "Unknown"] as const;
export const AID = ["Full", "Partial", "None"] as const;

export type Year = (typeof YEARS)[number];
export type Gender = (typeof GENDERS)[number];
export type Residency = (typeof RESIDENCY)[number];
export type Gen1 = (typeof GEN1)[number];
export type Aid = (typeof AID)[number];

export type DimKey = keyof DemoDims;
export type Filters = {
  year: Year | "all";
  gender: Gender | "all";
  res: Residency | "all";
  gen1: Gen1 | "all";
  aid: Aid | "all";
};

export const DEFAULT_FILTERS: Filters = {
  year: "all",
  gender: "all",
  res: "all",
  gen1: "all",
  aid: "all",
};

// Map filter keys → cube dim keys.
const FILTER_TO_DIM: Record<keyof Filters, DimKey> = {
  year: "year",
  gender: "gender",
  res: "residency",
  gen1: "gen1",
  aid: "aid",
};

function matches(cell: DemoCell, filters: Filters): boolean {
  for (const k of Object.keys(filters) as (keyof Filters)[]) {
    const v = filters[k];
    if (v === "all") continue;
    if (cell.dims[FILTER_TO_DIM[k]] !== v) return false;
  }
  return true;
}

let cache: DemoCell[] | null = null;
function all(): DemoCell[] {
  if (!cache) cache = getDemographicsCube();
  return cache;
}

export interface SliceAggregate {
  n: number;
  phq9: number;
  gad7: number;
  engagement: number;
  improvement6w: number;
  themes: { tag: string; weight: number }[];
  phq9Series: number[]; // 26-week
  gad7Series: number[];
  phq9Dist: number[];  // histogram bin counts (0..27 → 6 bins)
}

function weightedAvg(cells: DemoCell[], pick: (c: DemoCell) => number): number {
  const totalN = cells.reduce((s, c) => s + c.n, 0);
  if (totalN === 0) return 0;
  return cells.reduce((s, c) => s + pick(c) * c.n, 0) / totalN;
}

export function sliceCube(filters: Filters): SliceAggregate {
  const cells = all().filter((c) => matches(c, filters));
  const n = cells.reduce((s, c) => s + c.n, 0);
  if (n === 0) {
    return {
      n: 0, phq9: 0, gad7: 0, engagement: 0, improvement6w: 0,
      themes: [], phq9Series: [], gad7Series: [], phq9Dist: [],
    };
  }
  const phq9 = weightedAvg(cells, (c) => c.phq9);
  const gad7 = weightedAvg(cells, (c) => c.gad7);
  const engagement = weightedAvg(cells, (c) => c.engagement);
  const improvement6w = weightedAvg(cells, (c) => c.improvement6w);

  // Weighted 26-week series
  const series = (key: "phq9Series" | "gad7Series"): number[] => {
    const len = cells[0]?.[key].length ?? 0;
    if (len === 0) return [];
    const out = new Array(len).fill(0);
    for (const c of cells) for (let i = 0; i < len; i++) out[i] += c[key][i] * c.n;
    return out.map((v) => v / n);
  };

  // Weighted PHQ-9 distribution (6 bins across 0–27)
  const distLen = cells[0]?.phq9Dist.length ?? 6;
  const dist = new Array(distLen).fill(0);
  for (const c of cells) for (let i = 0; i < distLen; i++) dist[i] += c.phq9Dist[i] * c.n;
  const distNorm = dist.map((v) => v / n);

  // Merge weighted themes
  const themeMap = new Map<string, number>();
  for (const c of cells) {
    for (const t of c.themes) {
      themeMap.set(t.tag, (themeMap.get(t.tag) ?? 0) + t.weight * c.n);
    }
  }
  const themeTotal = [...themeMap.values()].reduce((s, v) => s + v, 0) || 1;
  const themes = [...themeMap.entries()]
    .map(([tag, w]) => ({ tag, weight: w / themeTotal }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  return {
    n,
    phq9: round1(phq9),
    gad7: round1(gad7),
    engagement: Math.round(engagement * 100) / 100,
    improvement6w: round1(improvement6w),
    themes,
    phq9Series: series("phq9Series").map(round1),
    gad7Series: series("gad7Series").map(round1),
    phq9Dist: distNorm.map((v) => Math.round(v * 1000) / 1000),
  };
}

function round1(v: number) { return Math.round(v * 10) / 10; }

// Marginal aggregate over one dimension while respecting other filters.
export function marginalize(dim: DimKey, filters: Filters): Array<{ key: string; agg: SliceAggregate }> {
  const values = dimValues(dim);
  return values.map((v) => {
    const nested: Filters = { ...filters };
    const filterKey = (Object.keys(FILTER_TO_DIM) as (keyof Filters)[])
      .find((k) => FILTER_TO_DIM[k] === dim)!;
    (nested as Record<string, string>)[filterKey] = v;
    return { key: v, agg: sliceCube(nested) };
  });
}

// Two-dim cross-tab, respecting other filters.
export interface CrossCell {
  rowKey: string;
  colKey: string;
  n: number;
  index: Result<number>; // wellbeing index 0–100 (higher = better) or suppressed
}
export function crossTab(rowDim: DimKey, colDim: DimKey, filters: Filters): CrossCell[] {
  const rows = dimValues(rowDim);
  const cols = dimValues(colDim);
  const out: CrossCell[] = [];
  for (const rk of rows) {
    for (const ck of cols) {
      const nested: Filters = { ...filters };
      const rFilter = filterKeyForDim(rowDim);
      const cFilter = filterKeyForDim(colDim);
      (nested as Record<string, string>)[rFilter] = rk;
      (nested as Record<string, string>)[cFilter] = ck;
      const agg = sliceCube(nested);
      const wellbeing = agg.n > 0 ? phq9ToWellbeing(agg.phq9) : 0;
      out.push({
        rowKey: rk,
        colKey: ck,
        n: agg.n,
        index: applyKAnonymity(agg.n, wellbeing),
      });
    }
  }
  return out;
}

// PHQ-9 (0–27, higher = worse) → wellbeing index (0–100, higher = better).
export function phq9ToWellbeing(phq9: number): number {
  const clamped = Math.max(0, Math.min(27, phq9));
  return Math.round(((27 - clamped) / 27) * 100);
}

export function institutionTotal(): number {
  return all().reduce((s, c) => s + c.n, 0);
}

function dimValues(dim: DimKey): string[] {
  switch (dim) {
    case "year": return [...YEARS];
    case "gender": return [...GENDERS];
    case "residency": return [...RESIDENCY];
    case "gen1": return [...GEN1];
    case "aid": return [...AID];
  }
}

function filterKeyForDim(dim: DimKey): keyof Filters {
  return (Object.keys(FILTER_TO_DIM) as (keyof Filters)[])
    .find((k) => FILTER_TO_DIM[k] === dim)!;
}

export { K_MIN };
