// PeaceCode — Product Hub store
// What's New · Themes · Integrations — all mock, all persistent to localStorage.

export type ReleaseType = "major" | "minor" | "patch";
export type ChangeKind = "feature" | "ui" | "perf" | "ai" | "security" | "fix";

export type ChangeEntry = { kind: ChangeKind; title: string; detail?: string };
export type Release = {
  version: string;             // e.g. "2.4.0"
  date: string;                // ISO
  type: ReleaseType;
  codename: string;
  headline: string;
  highlights: string[];
  changes: ChangeEntry[];
  knownIssues: string[];
  devNotes?: string;
  hue: string;
};

export type RoadmapItem = {
  id: string;
  title: string;
  summary: string;
  category: "AI" | "Wellness" | "Community" | "Integrations" | "Design" | "Performance";
  status: "now" | "coming" | "in_dev" | "planned" | "completed";
  progress: number;           // 0-100
  eta: string;
  votes: number;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  kind: "system" | "maintenance" | "campus" | "campaign" | "release";
  at: string;                 // ISO
};

export type FeatureRequest = {
  id: string;
  title: string;
  body: string;
  by: string;
  at: number;
  votes: number;
  comments: number;
  bookmarked?: boolean;
  status: "open" | "planned" | "in_dev" | "shipped";
};

export type ThemeCategory =
  | "Minimal" | "Lavender" | "Ocean" | "Forest" | "Cloud" | "Sunrise" | "Midnight"
  | "Paper" | "Glass" | "Gradient" | "Monochrome" | "Student Mode" | "Festival" | "Seasonal";

export type ThemeItem = {
  id: string;
  name: string;
  tagline: string;
  category: ThemeCategory;
  premium: boolean;
  developer: string;
  downloads: number;
  colors: [string, string, string, string]; // bg, surface, accent, ink
  radius: "sm" | "md" | "lg" | "xl";
  fontHeading: string;
  fontBody: string;
  animation: "quiet" | "gentle" | "playful";
  createdAt: string;
  trending?: boolean;
  featured?: boolean;
  seasonal?: boolean;
};

export type Integration = {
  id: string;
  name: string;
  tagline: string;
  category: "Calendar" | "Files" | "Health" | "Music" | "Productivity" | "Comms" | "Campus";
  brandHue: string;
  monogram: string;
  permissions: { key: string; label: string; kind: "read" | "write" }[];
  syncFrequencies: string[];
  privacyUrl?: string;
};

// ─── persistence ──────────────────────────────────────────────
type Persist = {
  installedThemes: string[];
  favoriteThemes: string[];
  activeTheme?: string;
  connectedIntegrations: Record<string, {
    connectedAt: number;
    lastSync?: number;
    frequency: string;
    autoSync: boolean;
    backgroundSync: boolean;
    permissions: Record<string, boolean>;
  }>;
  betaEnrolled: boolean;
  featureVotes: Record<string, boolean>;
  requestVotes: Record<string, boolean>;
  requestBookmarks: Record<string, boolean>;
  userRequests: FeatureRequest[];
  customization: {
    accent: string;
    fontScale: number;
    radius: number;
    animation: number;   // 0 slow – 100 fast
    density: "compact" | "comfortable" | "spacious";
    glass: number;       // 0-100
    gradient: number;    // 0-100
  };
  widgets: WidgetConfig[];
  profileTheme: { banner: string; frame: string; card: string };
};

export type WidgetConfig = {
  key: "journal" | "mindgym" | "peacebot" | "resources" | "community" | "calendar" | "stats" | "gratitude" | "breathe";
  label: string;
  visible: boolean;
  pinned: boolean;
  size: "s" | "m" | "l";
};

const KEY = "peacecode.hub.v1";
const empty: Persist = {
  installedThemes: [], favoriteThemes: [],
  connectedIntegrations: {},
  betaEnrolled: false,
  featureVotes: {}, requestVotes: {}, requestBookmarks: {},
  userRequests: [],
  customization: { accent: "sky", fontScale: 100, radius: 22, animation: 60, density: "comfortable", glass: 60, gradient: 40 },
  widgets: [
    { key: "journal",   label: "Journal",     visible: true,  pinned: true,  size: "m" },
    { key: "mindgym",   label: "Mind Gym",    visible: true,  pinned: false, size: "s" },
    { key: "peacebot",  label: "PeaceBot",    visible: true,  pinned: true,  size: "l" },
    { key: "resources", label: "Resources",   visible: true,  pinned: false, size: "m" },
    { key: "community", label: "Community",   visible: true,  pinned: false, size: "s" },
    { key: "calendar",  label: "Calendar",    visible: true,  pinned: false, size: "m" },
    { key: "stats",     label: "Statistics",  visible: false, pinned: false, size: "s" },
    { key: "gratitude", label: "Gratitude",   visible: true,  pinned: false, size: "s" },
    { key: "breathe",   label: "Breathe",     visible: true,  pinned: false, size: "s" },
  ],
  profileTheme: { banner: "aurora", frame: "soft-ring", card: "quiet-paper" },
};

