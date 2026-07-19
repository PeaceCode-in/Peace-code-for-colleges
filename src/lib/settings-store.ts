// PeaceCode — global settings store.
// Every value persists to localStorage. Appearance/accessibility changes
// are applied globally via CSS variables + data attributes.
import { currentDisplayName } from "./auth-store";


export type ThemeMode = "light" | "dark" | "auto" | "system";
export type Density = "compact" | "comfortable" | "spacious";
export type CardStyle = "elevated" | "flat" | "outlined";
export type ChartStyle = "smooth" | "sharp" | "dotted";
export type Personality = "gentle" | "friendly" | "motivational" | "professional" | "reflective";
export type ResponseLength = "short" | "balanced" | "detailed";

export type AccentKey = "lavender" | "blue" | "sky" | "moss" | "peach" | "rose" | "amber";
export const ACCENTS: Record<AccentKey, { name: string; primary: string; soft: string; ring: string }> = {
  lavender: { name: "Lavender", primary: "#7C6BC7", soft: "#D5C9F7", ring: "#B4A5F0" },
  blue:     { name: "Calm Blue", primary: "#4B6CB7", soft: "#AFC9F5", ring: "#7FA8E6" },
  sky:      { name: "Sky", primary: "#3E88C7", soft: "#B7DDF3", ring: "#77B7DF" },
  moss:     { name: "Moss", primary: "#5F8A6A", soft: "#CDE7D2", ring: "#93B79A" },
  peach:    { name: "Peach", primary: "#C77A5A", soft: "#F5D3BE", ring: "#E4A283" },
  rose:     { name: "Rose", primary: "#B0567A", soft: "#F1C7D6", ring: "#D68CA6" },
  amber:    { name: "Amber", primary: "#B08444", soft: "#EDD9B4", ring: "#D4B27B" },
};

// ─── Premium background themes ─────────────────────────────────
// Grainy, gradient canvases. Selected value persists to localStorage and
// applies globally by setting `html[data-pc-bg]`. Actual gradients + text
// tokens live in src/styles.css under `html[data-pc-bg="X"]`.
export type BgThemeKey =
  | "daylight" | "aurora"  | "dusk"    | "midnight"
  | "sage"     | "noir"    | "iris"    | "linen"
  | "ocean"    | "sunrise" | "lilac"   | "mint"
  | "ember"    | "graphite"| "sakura";
export const BG_THEMES: Record<BgThemeKey, { name: string; tone: "light" | "dark"; swatch: string[]; blurb: string }> = {
  daylight: { name: "Daylight",   tone: "light", swatch: ["#F7FAFF","#EAF3FF","#FFF5EE","#DDEEFF"], blurb: "Soft morning haze, our house default." },
  aurora:   { name: "Aurora",     tone: "light", swatch: ["#E9E4FF","#FCE7F3","#DDF1FF","#FFF1D6"], blurb: "Iridescent lavender and pink — Apple-like." },
  dusk:     { name: "Dusk",       tone: "light", swatch: ["#FFE7D6","#F8CAD7","#E9D6F5","#FFF2E6"], blurb: "Warm sunset peach with a rose whisper." },
  sage:     { name: "Sage Paper", tone: "light", swatch: ["#F1EFE6","#DDE7D6","#C7D6B8","#F7F4EB"], blurb: "Muted sage on warm paper. Very quiet." },
  linen:    { name: "Linen",      tone: "light", swatch: ["#FAF6F0","#F0E8DA","#E6D8C1","#FBF7EF"], blurb: "Cream and warm sand. Editorial calm." },
  ocean:    { name: "Ocean",      tone: "light", swatch: ["#D9EEF3","#B8D9E6","#95BFD1","#EAF6F8"], blurb: "Sea glass — cool teal on foam." },
  sunrise:  { name: "Sunrise",    tone: "light", swatch: ["#FFE4C7","#FFC8B4","#F6A69B","#FDEFD9"], blurb: "First light. Warm coral fade." },
  iris:     { name: "Iridescent", tone: "light", swatch: ["#C9F0F2","#E9D8FF","#FFE0EF","#F0F7FF"], blurb: "Vapor chrome — Y2K meets glass." },
  lilac:    { name: "Lilac Haze", tone: "light", swatch: ["#F3E8FF","#C7B4FF","#7A5CFF","#1E1447"], blurb: "Grainy pink to indigo — reference dream." },
  mint:     { name: "Fresh Mint", tone: "light", swatch: ["#E7F7EE","#CDEFD9","#A6DFB8","#F5FBF6"], blurb: "Cool, clean, ever-so-slightly minty." },
  sakura:   { name: "Sakura",     tone: "light", swatch: ["#FFEEF3","#FFD3E0","#F6B5CA","#FFF7FA"], blurb: "Cherry blossom — spring editorial." },
  ember:    { name: "Ember",      tone: "dark",  swatch: ["#1A0F0A","#3A1810","#7A2E1A","#E85D3A"], blurb: "Charcoal with warm ember glow." },
  graphite: { name: "Graphite",   tone: "dark",  swatch: ["#0F1116","#1A1D24","#2A3040","#8A9BB4"], blurb: "Slate paper — quiet, dense, focused." },
  midnight: { name: "Midnight",   tone: "dark",  swatch: ["#0B1020","#1B2140","#3A2E6B","#12203E"], blurb: "Deep navy with lavender aurora." },
  noir:     { name: "Noir Gold",  tone: "dark",  swatch: ["#0D0D0D","#1A1A1A","#3A2E1C","#C9A84C"], blurb: "Charcoal with a whisper of gold." },
};

