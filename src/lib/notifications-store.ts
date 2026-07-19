// Notification Center store: persistent inbox + settings. Seeded on first
// visit so the UI has a rich, believable timeline.

export type NotifCategory =
  | "peacebot" | "buddy" | "counselling" | "resources" | "journal"
  | "gratitude" | "mindgym" | "achievements" | "community"
  | "reminders" | "calendar" | "assessments" | "emergency"
  | "account" | "system";

export type NotifPriority = "critical" | "high" | "medium" | "low";

export type Notif = {
  id: string;
  type: string;                 // human-friendly type e.g. "New PeaceBot Message"
  category: NotifCategory;
  title: string;
  body: string;
  ts: number;
  read: boolean;
  pinned: boolean;
  bookmarked: boolean;
  archived: boolean;
  muted?: boolean;
  priority: NotifPriority;
  to?: string;                  // destination route
  person?: { name: string; initials?: string };
  icon?: string;                // lucide icon name
  actions?: { label: string; to: string; primary?: boolean }[];
  context?: string;             // extra description shown on detail page
};

export type NotifPrefs = {
  channels: {
    push: boolean; email: boolean; desktop: boolean; sms: boolean;
    weeklyDigest: boolean; monthlyReport: boolean;
  };
  categories: Record<NotifCategory, boolean>;
  quiet: { enabled: boolean; start: string; end: string; allowEmergency: boolean; allowCounselling: boolean; allowBuddy: boolean };
  dnd: boolean;
  mutedCategories: NotifCategory[];
};

const K = {
  list: "peacecode.notifs.list.v1",
  prefs: "peacecode.notifs.prefs.v1",
  seed: "peacecode.notifs.seed.v1",
};

function get<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; }
}
function set<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

export const CATEGORY_META: Record<NotifCategory, { label: string; icon: string; tone: string }> = {
  peacebot:    { label: "PeaceBot",     icon: "Bot",            tone: "soft" },
  buddy:       { label: "Peace Buddy",  icon: "UserCheck",      tone: "soft" },
  counselling: { label: "Counselling",  icon: "CalendarCheck",  tone: "soft" },
  resources:   { label: "Resources",    icon: "BookOpen",       tone: "soft" },
  journal:     { label: "Journal",      icon: "PenLine",        tone: "soft" },
  gratitude:   { label: "Gratitude",    icon: "Heart",          tone: "soft" },
  mindgym:     { label: "Mind Gym",     icon: "Brain",          tone: "soft" },
  achievements:{ label: "Achievements", icon: "Trophy",         tone: "soft" },
  community:   { label: "Community",    icon: "Users",          tone: "soft" },
  reminders:   { label: "Reminders",    icon: "Bell",           tone: "soft" },
  calendar:    { label: "Calendar",     icon: "Calendar",       tone: "soft" },
  assessments: { label: "Assessments",  icon: "ClipboardList",  tone: "soft" },
  emergency:   { label: "Emergency",    icon: "AlertTriangle",  tone: "warn" },
  account:     { label: "Account",      icon: "User",           tone: "soft" },
  system:      { label: "System",       icon: "Settings",       tone: "soft" },
};

const DEFAULT_PREFS: NotifPrefs = {
  channels: { push: true, email: true, desktop: true, sms: false, weeklyDigest: true, monthlyReport: false },
  categories: {
    peacebot: true, buddy: true, counselling: true, resources: true, journal: true,
    gratitude: true, mindgym: true, achievements: true, community: true,
    reminders: true, calendar: true, assessments: true, emergency: true,
    account: true, system: false,
  },
  quiet: { enabled: false, start: "22:00", end: "07:00", allowEmergency: true, allowCounselling: true, allowBuddy: false },
  dnd: false,
  mutedCategories: [],
};

