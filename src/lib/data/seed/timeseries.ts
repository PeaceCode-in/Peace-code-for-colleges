import { mulberry32, rFloat, SEED_ROOT, SEED_TODAY } from "./rng";

const WEEKS = 26;
const EXAM_WEEKS = new Set([8, 14, 22]); // seasonal dips
const TODAY = new Date(SEED_TODAY + "T00:00:00Z");

function weekIso(offsetFromLatest: number): string {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - offsetFromLatest * 7);
  return d.toISOString().slice(0, 10);
}

/** Wellbeing pulse trend, 26 weeks oldest → newest. */
export function seedPulseTrend(): Array<{ date: string; value: number }> {
  const rand = mulberry32(SEED_ROOT ^ 0x11);
  const out: Array<{ date: string; value: number }> = [];
  for (let w = 0; w < WEEKS; w++) {
    // gentle upward trend from ~62 → ~74; dip at exam weeks; small noise.
    const idxFromStart = w;
    const base = 62 + (idxFromStart / (WEEKS - 1)) * 12;
    const examDip = EXAM_WEEKS.has(idxFromStart) ? -6 : 0;
    const noise = (rand() - 0.5) * 3;
    const value = Math.max(0, Math.min(100, base + examDip + noise));
    out.push({ date: weekIso(WEEKS - 1 - w), value: Math.round(value * 10) / 10 });
  }
  return out;
}

/** Session cadence — weekly sessions completed, oldest → newest. */
export function seedSessionCadence(): Array<{ date: string; value: number }> {
  const rand = mulberry32(SEED_ROOT ^ 0x22);
  const out: Array<{ date: string; value: number }> = [];
  for (let w = 0; w < WEEKS; w++) {
    const base = 240 + w * 4;
    const examBump = EXAM_WEEKS.has(w) ? 60 : 0;
    const noise = Math.floor((rand() - 0.5) * 30);
    out.push({ date: weekIso(WEEKS - 1 - w), value: Math.max(50, base + examBump + noise) });
  }
  return out;
}

/** PHQ-9 severity bands, current snapshot. All bands >= k=10 by construction. */
export function seedPhq9(): {
  minimal: number; mild: number; moderate: number; moderatelySevere: number; severe: number;
} {
  const rand = mulberry32(SEED_ROOT ^ 0x33);
  return {
    minimal:           540 + Math.floor(rand() * 40),
    mild:              280 + Math.floor(rand() * 30),
    moderate:          140 + Math.floor(rand() * 20),
    moderatelySevere:   62 + Math.floor(rand() * 12),
    severe:             24 + Math.floor(rand() * 8),
  };
}

/** GAD-7 severity bands. */
export function seedGad7(): {
  minimal: number; mild: number; moderate: number; severe: number;
} {
  const rand = mulberry32(SEED_ROOT ^ 0x44);
  return {
    minimal:  510 + Math.floor(rand() * 40),
    mild:     300 + Math.floor(rand() * 30),
    moderate: 180 + Math.floor(rand() * 20),
    severe:    56 + Math.floor(rand() * 10),
  };
}

export function seedAvgMood(): number {
  return rFloat(mulberry32(SEED_ROOT ^ 0x55), 3.4, 3.9, 2);
}

export function todayISO(): string {
  return new Date(SEED_TODAY + "T14:00:00Z").toISOString();
}