export interface Settings {
  profile: {
    fullName: string;
    preferredName: string;
    studentId: string;
    college: string;
    degree: string;
    semester: string;
    pronouns: string;
    birthday: string;
    timezone: string;
    language: string;
    bio: string;
    wellnessGoal: string;
    interests: string[];
    emergencyName: string;
    emergencyPhone: string;
    photo?: string;
  };
  appearance: {
    theme: ThemeMode;
    accent: AccentKey;
    bgTheme: BgThemeKey;
    fontSize: number;     // px, 14–20
    density: Density;
    reduceMotion: boolean;
    glassEffects: boolean;
    roundedCorners: number; // 6–24
    cardStyle: CardStyle;
    chartStyle: ChartStyle;
    language: string;
  };
  accessibility: {
    highContrast: boolean;
    screenReader: boolean;
    keyboardNav: boolean;
    largeText: boolean;
    reduceAnim: boolean;
    voiceNav: boolean;
    captions: boolean;
    colorBlind: "none" | "protanopia" | "deuteranopia" | "tritanopia";
    readingWidth: "narrow" | "regular" | "wide";
    dyslexiaFont: boolean;
  };
  notifications: {
    channels: { push: boolean; email: boolean; desktop: boolean };
    quietHours: { enabled: boolean; from: string; to: string };
    dnd: boolean;
    frequency: "low" | "normal" | "high";
    types: Record<string, boolean>;
  };
  privacy: {
    twoFA: boolean;
    passkey: boolean;
    biometric: boolean;
    faceId: boolean;
    fingerprint: boolean;
    autoLock: number; // minutes, 0 = off
    pinLock: boolean;
    journalLock: boolean;
    gratitudePublic: boolean;
    communityVisible: boolean;
    anonymousDefault: boolean;
    hideOnline: boolean;
    hideActivity: boolean;
    buddyVisible: boolean;
    counsellingPrivate: boolean;
  };
  peacebot: {
    personality: Personality;
    responseLength: ResponseLength;
    memory: boolean;
    saveHistory: boolean;
    voiceSpeed: number; // 0.75–1.5
    voiceGender: "neutral" | "warm-f" | "warm-m";
    voiceLanguage: string;
    crisisDetection: boolean;
    dailyCheckin: boolean;
    suggestions: boolean;
    reflectionReminders: boolean;
    sleepReminders: boolean;
  };
  journal: {
    autosave: boolean;
    moodTracking: boolean;
    promptFrequency: "off" | "daily" | "weekly";
    templatesOn: boolean;
    privateDefault: boolean;
    passwordProtected: boolean;
    aiAnalysis: boolean;
    dailyGoal: number;
  };
  breathing: {
    preferred: string;
    duration: number; // minutes
    background: string;
    vibration: boolean;
    autoStart: boolean;
    focusTimer: boolean;
    dailyGoal: number;
    reminderTime: string;
    defaultLength: number;
  };
  community: {
    anonymousDefault: boolean;
    publicProfile: boolean;
    showAchievements: boolean;
    allowMessages: boolean;
    allowFriendRequests: boolean;
    interests: string[];
  };
  resources: {
    topics: string[];
    contentTypes: string[];
    languages: string[];
    readingTime: "any" | "short" | "medium" | "long";
    recommendations: boolean;
  };
  connected: Record<string, boolean>; // e.g. { google: true, apple: false, ... }
  emergency: {
    contactName: string;
    contactPhone: string;
    sosNumbers: string[];
    shareLocation: boolean;
    quickMessage: string;
    safeCheckIn: boolean;
  };
  betaEnrolled: boolean;
}

