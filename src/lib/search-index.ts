// Unified searchable index across the PeaceCode ecosystem. Reads real content
// from each module's local store defensively and merges it with a static
// catalog of routes/actions (the "command palette" surface).

import * as journal from "./journal-store";
import * as gratitude from "./gratitude-store";
import * as peacebot from "./peacebot-store";
import * as buddies from "./buddies-store";
import * as counselling from "./counselling-store";
import * as breathe from "./breathe-store";
import * as screening from "./screening-store";
import * as focus from "./focus-store";
import * as mindgym from "./mindgym-store";
import { RESOURCES, FORMAT_LABELS } from "./resources-store";
import { loadPrefs as loadSearchPrefs } from "./search-store";

export type SearchKind =
  | "journal" | "gratitude" | "peacebot" | "buddy" | "counsellor"
  | "resource" | "article" | "video" | "audio" | "worksheet"
  | "exercise" | "breathing" | "meditation" | "assessment"
  | "screening" | "mood" | "goal" | "habit" | "community" | "achievement"
  | "setting" | "action" | "route" | "person" | "focus" | "session";

export type SearchItem = {
  id: string;
  kind: SearchKind;
  module: string;                  // Journal, Resources, PeaceBot, ...
  title: string;
  subtitle?: string;
  description?: string;
  to?: string;                     // navigation target
  tags?: string[];
  ts?: number;                     // timestamp for date sorting
  duration?: number;               // seconds/minutes
  icon?: string;                   // lucide icon name (rendered by caller)
  keywords?: string;               // extra fuzzy match blob
};

// ─── Static navigation & action catalog ────────────────────────────────
// Every module page + quick action lives here so users can jump anywhere
// via natural-language search (e.g. "start breathing", "book therapist").

const ACTION_CATALOG: SearchItem[] = [
  { id: "act_home",        kind: "route",  module: "Home",       title: "Today",              to: "/",            icon: "Home",         tags: ["dashboard","home"] },
  { id: "act_journal",     kind: "route",  module: "Journal",    title: "Open Journal",       to: "/journal",     icon: "PenLine",      tags: ["write","reflect"] },
  { id: "act_journal_new", kind: "action", module: "Journal",    title: "New journal entry",  subtitle: "Start writing", to: "/journal", icon: "PenLine", tags: ["write","new"] },
  { id: "act_grat",        kind: "route",  module: "Gratitude",  title: "Gratitude",          to: "/gratitude",   icon: "Heart",        tags: ["thanks","grateful"] },
  { id: "act_grat_wall",   kind: "route",  module: "Gratitude",  title: "Public Gratitude Wall", to: "/gratitude/wall", icon: "Heart", tags: ["community","wall"] },
  { id: "act_breathe",     kind: "route",  module: "Breathe",    title: "Breathe",            to: "/breathe",     icon: "Wind",         tags: ["breathing","calm","anxiety","panic"] },
  { id: "act_breathe_go",  kind: "action", module: "Breathe",    title: "Start breathing",    subtitle: "Guided session", to: "/breathe", icon: "Wind", tags: ["relax","start"] },
  { id: "act_breathe_stats", kind: "route",module: "Breathe",    title: "Breathing stats",    to: "/breathe/stats", icon: "Activity",   tags: ["progress"] },
  { id: "act_focus",       kind: "route",  module: "Focus",      title: "Focus & Pomodoro",   to: "/focus",       icon: "Target",       tags: ["study","concentrate","timer"] },
  { id: "act_mindgym",     kind: "route",  module: "Mind Gym",   title: "Mind Gym",           to: "/mindgym",     icon: "Brain",        tags: ["exercises","games","training"] },
  { id: "act_bot",         kind: "route",  module: "PeaceBot",   title: "Talk to PeaceBot",   to: "/peacebot",    icon: "Bot",          tags: ["ai","chat","talk"] },
  { id: "act_buddies",     kind: "route",  module: "Peace Buddies", title: "Peace Buddies",   to: "/buddies",     icon: "UserCheck",    tags: ["peer","support"] },
  { id: "act_counsel",     kind: "route",  module: "Counselling",title: "Counselling",        to: "/counselling", icon: "CalendarCheck",tags: ["therapy","therapist","book","psychologist"] },
  { id: "act_counsel_book",kind: "action", module: "Counselling",title: "Book counselling",   to: "/counselling/experts", icon: "CalendarCheck", tags: ["book","therapist"] },
  { id: "act_screening",   kind: "route",  module: "Screening",  title: "Mental Health Screening", to: "/screening", icon: "ClipboardList", tags: ["assessment","test","phq","gad"] },
  { id: "act_community",   kind: "route",  module: "Community",  title: "Community",          to: "/community",   icon: "Users",        tags: ["circles","threads","rooms"] },
  { id: "act_resources",   kind: "route",  module: "Resources",  title: "Resource Library",   to: "/resources",   icon: "BookOpen",     tags: ["read","learn"] },
  { id: "act_profile",     kind: "route",  module: "Profile",    title: "Open profile",       to: "/profile",     icon: "User",         tags: ["me","identity"] },
  { id: "act_profile_streak", kind: "action", module: "Profile", title: "Show my streak",     to: "/profile",     icon: "Flame",        tags: ["streak"] },
  { id: "act_profile_ach", kind: "route",  module: "Profile",    title: "Achievements",       to: "/profile/achievements", icon: "Trophy", tags: ["badges"] },
  { id: "act_profile_journey", kind: "route", module: "Profile", title: "Wellness journey",   to: "/profile/journey", icon: "Sparkles", tags: ["timeline"] },
  { id: "act_profile_stats",kind: "route", module: "Profile",    title: "Profile statistics", to: "/profile/stats", icon: "Activity",   tags: ["analytics"] },
  { id: "act_settings",    kind: "route",  module: "Settings",   title: "Settings",           to: "/settings",    icon: "Settings",     tags: ["preferences"] },
  { id: "act_settings_priv", kind: "route",module: "Settings",   title: "Privacy",            to: "/settings/privacy", icon: "Lock",    tags: ["private"] },
  { id: "act_settings_theme", kind: "route", module: "Settings", title: "Appearance",         to: "/settings/appearance", icon: "Palette", tags: ["theme","dark","light"] },
  { id: "act_settings_notif", kind: "route", module: "Settings", title: "Notifications",      to: "/settings/notifications", icon: "Bell", tags: ["alerts"] },
  { id: "act_settings_emerg", kind: "route", module: "Settings", title: "Emergency & Safety", to: "/settings/emergency", icon: "AlertTriangle", tags: ["crisis","helpline"] },
  { id: "act_search_history", kind: "route", module: "Search",   title: "Search history",     to: "/search/history", icon: "Clock",   tags: ["saved","recent"] },
];

