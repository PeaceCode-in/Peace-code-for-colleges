// PeaceCode Student Profile — persistent mock state (localStorage).
// Everything the profile pages read/write goes through here. Frontend-only,
// but shaped like a real API so we can lift it to Cloud later.
import { currentDisplayName } from "./auth-store";

export type ThemeKey =
  | "sky" | "lavender" | "ocean" | "forest" | "sunrise"
  | "cloud" | "moon" | "peach" | "pastel-blue" | "pastel-purple" | "minimal";

export const THEMES: Record<ThemeKey, { label: string; from: string; to: string; ink: string; glow: string }> = {
  sky:            { label: "Sky",             from: "#DCEBFF", to: "#F3F7FF", ink: "#2E3A59", glow: "#8FB8FF" },
  lavender:       { label: "Lavender",        from: "#E9DEFB", to: "#F6F0FF", ink: "#3B2E5C", glow: "#B79CEB" },
  ocean:          { label: "Ocean",           from: "#B6DAE8", to: "#E4F3F7", ink: "#123A4A", glow: "#5FA9BF" },
  forest:         { label: "Forest",          from: "#CFE3D0", to: "#EEF6EA", ink: "#28402B", glow: "#7CA97F" },
  sunrise:        { label: "Sunrise",         from: "#FFD6B0", to: "#FFF0E1", ink: "#5A2E0F", glow: "#F0A473" },
  cloud:          { label: "Cloud",           from: "#E9EDF3", to: "#F8FAFC", ink: "#2A2F3A", glow: "#B7C0CE" },
  moon:           { label: "Moon",            from: "#D5D9E6", to: "#EDEFF6", ink: "#1F2340", glow: "#8892B0" },
  peach:          { label: "Soft Peach",      from: "#FBDCD1", to: "#FFF3EC", ink: "#5B2E1E", glow: "#F4A78E" },
  "pastel-blue":  { label: "Pastel Blue",     from: "#CFE2FF", to: "#EEF4FF", ink: "#1D3A7A", glow: "#8CB2F7" },
  "pastel-purple":{ label: "Pastel Purple",   from: "#E5D6FA", to: "#F3EBFF", ink: "#3D2A70", glow: "#B196E8" },
  minimal:        { label: "Minimal White",   from: "#F7F7F7", to: "#FFFFFF", ink: "#111111", glow: "#DDDDDD" },
};

export type MoodBadge =
  | "calm" | "growing" | "gentle" | "focused" | "tender" | "quiet" | "bright";

export const MOOD_META: Record<MoodBadge, { emoji: string; label: string; sub: string }> = {
  calm:    { emoji: "🟢", label: "Calm Today",       sub: "your rhythm is soft" },
  growing: { emoji: "🌿", label: "Growing Quietly",  sub: "small steps count" },
  gentle:  { emoji: "🕊",  label: "Gentle Now",       sub: "be kind to yourself" },
  focused: { emoji: "🎯", label: "Focused Mind",     sub: "in the deep zone" },
  tender:  { emoji: "🌸", label: "Tender Heart",     sub: "hold yourself close" },
  quiet:   { emoji: "🌙", label: "Quiet Thinker",    sub: "slow processing hours" },
  bright:  { emoji: "☀️", label: "Bright Today",     sub: "sunlight in your chest" },
};

export interface Interest { id: string; label: string; }
export interface Milestone { id: string; date: string; title: string; note: string; kind: "start" | "first" | "streak" | "milestone" | "gift" }
export interface Achievement {
  id: string; title: string; description: string; icon: string;
  earnedAt?: string; progress: number; total: number; category: string;
}
export interface ActivityItem { id: string; ts: string; kind: string; title: string; meta?: string; href?: string }
export interface Friend { id: string; name: string; handle: string; mood: MoodBadge; streak: number; college: string; mutual: number; status: "friend" | "request-in" | "request-out" | "suggested" }
export interface Bookmark { id: string; kind: "article" | "video" | "exercise" | "meditation" | "post"; title: string; source: string; addedAt: string }
export type Visibility = "everyone" | "friends" | "only-me";