const KEY = "peacecode.settings.v1";
const ACTIVITY_KEY = "peacecode.settings.activity.v1";

const defaults: Settings = {
  profile: {
    fullName: "Keya Sharma",
    preferredName: "Keya",
    studentId: "SIH-2024-1187",
    college: "IIT Delhi",
    degree: "B.Tech Computer Science",
    semester: "5",
    pronouns: "she/her",
    birthday: "2003-04-12",
    timezone: "Asia/Kolkata",
    language: "English",
    bio: "trying to be a little softer to myself, one day at a time.",
    wellnessGoal: "sleep before midnight, three nights a week.",
    interests: ["mindfulness", "reading", "music"],
    emergencyName: "Ma",
    emergencyPhone: "+91 98••••••••",
  },
  appearance: {
    theme: "light",
    accent: "rose",
    bgTheme: "sakura",
    fontSize: 16,
    density: "comfortable",
    reduceMotion: false,
    glassEffects: true,
    roundedCorners: 16,
    cardStyle: "elevated",
    chartStyle: "smooth",
    language: "English",
  },
  accessibility: {
    highContrast: false,
    screenReader: false,
    keyboardNav: true,
    largeText: false,
    reduceAnim: false,
    voiceNav: false,
    captions: false,
    colorBlind: "none",
    readingWidth: "regular",
    dyslexiaFont: false,
  },
  notifications: {
    channels: { push: true, email: true, desktop: false },
    quietHours: { enabled: true, from: "22:00", to: "07:00" },
    dnd: false,
    frequency: "normal",
    types: {
      dailyReminders: true, journalReminders: true, breathingReminders: true,
      meditationReminders: true, counsellingReminders: true, appointmentReminders: true,
      homeworkReminders: true, peaceBuddy: true, communityReplies: true,
      peacebotUpdates: true, achievements: true, weeklyReport: true, monthlyReport: false,
    },
  },
  privacy: {
    twoFA: false, passkey: false, biometric: false, faceId: false, fingerprint: false,
    autoLock: 5, pinLock: false, journalLock: true, gratitudePublic: false,
    communityVisible: true, anonymousDefault: true, hideOnline: false, hideActivity: false,
    buddyVisible: true, counsellingPrivate: true,
  },
  peacebot: {
    personality: "gentle", responseLength: "balanced", memory: true, saveHistory: true,
    voiceSpeed: 1, voiceGender: "warm-f", voiceLanguage: "English",
    crisisDetection: true, dailyCheckin: true, suggestions: true,
    reflectionReminders: true, sleepReminders: false,
  },
  journal: {
    autosave: true, moodTracking: true, promptFrequency: "daily", templatesOn: true,
    privateDefault: true, passwordProtected: false, aiAnalysis: true, dailyGoal: 1,
  },
  breathing: {
    preferred: "box", duration: 5, background: "silence", vibration: false,
    autoStart: false, focusTimer: true, dailyGoal: 5, reminderTime: "21:00", defaultLength: 5,
  },
  community: {
    anonymousDefault: true, publicProfile: false, showAchievements: true,
    allowMessages: true, allowFriendRequests: true,
    interests: ["mindfulness", "study-stress", "sleep"],
  },
  resources: {
    topics: ["Stress", "Sleep", "Exam Anxiety"],
    contentTypes: ["Articles", "Videos", "Podcasts"],
    languages: ["English", "Hindi"],
    readingTime: "any",
    recommendations: true,
  },
  connected: { google: true, apple: false, microsoft: false, collegeSSO: false, calendar: true, googleFit: false, appleHealth: false, fitbit: false, garmin: false },
  emergency: {
    contactName: "Ma",
    contactPhone: "+91 98••••••••",
    sosNumbers: ["112", "iCall +91 9152987821", "Vandrevala 1860-2662-345"],
    shareLocation: false,
    quickMessage: "I need help. Please call me.",
    safeCheckIn: true,
  },
  betaEnrolled: false,
};