// ─── Content collection ────────────────────────────────────────────────
// Runs on demand so results always reflect the latest local state.

function safe<T>(fn: () => T, fb: T): T { try { return fn(); } catch { return fb; } }

function collectAll(): SearchItem[] {
  const p = safe(() => loadSearchPrefs(), { pauseHistory: false, excludeJournal: false, excludeGratitude: false, excludeCounselling: false, excludePeaceBot: false, aiMode: false });
  const out: SearchItem[] = [...ACTION_CATALOG];

  // Journal
  if (!p.excludeJournal) {
    safe(() => journal.loadEntries(), []).forEach((e: any) => {
      const title = e.title || (e.content ? String(e.content).slice(0, 60) : "Journal entry");
      out.push({
        id: `j_${e.id}`,
        kind: "journal",
        module: "Journal",
        title,
        subtitle: e.mood ? `Mood · ${e.mood}` : "Reflection",
        description: e.content ? String(e.content).slice(0, 200) : undefined,
        to: `/journal`,
        tags: e.tags,
        ts: e.updatedAt ?? e.createdAt ?? e.ts,
        icon: "PenLine",
        keywords: `${e.content ?? ""} ${(e.tags ?? []).join(" ")}`,
      });
    });
  }

  // Gratitude — personal + public
  if (!p.excludeGratitude) {
    safe(() => gratitude.loadEntries(), []).forEach((e: any) => {
      out.push({
        id: `g_${e.id}`,
        kind: "gratitude",
        module: "Gratitude",
        title: (e.text || "Gratitude").slice(0, 60),
        subtitle: e.category ? `${e.category}` : "Gratitude",
        description: e.text,
        to: "/gratitude",
        tags: e.tags,
        ts: e.ts ?? e.createdAt,
        icon: "Heart",
        keywords: e.text,
      });
    });
    safe(() => gratitude.loadCommunity(), []).forEach((e: any) => {
      out.push({
        id: `gw_${e.id}`,
        kind: "gratitude",
        module: "Gratitude Wall",
        title: (e.text || "").slice(0, 60),
        subtitle: e.author ?? "Anonymous",
        description: e.text,
        to: "/gratitude/wall",
        ts: e.ts,
        icon: "Heart",
        keywords: e.text,
      });
    });
  }

  // PeaceBot conversations
  if (!p.excludePeaceBot) {
    safe(() => peacebot.loadConvs(), []).forEach((c: any) => {
      const last = c.messages?.[c.messages.length - 1];
      out.push({
        id: `pb_${c.id}`,
        kind: "peacebot",
        module: "PeaceBot",
        title: c.title || "Conversation",
        subtitle: c.type ? String(c.type) : "Chat",
        description: last?.text?.slice(0, 200),
        to: `/peacebot/c/${c.id}`,
        ts: c.updatedAt ?? c.createdAt,
        icon: "Bot",
        keywords: (c.messages ?? []).map((m: any) => m.text ?? "").join(" ").slice(0, 4000),
      });
    });
  }

  // Buddies
  safe(() => (buddies as any).BUDDIES ?? [], []).forEach((b: any) => {
    out.push({
      id: `bd_${b.id}`,
      kind: "buddy",
      module: "Peace Buddies",
      title: b.name,
      subtitle: `${b.year ?? ""} · ${b.field ?? ""}`.trim().replace(/^·\s*/, ""),
      description: b.bio,
      to: `/buddies/b/${b.id}`,
      tags: b.topics,
      icon: "UserCheck",
      keywords: `${b.bio ?? ""} ${(b.topics ?? []).join(" ")}`,
    });
  });
  safe(() => (buddies as any).PSYCHOLOGISTS ?? [], []).forEach((b: any) => {
    out.push({
      id: `psy_${b.id}`,
      kind: "person",
      module: "Psychologists",
      title: b.name,
      subtitle: b.specialty ?? "Psychologist",
      description: b.bio,
      to: `/buddies`,
      icon: "UserCheck",
      keywords: b.bio,
    });
  });

  // Counselling
  if (!p.excludeCounselling) {
    safe(() => (counselling as any).EXPERTS ?? [], []).forEach((e: any) => {
      out.push({
        id: `co_${e.id}`,
        kind: "counsellor",
        module: "Counselling",
        title: e.name,
        subtitle: (e.specializations ?? []).slice(0, 2).join(" · "),
        description: e.bio,
        to: `/counselling/e/${e.id}`,
        tags: e.specializations,
        icon: "CalendarCheck",
        keywords: `${e.bio ?? ""} ${(e.specializations ?? []).join(" ")} ${(e.therapyTypes ?? []).join(" ")}`,
      });
    });
    safe(() => (counselling as any).listAppointments?.() ?? [], []).forEach((a: any) => {
      out.push({
        id: `apt_${a.id}`,
        kind: "session",
        module: "Counselling",
        title: `Session · ${a.mode ?? "video"}`,
        subtitle: a.status,
        description: a.reason,
        to: `/counselling/appointment/${a.id}`,
        ts: a.scheduledFor,
        icon: "CalendarCheck",
      });
    });
  }

  // Resources
  const AUDIO_FMTS = new Set(["podcast", "audiobook", "meditation", "sleep-story"]);
  const VIDEO_FMTS = new Set(["video", "short-video"]);
  RESOURCES.forEach((r) => {
    const kind: SearchKind =
      VIDEO_FMTS.has(r.format) ? "video" :
      AUDIO_FMTS.has(r.format) ? "audio" :
      r.format === "worksheet" ? "worksheet" : "resource";
    out.push({
      id: `res_${r.id}`,
      kind,
      module: "Resources",
      title: r.title,
      subtitle: `${FORMAT_LABELS[r.format]} · ${r.minutes} min`,
      description: r.description,
      to: `/resources/r/${r.slug}`,
      tags: r.tags,
      duration: r.minutes,
      icon: "BookOpen",
      keywords: `${r.description ?? ""} ${(r.tags ?? []).join(" ")}`,
    });
  });

  // Mind Gym exercises
  safe(() => (mindgym as any).EXERCISES ?? [], []).forEach((ex: any) => {
    out.push({
      id: `mg_${ex.id}`,
      kind: "exercise",
      module: "Mind Gym",
      title: ex.title,
      subtitle: `${ex.difficulty ?? ""} · ${ex.type ?? ""}`,
      description: ex.description ?? ex.blurb,
      to: `/mindgym/exercise/${ex.id}`,
      tags: [ex.skill, ex.path].filter(Boolean),
      duration: ex.duration,
      icon: "Brain",
      keywords: `${ex.description ?? ""} ${ex.skill ?? ""}`,
    });
  });

  // Screening tests + sessions
  safe(() => (screening as any).TESTS ?? [], []).forEach((t: any) => {
    out.push({
      id: `test_${t.id}`,
      kind: "assessment",
      module: "Screening",
      title: t.title,
      subtitle: `${t.category} · ${t.difficulty}`,
      description: t.description,
      to: `/screening/take/${t.id}`,
      tags: [t.category],
      duration: t.durationMin,
      icon: "ClipboardList",
      keywords: `${t.description ?? ""} ${t.category}`,
    });
  });
  safe(() => screening.loadSessions(), []).forEach((s: any) => {
    out.push({
      id: `ss_${s.id}`,
      kind: "assessment",
      module: "Screening",
      title: `Assessment · ${s.testId}`,
      subtitle: s.status,
      to: s.status === "in_progress" ? `/screening/take/${s.testId}` : `/screening/results/${s.id}`,
      ts: s.updatedAt ?? s.startedAt,
      icon: "ClipboardList",
    });
  });

  // Breathing sessions (history)
  safe(() => breathe.loadSessions(), []).forEach((s: any) => {
    out.push({
      id: `br_${s.id}`,
      kind: "breathing",
      module: "Breathe",
      title: `${s.technique ?? "Breathing"} · ${Math.round((s.durationSec ?? 0) / 60)} min`,
      subtitle: new Date(s.endedAt ?? s.ts ?? Date.now()).toLocaleDateString(),
      to: "/breathe/stats",
      ts: s.endedAt ?? s.ts,
      icon: "Wind",
    });
  });

  // Focus sessions
  safe(() => focus.loadSessions(), []).forEach((s: any) => {
    out.push({
      id: `fo_${s.id}`,
      kind: "focus",
      module: "Focus",
      title: `${s.mode ?? "Focus"} · ${Math.round((s.durationSec ?? 0) / 60)} min`,
      subtitle: new Date(s.endedAt ?? s.ts ?? Date.now()).toLocaleDateString(),
      to: "/focus",
      ts: s.endedAt ?? s.ts,
      icon: "Target",
    });
  });

  return out;
}