// ─── seed data ─────────────────────────────────────────────────────────
function seed(): Notif[] {
  const now = Date.now();
  const h = 3600_000, m = 60_000, d = 86_400_000;
  const mk = (o: Partial<Notif> & { id: string; type: string; category: NotifCategory; title: string; body: string; ts: number }): Notif => ({
    read: false, pinned: false, bookmarked: false, archived: false, priority: "medium", ...o,
  });

  return [
    mk({ id: "n_1", ts: now - 5 * m, type: "Appointment Reminder", category: "counselling", priority: "high", title: "Session with Dr. Meera in 30 minutes",
         body: "Video session · CBT for exam stress. Have a glass of water nearby.", to: "/counselling", icon: "CalendarCheck",
         person: { name: "Dr. Meera Iyer", initials: "MI" }, pinned: true,
         actions: [{ label: "Join session", to: "/counselling", primary: true }, { label: "Reschedule", to: "/counselling" }],
         context: "The session covers thought-record work on last week's mock test spiral." }),

    mk({ id: "n_2", ts: now - 25 * m, type: "New PeaceBot Message", category: "peacebot", priority: "medium",
         title: "PeaceBot has a reflection ready", body: "\"I noticed you journaled less this week — want me to draft a gentle check-in prompt?\"",
         to: "/peacebot", icon: "Bot", actions: [{ label: "Open chat", to: "/peacebot", primary: true }] }),

    mk({ id: "n_3", ts: now - 45 * m, type: "Buddy Replied", category: "buddy", priority: "medium",
         title: "Ananya replied to your message", body: "\"Hey, I finished my first year too — happy to share how I stayed sane during finals week.\"",
         to: "/buddies", icon: "UserCheck", person: { name: "Ananya", initials: "AN" },
         actions: [{ label: "Open chat", to: "/buddies", primary: true }, { label: "View profile", to: "/buddies" }] }),

    mk({ id: "n_4", ts: now - 2 * h, type: "Journal Streak", category: "journal", priority: "low", read: true,
         title: "12 days of quiet honesty", body: "Your longest streak yet. One line tonight keeps it going.", to: "/journal", icon: "PenLine" }),

    mk({ id: "n_5", ts: now - 3 * h, type: "Achievement Unlocked", category: "achievements", priority: "medium",
         title: "You earned: Breath of Calm", body: "Ten full breathing sessions completed. Your Mind Garden grew a new leaf.",
         to: "/profile/achievements", icon: "Trophy",
         actions: [{ label: "See badge", to: "/profile/achievements", primary: true }, { label: "Share", to: "/profile/achievements" }] }),

    mk({ id: "n_6", ts: now - 4 * h, type: "Resource Recommendation", category: "resources", priority: "low",
         title: "New for you: How to sleep when your mind won't", body: "A 6-minute read from Dr. Aditi Rao, matched to your last two searches.",
         to: "/resources", icon: "BookOpen", actions: [{ label: "Read now", to: "/resources", primary: true }, { label: "Save for later", to: "/resources" }] }),

    mk({ id: "n_7", ts: now - 5 * h, type: "Mind Gym Daily Challenge", category: "mindgym", priority: "low",
         title: "Today's challenge · Attention Reset (4 min)", body: "Warm up your focus before your afternoon session.",
         to: "/mindgym", icon: "Brain", actions: [{ label: "Start", to: "/mindgym", primary: true }] }),

    mk({ id: "n_8", ts: now - 6 * h, type: "Community Reply", category: "community", priority: "low",
         title: "Rohit replied to your thread in Exam Circle", body: "\"Same here — writing down worst-case helped me sleep.\"",
         to: "/community", icon: "Users", person: { name: "Rohit", initials: "RO" },
         actions: [{ label: "View thread", to: "/community", primary: true }] }),

    mk({ id: "n_9", ts: now - 8 * h, type: "Homework Assigned", category: "counselling", priority: "high", read: true,
         title: "Homework from Dr. Meera", body: "Two thought records + a 5-min box-breath before study blocks this week.",
         to: "/counselling", icon: "ClipboardList", person: { name: "Dr. Meera Iyer", initials: "MI" },
         actions: [{ label: "Open homework", to: "/counselling", primary: true }] }),

    mk({ id: "n_10", ts: now - 10 * h, type: "Breathing Reminder", category: "reminders", priority: "low",
         title: "A 3-minute breath, before you scroll on", body: "Your evening reset is waiting.", to: "/breathe", icon: "Wind" }),

    mk({ id: "n_11", ts: now - 22 * h, type: "Assessment Due", category: "assessments", priority: "high",
         title: "Your monthly PHQ-9 check-in is due", body: "Two minutes. Only you will see the results.", to: "/screening", icon: "ClipboardList" }),

    mk({ id: "n_12", ts: now - 1 * d - 2 * h, type: "Tree Bloomed", category: "gratitude", priority: "low", read: true,
         title: "Your gratitude tree bloomed 🌸", body: "Five entries this week made a new blossom.",
         to: "/gratitude", icon: "Heart" }),

    mk({ id: "n_13", ts: now - 1 * d - 4 * h, type: "Weekly Reflection Ready", category: "reminders", priority: "medium", read: true,
         title: "Your Sunday reflection is ready", body: "A gentle summary of the week — journal, mood, focus.", to: "/journal", icon: "Sparkles",
         actions: [{ label: "Open reflection", to: "/journal", primary: true }] }),

    mk({ id: "n_14", ts: now - 2 * d - 3 * h, type: "Login Alert", category: "account", priority: "medium", read: true,
         title: "New sign-in from Chrome on macOS", body: "Bengaluru · 6:12 PM. If this wasn't you, secure your account.",
         to: "/settings/privacy", icon: "Lock", actions: [{ label: "Review devices", to: "/settings/privacy", primary: true }] }),

    mk({ id: "n_15", ts: now - 3 * d, type: "Journal Reminder", category: "journal", priority: "low", read: true,
         title: "One line, tonight.", body: "Even a single sentence counts.", to: "/journal", icon: "PenLine" }),

    mk({ id: "n_16", ts: now - 4 * d, type: "Comment Received", category: "community", priority: "low", read: true,
         title: "Nisha commented on your gratitude post", body: "\"This made me smile — thank you for sharing.\"", to: "/gratitude/wall",
         icon: "Heart", person: { name: "Nisha", initials: "NI" } }),

    mk({ id: "n_17", ts: now - 6 * d, type: "Friend Request", category: "community", priority: "low", read: true,
         title: "Kabir wants to connect as a Peace Buddy", body: "Studies at same college · shares 3 interests.", to: "/buddies",
         icon: "UserCheck", person: { name: "Kabir", initials: "KA" },
         actions: [{ label: "Accept", to: "/buddies", primary: true }, { label: "Decline", to: "/buddies" }] }),

    mk({ id: "n_18", ts: now - 9 * d, type: "Monthly Wellness Report", category: "reminders", priority: "medium", read: true,
         title: "Your November wellness report", body: "Mood trend, streaks, top themes — all in one gentle page.",
         to: "/profile/stats", icon: "Activity", bookmarked: true },
    ),

    mk({ id: "n_19", ts: now - 12 * d, type: "System Update", category: "system", priority: "low", read: true,
         title: "New in PeaceCode: Search Center", body: "Instantly find anything across the app with ⌘K.", to: "/search", icon: "Sparkles" }),
  ];
}