function load(): Persist {
  if (typeof window === "undefined") return { ...empty, widgets: [...empty.widgets] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...empty, widgets: [...empty.widgets] };
    const parsed = JSON.parse(raw) as Partial<Persist>;
    return {
      ...empty,
      ...parsed,
      customization: { ...empty.customization, ...(parsed.customization ?? {}) },
      widgets: parsed.widgets && parsed.widgets.length ? parsed.widgets : [...empty.widgets],
      profileTheme: { ...empty.profileTheme, ...(parsed.profileTheme ?? {}) },
    };
  } catch { return { ...empty, widgets: [...empty.widgets] }; }
}
function save(p: Persist) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  try { window.dispatchEvent(new Event("peacecode-hub-changed")); } catch {}
}

// ─── current version ──────────────────────────────────────────
export const CURRENT_VERSION = "2.4.0";

// ─── seeded releases ──────────────────────────────────────────
export const releases: Release[] = [
  {
    version: "2.4.0", date: "2026-07-10", type: "minor", codename: "Aurora",
    headline: "Softer surfaces. Sharper thinking.",
    highlights: [
      "PeaceBot 2 — warmer voice, longer memory",
      "Mind Gym daily quests",
      "New Aurora light theme",
    ],
    changes: [
      { kind: "feature", title: "PeaceBot v2",       detail: "Longer conversational memory, softer tone, faster replies." },
      { kind: "feature", title: "Mind Gym daily quests", detail: "One tiny challenge each day, streaks intact." },
      { kind: "feature", title: "Aurora theme",     detail: "Pastel sky-glass palette across the whole app." },
      { kind: "ui",      title: "Rounder buttons",  detail: "Tap targets are now more finger-friendly." },
      { kind: "perf",    title: "20% faster launch" },
      { kind: "ai",      title: "Journal insights", detail: "Weekly reflection cards written by PeaceBot." },
      { kind: "security",title: "Journal PIN v2",   detail: "Optional biometric unlock on supported devices." },
      { kind: "fix",     title: "Timer drift on iOS" },
    ],
    knownIssues: ["Widget order sometimes resets after logout — being fixed."],
    devNotes: "This release is optimized for on-device caching. Journal syncs less, feels faster.",
    hue: "#c6d9ee",
  },
  {
    version: "2.3.2", date: "2026-06-22", type: "patch", codename: "Wren",
    headline: "Tiny fixes, a lot smoother.",
    highlights: ["Calmer haptics", "Fewer notification stacks", "Breathe timer accuracy"],
    changes: [
      { kind: "fix",  title: "Breathe timer no longer drifts" },
      { kind: "fix",  title: "Achievements duplication" },
      { kind: "perf", title: "Search latency -35%" },
      { kind: "ui",   title: "Softer haptics on iOS" },
    ],
    knownIssues: [],
    hue: "#e5d3b3",
  },
  {
    version: "2.3.0", date: "2026-06-01", type: "minor", codename: "Wildflower",
    headline: "Community, quieter.",
    highlights: ["Peer Circles beta", "Gratitude Wall v2", "Focus soundscapes"],
    changes: [
      { kind: "feature", title: "Peer Circles",        detail: "12-person safe rooms with a soft facilitator." },
      { kind: "feature", title: "Gratitude Wall v2",   detail: "Reactions, kind-tags, quiet mode." },
      { kind: "ai",      title: "PeaceBot follow-ups", detail: "Gentle check-ins on tough days." },
      { kind: "ui",      title: "Editorial dashboard" },
      { kind: "fix",     title: "Login retry loop" },
    ],
    knownIssues: [],
    hue: "#bcd0b3",
  },
  {
    version: "2.2.0", date: "2026-05-10", type: "minor", codename: "Nimbus",
    headline: "The Mind Gym opens.",
    highlights: ["Mind Gym launch", "37 exercises", "Skill DNA visualisations"],
    changes: [
      { kind: "feature", title: "Mind Gym" },
      { kind: "feature", title: "Brain Score" },
      { kind: "ui",      title: "Fresh dashboard rings" },
      { kind: "perf",    title: "Cold start -22%" },
    ],
    knownIssues: [],
    hue: "#d4c6ea",
  },
  {
    version: "2.1.0", date: "2026-04-04", type: "minor", codename: "Sable",
    headline: "Emergency Center + Peace Buddies.",
    highlights: ["Emergency toolkit", "Peace Buddies matching", "Journaling improvements"],
    changes: [
      { kind: "feature", title: "Emergency Center" },
      { kind: "feature", title: "Peace Buddies" },
      { kind: "ai",      title: "Nightly reflection prompts" },
    ],
    knownIssues: [],
    hue: "#e8cfc7",
  },
];