// ─── Fuzzy scoring ─────────────────────────────────────────────────────

function score(q: string, item: SearchItem): number {
  if (!q) return 0;
  const query = q.toLowerCase().trim();
  const title = (item.title ?? "").toLowerCase();
  const sub = (item.subtitle ?? "").toLowerCase();
  const desc = (item.description ?? "").toLowerCase();
  const tags = (item.tags ?? []).join(" ").toLowerCase();
  const kw = (item.keywords ?? "").toLowerCase();

  // exact word match in title beats everything
  let s = 0;
  const terms = query.split(/\s+/).filter(Boolean);
  for (const t of terms) {
    if (title === t) s += 100;
    else if (title.startsWith(t)) s += 40;
    else if (title.includes(t)) s += 25;
    if (tags.includes(t)) s += 15;
    if (sub.includes(t)) s += 8;
    if (desc.includes(t)) s += 4;
    if (kw.includes(t)) s += 2;
  }
  // small recency boost for time-stamped items
  if (item.ts) {
    const days = (Date.now() - item.ts) / 86400000;
    if (days < 1) s += 6; else if (days < 7) s += 3; else if (days < 30) s += 1;
  }
  return s;
}

export type Group = { kind: string; label: string; items: SearchItem[] };

const GROUP_ORDER: { kind: SearchItem["kind"] | "resource-any" | "person-any"; label: string; match: (i: SearchItem) => boolean }[] = [
  { kind: "action", label: "Actions", match: (i) => i.kind === "action" || i.kind === "route" },
  { kind: "journal", label: "Journal", match: (i) => i.kind === "journal" },
  { kind: "gratitude", label: "Gratitude", match: (i) => i.kind === "gratitude" },
  { kind: "peacebot", label: "PeaceBot", match: (i) => i.kind === "peacebot" },
  { kind: "person-any", label: "People", match: (i) => i.kind === "buddy" || i.kind === "counsellor" || i.kind === "person" },
  { kind: "resource-any", label: "Resources", match: (i) => i.kind === "resource" || i.kind === "article" || i.kind === "video" || i.kind === "audio" || i.kind === "worksheet" },
  { kind: "exercise", label: "Mind Gym", match: (i) => i.kind === "exercise" },
  { kind: "breathing", label: "Breathing & Focus", match: (i) => i.kind === "breathing" || i.kind === "focus" },
  { kind: "assessment", label: "Assessments", match: (i) => i.kind === "assessment" },
  { kind: "session", label: "Sessions", match: (i) => i.kind === "session" },
  { kind: "setting", label: "Settings", match: (i) => i.kind === "setting" },
];

