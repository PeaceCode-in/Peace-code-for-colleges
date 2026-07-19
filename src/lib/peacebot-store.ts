// PeaceBot local-first store — conversations, memories, prefs.
// Every page reads/writes through here so state stays consistent.

export type Role = "me" | "peace";
export type ConvType =
  | "free" | "anxious" | "overthinking" | "focus" | "motivation" | "study"
  | "relationship" | "placement" | "homesick" | "sleep" | "exam" | "career"
  | "vent" | "celebrate" | "ask"
  | "academic" | "mentor" | "productivity" | "buddy" | "reflection"
  | "latenight" | "creative" | "life" | "general"
  | "cbt" | "grounding" | "compassion" | "regulation" | "mindful" | "burnout";

export type Attachment = { kind: "image" | "pdf" | "audio" | "note"; name: string; dataUrl?: string };

export type Msg = {
  id: string;
  from: Role;
  text: string;
  ts: number;
  pinned?: boolean;
  bookmarked?: boolean;
  reaction?: string;
  edited?: boolean;
  attachments?: Attachment[];
};

export type Conversation = {
  id: string;
  title: string;
  type: ConvType;
  createdAt: number;
  updatedAt: number;
  messages: Msg[];
  folder?: string;
  pinned?: boolean;
  archived?: boolean;
  favorite?: boolean;
  emotion?: string;
};

export type Memory = {
  id: string;
  text: string;
  category: "goal" | "dream" | "exam" | "friend" | "preference" | "habit" | "note";
  pinned?: boolean;
  createdAt: number;
};

export type Prefs = {
  avatar: "minimal" | "friendly" | "professional" | "supportive" | "motivational" | "calm";
  voice: "soft" | "warm" | "clear";
  accent: "in" | "us" | "uk";
  bubble: "round" | "square" | "flat";
  fontSize: "s" | "m" | "l";
  length: "short" | "medium" | "long";
  style: "poetic" | "direct" | "friendly";
  language: "en" | "hi" | "mixed";
  notifs: { morning: boolean; night: boolean; followup: boolean; goal: boolean; exam: boolean; habit: boolean };
};

const K = {
  convs: "peacecode.peacebot.conversations.v1",
  mems:  "peacecode.peacebot.memories.v1",
  prefs: "peacecode.peacebot.prefs.v1",
};

const uid = () => Math.random().toString(36).slice(2, 10);

const safeGet = <T,>(k: string, fb: T): T => {
  if (typeof window === "undefined") return fb;
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : fb; } catch { return fb; }
};
const safeSet = (k: string, v: unknown) => {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  window.dispatchEvent(new CustomEvent("peacebot-store", { detail: k }));
};

// ─── conversations ───
export function loadConvs(): Conversation[] { return safeGet<Conversation[]>(K.convs, []); }
export function saveConvs(list: Conversation[]) { safeSet(K.convs, list); }
export function getConv(id: string): Conversation | undefined { return loadConvs().find((c) => c.id === id); }
export function upsertConv(c: Conversation) {
  const list = loadConvs();
  const i = list.findIndex((x) => x.id === c.id);
  if (i >= 0) list[i] = c; else list.unshift(c);
  saveConvs(list);
}
export function deleteConv(id: string) { saveConvs(loadConvs().filter((c) => c.id !== id)); }

export const CONV_TITLES: Record<ConvType, string> = {
  free: "talking freely", anxious: "feeling anxious", overthinking: "overthinking",
  focus: "help me focus", motivation: "a little motivation", study: "study planning",
  relationship: "relationship thoughts", placement: "placement stress", homesick: "homesickness",
  sleep: "sleep help", exam: "exam panic", career: "career confusion", vent: "just venting",
  celebrate: "celebrating something", ask: "ask anything",
  academic: "academic coach", mentor: "career mentor", productivity: "productivity coach",
  buddy: "study buddy", reflection: "daily reflection", latenight: "late-night companion",
  creative: "creative brainstorm", life: "life advice", general: "general chat",
  cbt: "cbt conversation", grounding: "grounding exercise", compassion: "self-compassion",
  regulation: "emotional regulation", mindful: "mindfulness coach", burnout: "burnout recovery",
};

