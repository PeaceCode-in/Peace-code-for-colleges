// Local-first journal persistence.
export type Mood = "radiant" | "calm" | "okay" | "low" | "heavy";
export type JournalKind = "quick" | "guided" | "voice";

export type VoiceNote = {
  id: string;
  dataUrl: string;         // base64 audio (data:audio/...)
  mime: string;
  duration: number;        // seconds
  transcript?: string;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  body: string;
  mood: Mood | null;
  energy: number;
  gratitude: string[];
  wins: string[];
  challenges: string[];
  tags: string[];
  collection: string;
  favorite: boolean;
  archived: boolean;
  secret?: boolean;           // hidden behind lock
  weather?: string;
  location?: string;
  kind: JournalKind;
  status: "draft" | "saved";
  aiSummary?: string;
  photos?: string[];          // data URLs
  voiceNotes?: VoiceNote[];
};

const KEY = "peacecode.journal.entries.v1";
const PREF = "peacecode.journal.prefs.v1";
const UNLOCK_KEY = "peacecode.journal.unlocked";

export type ThemeName = "paper" | "linen" | "sky" | "lavender";

export type JournalPrefs = {
  theme: ThemeName;
  fontScale: 1 | 1.1 | 1.25;
  lockEnabled: boolean;
  passwordHash?: string;
  biometricEnabled?: boolean;
  webauthnCredId?: string;   // base64
};

export const THEME_META: Record<ThemeName, { label: string; ink: string; bg: string; surface: string; accent: string; note: string }> = {
  paper:    { label: "Paper",    ink: "#2A2620", bg: "#F7F1E6", surface: "#FFFDF7", accent: "#B8956A", note: "warm cream, ink" },
  linen:    { label: "Linen",    ink: "#2E2A26", bg: "#EFE7DA", surface: "#F8F2E7", accent: "#9C846A", note: "soft weave" },
  sky:      { label: "Sky",      ink: "#1D2A44", bg: "#F7FAFF", surface: "#FFFFFF", accent: "#4B6CB7", note: "clear morning" },
  lavender: { label: "Lavender", ink: "#2A2440", bg: "#F4EFFB", surface: "#FBF8FF", accent: "#7C6BB0", note: "dusk calm" },
};

export const defaultPrefs: JournalPrefs = { theme: "sky", fontScale: 1, lockEnabled: false };

export function loadEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as JournalEntry[];
    return arr.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch { return []; }
}

export function saveEntries(list: JournalEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function upsertEntry(entry: JournalEntry) {
  const list = loadEntries();
  const idx = list.findIndex((e) => e.id === entry.id);
  const next = { ...entry, updatedAt: new Date().toISOString() };
  if (idx >= 0) list[idx] = next; else list.unshift(next);
  saveEntries(list);
  return next;
}

export function deleteEntry(id: string) {
  saveEntries(loadEntries().filter((e) => e.id !== id));
}

export function getEntry(id: string): JournalEntry | undefined {
  return loadEntries().find((e) => e.id === id);
}

export function newEntry(kind: JournalKind = "quick", seed?: Partial<JournalEntry>): JournalEntry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    title: "",
    body: "",
    mood: null,
    energy: 3,
    gratitude: [],
    wins: [],
    challenges: [],
    tags: [],
    collection: "Personal",
    favorite: false,
    archived: false,
    kind,
    status: "draft",
    photos: [],
    voiceNotes: [],
    ...seed,
  };
}

export function loadPrefs(): JournalPrefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = window.localStorage.getItem(PREF);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch { return defaultPrefs; }
}
export function savePrefs(p: JournalPrefs) {
  window.localStorage.setItem(PREF, JSON.stringify(p));
}

// ── unlock session ─────────────────────────────────────────────
export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
}
export function setUnlocked(v: boolean) {
  if (typeof window === "undefined") return;
  if (v) window.sessionStorage.setItem(UNLOCK_KEY, "1");
  else window.sessionStorage.removeItem(UNLOCK_KEY);
}

