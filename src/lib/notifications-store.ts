// Notifications store — aggregate-only institutional alerts.
// Never references individual students. Backed by localStorage; subscribers
// re-render via useSyncExternalStore.
import { useSyncExternalStore } from "react";
import { mulberry32, SEED_ROOT, SEED_TODAY } from "@/lib/data/seed/rng";

export type NotifKind = "risk" | "referral" | "screening" | "report" | "system";

export type Notification = {
  id: string;
  kind: NotifKind;
  title: string;
  sub: string;
  createdAtISO: string;
  deepLink: string;
  read: boolean;
};

const KEY = "pcc.notifications.v1";
const listeners = new Set<() => void>();
let cache: Notification[] = [];
let loaded = false;

function persist() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* quota */ }
}

function emit() { for (const l of listeners) l(); }

function load(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Notification[];
  } catch { /* corrupt */ }
  return seed();
}

function seed(): Notification[] {
  const t = new Date(SEED_TODAY + "T09:00:00Z").getTime();
  const H = 60 * 60 * 1000;
  const items: Array<Omit<Notification, "id" | "createdAtISO" | "read">> = [
    { kind: "risk",      title: "Elevated PHQ-9 rate in Engineering",           sub: "Aggregate high band up 14% week-over-week.",           deepLink: "/signals/wellbeing" },
    { kind: "referral",  title: "3 overdue referrals across care queues",       sub: "Median time-to-contact drifted past 48h target.",      deepLink: "/care/referrals" },
    { kind: "screening", title: "Screening completion at 82%",                  sub: "Term-to-date rate above institutional baseline.",      deepLink: "/signals/screenings" },
    { kind: "report",    title: "Weekly term report ready",                     sub: "Board-ready packet generated with k=10 enforced.",     deepLink: "/reports" },
    { kind: "system",    title: "Seed mode is active",                          sub: "Displaying deterministic mock data — no live feed.",   deepLink: "/qa-data" },
    { kind: "risk",      title: "GAD-7 severe band in Y2 cohort",               sub: "Cohort n=142 — trend elevated for 3 consecutive weeks.", deepLink: "/care/risk" },
    { kind: "referral",  title: "Peer-bridge channel outperforming baseline",   sub: "Acceptance rate +9pt over counsellor-led referrals.",  deepLink: "/care/routing" },
    { kind: "system",    title: "Appearance: motion set to Standard",           sub: "Applied from Settings → Appearance.",                  deepLink: "/settings/appearance" },
  ];
  const out: Notification[] = items.map((it, i) => ({
    ...it,
    id: `n-${i + 1}`,
    createdAtISO: new Date(t - i * 5 * H).toISOString(),
    read: i >= 2, // top two unread by default
  }));
  return out;
}

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  cache = load();
}

// ─── public API ─────────────────────────────────────────────────
export function listNotifications(): Notification[] {
  ensureLoaded();
  return cache;
}
export function unreadCount(): number {
  ensureLoaded();
  return cache.reduce((n, x) => n + (x.read ? 0 : 1), 0);
}
export function markRead(id: string) {
  ensureLoaded();
  cache = cache.map((n) => (n.id === id ? { ...n, read: true } : n));
  persist(); emit();
}
export function markAllRead() {
  ensureLoaded();
  cache = cache.map((n) => ({ ...n, read: true }));
  persist(); emit();
}
export function pushNotification(n: Omit<Notification, "id" | "createdAtISO" | "read">) {
  ensureLoaded();
  const id = `n-${Date.now().toString(36)}`;
  cache = [{ ...n, id, createdAtISO: new Date().toISOString(), read: false }, ...cache].slice(0, 60);
  persist(); emit();
}
export function clearAll() {
  cache = [];
  persist(); emit();
}

function subscribe(l: () => void) {
  ensureLoaded();
  listeners.add(l);
  return () => { listeners.delete(l); };
}

// React hook
export function useNotifications(): Notification[] {
  return useSyncExternalStore(subscribe, () => { ensureLoaded(); return cache; }, () => []);
}
export function useUnreadCount(): number {
  return useSyncExternalStore(subscribe, () => { ensureLoaded(); return cache.reduce((n, x) => n + (x.read ? 0 : 1), 0); }, () => 0);
}

// ─── Live polling (mock feed) ───────────────────────────────────
const CANDIDATES: Array<Omit<Notification, "id" | "createdAtISO" | "read">> = [
  { kind: "risk",     title: "Item-9 endorsements: 2 new this cycle",       sub: "Aggregate signal only. Review the care queue.",       deepLink: "/care/risk" },
  { kind: "referral", title: "Referral acceptance rate improved (+4pt)",     sub: "Rolling 7-day window across all schools.",            deepLink: "/care/referrals" },
  { kind: "screening", title: "GAD-7 completion dipped in Business",         sub: "Below the 75% threshold for the past 2 weeks.",       deepLink: "/signals/screenings" },
  { kind: "report",   title: "Board-of-Governors export finished",           sub: "PDF + XLSX ready in Reports.",                        deepLink: "/reports/history" },
  { kind: "system",   title: "Data refresh completed",                       sub: "26-week aggregates refreshed at institutional level.", deepLink: "/qa-data" },
];
let pollTimer: number | null = null;
export function startLivePolling(intervalMs = 45_000) {
  if (typeof window === "undefined" || pollTimer !== null) return;
  const rand = mulberry32(SEED_ROOT ^ Date.now());
  pollTimer = window.setInterval(() => {
    if (rand() < 0.18) {
      const pick = CANDIDATES[Math.floor(rand() * CANDIDATES.length)]!;
      pushNotification(pick);
    }
  }, intervalMs);
}
export function stopLivePolling() {
  if (pollTimer !== null && typeof window !== "undefined") {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

// ─── helpers ────────────────────────────────────────────────────
export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const delta = Math.max(0, Date.now() - t);
  const m = Math.round(delta / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  return `${w}w ago`;
}