export interface Profile {
  displayName: string;
  preferredName: string;
  username: string;
  bio: string;
  about: string;
  pronouns: string;
  birthday: string;
  location: string;
  timezone: string;
  college: string;
  department: string;
  degree: string;
  semester: string;
  year: string;
  studentId: string;
  languages: string[];
  website: string;
  linkedin: string;
  github: string;
  portfolio: string;
  instagram: string;
  emergencyName: string;
  emergencyPhone: string;
  verified: boolean;
  memberSince: string;
  photo?: string;
  cover?: string;
  moodIdentity: string;
  currentMood: MoodBadge;
  theme: ThemeKey;
  peaceScore: number;
  streaks: { peace: number; journal: number; breathing: number; mindgym: number };
  interests: Interest[];
  milestones: Milestone[];
  achievements: Achievement[];
  activity: ActivityItem[];
  friends: Friend[];
  bookmarks: Bookmark[];
  widgets: string[];        // ordered dashboard widget ids
  hiddenWidgets: string[];
  privacy: Record<string, Visibility>;
  garden: { level: number; growthPct: number; leaves: number; flowers: number; birds: number; season: "spring" | "summer" | "autumn" | "winter"; water: number; nextMilestone: string; history: { week: string; growth: number }[] };
  stats: { moodTrend: number[]; journalHeatmap: number[]; breathingSessions: number; avgSleep: number; xp: number; resources: number; contributions: number; counselling: number };
  notifications: { id: string; kind: string; title: string; at: string; read: boolean }[];
}

const KEY = "peacecode.profile.v1";