export function releaseByVersion(v: string) { return releases.find((r) => r.version === v); }

// ─── roadmap ──────────────────────────────────────────────────
export const roadmap: RoadmapItem[] = [
  { id: "rm-widgets", title: "Home screen widgets",       summary: "iOS and Android widgets for streaks, journal, breathe.", category: "Design",       status: "now",       progress: 85, eta: "This month",  votes: 1284 },
  { id: "rm-voice",   title: "PeaceBot voice mode v2",     summary: "Softer voice, natural interruptions, offline mode.",    category: "AI",           status: "in_dev",    progress: 60, eta: "August",      votes: 964  },
  { id: "rm-fit",     title: "Deep Google Fit integration",summary: "Steps, sleep and heart rate into wellness cards.",      category: "Integrations", status: "coming",    progress: 30, eta: "September",   votes: 812  },
  { id: "rm-groups",  title: "Study Group scheduling",     summary: "Auto-suggested study circles based on subjects.",       category: "Community",    status: "planned",   progress: 10, eta: "Later this year", votes: 604 },
  { id: "rm-perf",    title: "50% faster cold start",      summary: "Everything opens twice as fast.",                        category: "Performance",  status: "in_dev",    progress: 55, eta: "August",      votes: 502 },
  { id: "rm-color",   title: "Custom accent generator",    summary: "Pick an image, get a soft palette.",                     category: "Design",       status: "planned",   progress: 5,  eta: "TBD",         votes: 388 },
  { id: "rm-cal",     title: "Two-way Google Calendar",    summary: "PeaceCode events show up in Google, and back.",         category: "Integrations", status: "coming",    progress: 25, eta: "August",      votes: 771 },
  { id: "rm-ai",      title: "AI Study Coach",             summary: "PeaceBot helps plan revision weeks.",                     category: "AI",           status: "planned",   progress: 8,  eta: "Q4",          votes: 690 },
  { id: "rm-emerg",   title: "Local emergency directory",  summary: "Verified helplines by city, updated monthly.",           category: "Wellness",     status: "completed", progress: 100,eta: "Shipped v2.1", votes: 420 },
  { id: "rm-mindgym", title: "Mind Gym multiplayer",       summary: "Play a round with a buddy.",                             category: "Community",    status: "planned",   progress: 0,  eta: "TBD",         votes: 355 },
];

export function roadmapById(id: string) { return roadmap.find((r) => r.id === id); }

// ─── announcements ────────────────────────────────────────────
export const announcements: Announcement[] = [
  { id: "a-2.4",    title: "PeaceCode 2.4 — Aurora is live",   body: "New PeaceBot, softer UI, Mind Gym daily quests.", kind: "release",    at: "2026-07-10T08:00:00Z" },
  { id: "a-camp",   title: "Exam Week Campaign",                body: "Quiet rooms, breathing sessions, and free counselling slots this week.", kind: "campaign", at: "2026-07-07T08:00:00Z" },
  { id: "a-maint",  title: "Scheduled maintenance July 14",     body: "Login may be slow between 03:00–03:30 IST.",       kind: "maintenance",at: "2026-07-05T08:00:00Z" },
  { id: "a-camp2",  title: "New IIT Bombay campus partner",     body: "Peace Buddies + counselling live for IITB.",       kind: "campus",     at: "2026-07-02T08:00:00Z" },
  { id: "a-sys",    title: "Improved journal encryption",       body: "Your entries are now protected end-to-end by default.", kind: "system", at: "2026-06-28T08:00:00Z" },
];

