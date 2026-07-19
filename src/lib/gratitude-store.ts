// Local-first gratitude persistence + tree/streak/achievement logic + community seed.

export type GratitudePrivacy = "private" | "public" | "anonymous";
export type GratitudeMood = "peaceful" | "joyful" | "grateful" | "hopeful" | "tender" | "loved";

export const CATEGORIES = [
  "Family","Friends","College","Professors","Hostel","Relationships",
  "Career","Health","Nature","Self","Small Wins","Random Moments",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const MOODS: { key: GratitudeMood; emoji: string; label: string }[] = [
  { key: "peaceful", emoji: "🌿", label: "peaceful" },
  { key: "joyful",   emoji: "☀️", label: "joyful" },
  { key: "grateful", emoji: "🕊️", label: "grateful" },
  { key: "hopeful",  emoji: "🌱", label: "hopeful" },
  { key: "tender",   emoji: "🤍", label: "tender" },
  { key: "loved",    emoji: "💛", label: "loved" },
];

export type VoiceNote = { dataUrl: string; mime: string; duration: number; transcript?: string };

export type GratitudeEntry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  body: string;
  mood: GratitudeMood | null;
  emoji: string;
  tags: string[];
  category: Category | null;
  privacy: GratitudePrivacy;
  photos?: string[];
  voice?: VoiceNote;
  location?: string;
  status: "draft" | "saved";
};

export type CommunityEntry = {
  id: string;
  createdAt: string;
  body: string;
  category: Category;
  anonymous: boolean;
  authorName?: string;
  college?: string;
  likes: number;
  hearts: number;
  supports: number;
};

export type Prefs = {
  defaultPrivacy: GratitudePrivacy;
  anonymousMode: boolean;
  hideIdentity: boolean;
  notifyDaily: boolean;
  notifyStreak: boolean;
  notifyBloom: boolean;
  notifyWeekly: boolean;
  activeChallenge?: "7" | "21" | "30" | "college" | "friends";
  challengeStartedAt?: string;
};

const K_ENTRIES = "peacecode.gratitude.entries.v1";
const K_PREFS = "peacecode.gratitude.prefs.v1";
const K_REACTIONS = "peacecode.gratitude.reactions.v1";
const K_BOOKMARKS = "peacecode.gratitude.bookmarks.v1";
const K_HIDDEN = "peacecode.gratitude.hidden.v1";
const K_COMMUNITY = "peacecode.gratitude.community.v1";

export const defaultPrefs: Prefs = {
  defaultPrivacy: "private",
  anonymousMode: false,
  hideIdentity: false,
  notifyDaily: true,
  notifyStreak: true,
  notifyBloom: true,
  notifyWeekly: true,
};

// ─── storage helpers ─────────────────────────────────────────────
function get<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const r = window.localStorage.getItem(k); return r ? (JSON.parse(r) as T) : fallback; }
  catch { return fallback; }
}
function set<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(k, JSON.stringify(v));
}