const defaults: Profile = {
  displayName: "Keya Sharma",
  preferredName: "Keya",
  username: "@keya",
  bio: "learning to sit with quiet.",
  about: "Second-year psych student who journals in the mornings, walks at dusk, and collects rainy day playlists. I use PeaceCode to slow my mind down and grow one soft habit at a time.",
  pronouns: "she / her",
  birthday: "2005-04-11",
  location: "Bengaluru, IN",
  timezone: "Asia/Kolkata",
  college: "Christ University",
  department: "Psychology",
  degree: "BA Honours",
  semester: "4",
  year: "II",
  studentId: "PSY-2405-118",
  languages: ["English", "Hindi", "Kannada"],
  website: "",
  linkedin: "",
  github: "",
  portfolio: "",
  instagram: "",
  emergencyName: "Nisha (mom)",
  emergencyPhone: "+91 98••• •••02",
  verified: true,
  memberSince: "2025-08-14",
  moodIdentity: "Quiet Thinker",
  currentMood: "growing",
  theme: "sky",
  peaceScore: 78,
  streaks: { peace: 12, journal: 9, breathing: 21, mindgym: 6 },
  interests: [
    { id: "i1", label: "Journaling" }, { id: "i2", label: "Psychology" },
    { id: "i3", label: "Books" }, { id: "i4", label: "Coffee" },
    { id: "i5", label: "Photography" }, { id: "i6", label: "Slow mornings" },
  ],
  milestones: [
    { id: "m1", date: "2025-08-14", title: "Joined PeaceCode", note: "first soft landing", kind: "start" },
    { id: "m2", date: "2025-08-15", title: "First Journal", note: "three shy sentences", kind: "first" },
    { id: "m3", date: "2025-08-22", title: "First Gratitude", note: "grateful for warm chai", kind: "first" },
    { id: "m4", date: "2025-09-02", title: "First Breathing Session", note: "box breath · 4 minutes", kind: "first" },
    { id: "m5", date: "2025-09-18", title: "First Peace Buddy", note: "met Ayaan", kind: "first" },
    { id: "m6", date: "2025-10-04", title: "First Counselling Session", note: "with Dr. Meera", kind: "first" },
    { id: "m7", date: "2025-10-30", title: "Mind Gym Started", note: "focus lane · lv1", kind: "start" },
    { id: "m8", date: "2026-06-25", title: "12-day streak", note: "you kept showing up", kind: "streak" },
  ],
  achievements: [
    { id: "a1", title: "7 Day Journal",     description: "A week of writing yourself down.", icon: "✍️", earnedAt: "2025-08-21", progress: 7, total: 7, category: "Journal" },
    { id: "a2", title: "30 Day Journal",    description: "Thirty mornings, one soft voice.", icon: "📓", progress: 22, total: 30, category: "Journal" },
    { id: "a3", title: "100 Gratitudes",    description: "A hundred small things noticed.", icon: "🌿", progress: 63, total: 100, category: "Gratitude" },
    { id: "a4", title: "Mind Gym Lv10",     description: "Ten levels of mental fitness.", icon: "🧠", progress: 6, total: 10, category: "Mind Gym" },
    { id: "a5", title: "First Reflection",  description: "You paused and looked back.", icon: "🪞", earnedAt: "2025-09-01", progress: 1, total: 1, category: "Reflection" },
    { id: "a6", title: "Calm Week",         description: "A gentle seven day stretch.", icon: "☁️", earnedAt: "2025-10-08", progress: 7, total: 7, category: "Wellbeing" },
    { id: "a7", title: "Community Helper",  description: "You lifted someone else up.", icon: "🫂", progress: 3, total: 10, category: "Community" },
    { id: "a8", title: "Kindness Badge",    description: "Ten kind replies given.", icon: "💛", progress: 4, total: 10, category: "Community" },
    { id: "a9", title: "Focus Master",      description: "Ten deep focus hours.", icon: "🎯", progress: 7, total: 10, category: "Focus" },
    { id: "a10", title: "Sleep Hero",       description: "Seven nights of steady sleep.", icon: "🌙", progress: 5, total: 7, category: "Sleep" },
    { id: "a11", title: "Exam Warrior",     description: "Held steady through exams.", icon: "📚", progress: 0, total: 1, category: "Study" },
    { id: "a12", title: "Growth Explorer",  description: "Tried five different tools.", icon: "🌱", earnedAt: "2025-11-14", progress: 5, total: 5, category: "Discovery" },
  ],
  activity: [
    { id: "ac1", ts: new Date().toISOString(),                                       kind: "journal",    title: "Wrote 3 quiet paragraphs",       meta: "morning · 4 min",   href: "/journal" },
    { id: "ac2", ts: new Date(Date.now() - 2 * 3600e3).toISOString(),                kind: "breathing",  title: "Box breathing · 6 minutes",       meta: "before class",       href: "/breathe" },
    { id: "ac3", ts: new Date(Date.now() - 6 * 3600e3).toISOString(),                kind: "mindgym",    title: "Focus lane · streak +1",          meta: "lv6 · +42 XP",      href: "/mindgym" },
    { id: "ac4", ts: new Date(Date.now() - 22 * 3600e3).toISOString(),               kind: "resource",   title: "Read: 'Naming what you feel'",    meta: "6 min read",         href: "/resources" },
    { id: "ac5", ts: new Date(Date.now() - 28 * 3600e3).toISOString(),               kind: "gratitude",  title: "Noticed: warm chai, quiet metro", meta: "gratitude tree +2",  href: "/gratitude" },
    { id: "ac6", ts: new Date(Date.now() - 2 * 24 * 3600e3).toISOString(),           kind: "buddy",      title: "Checked in with Ayaan",           meta: "12 messages",        href: "/buddies" },
    { id: "ac7", ts: new Date(Date.now() - 3 * 24 * 3600e3).toISOString(),           kind: "screening",  title: "Completed WHO-5 wellbeing",       meta: "score 17 / 25",     href: "/screening" },
    { id: "ac8", ts: new Date(Date.now() - 5 * 24 * 3600e3).toISOString(),           kind: "community",  title: "Helpful reply · 12 hearts",       meta: "in Late Nights",     href: "/community" },
  ],
  friends: [
    { id: "f1", name: "Ayaan Verma",   handle: "@ayaan",   mood: "focused", streak: 21, college: "Christ University", mutual: 4, status: "friend" },
    { id: "f2", name: "Priya Nair",    handle: "@priya.n", mood: "calm",    streak: 14, college: "St. Joseph's",       mutual: 2, status: "friend" },
    { id: "f3", name: "Dev Menon",     handle: "@dev",     mood: "quiet",   streak: 8,  college: "Christ University", mutual: 6, status: "friend" },
    { id: "f4", name: "Iris Fernandez", handle: "@iris",    mood: "gentle",  streak: 33, college: "St. Xavier's",       mutual: 1, status: "request-in" },
    { id: "f5", name: "Rohit Bansal",  handle: "@rohitb",  mood: "growing", streak: 4,  college: "IIT Bombay",         mutual: 0, status: "request-out" },
    { id: "f6", name: "Meher Kaul",    handle: "@meher",   mood: "bright",  streak: 45, college: "NIT Warangal",       mutual: 3, status: "suggested" },
    { id: "f7", name: "Ishaan Rao",    handle: "@ish",     mood: "tender",  streak: 2,  college: "Christ University", mutual: 5, status: "suggested" },
  ],
  bookmarks: [
    { id: "b1", kind: "article",    title: "How to sit with anxiety without fixing it", source: "Resources · Dr. Anaya", addedAt: "2026-06-01" },
    { id: "b2", kind: "video",      title: "5-minute grounding for exam stress",         source: "Video · PeaceCode",    addedAt: "2026-06-04" },
    { id: "b3", kind: "meditation", title: "Rainy afternoon body scan",                  source: "Audio · 12 min",       addedAt: "2026-06-08" },
    { id: "b4", kind: "exercise",   title: "Box breathing · slow variant",                source: "Breathe",              addedAt: "2026-06-12" },
    { id: "b5", kind: "post",       title: "How I made peace with slow mornings",        source: "Community · Late Nights", addedAt: "2026-06-20" },
    { id: "b6", kind: "article",    title: "The soft science of self-compassion",         source: "Resources",             addedAt: "2026-06-26" },
  ],
  widgets: ["mood", "journal", "garden", "achievements", "mindgym", "resources", "community", "peacebot", "counselling"],
  hiddenWidgets: [],
  privacy: {
    overview: "everyone", journey: "friends", achievements: "everyone",
    garden: "friends", activity: "only-me", stats: "only-me",
    friends: "friends", bookmarks: "only-me", interests: "everyone",
    emergency: "only-me",
  },
  garden: {
    level: 6, growthPct: 62, leaves: 148, flowers: 12, birds: 3,
    season: "summer", water: 74, nextMilestone: "First flower cluster · 8 leaves to go",
    history: [
      { week: "W-5", growth: 20 }, { week: "W-4", growth: 32 }, { week: "W-3", growth: 41 },
      { week: "W-2", growth: 48 }, { week: "W-1", growth: 55 }, { week: "This week", growth: 62 },
    ],
  },
  stats: {
    moodTrend: [58, 62, 60, 66, 71, 68, 74, 78],
    journalHeatmap: Array.from({ length: 63 }, (_, i) => (i % 7 === 3 || i % 5 === 0) ? 3 : (i % 3 === 0 ? 2 : (i % 2 === 0 ? 1 : 0))),
    breathingSessions: 34, avgSleep: 7.1, xp: 2480, resources: 41, contributions: 18, counselling: 3,
  },
  notifications: [
    { id: "n1", kind: "achievement", title: "You earned 'Growth Explorer'", at: new Date(Date.now() - 4 * 3600e3).toISOString(), read: false },
    { id: "n2", kind: "friend",      title: "Iris sent you a friend request", at: new Date(Date.now() - 26 * 3600e3).toISOString(), read: false },
    { id: "n3", kind: "reply",       title: "Ayaan replied to your journal",  at: new Date(Date.now() - 2 * 24 * 3600e3).toISOString(), read: true },
    { id: "n4", kind: "counsellor",  title: "Dr. Meera confirmed Wed 4pm",    at: new Date(Date.now() - 3 * 24 * 3600e3).toISOString(), read: true },
    { id: "n5", kind: "visitor",     title: "3 new profile visitors this week", at: new Date(Date.now() - 5 * 24 * 3600e3).toISOString(), read: true },
  ],
};