export function loadAll(): Notif[] {
  if (typeof window === "undefined") return [];
  const seeded = localStorage.getItem(K.seed);
  if (!seeded) {
    const list = seed();
    set(K.list, list);
    try { localStorage.setItem(K.seed, "1"); } catch {}
    return list;
  }
  return get<Notif[]>(K.list, []);
}
export function saveAll(list: Notif[]) { set(K.list, list); }

export function patch(id: string, p: Partial<Notif>) {
  saveAll(loadAll().map((n) => (n.id === id ? { ...n, ...p } : n)));
}
export function remove(id: string) { saveAll(loadAll().filter((n) => n.id !== id)); }
export function removeMany(ids: string[]) { const s = new Set(ids); saveAll(loadAll().filter((n) => !s.has(n.id))); }
export function markRead(id: string, v = true) { patch(id, { read: v }); }
export function markAllRead() { saveAll(loadAll().map((n) => ({ ...n, read: true }))); }
export function togglePinned(id: string) { const n = loadAll().find((x) => x.id === id); if (n) patch(id, { pinned: !n.pinned }); }
export function toggleBookmarked(id: string) { const n = loadAll().find((x) => x.id === id); if (n) patch(id, { bookmarked: !n.bookmarked }); }
export function archive(id: string, v = true) { patch(id, { archived: v, read: true }); }
export function get1(id: string): Notif | undefined { return loadAll().find((n) => n.id === id); }