// deep merge helper for restoring partial saved shape
function merge<T>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const k of Object.keys(patch as object)) {
    const bv = (base as Record<string, unknown>)[k];
    const pv = (patch as Record<string, unknown>)[k];
    if (bv && typeof bv === "object" && !Array.isArray(bv) && pv && typeof pv === "object" && !Array.isArray(pv)) {
      out[k] = merge(bv, pv);
    } else if (pv !== undefined) {
      out[k] = pv;
    }
  }
  return out as T;
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(KEY);
    const base = raw ? merge(defaults, JSON.parse(raw)) : defaults;
    const who = currentDisplayName();
    return { ...base, profile: { ...base.profile, fullName: who.full, preferredName: who.first } };
  } catch { return defaults; }
}

export function saveSettings(next: Settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("peacecode-settings", { detail: next }));
  applyAppearance(next);
  applyAccessibility(next);
}

// ─── Activity log ─────────────────────────────────────────────
export type Activity = { id: string; label: string; ts: string };
export function logActivity(label: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    const list: Activity[] = raw ? JSON.parse(raw) : [];
    list.unshift({ id: `a-${Date.now()}`, label, ts: new Date().toISOString() });
    window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list.slice(0, 30)));
  } catch {}
}
export function loadActivity(): Activity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ─── Appearance application ───────────────────────────────────
export function applyAppearance(s: Settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const a = s.appearance;

  // Background theme (writes html[data-pc-bg]; CSS in styles.css does the rest)
  const bg = (a.bgTheme && BG_THEMES[a.bgTheme]) ? a.bgTheme : "sakura";
  root.setAttribute("data-pc-bg", bg);

  // Theme mode: dark presets force dark; user override still wins if explicit.
  const preset = BG_THEMES[bg];
  let mode: "light" | "dark" = preset.tone === "dark" ? "dark" : "light";
  if (a.theme === "dark") mode = "dark";
  else if (a.theme === "light") mode = "light";
  else if (a.theme === "auto" || a.theme === "system") {
    mode = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : preset.tone;
  }
  root.classList.toggle("dark", mode === "dark");
  root.setAttribute("data-theme", mode);
  try { localStorage.setItem("peacecode.theme.v1", mode); } catch {}

  // Accent
  const acc = ACCENTS[a.accent] ?? ACCENTS.blue;
  root.style.setProperty("--pc-primary", acc.primary);
  root.style.setProperty("--pc-soft", acc.soft);
  root.style.setProperty("--pc-aurora-b", acc.soft);

  // Font size (base rem)
  const sizeAdjusted = s.accessibility.largeText ? Math.max(a.fontSize, 18) : a.fontSize;
  root.style.fontSize = `${sizeAdjusted}px`;

  // Density → spacing scale
  root.setAttribute("data-density", a.density);

  // Motion / effects
  root.setAttribute("data-motion", (a.reduceMotion || s.accessibility.reduceAnim) ? "reduced" : "on");
  root.setAttribute("data-glass", a.glassEffects ? "on" : "off");
  root.setAttribute("data-card-style", a.cardStyle);
  root.setAttribute("data-chart-style", a.chartStyle);
  root.style.setProperty("--pc-radius-scale", `${a.roundedCorners}px`);
  root.style.setProperty("--radius", `${a.roundedCorners}px`);
}

export function applyAccessibility(s: Settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const ax = s.accessibility;
  root.setAttribute("data-contrast", ax.highContrast ? "high" : "normal");
  root.setAttribute("data-colorblind", ax.colorBlind);
  root.setAttribute("data-reading", ax.readingWidth);
  root.setAttribute("data-dyslexia", ax.dyslexiaFont ? "on" : "off");
}

