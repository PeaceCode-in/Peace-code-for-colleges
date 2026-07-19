// Mulberry32 — tiny, fast, deterministic PRNG. Same seed → identical stream.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rInt(rand: () => number, lo: number, hi: number): number {
  return Math.floor(rand() * (hi - lo + 1)) + lo;
}

export function rFloat(rand: () => number, lo: number, hi: number, dp = 1): number {
  const v = rand() * (hi - lo) + lo;
  const m = 10 ** dp;
  return Math.round(v * m) / m;
}

export function rPick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

export const SEED_TODAY = "2026-07-19"; // anchor so charts don't drift.
export const SEED_ROOT = 0x50656163; // "Peac"