export type SearchFilter =
  | "everything" | "actions" | "journal" | "gratitude" | "peacebot"
  | "people" | "resources" | "videos" | "articles" | "audio" | "worksheets"
  | "exercises" | "assessments" | "sessions";

function filterFn(f: SearchFilter): (i: SearchItem) => boolean {
  switch (f) {
    case "actions":    return (i) => i.kind === "action" || i.kind === "route";
    case "journal":    return (i) => i.kind === "journal";
    case "gratitude":  return (i) => i.kind === "gratitude";
    case "peacebot":   return (i) => i.kind === "peacebot";
    case "people":     return (i) => i.kind === "buddy" || i.kind === "counsellor" || i.kind === "person";
    case "resources":  return (i) => i.kind === "resource" || i.kind === "article" || i.kind === "video" || i.kind === "audio" || i.kind === "worksheet";
    case "videos":     return (i) => i.kind === "video";
    case "articles":   return (i) => i.kind === "resource" || i.kind === "article";
    case "audio":      return (i) => i.kind === "audio";
    case "worksheets": return (i) => i.kind === "worksheet";
    case "exercises":  return (i) => i.kind === "exercise" || i.kind === "breathing" || i.kind === "focus";
    case "assessments":return (i) => i.kind === "assessment";
    case "sessions":   return (i) => i.kind === "session";
    default:           return () => true;
  }
}