export async function hashPassword(pw: string): Promise<string> {
  const buf = new TextEncoder().encode(pw);
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── derived stats ─────────────────────────────────────────────
export function dayKey(d: Date | string) {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export function computeStreak(entries: JournalEntry[]) {
  const days = new Set(entries.filter((e) => e.status === "saved").map((e) => dayKey(e.createdAt)));
  let current = 0, longest = 0, run = 0;
  const today = new Date();
  for (let i = 0; i < 400; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    if (days.has(dayKey(d))) current++; else break;
  }
  const sorted = Array.from(days).sort();
  let prev: string | null = null;
  for (const k of sorted) {
    if (prev) {
      const a = new Date(prev), b = new Date(k);
      const diff = Math.round((+b - +a) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    } else run = 1;
    longest = Math.max(longest, run);
    prev = k;
  }
  return { current, longest, totalDays: days.size };
}

export function weekMoodTrend(entries: JournalEntry[]) {
  const score: Record<Mood, number> = { radiant: 5, calm: 4, okay: 3, low: 2, heavy: 1 };
  const out: { day: string; label: string; value: number | null; mood: Mood | null }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const k = dayKey(d);
    const day = entries.find((e) => dayKey(e.createdAt) === k && e.mood);
    out.push({
      day: k,
      label: d.toLocaleDateString(undefined, { weekday: "short" })[0],
      value: day?.mood ? score[day.mood] : null,
      mood: day?.mood ?? null,
    });
  }
  return out;
}

// ── writing insights ──────────────────────────────────────────
const STOPWORDS = new Set(("a about all also am an and any are as at be because been but by can could did do does for from get got had has have he her here him his how i if in into is it its just like me my no not now of on one only or our out over she so some such than that the their them then there these they this those to too up us very was we were what when where which who why will with would you your".split(" ")));

export function buildHeatmap(entries: JournalEntry[], weeks = 14) {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (e.status !== "saved") continue;
    const k = dayKey(e.createdAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - (weeks * 7 - 1));
  // align to Monday
  const dow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dow);
  const cells: { key: string; count: number; date: Date }[] = [];
  const total = weeks * 7 + dow;
  for (let i = 0; i < total; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const k = dayKey(d);
    cells.push({ key: k, count: counts.get(k) ?? 0, date: d });
  }
  return cells;
}

export function topEmotions(entries: JournalEntry[]) {
  const c: Record<Mood, number> = { radiant: 0, calm: 0, okay: 0, low: 0, heavy: 0 };
  for (const e of entries) if (e.mood) c[e.mood]++;
  return (Object.entries(c) as [Mood, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([, n]) => n > 0);
}

export function topWords(entries: JournalEntry[], limit = 24) {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const words = (e.body + " " + e.title).toLowerCase().match(/[a-zA-Z']{3,}/g) ?? [];
    for (const w of words) {
      if (STOPWORDS.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export function monthMoodTrend(entries: JournalEntry[]) {
  const score: Record<Mood, number> = { radiant: 5, calm: 4, okay: 3, low: 2, heavy: 1 };
  const now = new Date();
  const out: { label: string; value: number | null }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const k = dayKey(d);
    const day = entries.find((e) => dayKey(e.createdAt) === k && e.mood);
    out.push({
      label: d.getDate().toString(),
      value: day?.mood ? score[day.mood] : null,
    });
  }
  return out;
}

// ── media aggregation ─────────────────────────────────────────
export type MediaItem =
  | { kind: "photo"; entryId: string; url: string; createdAt: string; title: string }
  | { kind: "voice"; entryId: string; voice: VoiceNote; title: string };

export function collectMedia(entries: JournalEntry[]): MediaItem[] {
  const items: MediaItem[] = [];
  for (const e of entries) {
    for (const p of e.photos ?? []) {
      items.push({ kind: "photo", entryId: e.id, url: p, createdAt: e.createdAt, title: e.title || "untitled" });
    }
    for (const v of e.voiceNotes ?? []) {
      items.push({ kind: "voice", entryId: e.id, voice: v, title: e.title || "voice note" });
    }
  }
  return items.sort((a, b) => {
    const ta = a.kind === "photo" ? a.createdAt : a.voice.createdAt;
    const tb = b.kind === "photo" ? b.createdAt : b.voice.createdAt;
    return tb.localeCompare(ta);
  });
}
