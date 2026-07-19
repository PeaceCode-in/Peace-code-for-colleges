// 5-D cohort cube: Year × Gender × Residency × First-gen × Aid.
// Precomputed with k=10 enforcement — sub-threshold cells are marked hidden.
import { mulberry32, SEED_ROOT } from "./rng";

export const DIMS = {
  year:      ["Y1", "Y2", "Y3", "Y4"] as const,
  gender:    ["Woman", "Man", "Non-binary"] as const,
  residency: ["On-campus", "Off-campus", "Commuter"] as const,
  firstGen:  ["Yes", "No"] as const,
  aid:       ["Full", "Partial", "None"] as const,
};

export type CubeCell =
  | { hidden: true; key: string }
  | {
      hidden: false;
      key: string;
      n: number;
      wellbeingIndex: number;
      engagementRate: number;
      highRiskPct: number;
    };

const K = 10;

export function buildCube(): CubeCell[] {
  const rand = mulberry32(SEED_ROOT ^ 0xC1);
  const cells: CubeCell[] = [];
  for (const y of DIMS.year)
    for (const g of DIMS.gender)
      for (const r of DIMS.residency)
        for (const fg of DIMS.firstGen)
          for (const a of DIMS.aid) {
            const key = `${y}|${g}|${r}|${fg}|${a}`;
            // Non-binary and first-gen slices are naturally smaller — sometimes suppressed.
            const base = 30 + rand() * 40;
            const shrink = (g === "Non-binary" ? 0.25 : 1) * (fg === "Yes" ? 0.55 : 1);
            const n = Math.round(base * shrink);
            if (n < K) {
              cells.push({ hidden: true, key });
              continue;
            }
            cells.push({
              hidden: false,
              key,
              n,
              wellbeingIndex: Math.round((60 + rand() * 20) * 10) / 10,
              engagementRate: Math.round((0.35 + rand() * 0.4) * 100) / 100,
              highRiskPct:    Math.round((0.04 + rand() * 0.08) * 100) / 100,
            });
          }
  return cells;
}

export function summariseCube(cells: CubeCell[] = buildCube()) {
  const visible = cells.filter((c): c is Extract<CubeCell, { hidden: false }> => !c.hidden);
  const n = visible.reduce((a, b) => a + b.n, 0);
  if (n < K) return { n: 0, wellbeingIndex: 0, engagementRate: 0, highRiskPct: 0, distribution: [] };
  const wSum = visible.reduce((a, b) => a + b.wellbeingIndex * b.n, 0);
  const eSum = visible.reduce((a, b) => a + b.engagementRate * b.n, 0);
  const rSum = visible.reduce((a, b) => a + b.highRiskPct * b.n, 0);
  return {
    n,
    wellbeingIndex: Math.round((wSum / n) * 10) / 10,
    engagementRate: Math.round((eSum / n) * 100) / 100,
    highRiskPct:    Math.round((rSum / n) * 100) / 100,
    distribution: [
      { bucket: "Low",      value: Math.round(visible.filter((c) => c.wellbeingIndex < 60).reduce((a, b) => a + b.n, 0) / n * 100) / 100 },
      { bucket: "Moderate", value: Math.round(visible.filter((c) => c.wellbeingIndex >= 60 && c.wellbeingIndex < 75).reduce((a, b) => a + b.n, 0) / n * 100) / 100 },
      { bucket: "High",     value: Math.round(visible.filter((c) => c.wellbeingIndex >= 75).reduce((a, b) => a + b.n, 0) / n * 100) / 100 },
    ],
  };
}
