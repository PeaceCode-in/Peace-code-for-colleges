// Breathing session store — localStorage persistence.

export type BreathTechniqueKey =
  | "box" | "478" | "cyclic" | "resonance" | "nostril" | "triangle" | "custom";

export interface BreathPattern {
  inhale: number;  // seconds
  hold1: number;   // hold after inhale
  exhale: number;
  hold2: number;   // hold after exhale
}

export interface BreathSession {
  id: string;
  technique: BreathTechniqueKey;
  minutes: number;      // actual
  planned: number;
  cycles: number;
  completedAt: string;
  moodBefore?: string;
  moodAfter?: string;
  fullyCompleted: boolean;
}

export interface BreathPrefs {
  voice: boolean;
  soundscape: string;
  theme: string;
  pace: "beginner" | "normal" | "advanced" | "custom";
  favorites: BreathTechniqueKey[];
  customPattern: BreathPattern;
  dailyGoalMinutes: number;
  // accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  fontScale: number; // 1 = default, 1.15, 1.3, 1.5
  keyboardHints: boolean;
}

const SESSIONS_KEY = "peacecode.breathe.sessions.v1";
const PREFS_KEY = "peacecode.breathe.prefs.v1";

const defaultPrefs: BreathPrefs = {
  voice: true,
  soundscape: "silence",
  theme: "clouds",
  pace: "normal",
  favorites: ["box", "478"],
  customPattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  dailyGoalMinutes: 5,
  reducedMotion: false,
  highContrast: false,
  fontScale: 1,
  keyboardHints: true,
};

function readSessions(): BreathSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as BreathSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function writeSessions(list: BreathSession[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
}

function seed(): BreathSession[] {
  const now = Date.now();
  const day = 86400000;
  const techniques: BreathTechniqueKey[] = ["box", "478", "cyclic", "resonance", "box", "triangle", "478"];
  const mins = [5, 3, 10, 5, 7, 3, 5];
  const out: BreathSession[] = mins.map((m, i) => ({
    id: `bseed-${i}`,
    technique: techniques[i],
    minutes: m,
    planned: m,
    cycles: Math.round(m * 3),
    completedAt: new Date(now - (mins.length - 1 - i) * day - 3600000).toISOString(),
    moodBefore: ["restless", "cloudy", "tender", "grounded"][i % 4],
    moodAfter: ["gentle", "grounded", "flowing", "gentle"][i % 4],
    fullyCompleted: true,
  }));
  writeSessions(out);
  return out;
}

export function loadSessions(): BreathSession[] {
  return readSessions().sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}
export function saveSession(s: Omit<BreathSession, "id">): BreathSession {
  const full = { ...s, id: `bs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  const list = readSessions();
  list.push(full);
  writeSessions(list);
  return full;
}
export function deleteSession(id: string) {
  writeSessions(readSessions().filter((s) => s.id !== id));
}

export function loadPrefs(): BreathPrefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch { return defaultPrefs; }
}
export function savePrefs(p: BreathPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

export function dayKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function computeStreak(sessions: BreathSession[]): { current: number; longest: number; totalDays: number } {
  const days = new Set(sessions.map((s) => dayKey(s.completedAt)));
  const sorted = Array.from(days).sort();
  let longest = 0, run = 0;
  let prev: Date | null = null;
  for (const k of sorted) {
    const d = new Date(k);
    if (prev && d.getTime() - prev.getTime() === 86400000) run++;
    else run = 1;
    if (run > longest) longest = run;
    prev = d;
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  while (days.has(dayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, longest, totalDays: days.size };
}

export function weekSummary(sessions: BreathSession[]) {
  const now = Date.now();
  const week = sessions.filter((s) => now - new Date(s.completedAt).getTime() < 7 * 86400000);
  return {
    minutes: week.reduce((a, s) => a + s.minutes, 0),
    sessions: week.length,
    cycles: week.reduce((a, s) => a + s.cycles, 0),
  };
}