// ─── themes (24 seeded) ───────────────────────────────────────
export const themes: ThemeItem[] = [
  { id: "th-aurora",     name: "Aurora",         tagline: "Soft sky, warm dawn.",     category: "Minimal",   premium: false, developer: "PeaceCode Studio", downloads: 12480, colors: ["#f5f7fb","#ffffff","#7fa5d8","#22323e"], radius: "lg", fontHeading: "Fraunces", fontBody: "DM Sans",   animation: "gentle",  createdAt: "2026-07-10", featured: true, trending: true },
  { id: "th-lavender",   name: "Lavender Dream", tagline: "Dusk, held soft.",         category: "Lavender",  premium: false, developer: "PeaceCode Studio", downloads: 9821,  colors: ["#f6f2ff","#ffffff","#8a7ec9","#2a2540"], radius: "xl", fontHeading: "Cormorant", fontBody: "Karla",  animation: "gentle",  createdAt: "2026-07-01", featured: true },
  { id: "th-ocean",      name: "Ocean Deep",     tagline: "Calm, at depth.",          category: "Ocean",     premium: false, developer: "PeaceCode Studio", downloads: 8410,  colors: ["#eff6fb","#ffffff","#3b7d99","#0c2340"], radius: "lg", fontHeading: "Lora",    fontBody: "Inter",     animation: "quiet",   createdAt: "2026-06-14", trending: true },
  { id: "th-forest",     name: "Forest Moss",    tagline: "Grounded, quiet green.",   category: "Forest",    premium: false, developer: "Studio Prana",     downloads: 7230,  colors: ["#f2f5ee","#ffffff","#6b8a5d","#1a3c2a"], radius: "md", fontHeading: "Fraunces", fontBody: "DM Sans",  animation: "quiet",   createdAt: "2026-06-01" },
  { id: "th-cloud",      name: "Cloud",          tagline: "Pale, unhurried.",         category: "Cloud",     premium: false, developer: "PeaceCode Studio", downloads: 15102, colors: ["#f8fafc","#ffffff","#8ea8c4","#22323e"], radius: "xl", fontHeading: "Instrument Serif", fontBody: "Work Sans", animation: "quiet",   createdAt: "2026-05-04", featured: true },
  { id: "th-sunrise",    name: "Sunrise",        tagline: "First light on skin.",     category: "Sunrise",   premium: true,  developer: "Soft Studio",       downloads: 4210,  colors: ["#fff3ea","#fffaf5","#e88a68","#4a2a1c"], radius: "lg", fontHeading: "DM Serif Display", fontBody: "Fira Sans", animation: "gentle",  createdAt: "2026-06-20" },
  { id: "th-midnight",   name: "Midnight",       tagline: "Late-study calm.",         category: "Midnight",  premium: true,  developer: "PeaceCode Studio", downloads: 6820,  colors: ["#0f172a","#141b2e","#7fa5d8","#e8ecf3"], radius: "lg", fontHeading: "Fraunces", fontBody: "DM Sans",   animation: "quiet",   createdAt: "2026-06-11", trending: true },
  { id: "th-paper",      name: "Paper",          tagline: "Ink on cream.",            category: "Paper",     premium: false, developer: "Slow Ink",         downloads: 5410,  colors: ["#faf6ee","#ffffff","#4a4a4a","#1a1a1a"], radius: "sm", fontHeading: "Libre Baskerville", fontBody: "IBM Plex Sans", animation: "quiet",   createdAt: "2026-05-01" },
  { id: "th-glass",      name: "Glass",          tagline: "Translucent everywhere.",  category: "Glass",     premium: true,  developer: "PeaceCode Labs",   downloads: 3812,  colors: ["#eef2f8","#ffffffcc","#8fb0d2","#1a2440"], radius: "xl", fontHeading: "Sora",    fontBody: "Manrope",   animation: "playful", createdAt: "2026-07-04", featured: true, trending: true },
  { id: "th-mono",       name: "Monochrome",     tagline: "One shade of quiet.",      category: "Monochrome",premium: false, developer: "Paper Studio",     downloads: 4901,  colors: ["#f5f5f5","#ffffff","#333333","#0a0a0a"], radius: "md", fontHeading: "Space Grotesk", fontBody: "DM Sans",   animation: "quiet",   createdAt: "2026-04-22" },
  { id: "th-gradient",   name: "Sky Gradient",   tagline: "Slow color, softly.",      category: "Gradient",  premium: true,  developer: "PeaceCode Labs",   downloads: 4102,  colors: ["#eef4ff","#fff5ee","#c9a0dc","#22323e"], radius: "xl", fontHeading: "Syne",    fontBody: "Plus Jakarta", animation: "playful", createdAt: "2026-06-05" },
  { id: "th-student",    name: "Student Mode",   tagline: "Focus, first.",            category: "Student Mode", premium: false, developer: "PeaceCode Studio", downloads: 8290, colors: ["#faf9f6","#ffffff","#a08a5c","#22323e"], radius: "md", fontHeading: "Fraunces", fontBody: "DM Sans",   animation: "quiet",   createdAt: "2026-05-18" },
  { id: "th-diwali",     name: "Diwali",         tagline: "Warm lamps, quiet home.",  category: "Festival",  premium: true,  developer: "PeaceCode Studio", downloads: 3210,  colors: ["#fff5e3","#fffcf3","#c47a2a","#3b1e0e"], radius: "lg", fontHeading: "Abril Fatface", fontBody: "Cabin", animation: "gentle",  createdAt: "2025-10-30", seasonal: true },
  { id: "th-holi",       name: "Holi",           tagline: "Every color, kindly.",     category: "Festival",  premium: true,  developer: "PeaceCode Studio", downloads: 2810,  colors: ["#fff0f6","#ffffff","#e46aa0","#2a1830"], radius: "lg", fontHeading: "Syne",    fontBody: "Plus Jakarta", animation: "playful", createdAt: "2026-03-01", seasonal: true },
  { id: "th-monsoon",    name: "Monsoon",        tagline: "Petrichor palette.",       category: "Seasonal",  premium: false, developer: "Studio Prana",     downloads: 3510,  colors: ["#eaf1ee","#ffffff","#5a7d78","#22323e"], radius: "md", fontHeading: "Lora",    fontBody: "Nunito Sans", animation: "quiet",   createdAt: "2026-06-14", seasonal: true },
  { id: "th-winter",     name: "Winter Frost",   tagline: "Icy, hushed.",             category: "Seasonal",  premium: false, developer: "Slow Ink",         downloads: 3010,  colors: ["#eef4fa","#ffffff","#6ba3c8","#0c2340"], radius: "lg", fontHeading: "Fraunces", fontBody: "DM Sans",   animation: "quiet",   createdAt: "2025-12-15", seasonal: true },
  { id: "th-linen",      name: "Linen",          tagline: "Warm, worn, kind.",        category: "Minimal",   premium: false, developer: "Soft Studio",       downloads: 6210,  colors: ["#f7f2e9","#ffffff","#a08a5c","#3d2a1a"], radius: "md", fontHeading: "Cormorant", fontBody: "Karla",  animation: "quiet",   createdAt: "2026-05-30" },
  { id: "th-pastel",     name: "Pastel Meadow",  tagline: "Small joys.",              category: "Gradient",  premium: false, developer: "PeaceCode Studio", downloads: 4610,  colors: ["#fff5ee","#f4f2ff","#c0a8de","#3b3352"], radius: "xl", fontHeading: "Syne",    fontBody: "Plus Jakarta", animation: "gentle",  createdAt: "2026-04-30" },
  { id: "th-slate",      name: "Slate",          tagline: "Cool, quiet grays.",       category: "Monochrome",premium: false, developer: "Paper Studio",     downloads: 3801,  colors: ["#f2f4f6","#ffffff","#5a6474","#1a1a1a"], radius: "md", fontHeading: "Space Grotesk", fontBody: "Inter",   animation: "quiet",   createdAt: "2026-03-20" },
  { id: "th-terra",      name: "Terracotta",     tagline: "Earthed and warm.",         category: "Minimal",   premium: true,  developer: "Soft Studio",       downloads: 2510,  colors: ["#fbf1e6","#ffffff","#c96b4a","#4a2a1c"], radius: "lg", fontHeading: "DM Serif Display", fontBody: "Fira Sans", animation: "gentle",  createdAt: "2026-05-15" },
  { id: "th-mint",       name: "Neon Mint",      tagline: "Quiet in the dark.",       category: "Midnight",  premium: true,  developer: "PeaceCode Labs",   downloads: 1810,  colors: ["#0f1d16","#132a1f","#4ade80","#e5f6e5"], radius: "lg", fontHeading: "Space Grotesk", fontBody: "DM Sans",   animation: "playful", createdAt: "2026-06-25" },
  { id: "th-vapor",      name: "Vapor",          tagline: "Iridescent quiet.",         category: "Gradient",  premium: true,  developer: "PeaceCode Labs",   downloads: 1420,  colors: ["#f2eefb","#eef4ff","#a78bfa","#1a1a2e"], radius: "xl", fontHeading: "Syne",    fontBody: "Plus Jakarta", animation: "playful", createdAt: "2026-07-05", trending: true },
  { id: "th-brutalist",  name: "Brutalist Pop",  tagline: "One accent, loud.",         category: "Monochrome",premium: false, developer: "Paper Studio",     downloads: 1210,  colors: ["#ffffff","#f5f5f5","#ff5722","#0a0a0a"], radius: "sm", fontHeading: "Archivo Black", fontBody: "Hind", animation: "playful", createdAt: "2026-02-14" },
  { id: "th-emerald",    name: "Emerald Prestige", tagline: "Rich green, gold, hush.", category: "Forest",   premium: true,  developer: "Studio Prana",     downloads: 1010,  colors: ["#f5f0e0","#ffffff","#0d7a5f","#064e3b"], radius: "lg", fontHeading: "Cormorant", fontBody: "Karla",  animation: "gentle",  createdAt: "2026-05-27" },
];
export function themeById(id: string) { return themes.find((t) => t.id === id); }