export function loadProfile(): Profile {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(KEY);
    const signed = currentDisplayName();
    const parsed = raw ? JSON.parse(raw) as Partial<Profile> : {};
    // Always overlay identity from the active session (or Guest fallback)
    // so a stale saved profile never leaks another student's name.
    const merged: Profile = { ...defaults, ...parsed, displayName: signed.full, preferredName: signed.first };
    if (signed.isGuest) {
      merged.username = "@guest";
      merged.verified = false;
    }
    return merged;
  } catch { return defaults; }
}
export function saveProfile(p: Profile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent("peacecode-profile-updated"));
}
export function updateProfile(patch: Partial<Profile>): Profile {
  const next = { ...loadProfile(), ...patch };
  saveProfile(next);
  return next;
}
export function resetProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

// Profile completion: 10 identity fields
const COMPLETION_FIELDS: (keyof Profile)[] = [
  "displayName", "bio", "about", "college", "degree", "pronouns",
  "birthday", "location", "photo", "cover",
];
export function completionPercent(p: Profile): { pct: number; missing: string[] } {
  const missing: string[] = [];
  let filled = 0;
  const nice: Record<string, string> = {
    displayName: "Add your name", bio: "Write a short bio", about: "Fill out About Me",
    college: "Add your college", degree: "Add your degree", pronouns: "Add pronouns",
    birthday: "Add birthday", location: "Add location", photo: "Upload profile photo", cover: "Upload cover photo",
  };
  for (const f of COMPLETION_FIELDS) {
    const v = p[f];
    if (typeof v === "string" && v.trim().length > 0) filled++;
    else if (Array.isArray(v) && v.length > 0) filled++;
    else missing.push(nice[f as string] ?? f);
  }
  return { pct: Math.round((filled / COMPLETION_FIELDS.length) * 100), missing };
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