export const CONV_OPENERS: Partial<Record<ConvType, string>> = {
  anxious: "hey — i'm here. what's the anxiety pointing at right now? no need to solve it, just name a piece of it.",
  overthinking: "let's slow the loop. what's the thought that keeps coming back?",
  focus: "okay — one small thing to focus on. what would count as a good next 25 minutes?",
  motivation: "you don't need to feel it to start it. tell me what today is asking of you.",
  study: "what's on your plate this week? we'll shape it into something walkable.",
  placement: "placement season is loud. tell me what's the loudest thought right now.",
  homesick: "home lives in small things. what part of home are you missing tonight?",
  sleep: "let's get you to sleep gently. how does your body feel right now?",
  exam: "breathe with me first. one exam, one page, one line. what's the exam about?",
  vent: "vent as long as you need. i'm not going anywhere.",
  celebrate: "i want to hear this properly. tell me what happened.",
  cbt: "let's look at one thought together. what's the thought — as you'd say it in your head?",
  grounding: "we'll do 5-4-3-2-1. name 5 things you can see around you.",
  burnout: "you sound tired in a way sleep doesn't fix. what's been draining you most?",
};

export function newConv(type: ConvType = "free"): Conversation {
  const id = uid();
  const now = Date.now();
  const opener = CONV_OPENERS[type] ?? "hey. i'm here. what's on your mind?";
  return {
    id, title: CONV_TITLES[type] ?? "new conversation",
    type, createdAt: now, updatedAt: now,
    messages: [{ id: uid(), from: "peace", text: opener, ts: now }],
  };
}
export function addMsg(convId: string, m: Omit<Msg, "id" | "ts">): Msg {
  const list = loadConvs();
  const c = list.find((x) => x.id === convId);
  const msg: Msg = { ...m, id: uid(), ts: Date.now() };
  if (c) { c.messages.push(msg); c.updatedAt = msg.ts; saveConvs(list); }
  return msg;
}
export function patchMsg(convId: string, msgId: string, patch: Partial<Msg>) {
  const list = loadConvs();
  const c = list.find((x) => x.id === convId); if (!c) return;
  const m = c.messages.find((x) => x.id === msgId); if (!m) return;
  Object.assign(m, patch); c.updatedAt = Date.now(); saveConvs(list);
}
export function removeMsg(convId: string, msgId: string) {
  const list = loadConvs();
  const c = list.find((x) => x.id === convId); if (!c) return;
  c.messages = c.messages.filter((m) => m.id !== msgId); c.updatedAt = Date.now(); saveConvs(list);
}

// ─── memories ───
export function loadMems(): Memory[] { return safeGet<Memory[]>(K.mems, DEFAULT_MEMS); }
export function saveMems(list: Memory[]) { safeSet(K.mems, list); }
export function addMem(text: string, category: Memory["category"] = "note"): Memory {
  const m: Memory = { id: uid(), text, category, createdAt: Date.now() };
  saveMems([m, ...loadMems()]); return m;
}
export function patchMem(id: string, patch: Partial<Memory>) {
  const list = loadMems().map((m) => (m.id === id ? { ...m, ...patch } : m)); saveMems(list);
}
export function removeMem(id: string) { saveMems(loadMems().filter((m) => m.id !== id)); }

const DEFAULT_MEMS: Memory[] = [
  { id: "m1", text: "prefers being called Jai", category: "preference", pinned: true, createdAt: Date.now() - 86400000 * 12 },
  { id: "m2", text: "final semester at NIT — placement season starts in march", category: "exam", pinned: true, createdAt: Date.now() - 86400000 * 9 },
  { id: "m3", text: "wants to move into product design after graduating", category: "dream", createdAt: Date.now() - 86400000 * 5 },
  { id: "m4", text: "sleeps better after a 4-7-8 breath at night", category: "habit", createdAt: Date.now() - 86400000 * 3 },
  { id: "m5", text: "close friend Riya is going through a break-up", category: "friend", createdAt: Date.now() - 86400000 * 2 },
  { id: "m6", text: "writing style: short, lowercase, honest", category: "preference", createdAt: Date.now() - 86400000 * 1 },
];

// ─── prefs ───
export const DEFAULT_PREFS: Prefs = {
  avatar: "supportive", voice: "warm", accent: "in", bubble: "round",
  fontSize: "m", length: "medium", style: "poetic", language: "en",
  notifs: { morning: true, night: true, followup: true, goal: true, exam: true, habit: false },
};
export function loadPrefs(): Prefs { return { ...DEFAULT_PREFS, ...safeGet<Partial<Prefs>>(K.prefs, {}) }; }
export function savePrefs(p: Prefs) { safeSet(K.prefs, p); }

// ─── ambient student context (mock, mirrors dashboard) ───
export const STUDENT_CONTEXT = {
  name: "Jai",
  streak: 14,
  sleepHours: 7.4,
  mood: "grounded",
  focusMinutes: 120,
  journalEntries: 6,
  lastScreening: "PHQ-9 · mild · 6 days ago",
  exams: "endsem starts in 18 days",
};
