/**
 * Runtime flag: was the last dataClient call served by seed data?
 * Read by the "Seed mode" pill in the topbar.
 */
let active = false;
const listeners = new Set<() => void>();

export function markSeedUsed(on: boolean) {
  if (active === on) return;
  active = on;
  for (const l of listeners) l();
}

export function isSeedActive(): boolean {
  return active || isSeedForced();
}

export function isSeedForced(): boolean {
  return import.meta.env.VITE_FORCE_SEED === "true";
}

export function subscribeSeedState(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