export function unreadCount(): number { return loadAll().filter((n) => !n.read && !n.archived).length; }

export function loadPrefs(): NotifPrefs {
  const p = get<Partial<NotifPrefs>>(K.prefs, {});
  return {
    ...DEFAULT_PREFS,
    ...p,
    channels: { ...DEFAULT_PREFS.channels, ...(p.channels ?? {}) },
    categories: { ...DEFAULT_PREFS.categories, ...(p.categories ?? {}) },
    quiet: { ...DEFAULT_PREFS.quiet, ...(p.quiet ?? {}) },
  };
}
export function savePrefs(p: NotifPrefs) { set(K.prefs, p); }

// ─── time buckets ──────────────────────────────────────────────────────
export function bucketFor(ts: number): "today" | "yesterday" | "week" | "month" | "older" {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86_400_000;
  if (ts >= start) return "today";
  if (ts >= start - day) return "yesterday";
  if (ts >= start - 7 * day) return "week";
  if (ts >= start - 30 * day) return "month";
  return "older";
}
export const BUCKET_LABEL: Record<ReturnType<typeof bucketFor>, string> = {
  today: "Today", yesterday: "Yesterday", week: "Earlier this week", month: "Earlier this month", older: "Older",
};

export function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return `${m}m`;
  const h = Math.round(m / 60); if (h < 24) return `${h}h`;
  const d = Math.round(h / 24); if (d < 7) return `${d}d`;
  const w = Math.round(d / 7); if (w < 4) return `${w}w`;
  return new Date(ts).toLocaleDateString();
}

// Smart grouping: collapse ≥3 same-category, same-day items into a group.
export type Group = { key: string; category: NotifCategory; label: string; items: Notif[]; from: number; to: number };
export function smartGroup(list: Notif[]): Array<Notif | Group> {
  const out: Array<Notif | Group> = [];
  // group by (category, day)
  const map = new Map<string, Notif[]>();
  for (const n of list) {
    const day = new Date(n.ts).toDateString();
    const key = `${n.category}__${day}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  const used = new Set<string>();
  for (const n of list) {
    const day = new Date(n.ts).toDateString();
    const key = `${n.category}__${day}`;
    if (used.has(n.id)) continue;
    const bucket = map.get(key)!;
    if (bucket.length >= 3) {
      bucket.forEach((x) => used.add(x.id));
      const label = `${CATEGORY_META[n.category].label} — ${bucket.length} updates`;
      out.push({
        key, category: n.category, label,
        items: bucket.sort((a, b) => b.ts - a.ts),
        from: Math.min(...bucket.map((x) => x.ts)),
        to: Math.max(...bucket.map((x) => x.ts)),
      });
    } else {
      out.push(n);
      used.add(n.id);
    }
  }
  // preserve time-desc ordering
  return out.sort((a, b) => {
    const at = "items" in a ? a.to : a.ts;
    const bt = "items" in b ? b.to : b.ts;
    return bt - at;
  });
}