// ─── integrations ─────────────────────────────────────────────
export const integrations: Integration[] = [
  { id: "int-gcal",     name: "Google Calendar",  tagline: "Sync events both ways.",        category: "Calendar",    brandHue: "#4285F4", monogram: "G", permissions: [{ key: "cal.read", label: "Read events", kind: "read" }, { key: "cal.write", label: "Create events", kind: "write" }], syncFrequencies: ["Real-time", "Every 15 min", "Hourly", "Manual only"] },
  { id: "int-apple",    name: "Apple Calendar",   tagline: "Native macOS/iOS sync.",         category: "Calendar",    brandHue: "#000000", monogram: "A", permissions: [{ key: "cal.read", label: "Read events", kind: "read" }, { key: "cal.write", label: "Create events", kind: "write" }], syncFrequencies: ["Real-time", "Hourly", "Manual only"] },
  { id: "int-outlook",  name: "Outlook",          tagline: "Work + college accounts.",       category: "Calendar",    brandHue: "#0072C6", monogram: "O", permissions: [{ key: "cal.read", label: "Read events", kind: "read" }, { key: "cal.write", label: "Create events", kind: "write" }], syncFrequencies: ["Every 15 min", "Hourly", "Manual only"] },
  { id: "int-gdrive",   name: "Google Drive",     tagline: "Attach docs to journal.",        category: "Files",       brandHue: "#0F9D58", monogram: "D", permissions: [{ key: "files.read", label: "Read files", kind: "read" }], syncFrequencies: ["Hourly", "Daily", "Manual only"] },
  { id: "int-onedrive", name: "OneDrive",         tagline: "Word / PowerPoint files.",       category: "Files",       brandHue: "#0072C6", monogram: "O", permissions: [{ key: "files.read", label: "Read files", kind: "read" }], syncFrequencies: ["Hourly", "Daily", "Manual only"] },
  { id: "int-dropbox",  name: "Dropbox",          tagline: "Journal exports go here.",       category: "Files",       brandHue: "#0061FF", monogram: "D", permissions: [{ key: "files.write", label: "Write exports", kind: "write" }], syncFrequencies: ["Daily", "Weekly", "Manual only"] },
  { id: "int-gfit",     name: "Google Fit",       tagline: "Steps, sleep, heart rate.",      category: "Health",      brandHue: "#EA4335", monogram: "F", permissions: [{ key: "health.steps", label: "Steps", kind: "read" }, { key: "health.sleep", label: "Sleep", kind: "read" }, { key: "health.heart", label: "Heart rate (placeholder)", kind: "read" }], syncFrequencies: ["Every 15 min", "Hourly", "Manual only"] },
  { id: "int-ahealth",  name: "Apple Health",     tagline: "Native health metrics.",         category: "Health",      brandHue: "#FF2D55", monogram: "H", permissions: [{ key: "health.steps", label: "Steps", kind: "read" }, { key: "health.sleep", label: "Sleep", kind: "read" }, { key: "health.heart", label: "Heart rate (placeholder)", kind: "read" }], syncFrequencies: ["Real-time", "Hourly", "Manual only"] },
  { id: "int-fitbit",   name: "Fitbit",           tagline: "Wearable + sleep sync.",         category: "Health",      brandHue: "#00B0B9", monogram: "F", permissions: [{ key: "health.steps", label: "Steps", kind: "read" }, { key: "health.sleep", label: "Sleep", kind: "read" }], syncFrequencies: ["Hourly", "Daily", "Manual only"] },
  { id: "int-garmin",   name: "Garmin",           tagline: "Run / cycle / recovery.",         category: "Health",      brandHue: "#000000", monogram: "G", permissions: [{ key: "health.steps", label: "Steps", kind: "read" }, { key: "health.sleep", label: "Sleep", kind: "read" }], syncFrequencies: ["Hourly", "Manual only"] },
  { id: "int-spotify",  name: "Spotify",          tagline: "Focus & sleep playlists.",       category: "Music",       brandHue: "#1DB954", monogram: "S", permissions: [{ key: "music.play", label: "Play music", kind: "write" }, { key: "music.playlists", label: "Read playlists", kind: "read" }], syncFrequencies: ["Real-time", "Manual only"] },
  { id: "int-notion",   name: "Notion",           tagline: "Journal → Notion, both ways.",   category: "Productivity",brandHue: "#000000", monogram: "N", permissions: [{ key: "notion.read", label: "Read pages", kind: "read" }, { key: "notion.write", label: "Write pages", kind: "write" }], syncFrequencies: ["Hourly", "Daily", "Manual only"] },
  { id: "int-slack",    name: "Slack",            tagline: "Quiet hours announcements.",     category: "Comms",       brandHue: "#4A154B", monogram: "S", permissions: [{ key: "slack.dm", label: "DM notifications", kind: "write" }], syncFrequencies: ["Real-time", "Manual only"] },
  { id: "int-discord",  name: "Discord",          tagline: "Study groups + roles.",           category: "Comms",       brandHue: "#5865F2", monogram: "D", permissions: [{ key: "discord.rooms", label: "Join rooms", kind: "read" }], syncFrequencies: ["Real-time", "Manual only"] },
  { id: "int-zoom",     name: "Zoom",             tagline: "One-tap counselling sessions.", category: "Comms",       brandHue: "#2D8CFF", monogram: "Z", permissions: [{ key: "zoom.join", label: "Join meetings", kind: "read" }], syncFrequencies: ["Real-time", "Manual only"] },
  { id: "int-teams",    name: "Microsoft Teams",  tagline: "Campus classroom rooms.",         category: "Comms",       brandHue: "#5059C9", monogram: "T", permissions: [{ key: "teams.rooms", label: "Join rooms", kind: "read" }], syncFrequencies: ["Real-time", "Manual only"] },
  { id: "int-sso",      name: "Campus SSO",       tagline: "One log-in for your campus.",    category: "Campus",      brandHue: "#22323e", monogram: "C", permissions: [{ key: "sso.identity", label: "Verify identity", kind: "read" }], syncFrequencies: ["Real-time"] },
];
export function integrationById(id: string) { return integrations.find((i) => i.id === id); }

