// Gentle browser-notification scheduler for gratitude reminders.
// All checks happen on the client; no service worker required.

import type { Prefs } from "./gratitude-store";
import { computeStreak, computeTree, loadEntries, todayCount } from "./gratitude-store";

const LAST_KEY = "peacecode.gratitude.notify.last.v1";
type LastSent = Partial<Record<"daily" | "streak" | "bloom" | "weekly", string>>;

function loadLast(): LastSent {
  try { return JSON.parse(localStorage.getItem(LAST_KEY) ?? "{}"); } catch { return {}; }
}
function saveLast(v: LastSent) { localStorage.setItem(LAST_KEY, JSON.stringify(v)); }

function todayKey() { return new Date().toISOString().slice(0, 10); }
function weekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const w = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${w}`;
}

export type NotifyPermission = "default" | "granted" | "denied" | "unsupported";

export function getPermission(): NotifyPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotifyPermission;
}

export async function requestPermission(): Promise<NotifyPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission as NotifyPermission;
  }
  const r = await Notification.requestPermission();
  return r as NotifyPermission;
}

function fire(title: string, body: string) {
  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      silent: false,
      tag: `peacecode-gratitude-${title}`,
    });
  } catch { /* ignore */ }
}

// Evaluate all reminders. Idempotent — each fires at most once per bucket (day/week).
export function evaluateReminders(prefs: Prefs) {
  if (typeof window === "undefined") return;
  if (getPermission() !== "granted") return;

  const entries = loadEntries();
  const last = loadLast();
  const today = todayKey();
  const week = weekKey();
  const hour = new Date().getHours();
  const streak = computeStreak(entries);
  const tree = computeTree(entries);
  const count = todayCount(entries);

  // 1. Daily reminder — gentle nudge after 7pm if nothing today
  if (prefs.notifyDaily && hour >= 19 && count === 0 && last.daily !== today) {
    fire("a small mercy", "notice one thing that softened your day.");
    last.daily = today;
  }

  // 2. Streak reminder — protect a live streak (≥3) if nothing today, after 8pm
  if (prefs.notifyStreak && streak.current >= 3 && count === 0 && hour >= 20 && last.streak !== today) {
    fire(`${streak.current}-day streak`, "one line keeps the chain warm.");
    last.streak = today;
  }

  // 3. Tree bloom — new stage reached
  const bloomKey = `${today}:${tree.stage.key}`;
  if (prefs.notifyBloom && last.bloom !== bloomKey) {
    // Only fire once we've actually reached a non-seed stage this session.
    if (tree.stageIdx >= 1 && last.bloom && !last.bloom.endsWith(tree.stage.key)) {
      fire(`your tree bloomed`, `it's a ${tree.stage.label.toLowerCase()} now.`);
    }
    last.bloom = bloomKey;
  }

  // 4. Weekly reflection — sunday evening
  if (prefs.notifyWeekly && new Date().getDay() === 0 && hour >= 18 && last.weekly !== week) {
    fire("weekly reflection", "peace has a soft summary of your week.");
    last.weekly = week;
  }

  saveLast(last);
}

let intervalId: number | null = null;
export function startReminderLoop(getPrefs: () => Prefs) {
  if (typeof window === "undefined") return () => {};
  evaluateReminders(getPrefs());
  intervalId = window.setInterval(() => evaluateReminders(getPrefs()), 5 * 60 * 1000); // every 5 min
  return () => { if (intervalId != null) window.clearInterval(intervalId); intervalId = null; };
}