// ─── React hook ───────────────────────────────────────────────
import { useEffect, useState } from "react";

export function useSettings(): [Settings, (patch: (s: Settings) => Settings, activityLabel?: string) => void] {
  const [s, setS] = useState<Settings>(defaults);
  useEffect(() => {
    const initial = loadSettings();
    setS(initial);
    applyAppearance(initial);
    applyAccessibility(initial);
    const onSync = (e: Event) => setS((e as CustomEvent<Settings>).detail);
    window.addEventListener("peacecode-settings", onSync);
    return () => window.removeEventListener("peacecode-settings", onSync);
  }, []);
  const update = (patch: (s: Settings) => Settings, activityLabel?: string) => {
    setS((prev) => {
      const next = patch(prev);
      saveSettings(next);
      if (activityLabel) logActivity(activityLabel);
      return next;
    });
  };
  return [s, update];
}

// ─── Search index for settings ───────────────────────────────
export const SETTINGS_INDEX: { label: string; to: string; hint: string; keywords: string[] }[] = [
  { label: "Profile", to: "/settings/profile", hint: "name, college, bio, birthday", keywords: ["profile","name","bio","student","college","photo","birthday","timezone","pronouns","interests","emergency"] },
  { label: "Notifications", to: "/settings/notifications", hint: "reminders, quiet hours, dnd", keywords: ["notifications","reminders","push","email","quiet","dnd","frequency","weekly","monthly"] },
  { label: "Privacy & Security", to: "/settings/privacy", hint: "password, 2FA, biometrics", keywords: ["privacy","security","password","2fa","biometric","face","fingerprint","lock","pin","delete","export"] },
  { label: "Appearance", to: "/settings/appearance", hint: "theme, accent, font", keywords: ["appearance","theme","dark","light","accent","color","font","density","motion","glass","corners","radius"] },
  { label: "Accessibility", to: "/settings/accessibility", hint: "contrast, large text, dyslexia", keywords: ["accessibility","contrast","screen reader","large text","captions","dyslexia","color blind","reading width","keyboard","voice"] },
  { label: "PeaceBot", to: "/settings/peacebot", hint: "AI personality, voice, memory", keywords: ["peacebot","ai","personality","voice","memory","reminder","reflection","sleep","crisis"] },
  { label: "Journal", to: "/settings/journal", hint: "autosave, prompts, streak", keywords: ["journal","autosave","mood","prompt","template","private","password","ai analysis","daily"] },
  { label: "Breathing", to: "/settings/breathing", hint: "session length, sounds", keywords: ["breathing","breathe","exercise","duration","sound","vibration","reminder","focus"] },
  { label: "Community", to: "/settings/community", hint: "profile, requests, mutes", keywords: ["community","anonymous","public","achievements","messages","friend","block","mute","interests"] },
  { label: "Resources", to: "/settings/resources", hint: "topics, content type", keywords: ["resources","topics","stress","sleep","anxiety","content","language","recommendations"] },
  { label: "Data & Storage", to: "/settings/data", hint: "cache, backup, sync", keywords: ["data","storage","cache","backup","sync","offline","downloads","media"] },
  { label: "Connected Accounts", to: "/settings/connected", hint: "google, apple, wearables", keywords: ["connected","google","apple","microsoft","sso","calendar","fit","health","fitbit","garmin"] },
  { label: "Emergency & Safety", to: "/settings/emergency", hint: "SOS, contact, helplines", keywords: ["emergency","safety","sos","helpline","contact","location","panic","check-in"] },
  { label: "Support", to: "/settings/support", hint: "help centre, feedback", keywords: ["support","help","faq","bug","feedback","rate","privacy policy","terms"] },
  { label: "About PeaceCode", to: "/settings/about", hint: "version, team, roadmap", keywords: ["about","version","build","team","open source","acknowledgements","whats new","roadmap","beta"] },
  { label: "Log out", to: "/settings/logout", hint: "sign out of PeaceCode", keywords: ["logout","log out","sign out"] },
];
