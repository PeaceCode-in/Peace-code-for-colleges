import { mulberry32, SEED_ROOT } from "./rng";

const K = 10;

/** Tier populations. Every count >= k. */
export function seedTiers(): Array<{ tier: "Elevated" | "High" | "Item9" | "Overdue"; n: number }> {
  const rand = mulberry32(SEED_ROOT ^ 0x71);
  const raw: Array<{ tier: "Elevated" | "High" | "Item9" | "Overdue"; n: number }> = [
    { tier: "Elevated", n: 68 + Math.floor(rand() * 20) },
    { tier: "High",     n: 28 + Math.floor(rand() * 10) },
    { tier: "Item9",    n: 14 + Math.floor(rand() * 6) },
    { tier: "Overdue",  n: 22 + Math.floor(rand() * 8) },
  ];
  return raw.map((r) => (r.n < K ? { ...r, n: K } : r));
}

/** Care routing funnel: detected → outreach → contact → intake → completed. */
export function seedFunnel(): Array<{ step: string; n: number }> {
  const t = seedTiers().reduce((a, b) => a + b.n, 0);
  const decay = [1, 0.82, 0.68, 0.51, 0.38];
  const steps = ["Detected", "Outreach", "Contact", "Intake", "Completed"];
  return steps.map((step, i) => ({ step, n: Math.max(K, Math.floor(t * decay[i]!)) }));
}

/** Time-to-contact histogram — hours to first contact for each detected case. */
export function seedTimeToContactHours(): number[] {
  const rand = mulberry32(SEED_ROOT ^ 0x72);
  const out: number[] = [];
  const total = seedTiers().reduce((a, b) => a + b.n, 0);
  for (let i = 0; i < total; i++) {
    // Log-normal-ish distribution centred around 6-12h with a long tail.
    const u = rand();
    const hours = Math.round(Math.exp(1.8 + u * 1.6) * 10) / 10;
    out.push(hours);
  }
  return out;
}

/** Channel breakdown, sums to ~100. */
export function seedChannels(): Array<{ channel: string; pct: number }> {
  return [
    { channel: "In-app nudge", pct: 42 },
    { channel: "Email",        pct: 28 },
    { channel: "SMS",          pct: 18 },
    { channel: "Peer bridge",  pct: 12 },
  ];
}
