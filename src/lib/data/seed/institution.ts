import { mulberry32, rInt, SEED_ROOT } from "./rng";

export const SEED_INSTITUTION = {
  id: "iitb-seed",
  name: "Indian Institute of Technology Bombay",
  shortName: "IIT Bombay",
  studentPopulation: 1200,
};

export const SEED_DEPARTMENTS = [
  { id: "cs",   name: "Computer Science",     school: "Engineering" },
  { id: "bus",  name: "Business",             school: "Management" },
  { id: "arts", name: "Arts",                 school: "Humanities" },
  { id: "eng",  name: "Engineering",          school: "Engineering" },
  { id: "hs",   name: "Health Sciences",      school: "Sciences" },
  { id: "hum",  name: "Humanities",           school: "Humanities" },
  { id: "law",  name: "Law",                  school: "Law" },
  { id: "sci",  name: "Sciences",             school: "Sciences" },
] as const;

export const SEED_YEARS = ["Y1", "Y2", "Y3", "Y4"] as const;

/** dept × year → cohort size, all >= k=10. Deterministic from SEED_ROOT. */
export function cohortMatrix(): Record<string, Record<string, number>> {
  const rand = mulberry32(SEED_ROOT ^ 0xC0);
  const total = SEED_INSTITUTION.studentPopulation;
  const weights = SEED_DEPARTMENTS.map(() => 1 + rand() * 0.6);
  const wSum = weights.reduce((a, b) => a + b, 0);
  const out: Record<string, Record<string, number>> = {};
  for (let i = 0; i < SEED_DEPARTMENTS.length; i++) {
    const dept = SEED_DEPARTMENTS[i]!;
    const deptTotal = Math.floor((weights[i]! / wSum) * total);
    const yrWeights = SEED_YEARS.map(() => 0.9 + rand() * 0.3);
    const yrSum = yrWeights.reduce((a, b) => a + b, 0);
    out[dept.id] = {};
    for (let j = 0; j < SEED_YEARS.length; j++) {
      const yr = SEED_YEARS[j]!;
      const n = Math.max(12, Math.floor((yrWeights[j]! / yrSum) * deptTotal));
      out[dept.id]![yr] = n;
    }
  }
  return out;
}

export function deptTotal(deptId: string): number {
  const m = cohortMatrix()[deptId];
  if (!m) return 0;
  return Object.values(m).reduce((a, b) => a + b, 0);
}

// Sanity: ensure every cohort cell >= 10 at build.
if (import.meta.env.DEV) {
  const m = cohortMatrix();
  for (const [dept, yrs] of Object.entries(m)) {
    for (const [yr, n] of Object.entries(yrs)) {
      if (n < 10) throw new Error(`[seed] dept×year ${dept}/${yr} n=${n} violates k>=10`);
    }
  }
  void rInt;
}
