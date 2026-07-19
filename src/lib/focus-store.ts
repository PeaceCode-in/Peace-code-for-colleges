// Focus session store — persists to localStorage. Swap the read/write
// helpers for server calls when Lovable Cloud is enabled.

export type FocusMode = "focus" | "flow" | "short" | "long";

export interface FocusSession {
  id: string;
  mode: FocusMode;
  minutes: number;         // actual minutes held (can be partial if user skipped)
  planned: number;         // planned duration of the mode
  completedAt: string;     // ISO
  taskLabel?: string;
  fullyCompleted: boolean; // true if timer ran to zero
}

const KEY = "peacecode.focus.sessions.v1";

// -- storage primitives (SSR-safe) ---------------------------------
function read(): FocusSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seedIfEmpty();
    const parsed = JSON.parse(raw) as FocusSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function write(list: FocusSession[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

// Seed a bit of realistic history the first time so charts aren't empty.
function seedIfEmpty(): FocusSession[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const seed: FocusSession[] = [];
  const pattern = [62, 48, 95, 30, 78, 110, 54, 40, 65, 80, 25, 90, 55, 72];
  const modes: FocusMode[] = ["focus", "flow", "focus", "short", "focus", "flow", "focus"];
  pattern.forEach((total, i) => {
    let left = total;
    let k = 0;
    while (left > 5) {
      const mode = modes[(i + k) % modes.length];
      const planned = mode === "flow" ? 50 : mode === "focus" ? 25 : mode === "long" ? 15 : 5;
      const mins = Math.min(planned, left);
      seed.push({
        id: `seed-${i}-${k}`,
        mode,
        minutes: mins,
        planned,
        completedAt: new Date(now - (pattern.length - 1 - i) * day - k * 60 * 60 * 1000).toISOString(),
        fullyCompleted: mins === planned,
      });
      left -= mins;
      k += 1;
    }
  });
  write(seed);
  return seed;
}

// -- public api ---------------------------------------------------
export function loadSessions(): FocusSession[] {
  return read().sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}
export function saveSession(s: Omit<FocusSession, "id">): FocusSession {
  const full: FocusSession = { ...s, id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  const list = read();
  list.push(full);
  write(list);
  return full;
}
export function deleteSession(id: string) {
  write(read().filter((s) => s.id !== id));
}
export function clearAll() { write([]); }

// -- date helpers -------------------------------------------------
export function dayKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
export function shiftDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  d.setHours(0, 0, 0, 0);
  return d;
}

// -- aggregations -------------------------------------------------
export interface DayAgg {
  key: string;
  date: Date;
  minutes: number;
  sessions: number;
  qualifies: boolean; // day counts toward streak (any focus/flow session)
}

export function aggregateByDay(sessions: FocusSession[], days: number, endDate = new Date()): DayAgg[] {
  const end = new Date(endDate); end.setHours(0, 0, 0, 0);
  const map = new Map<string, DayAgg>();
  for (let i = days - 1; i >= 0; i--) {
    const d = shiftDays(end, -i);
    const k = dayKey(d);
    map.set(k, { key: k, date: d, minutes: 0, sessions: 0, qualifies: false });
  }
  for (const s of sessions) {
    const k = dayKey(s.completedAt);
    const agg = map.get(k);
    if (!agg) continue;
    agg.minutes += s.minutes;
    agg.sessions += 1;
    if (s.mode === "focus" || s.mode === "flow") agg.qualifies = true;
  }
  return Array.from(map.values());
}

export function computeStreaks(sessions: FocusSession[]): { current: number; longest: number; totalDays: number } {
  // build a set of unique qualifying days
  const qualifying = new Set<string>();
  for (const s of sessions) {
    if (s.mode !== "focus" && s.mode !== "flow") continue;
    qualifying.add(dayKey(s.completedAt));
  }
  const totalDays = qualifying.size;
  const sorted = Array.from(qualifying).sort();

  let longest = 0, run = 0;
  let prev: Date | null = null;
  for (const k of sorted) {
    const d = new Date(k);
    if (prev && (d.getTime() - prev.getTime()) === 24 * 60 * 60 * 1000) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }

  // current streak: walk back from today
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let current = 0;
  let cursor = new Date(today);
  // if today has no session, start from yesterday (grace)
  if (!qualifying.has(dayKey(cursor))) cursor = shiftDays(cursor, -1);
  while (qualifying.has(dayKey(cursor))) {
    current += 1;
    cursor = shiftDays(cursor, -1);
  }

  return { current, longest, totalDays };
}

export function weekdayIndex(d: Date): number {
  // Mon = 0 … Sun = 6
  return (d.getDay() + 6) % 7;
}