// ─── seeded feature requests ──────────────────────────────────
export const seedRequests: FeatureRequest[] = [
  { id: "fr-widget-lock", title: "Lock-screen widget for streak",    body: "A tiny widget showing my current streak — no notifications.", by: "aanya",   at: Date.now() - 3 * 86400_000, votes: 214, comments: 12, status: "planned" },
  { id: "fr-hindi-full",  title: "Full app in Hindi",                body: "Every string, not just resources.",                            by: "arjun",   at: Date.now() - 6 * 86400_000, votes: 189, comments: 30, status: "in_dev" },
  { id: "fr-focus-timer", title: "Longer focus timer options",       body: "Add 90-minute deep focus sessions.",                            by: "kabir",   at: Date.now() - 9 * 86400_000, votes: 132, comments: 8,  status: "open" },
  { id: "fr-mood-audio",  title: "Mood-based playlist suggestions",  body: "PeaceBot should pick songs that match my mood entry.",         by: "meera",   at: Date.now() - 12 * 86400_000, votes: 121, comments: 15, status: "open" },
  { id: "fr-cert-pdf",    title: "Real event certificates",           body: "PDF I can put on LinkedIn.",                                    by: "vikram",  at: Date.now() - 14 * 86400_000, votes: 96, comments: 4,  status: "open" },
];