export type SearchOptions = {
  filter?: SearchFilter;
  limit?: number;
  sort?: "relevance" | "newest" | "oldest";
};

export function searchAll(query: string, opts: SearchOptions = {}): { total: number; groups: Group[]; flat: SearchItem[] } {
  const all = collectAll();
  const filtered = all.filter(filterFn(opts.filter ?? "everything"));

  let scored: { item: SearchItem; s: number }[];
  if (!query.trim()) {
    scored = filtered.map((item) => ({ item, s: 0 }));
  } else {
    scored = filtered
      .map((item) => ({ item, s: score(query, item) }))
      .filter((x) => x.s > 0);
  }

  const sort = opts.sort ?? "relevance";
  scored.sort((a, b) => {
    if (sort === "newest") return (b.item.ts ?? 0) - (a.item.ts ?? 0);
    if (sort === "oldest") return (a.item.ts ?? Infinity) - (b.item.ts ?? Infinity);
    return b.s - a.s;
  });

  const limit = opts.limit ?? 120;
  const capped = scored.slice(0, limit).map((x) => x.item);

  const groups: Group[] = GROUP_ORDER.map((g) => ({
    kind: g.kind,
    label: g.label,
    items: capped.filter(g.match),
  })).filter((g) => g.items.length > 0);

  return { total: scored.length, groups, flat: capped };
}

// Landing rails ── recently-touched content, trending, continue where left off.
export function landingRails(): {
  recent: SearchItem[];
  trending: SearchItem[];
  continueRail: SearchItem[];
  quickAccess: SearchItem[];
  suggested: SearchItem[];
} {
  const all = collectAll();
  const withTs = all.filter((i) => i.ts).sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
  const trending = all
    .filter((i) => i.kind === "resource" || i.kind === "video" || i.kind === "audio" || i.kind === "exercise")
    .slice(0, 8);
  const quickAccess = all.filter((i) => i.kind === "route").slice(0, 12);
  const continueRail = withTs
    .filter((i) => ["journal", "peacebot", "assessment", "focus", "breathing"].includes(i.kind))
    .slice(0, 6);
  const suggested = ACTION_CATALOG.filter((a) => a.kind === "action").slice(0, 8);
  return { recent: withTs.slice(0, 8), trending, continueRail, quickAccess, suggested };
}

export function suggest(query: string): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const all = collectAll();
  const seeds = new Set<string>();
  for (const item of all) {
    const title = item.title.toLowerCase();
    if (title.startsWith(q)) seeds.add(item.title);
    (item.tags ?? []).forEach((t) => { if (t.toLowerCase().startsWith(q)) seeds.add(t); });
    if (seeds.size >= 8) break;
  }
  return Array.from(seeds).slice(0, 8);
}

export const TRENDING_QUERIES = [
  "exam stress", "sleep", "anxiety", "gratitude", "breathing",
  "panic attack", "study focus", "depression", "self compassion", "motivation",
];