export function loadEntries(): GratitudeEntry[] {
  return get<GratitudeEntry[]>(K_ENTRIES, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function saveEntries(list: GratitudeEntry[]) { set(K_ENTRIES, list); }
export function upsertEntry(e: GratitudeEntry) {
  const list = loadEntries();
  const i = list.findIndex((x) => x.id === e.id);
  if (i >= 0) list[i] = e; else list.unshift(e);
  saveEntries(list);
}
export function deleteEntry(id: string) { saveEntries(loadEntries().filter((e) => e.id !== id)); }
export function getEntry(id: string) { return loadEntries().find((e) => e.id === id) ?? null; }
export function newId() { return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

export function loadPrefs(): Prefs { return { ...defaultPrefs, ...get<Partial<Prefs>>(K_PREFS, {}) }; }
export function savePrefs(p: Prefs) { set(K_PREFS, p); }

export function loadReactions(): Record<string, { liked?: boolean; hearted?: boolean; supported?: boolean }> {
  return get(K_REACTIONS, {});
}
export function saveReactions(r: ReturnType<typeof loadReactions>) { set(K_REACTIONS, r); }
export function loadBookmarks(): string[] { return get(K_BOOKMARKS, []); }
export function saveBookmarks(v: string[]) { set(K_BOOKMARKS, v); }
export function loadHidden(): string[] { return get(K_HIDDEN, []); }
export function saveHidden(v: string[]) { set(K_HIDDEN, v); }

// ─── streaks ─────────────────────────────────────────────────────
function dayKey(iso: string) { return iso.slice(0, 10); }
function todayKey() { return new Date().toISOString().slice(0, 10); }

export function computeStreak(entries: GratitudeEntry[]): { current: number; longest: number } {
  const days = new Set(entries.map((e) => dayKey(e.createdAt)));
  if (!days.size) return { current: 0, longest: 0 };
  const sorted = [...days].sort();
  let longest = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00");
    const cur = new Date(sorted[i] + "T00:00:00");
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) run++; else run = 1;
    if (run > longest) longest = run;
  }
  // current streak from today backward
  let current = 0;
  const d = new Date();
  for (;;) {
    const k = d.toISOString().slice(0, 10);
    if (days.has(k)) { current++; d.setDate(d.getDate() - 1); }
    else if (current === 0 && k === todayKey()) { d.setDate(d.getDate() - 1); } // grace: no entry yet today
    else break;
  }
  return { current, longest };
}

export function todayCount(entries: GratitudeEntry[]): number {
  const t = todayKey();
  return entries.filter((e) => dayKey(e.createdAt) === t).length;
}

// ─── tree stages ─────────────────────────────────────────────────
export const STAGES = [
  { key: "seed",       label: "Seed",             min: 0,   emoji: "🌰" },
  { key: "sprout",     label: "Sprout",           min: 3,   emoji: "🌱" },
  { key: "small",      label: "Small Plant",      min: 10,  emoji: "🪴" },
  { key: "young",      label: "Young Tree",       min: 25,  emoji: "🌿" },
  { key: "mature",     label: "Mature Tree",      min: 60,  emoji: "🌳" },
  { key: "blooming",   label: "Blooming Tree",    min: 120, emoji: "🌸" },
  { key: "golden",     label: "Golden Tree",      min: 250, emoji: "🍂" },
  { key: "peace",      label: "Peace Forest Tree", min: 500, emoji: "✨" },
] as const;
export type StageKey = (typeof STAGES)[number]["key"];

export type TreeState = {
  score: number;
  stageIdx: number;
  stage: (typeof STAGES)[number];
  next: (typeof STAGES)[number] | null;
  bloom: number; // 0..1 progress to next
  leaves: number;
  flowers: number;
  fruits: number;
  birds: number;
};

export function computeTree(entries: GratitudeEntry[]): TreeState {
  const { current, longest } = computeStreak(entries);
  const publicCount = entries.filter((e) => e.privacy !== "private").length;
  const score = entries.length + current * 3 + longest + Math.floor(publicCount * 1.5);

  let stageIdx = 0;
  for (let i = STAGES.length - 1; i >= 0; i--) if (score >= STAGES[i].min) { stageIdx = i; break; }
  const stage = STAGES[stageIdx];
  const next = STAGES[stageIdx + 1] ?? null;
  const bloom = next ? Math.min(1, (score - stage.min) / (next.min - stage.min)) : 1;

  return {
    score, stageIdx, stage, next, bloom,
    leaves: Math.min(999, entries.length * 2 + stageIdx * 8),
    flowers: Math.max(0, entries.length - 10) + (stageIdx >= 5 ? 12 : 0),
    fruits: stageIdx >= 4 ? Math.floor(entries.length / 8) : 0,
    birds: stageIdx >= 3 ? Math.min(9, Math.floor(entries.length / 6)) : 0,
  };
}

// ─── achievements ────────────────────────────────────────────────
export type Achievement = { key: string; label: string; hint: string; unlocked: boolean };
export function computeAchievements(entries: GratitudeEntry[]): Achievement[] {
  const { current, longest } = computeStreak(entries);
  const publicCount = entries.filter((e) => e.privacy !== "private").length;
  const tree = computeTree(entries);
  const list: Achievement[] = [
    { key: "first",     label: "First Gratitude",     hint: "plant one seed",             unlocked: entries.length >= 1 },
    { key: "streak7",   label: "7-Day Streak",        hint: "seven days in a row",        unlocked: Math.max(current, longest) >= 7 },
    { key: "streak30",  label: "30-Day Streak",       hint: "a full month tender",        unlocked: Math.max(current, longest) >= 30 },
    { key: "hundred",   label: "100 Gratitudes",      hint: "one hundred small mercies",  unlocked: entries.length >= 100 },
    { key: "fivehund",  label: "500 Gratitudes",      hint: "a quiet library",            unlocked: entries.length >= 500 },
    { key: "public1",   label: "First Public",        hint: "share one with the world",   unlocked: publicCount >= 1 },
    { key: "supporter", label: "Community Supporter", hint: "send ten hearts",            unlocked: (Object.values(loadReactions()).filter((r) => r.hearted).length) >= 10 },
    { key: "bloom",     label: "Blooming Tree",       hint: "reach the blooming stage",   unlocked: tree.stageIdx >= 5 },
    { key: "gold",      label: "Golden Tree",         hint: "reach the golden stage",     unlocked: tree.stageIdx >= 6 },
    { key: "forest",    label: "Peace Forest",        hint: "reach the forest",           unlocked: tree.stageIdx >= 7 },
  ];
  return list;
}

// ─── community seed ─────────────────────────────────────────────
const SEED: Omit<CommunityEntry, "id" | "createdAt">[] = [
  { body: "chai with amma before class. she remembered i don't like too much sugar.", category: "Family", anonymous: false, authorName: "Ria", college: "IIT Bombay", likes: 128, hearts: 84, supports: 12 },
  { body: "cried in the library and a stranger left a tissue on my table.", category: "Random Moments", anonymous: true, likes: 302, hearts: 210, supports: 96 },
  { body: "my roommate made maggi at 2 a.m. because i couldn't sleep.", category: "Hostel", anonymous: false, authorName: "Aarav", college: "BITS Pilani", likes: 94, hearts: 61, supports: 4 },
  { body: "prof stayed back an hour to explain one derivation. i understood it.", category: "Professors", anonymous: false, authorName: "Neha", college: "NIT Trichy", likes: 71, hearts: 40, supports: 3 },
  { body: "rain against the hostel window. no plans. just watching.", category: "Nature", anonymous: true, likes: 188, hearts: 122, supports: 8 },
  { body: "got a 6/10 and didn't spiral. that's growth.", category: "Small Wins", anonymous: false, authorName: "Kabir", college: "DU", likes: 156, hearts: 88, supports: 24 },
  { body: "friend texted 'thinking of you' out of nowhere. saved my afternoon.", category: "Friends", anonymous: true, likes: 240, hearts: 176, supports: 34 },
  { body: "walked to college instead of taking rickshaw. legs sore, head quiet.", category: "Health", anonymous: false, authorName: "Isha", college: "Christ", likes: 62, hearts: 30, supports: 2 },
  { body: "let myself take a nap without guilt. woke up softer.", category: "Self", anonymous: true, likes: 214, hearts: 168, supports: 42 },
  { body: "he still holds my hand when we cross the road.", category: "Relationships", anonymous: true, likes: 411, hearts: 302, supports: 26 },
  { body: "got the internship. six months of nervous emails paid off.", category: "Career", anonymous: false, authorName: "Vikram", college: "IIIT Hyderabad", likes: 289, hearts: 148, supports: 18 },
  { body: "our chai wala remembered my order after a semester away.", category: "College", anonymous: false, authorName: "Meera", college: "JMI", likes: 133, hearts: 92, supports: 5 },
];

export function loadCommunity(): CommunityEntry[] {
  const cached = get<CommunityEntry[]>(K_COMMUNITY, []);
  if (cached.length) return cached;
  const now = Date.now();
  const seeded: CommunityEntry[] = SEED.map((s, i) => ({
    ...s,
    id: `c_${i}`,
    createdAt: new Date(now - (i + 1) * 3.6e6 - Math.random() * 8.64e7).toISOString(),
  }));
  set(K_COMMUNITY, seeded);
  return seeded;
}

// forest metrics — real user entries + community
export function computeForest(userEntries: GratitudeEntry[]) {
  const community = loadCommunity();
  const totalTrees = 2847 + (userEntries.length > 0 ? 1 : 0);
  const totalEntries = 41288 + userEntries.length + community.length;
  const bloomed = 312;
  const health = Math.min(1, 0.62 + (userEntries.length / 400));
  return { totalTrees, totalEntries, bloomed, health };
}

// convert user entry → public feed record (for the wall)
export function userAsCommunity(e: GratitudeEntry, hideIdentity: boolean): CommunityEntry {
  return {
    id: `u_${e.id}`,
    createdAt: e.createdAt,
    body: (e.title ? e.title + " — " : "") + e.body,
    category: e.category ?? "Random Moments",
    anonymous: e.privacy === "anonymous" || hideIdentity,
    authorName: e.privacy === "anonymous" || hideIdentity ? undefined : "You",
    college: undefined,
    likes: 0, hearts: 0, supports: 0,
  };
}