// ─── selectors ────────────────────────────────────────────────
export function getState() { return load(); }
export function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const on = () => cb();
  window.addEventListener("peacecode-hub-changed", on);
  return () => window.removeEventListener("peacecode-hub-changed", on);
}

// theme actions
export function isThemeInstalled(id: string) { return load().installedThemes.includes(id); }
export function isThemeFavorite(id: string)  { return load().favoriteThemes.includes(id); }
export function activeThemeId()               { return load().activeTheme; }
export function installTheme(id: string) {
  const p = load(); if (!p.installedThemes.includes(id)) p.installedThemes.push(id); save(p);
}
export function uninstallTheme(id: string) {
  const p = load(); p.installedThemes = p.installedThemes.filter((x) => x !== id);
  if (p.activeTheme === id) delete p.activeTheme;
  save(p);
}
export function favoriteTheme(id: string) {
  const p = load(); const i = p.favoriteThemes.indexOf(id);
  i >= 0 ? p.favoriteThemes.splice(i, 1) : p.favoriteThemes.push(id);
  save(p);
}
export function applyTheme(id: string) { const p = load(); p.activeTheme = id; if (!p.installedThemes.includes(id)) p.installedThemes.push(id); save(p); }
export function restoreDefaultTheme() { const p = load(); delete p.activeTheme; save(p); }

