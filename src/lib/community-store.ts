// Local-first Community store. Circles, live rooms, threads, comments, saves, joins.
// LocalStorage persistence + a tiny pub/sub so React components re-render on writes.

import { useEffect, useState } from "react";

// ─── types ────────────────────────────────────────────────────────
export type Circle = {
  slug: string;
  name: string;
  tag: string;
  accent: string;
  members: number;
  live: number;
  description: string;
};

export type Room = {
  id: string;
  name: string;
  host: string;
  listeners: number;
  tag: string;
  started: string;
  topic: string;
  circleSlug?: string;
};

export type Thread = {
  id: string;
  author: string;
  circleSlug: string;
  title: string;
  body: string;
  votes: number;
  tag: string;
  createdAt: number;
};

export type Comment = {
  id: string;
  threadId: string;
  who: string;
  text: string;
  createdAt: number;
  votes: number;
  held?: boolean;
};

export type RoomMessage = {
  id: string;
  roomId: string;
  who: string;
  text: string;
  createdAt: number;
  mine?: boolean;
  tone?: "guide";
};

// ─── seed ─────────────────────────────────────────────────────────
const lavender = "#D5C9F7";
const sky      = "#AFC9F5";
const rose     = "#F8CADA";
const mint     = "#CDEBD9";

const SEED_CIRCLES: Circle[] = [
  { slug: "exam-calm",         name: "Exam calm",           tag: "study",  accent: sky,      members: 214, live: 18, description: "we study quietly, together. no comparing, no cramming — just presence before a paper." },
  { slug: "homesick",          name: "Homesick",            tag: "care",   accent: lavender, members: 87,  live: 6,  description: "for anyone missing a kitchen, a language, a person, a monsoon. bring one thing, leave a little lighter." },
  { slug: "late-night",        name: "Late-night thoughts", tag: "safe",   accent: rose,     members: 342, live: 41, description: "if the ceiling is talking to you at 3am, we're here. no fixing." },
  { slug: "first-gen",         name: "First-gen students",  tag: "kin",    accent: mint,     members: 128, live: 9,  description: "we are the first in our family to do this. it's proud and lonely at once." },
  { slug: "panic-to-pause",    name: "Panic → pause",       tag: "breath", accent: sky,      members: 501, live: 63, description: "a short room for the shaky moments. a breath, a script, and a hand." },
  { slug: "quiet-wins",        name: "Quiet wins",          tag: "joy",    accent: lavender, members: 276, live: 14, description: "the ordinary victories nobody claps for. we clap here." },
];

const SEED_ROOMS: Room[] = [
  { id: "r-sunday-reset",    name: "Sunday reset",   host: "moon · counselor", listeners: 42, tag: "guided",  started: "12 min", topic: "letting the week soften before it starts", circleSlug: "quiet-wins" },
  { id: "r-3am-company",     name: "3AM company",    host: "kavya · peer",     listeners: 19, tag: "open mic", started: "28 min", topic: "if you can't sleep, we're here. no fixing.", circleSlug: "late-night" },
  { id: "r-breath-together", name: "Breath together",host: "peace bot",        listeners: 88, tag: "breath",   started: "just now",topic: "box breathing · 6 rounds · anyone welcome",   circleSlug: "panic-to-pause" },
  { id: "r-before-exam",     name: "Before the exam",host: "aditi · peer",     listeners: 31, tag: "study",    started: "1 hr",    topic: "we're studying quietly. no talking, just presence.", circleSlug: "exam-calm" },
];

const SEED_THREADS: Thread[] = [
  { id: "t1", author: "someone kind", circleSlug: "homesick",    title: "the smell of monsoon here reminds me of my mother's kitchen. that's enough for today.", body: "no lesson. no takeaway. just — writing it down so it exists somewhere.", votes: 218, tag: "soft", createdAt: Date.now() - 2 * 3600e3 },
  { id: "t2", author: "night owl",    circleSlug: "late-night",  title: "does anyone else feel like they're performing rest?", body: "I took a break yesterday and spent it worrying about whether I was resting correctly.", votes: 412, tag: "real", createdAt: Date.now() - 5 * 3600e3 },
  { id: "t3", author: "quiet friend", circleSlug: "exam-calm",   title: "a small script that worked for me the night before finals", body: "1. close the notes. 2. shower. 3. write tomorrow-morning-me one kind sentence. 4. sleep. it's not more studying that helped, it was trusting what I'd already done.", votes: 189, tag: "share", createdAt: Date.now() - 8 * 3600e3 },
  { id: "t4", author: "anon",         circleSlug: "first-gen",   title: "my parents don't understand what a thesis is, and that's okay", body: "for a long time I thought I needed them to get it. today I realized their pride doesn't depend on understanding. it just is.", votes: 356, tag: "kin", createdAt: Date.now() - 26 * 3600e3 },
];

const SEED_COMMENTS: Comment[] = [
  { id: "c1", threadId: "t2", who: "someone kind", text: "reading this at 2am. thank you for writing it down.", createdAt: Date.now() - 20 * 60e3, votes: 18 },
  { id: "c2", threadId: "t2", who: "quiet friend", text: "i felt this in my chest. we're not performing, we're just tired.", createdAt: Date.now() - 60 * 60e3, votes: 42 },
  { id: "c3", threadId: "t1", who: "anon",         text: "sending a quiet nod across the internet.", createdAt: Date.now() - 3 * 3600e3, votes: 9 },
];