// integration actions
export function isConnected(id: string) { return !!load().connectedIntegrations[id]; }
export function connect(id: string) {
  const p = load();
  const integ = integrationById(id);
  if (!integ) return;
  p.connectedIntegrations[id] = {
    connectedAt: Date.now(),
    lastSync: Date.now(),
    frequency: integ.syncFrequencies[0],
    autoSync: true,
    backgroundSync: true,
    permissions: Object.fromEntries(integ.permissions.map((pm) => [pm.key, true])),
  };
  save(p);
}
export function disconnect(id: string) { const p = load(); delete p.connectedIntegrations[id]; save(p); }
export function updateIntegration(id: string, patch: Partial<Persist["connectedIntegrations"][string]>) {
  const p = load(); const cur = p.connectedIntegrations[id]; if (!cur) return;
  p.connectedIntegrations[id] = { ...cur, ...patch };
  save(p);
}
export function togglePermission(id: string, key: string) {
  const p = load(); const cur = p.connectedIntegrations[id]; if (!cur) return;
  cur.permissions[key] = !cur.permissions[key];
  save(p);
}
export function manualSync(id: string) {
  const p = load(); const cur = p.connectedIntegrations[id]; if (!cur) return;
  cur.lastSync = Date.now();
  save(p);
}

// beta
export function isBetaEnrolled() { return load().betaEnrolled; }
export function toggleBeta() { const p = load(); p.betaEnrolled = !p.betaEnrolled; save(p); }

// roadmap voting
export function hasVoted(id: string) { return !!load().featureVotes[id]; }
export function toggleVote(id: string) {
  const p = load(); p.featureVotes[id] = !p.featureVotes[id]; save(p);
}

// feature requests
export function allRequests(): FeatureRequest[] {
  const p = load();
  return [...seedRequests, ...p.userRequests].sort((a, b) => b.votes - a.votes);
}
export function requestById(id: string): FeatureRequest | undefined {
  return allRequests().find((r) => r.id === id);
}
export function submitRequest(title: string, body: string) {
  const p = load();
  const r: FeatureRequest = {
    id: `fr-${Date.now()}`,
    title: title.trim(), body: body.trim(),
    by: "you", at: Date.now(), votes: 1, comments: 0, status: "open",
  };
  p.userRequests.push(r);
  p.requestVotes[r.id] = true;
  save(p);
  return r;
}
export function voteRequest(id: string) {
  const p = load(); p.requestVotes[id] = !p.requestVotes[id]; save(p);
}
export function hasVotedRequest(id: string) { return !!load().requestVotes[id]; }
export function bookmarkRequest(id: string) {
  const p = load(); p.requestBookmarks[id] = !p.requestBookmarks[id]; save(p);
}
export function hasBookmarkedRequest(id: string) { return !!load().requestBookmarks[id]; }

// customization
export function getCustomization() { return load().customization; }
export function updateCustomization(patch: Partial<Persist["customization"]>) {
  const p = load(); p.customization = { ...p.customization, ...patch }; save(p);
}

// widgets
export function getWidgets() { return load().widgets; }
export function updateWidget(key: WidgetConfig["key"], patch: Partial<WidgetConfig>) {
  const p = load();
  p.widgets = p.widgets.map((w) => (w.key === key ? { ...w, ...patch } : w));
  save(p);
}
export function moveWidget(key: WidgetConfig["key"], dir: -1 | 1) {
  const p = load();
  const i = p.widgets.findIndex((w) => w.key === key);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= p.widgets.length) return;
  const arr = [...p.widgets];
  [arr[i], arr[j]] = [arr[j], arr[i]];
  p.widgets = arr;
  save(p);
}
export function resetWidgets() { const p = load(); p.widgets = [...empty.widgets]; save(p); }

// profile theme
export function getProfileTheme() { return load().profileTheme; }
export function updateProfileTheme(patch: Partial<Persist["profileTheme"]>) {
  const p = load(); p.profileTheme = { ...p.profileTheme, ...patch }; save(p);
}

// beta features metadata
export const BETA_FEATURES = [
  { id: "b-voice2",    name: "PeaceBot Voice v2",          desc: "Softer voice, natural pauses, offline mode.",  bugs: ["Occasional latency after 20 min sessions."] },
  { id: "b-fit",       name: "Deep Google Fit",            desc: "Heart-rate variability in wellness rings.",     bugs: ["HRV shows N/A on Android 12."] },
  { id: "b-widgets",   name: "Home-screen widgets",         desc: "Streak, journal and breathe widgets.",         bugs: ["Widget refresh delay up to 15 min."] },
  { id: "b-multiplayer", name: "Mind Gym multiplayer",     desc: "Play a round with a Peace Buddy.",             bugs: ["Session may reset if buddy leaves."] },
];