const SEED_ROOM_MSGS: RoomMessage[] = [
  { id: "m1", roomId: "r-sunday-reset",    who: "peace bot", text: "welcome in. take your first breath here — no need to say anything.", createdAt: Date.now() - 60e3, tone: "guide" },
  { id: "m2", roomId: "r-sunday-reset",    who: "moon",      text: "let's start with a small anchor — where in the room are you sitting?", createdAt: Date.now() - 30e3, tone: "guide" },
  { id: "m3", roomId: "r-sunday-reset",    who: "leaf",      text: "at my desk. slightly slouched.", createdAt: Date.now() - 12e3 },
  { id: "m4", roomId: "r-3am-company",     who: "kavya",     text: "hi. glad you're here. we're just keeping company.", createdAt: Date.now() - 40e3 },
  { id: "m5", roomId: "r-breath-together", who: "peace bot", text: "in for four … hold four … out for six. round one begins.", createdAt: Date.now() - 20e3, tone: "guide" },
  { id: "m6", roomId: "r-before-exam",     who: "aditi",     text: "phones down. we study together, in silence, for 25 minutes.", createdAt: Date.now() - 15e3 },
];

// ─── state ────────────────────────────────────────────────────────
type State = {
  circles: Circle[];
  rooms: Room[];
  threads: Thread[];
  comments: Comment[];
  roomMessages: RoomMessage[];
  savedThreadIds: string[];
  joinedCircles: string[];
  votedThreads: Record<string, 1 | -1 | undefined>;
};

const KEY = "peacecode.community.v1";

function load(): State {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<State>;
    return { ...defaults(), ...parsed };
  } catch {
    return defaults();
  }
}

function defaults(): State {
  return {
    circles: SEED_CIRCLES,
    rooms: SEED_ROOMS,
    threads: SEED_THREADS,
    comments: SEED_COMMENTS,
    roomMessages: SEED_ROOM_MSGS,
    savedThreadIds: [],
    joinedCircles: [],
    votedThreads: {},
  };
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}
function emit() {
  persist();
  listeners.forEach((l) => l());
}

// ─── read hook ────────────────────────────────────────────────────
export function useCommunity() {
  const [snap, setSnap] = useState(state);
  useEffect(() => {
    const l = () => setSnap({ ...state });
    listeners.add(l);
    // rehydrate on mount (handles SSR / initial defaults)
    state = load();
    setSnap({ ...state });
    return () => { listeners.delete(l); };
  }, []);
  return snap;
}

// ─── mutations ────────────────────────────────────────────────────
export const community = {
  getCircleBySlug(slug: string) { return state.circles.find((c) => c.slug === slug); },
  getRoom(id: string) { return state.rooms.find((r) => r.id === id); },
  getThread(id: string) { return state.threads.find((t) => t.id === id); },
  threadsInCircle(slug: string) { return state.threads.filter((t) => t.circleSlug === slug); },
  commentsFor(threadId: string) { return state.comments.filter((c) => c.threadId === threadId).sort((a, b) => b.createdAt - a.createdAt); },
  messagesFor(roomId: string) { return state.roomMessages.filter((m) => m.roomId === roomId).sort((a, b) => a.createdAt - b.createdAt); },

  toggleJoin(slug: string) {
    const has = state.joinedCircles.includes(slug);
    state.joinedCircles = has ? state.joinedCircles.filter((s) => s !== slug) : [...state.joinedCircles, slug];
    state.circles = state.circles.map((c) => c.slug === slug ? { ...c, members: c.members + (has ? -1 : 1) } : c);
    emit();
  },

  toggleSave(threadId: string) {
    const has = state.savedThreadIds.includes(threadId);
    state.savedThreadIds = has ? state.savedThreadIds.filter((s) => s !== threadId) : [...state.savedThreadIds, threadId];
    emit();
  },

  voteThread(threadId: string, dir: 1 | -1) {
    const prev = state.votedThreads[threadId];
    let delta = 0;
    let next: 1 | -1 | undefined = dir;
    if (prev === dir) { delta = -dir; next = undefined; }        // undo
    else if (prev === undefined) { delta = dir; }                // fresh vote
    else { delta = dir * 2; }                                    // flip vote
    state.votedThreads = { ...state.votedThreads, [threadId]: next };
    state.threads = state.threads.map((t) => t.id === threadId ? { ...t, votes: t.votes + delta } : t);
    emit();
  },

  createThread(input: { title: string; body: string; circleSlug: string; }) {
    const id = "t" + Date.now();
    const t: Thread = {
      id, author: "you (anon)", createdAt: Date.now(),
      votes: 1, tag: "soft",
      title: input.title.trim(), body: input.body.trim(),
      circleSlug: input.circleSlug,
    };
    state.threads = [t, ...state.threads];
    state.votedThreads = { ...state.votedThreads, [id]: 1 };
    emit();
    return id;
  },

  addComment(threadId: string, text: string) {
    if (!text.trim()) return;
    const c: Comment = { id: "c" + Date.now(), threadId, who: "you (anon)", text: text.trim(), createdAt: Date.now(), votes: 0 };
    state.comments = [c, ...state.comments];
    emit();
  },
  voteComment(commentId: string, dir: 1 | -1) {
    state.comments = state.comments.map((c) => c.id === commentId ? { ...c, votes: c.votes + dir } : c);
    emit();
  },
  toggleHold(commentId: string) {
    state.comments = state.comments.map((c) => c.id === commentId ? { ...c, held: !c.held, votes: c.votes + (c.held ? -1 : 1) } : c);
    emit();
  },

  sendRoomMessage(roomId: string, text: string) {
    if (!text.trim()) return;
    const m: RoomMessage = { id: "m" + Date.now(), roomId, who: "you (anon)", text: text.trim(), createdAt: Date.now(), mine: true };
    state.roomMessages = [...state.roomMessages, m];
    emit();
  },
};

// ─── helpers ──────────────────────────────────────────────────────
export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); return `${d}d`;
}
