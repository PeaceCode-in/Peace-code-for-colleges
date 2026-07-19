// PeaceCode Resource Library — local-first store
// Seeded content, bookmarks, history, notes, highlights, playlists, downloads,
// achievements, learning streak, and recommendation logic. No SSR access.
import { useState, useEffect } from "react";

export type ResourceFormat =
  | "article" | "short-read" | "long-read" | "research"
  | "video" | "short-video"
  | "podcast" | "audiobook"
  | "meditation" | "sleep-story"
  | "worksheet" | "infographic" | "interactive" | "checklist" | "template"
  | "course" | "challenge" | "webinar" | "pdf" | "flashcards" | "quiz"
  | "breathing" | "journal-prompt" | "case-study" | "story" | "interview";

export const FORMAT_LABELS: Record<ResourceFormat, string> = {
  "article": "Article", "short-read": "Short Read", "long-read": "Long Read",
  "research": "Research", "video": "Video", "short-video": "Short",
  "podcast": "Podcast", "audiobook": "Audiobook",
  "meditation": "Meditation", "sleep-story": "Sleep Story",
  "worksheet": "Worksheet", "infographic": "Infographic",
  "interactive": "Interactive", "checklist": "Checklist", "template": "Template",
  "course": "Course", "challenge": "Challenge", "webinar": "Webinar",
  "pdf": "PDF Guide", "flashcards": "Flashcards", "quiz": "Quiz",
  "breathing": "Breathing", "journal-prompt": "Journal Prompt",
  "case-study": "Case Study", "story": "Student Story", "interview": "Interview",
};

export const CATEGORIES = [
  { slug: "stress",         name: "Stress",           emoji: "🌊", color: "#7FB3D5" },
  { slug: "anxiety",        name: "Anxiety",          emoji: "🫧", color: "#A9CCE3" },
  { slug: "depression",     name: "Depression",       emoji: "🌧️", color: "#8E9AAF" },
  { slug: "burnout",        name: "Burnout",          emoji: "🔥", color: "#E8A87C" },
  { slug: "friendship",     name: "Friendship",       emoji: "🤝", color: "#F5B7B1" },
  { slug: "relationships",  name: "Relationships",    emoji: "💞", color: "#E8B4CB" },
  { slug: "college-life",   name: "College Life",     emoji: "🎓", color: "#B4A7D6" },
  { slug: "hostel-life",    name: "Hostel Life",      emoji: "🏠", color: "#D4B896" },
  { slug: "homesickness",   name: "Homesickness",     emoji: "🏡", color: "#C9A9A6" },
  { slug: "exams",          name: "Exams",            emoji: "📚", color: "#F4D06F" },
  { slug: "placements",     name: "Placements",       emoji: "💼", color: "#82B366" },
  { slug: "internships",    name: "Internships",      emoji: "🧭", color: "#95C8A5" },
  { slug: "career",         name: "Career",           emoji: "🚀", color: "#7FB1B5" },
  { slug: "confidence",     name: "Self Confidence",  emoji: "🌟", color: "#F5CBA7" },
  { slug: "productivity",   name: "Productivity",     emoji: "⚡", color: "#F7DC6F" },
  { slug: "focus",          name: "Focus",            emoji: "🎯", color: "#BB8FCE" },
  { slug: "mindfulness",    name: "Mindfulness",      emoji: "🍃", color: "#A2D9A5" },
  { slug: "meditation",     name: "Meditation",       emoji: "🧘", color: "#AED6F1" },
  { slug: "sleep",          name: "Sleep",            emoji: "🌙", color: "#8FA5C8" },
  { slug: "nutrition",      name: "Nutrition",        emoji: "🥗", color: "#A9DFBF" },
  { slug: "fitness",        name: "Fitness",          emoji: "💪", color: "#F1948A" },
  { slug: "self-care",      name: "Self Care",        emoji: "🌸", color: "#F5B7B1" },
  { slug: "motivation",     name: "Motivation",       emoji: "🔥", color: "#F5B041" },
  { slug: "communication",  name: "Communication",    emoji: "💬", color: "#85C1E2" },
  { slug: "time",           name: "Time Management",  emoji: "⏳", color: "#D7BDE2" },
  { slug: "money",          name: "Financial Wellness", emoji: "🪙", color: "#F9E79F" },
  { slug: "digital",        name: "Digital Wellbeing", emoji: "📱", color: "#AEB6BF" },
  { slug: "gratitude",      name: "Gratitude",        emoji: "🕊️", color: "#F5CBA7" },
  { slug: "journaling",     name: "Journaling",       emoji: "✍️", color: "#D5A6BD" },
  { slug: "adhd",           name: "ADHD",             emoji: "🌀", color: "#C39BD3" },
  { slug: "ocd",            name: "OCD",              emoji: "🔁", color: "#A3E4D7" },
  { slug: "ptsd",           name: "PTSD",             emoji: "🕯️", color: "#D2B4DE" },
  { slug: "lgbtq",          name: "LGBTQ+",           emoji: "🏳️‍🌈", color: "#F1948A" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const DIFFICULTIES = ["Gentle", "Balanced", "Deep"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const LANGUAGES = ["English", "Hindi"] as const;
export type Language = (typeof LANGUAGES)[number];

export type Author = {
  id: string;
  name: string;
  title: string;
  bio: string;
  verified: boolean;
  rating: number;
  topics: CategorySlug[];
  socials: { twitter?: string; linkedin?: string; site?: string };
};

export type Resource = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body?: string;                    // long-form content
  authorId: string;
  format: ResourceFormat;
  category: CategorySlug;
  tags: string[];
  minutes: number;                  // reading / watch / listen
  difficulty: Difficulty;
  language: Language;
  publishedAt: string;              // ISO
  hero: string;                     // gradient token, e.g. "sunrise"
  emoji: string;
  views: number;
  likes: number;
  bookmarks: number;
  rating: number;
  featured?: boolean;
  free: boolean;
  trending?: boolean;
  toc?: string[];
  tableOfContents?: string[];
  transcript?: string;
};

export type Collection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  hero: string;
  emoji: string;
  curator: string;
  resourceIds: string[];
};

// ─── Authors ──────────────────────────────────────────────
export const AUTHORS: Author[] = [
  { id: "a1", name: "Dr. Ananya Rao", title: "Clinical Psychologist, NIMHANS",
    bio: "Ananya works with students on anxiety, burnout and the quiet grief of leaving home. She writes gentle, evidence-based pieces that read like a letter from a friend.",
    verified: true, rating: 4.9, topics: ["anxiety","burnout","homesickness","exams"],
    socials: { linkedin: "#", twitter: "#", site: "#" } },
  { id: "a2", name: "Kabir Sen", title: "Sleep Researcher & Meditation Guide",
    bio: "Kabir teaches nervous-system regulation, sleep hygiene and long-form breath work. He's spent a decade with Zen and Vipassana teachers.",
    verified: true, rating: 4.8, topics: ["sleep","meditation","mindfulness","stress"],
    socials: { site: "#" } },
  { id: "a3", name: "Prof. Meera Iyer", title: "Career Counsellor, IIT Bombay",
    bio: "Meera has helped over 12,000 students navigate placements, career pivots and imposter syndrome. Warm, practical, unafraid.",
    verified: true, rating: 4.9, topics: ["career","placements","internships","confidence"],
    socials: { linkedin: "#" } },
  { id: "a4", name: "Riya Kapoor", title: "Peer Wellness Educator",
    bio: "Riya writes as a fifth-year student who has been through the wall and back. Real, tender, and never preachy.",
    verified: true, rating: 4.7, topics: ["college-life","hostel-life","friendship","relationships"],
    socials: { twitter: "#" } },
  { id: "a5", name: "Dr. Farhan Qureshi", title: "Psychiatrist, AIIMS",
    bio: "Farhan focuses on ADHD, OCD and depression in students. He believes in the phrase: 'diagnosis is not identity'.",
    verified: true, rating: 4.9, topics: ["adhd","ocd","depression","ptsd"],
    socials: { linkedin: "#" } },
  { id: "a6", name: "Sana Verma", title: "Nutritionist & Fitness Coach",
    bio: "Sana designs eating and movement rituals for exam-week bodies. No shame, no fad diets, only what actually works.",
    verified: true, rating: 4.6, topics: ["nutrition","fitness","self-care"],
    socials: { site: "#" } },
];

// helper for seed generation
const now = new Date("2026-07-01T09:00:00Z").getTime();
const dayAgo = (n: number) => new Date(now - n * 86400000).toISOString();

let __rid = 0;
const R = (
  authorId: string,
  title: string,
  description: string,
  format: ResourceFormat,
  category: CategorySlug,
  minutes: number,
  hero: string,
  emoji: string,
  tags: string[] = [],
  opts: Partial<Resource> = {}
): Resource => {
  __rid++;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id: `r${__rid}`, slug, title, description, authorId, format, category, tags,
    minutes, difficulty: opts.difficulty ?? "Balanced", language: opts.language ?? "English",
    publishedAt: opts.publishedAt ?? dayAgo(__rid % 60),
    hero, emoji,
    views: 1200 + ((__rid * 137) % 8000),
    likes: 80 + ((__rid * 53) % 900),
    bookmarks: 40 + ((__rid * 29) % 500),
    rating: 4.2 + ((__rid * 7) % 8) / 10,
    free: true,
    trending: __rid % 5 === 0,
    featured: __rid % 11 === 0,
    body: opts.body,
    tableOfContents: opts.tableOfContents,
    transcript: opts.transcript,
    ...opts,
  };
};

// ─── Seed resources ────────────────────────────────────────
export const RESOURCES: Resource[] = [
  R("a1","The Quiet Panic Before a Paper","A gentle walkthrough of the physiology of exam anxiety — and three things you can do in the last five minutes before the invigilator hands out the sheet.","article","exams",6,"sunrise","🌅",["exam","anxiety","cbt"],{
    body: `Exam anxiety is not weakness. It is your body preparing to run from a tiger it cannot see.\n\nIn the last five minutes before a paper, three things reliably help.\n\n**1. Long exhale**\nBreathe in for 4, out for 8. The exhale is the anchor — it activates the parasympathetic nervous system.\n\n**2. Feet on floor**\nPress both feet firmly down. Notice five things you can see. Anchor.\n\n**3. Write your name**\nA small act of agency. You are here. You have prepared. You will begin.`,
    tableOfContents: ["Why your body reacts this way","The five-minute protocol","What to do if you blank","A note for the walk home"],
    featured: true,
  }),
  R("a1","When Everything Feels Like Too Much","A short, tender piece on burnout — and why doing less is often the most productive thing you can do.","short-read","burnout",4,"dusk","🌫️",["burnout","rest"]),
  R("a2","Ocean Breath — 12 Minutes","A guided meditation for the nervous system, using ujjayi breath. Best with headphones and eyes closed.","meditation","meditation",12,"ocean","🌊",["breath","calm"]),
  R("a2","The Wind-Down Sleep Story","A slow story about a lantern-lit riverbank in Kyoto. Written to be heard, not remembered.","sleep-story","sleep",22,"night","🌙",["sleep","story"]),
  R("a3","How To Read A JD Without Spiralling","A pragmatic guide to reading job descriptions — what to ignore, what to internalise, and how to talk about gaps.","long-read","placements",11,"paper","📄",["placements","career"]),
  R("a3","Talking About Yourself Without Cringing","The framework I use with 800 students a year to answer 'tell me about yourself' in interviews.","video","confidence",8,"warm","🎥",["interview","confidence"]),
  R("a4","The Hostel Room Nobody Warns You About","Riya writes about the first three weeks — the sounds, the small grief, the friend you thought you'd have by now.","story","hostel-life",7,"amber","🕯️",["hostel","freshers"]),
  R("a4","How To Text A Friend Who's Not Okay","A short checklist for messaging someone who's struggling — what helps, what to avoid.","checklist","friendship",3,"peach","💌",["support","friendship"]),
  R("a5","ADHD Isn't Laziness — Here's What's Happening","A calm, clinical explanation of the ADHD brain and why executive function is not effort.","long-read","adhd",14,"lavender","🌀",["adhd","science"]),
  R("a5","A Grounding Exercise For Panic","5-4-3-2-1 in audio form, spoken slowly, twice through.","podcast","anxiety",6,"cool","🎧",["panic","grounding"]),
  R("a6","Exam Week Plate","A one-page infographic showing what to eat on paper mornings — no fads, no shame.","infographic","nutrition",2,"garden","🥗",["food","exams"]),
  R("a6","Ten-Minute Room Workout","A silent, no-equipment routine for hostel rooms with thin walls.","short-video","fitness",10,"sun","💪",["movement"]),
  R("a2","Box Breathing — 4x4x4x4","The technique used by Navy SEALs and, more importantly, by first-year students at 2am.","breathing","stress",5,"mist","🫁",["breath"]),
  R("a1","Journal Prompt — The Version Of Me I'm Afraid Of","One question. Ten minutes. Write without stopping.","journal-prompt","journaling",10,"paper","📓",["journal"]),
  R("a3","Placement Prep — A 6-Week Structure","A slow, humane 6-week study plan for placements. Includes rest days.","course","placements",180,"warm","📚",["placements","course"],{ difficulty: "Deep" }),
  R("a4","How I Went Home Without Feeling Like A Failure","A student's essay on the semester she left and the semester she came back stronger.","story","homesickness",8,"dusk","🏡",["homesickness"]),
  R("a5","Depression Isn't Sadness","A short, careful explanation of what clinical depression actually feels like from the inside.","short-read","depression",5,"grey","🌧️",["depression"]),
  R("a1","CBT Worksheet — Thought Record","A one-page PDF worksheet to catch, examine, and gently rewrite anxious thoughts.","worksheet","anxiety",8,"paper","📝",["cbt","worksheet"]),
  R("a2","Mindful Walk — 15 Minutes","A guided walk-and-notice audio. Best done outside, slowly, without headphones in both ears.","meditation","mindfulness",15,"garden","🍃",["walk","mindful"]),
  R("a4","Small Talk Without Draining Yourself","Introvert-friendly scripts for the mess hall, the corridor, the group project.","article","communication",6,"peach","💬",["social"]),
  R("a3","How To Answer 'What's Your Weakness'","A short video with two frameworks — pick the one that fits your voice.","short-video","career",4,"warm","🎥",["interview"]),
  R("a1","When A Friend Vanishes","On the strange grief of a friendship that ends without a fight.","long-read","friendship",12,"dusk","🕊️",["friendship","loss"]),
  R("a2","Yoga Nidra For Study Breaks","A 20-minute lie-down practice for the middle of a study day.","meditation","sleep",20,"night","🌙",["nidra"]),
  R("a5","OCD Isn't Being Tidy","A gentle piece on what OCD actually looks like in students, and where to begin if you recognise yourself.","article","ocd",7,"lavender","🔁",["ocd"]),
  R("a6","Building A Movement Habit That Doesn't Break","Behaviour design for people who have started and stopped nineteen times.","long-read","fitness",9,"sun","🏃",["habit","fitness"]),
  R("a1","Screening Self-Check — GAD-7 Guide","How to read a GAD-7 result without spiralling. What the numbers mean, and what to do next.","article","anxiety",5,"mist","📊",["screening","gad7"]),
  R("a3","Internship Cold Emails That Don't Sound Desperate","Three real templates, annotated, from students who got responses.","template","internships",6,"paper","✉️",["email","internship"]),
  R("a4","A Playlist For Sunday Evenings","Riya's private playlist for the weight of a new week. (Curated tracks list.)","article","motivation",3,"amber","🎵",["playlist"]),
  R("a2","Deep Rest — 45 Minute Sleep Story","A very long, very slow story about a train that never quite arrives.","sleep-story","sleep",45,"night","🚂",["sleep"], { difficulty: "Deep" }),
  R("a5","PTSD — What Recovery Actually Looks Like","A slow, careful piece on non-linear healing.","long-read","ptsd",13,"grey","🕯️",["ptsd","recovery"]),
  R("a1","Being Queer On A Small Campus","On the specific loneliness — and the specific joy — of finding your people.","story","lgbtq",9,"rainbow","🌈",["lgbtq","story"]),
  R("a3","Money Anxiety For Students","A calm guide to talking about money with parents, tracking spending without guilt, and building a first buffer.","article","money",7,"sun","🪙",["money"]),
  R("a2","Phone-Free Mornings — 7 Day Challenge","A gentle 7-day nudge to keep your phone in another room until you've had water and light.","challenge","digital",7,"sunrise","📱",["digital","challenge"]),
  R("a1","Three Ways To Say 'I'm Struggling'","Words you can copy-paste to a parent, a friend, or a counsellor.","template","communication",3,"peach","💬",["scripts"]),
  R("a4","Gratitude, But Not The Instagram Kind","Riya on gratitude that isn't a performance.","short-read","gratitude",4,"amber","🕊️",["gratitude"]),
  R("a2","Pomodoro That Actually Works","Why 25/5 fails for most students, and the interval that works instead.","article","focus",6,"warm","🎯",["focus","study"]),
  R("a3","How To Choose A Major Without A Panic Attack","A framework, not a formula. Three questions to sit with.","interactive","career",12,"paper","🧭",["decision"]),
  R("a5","Medication Isn't Cheating","A short, calm piece on psychiatric medication and shame.","short-read","depression",5,"grey","💊",["meds"]),
  R("a1","When Confidence Comes And Goes","A tender essay on the days you feel small, and the ones you don't.","article","confidence",6,"warm","🌟",["confidence"]),
  R("a2","4-7-8 Breath For Sleep","The classical Weil technique, in audio, three rounds.","breathing","sleep",5,"night","😴",["breath","sleep"]),
];

// ─── Collections ──────────────────────────────────────────
export const COLLECTIONS: Collection[] = [
  { id: "c1", slug: "exam-survival-kit", title: "Exam Survival Kit",
    description: "For the weeks you can't remember what day it is. Nine short things to keep you steady.",
    hero: "sunrise", emoji: "📚", curator: "Dr. Ananya Rao",
    resourceIds: ["r1","r13","r11","r18","r36","r26","r14","r9","r6"] },
  { id: "c2", slug: "beat-anxiety", title: "Beat Anxiety",
    description: "The calmest, most evidence-based pieces we have on anxiety — including two audios.",
    hero: "mist", emoji: "🫧", curator: "PeaceCode Editors",
    resourceIds: ["r1","r10","r13","r18","r26","r14"] },
  { id: "c3", slug: "better-sleep", title: "Better Sleep",
    description: "Wind down. Long stories. Slow breath. Ten pieces, curated by Kabir.",
    hero: "night", emoji: "🌙", curator: "Kabir Sen",
    resourceIds: ["r4","r29","r23","r40","r3"] },
  { id: "c4", slug: "productivity-mastery", title: "Productivity Mastery",
    description: "Not hustle. Rhythm. A calmer way to get more done.",
    hero: "warm", emoji: "⚡", curator: "PeaceCode Editors",
    resourceIds: ["r36","r15","r25","r33"] },
  { id: "c5", slug: "hostel-starter-kit", title: "Hostel Starter Kit",
    description: "Everything Riya wishes someone had told her in freshers' week.",
    hero: "amber", emoji: "🏠", curator: "Riya Kapoor",
    resourceIds: ["r7","r16","r20","r28","r34"] },
  { id: "c6", slug: "placement-preparation", title: "Placement Preparation",
    description: "A six-week runway — with room for rest.",
    hero: "warm", emoji: "💼", curator: "Prof. Meera Iyer",
    resourceIds: ["r5","r6","r15","r21","r27","r37"] },
  { id: "c7", slug: "relationship-help", title: "Relationship Help",
    description: "Friendship, dating, endings. Nothing performative.",
    hero: "peach", emoji: "💞", curator: "Riya Kapoor",
    resourceIds: ["r8","r20","r22","r34"] },
  { id: "c8", slug: "managing-burnout", title: "Managing Burnout",
    description: "For the semester you gave everything to. Rest as strategy.",
    hero: "dusk", emoji: "🕯️", curator: "Dr. Ananya Rao",
    resourceIds: ["r2","r39","r19","r23"] },
  { id: "c9", slug: "confidence-building", title: "Confidence Building",
    description: "A slow, honest set on being seen — without pretending.",
    hero: "sun", emoji: "🌟", curator: "PeaceCode Editors",
    resourceIds: ["r6","r39","r20","r21"] },
  { id: "c10", slug: "freshers-guide", title: "Freshers Guide",
    description: "The first-year handbook we wish we'd had.",
    hero: "sunrise", emoji: "🎓", curator: "Riya Kapoor",
    resourceIds: ["r7","r16","r20","r34","r33"] },
  { id: "c11", slug: "womens-wellness", title: "Women's Wellness",
    description: "Pieces on the specific texture of being a woman on campus.",
    hero: "rose", emoji: "🌸", curator: "PeaceCode Editors",
    resourceIds: ["r31","r38","r22","r11"] },
];

// ─── Store (localStorage) ─────────────────────────────────
type StoreShape = {
  bookmarks: string[];
  completed: string[];
  history: { id: string; at: string }[];
  progress: Record<string, number>;      // 0..1
  likes: string[];
  notes: Record<string, { id: string; at: string; body: string; quote?: string }[]>;
  highlights: Record<string, string[]>;
  downloads: string[];
  playlists: { id: string; name: string; resourceIds: string[] }[];
  learnMinutes: Record<string, number>;  // dateKey -> minutes
  achievements: string[];
  prefs: {
    textSize: number;                    // 14..22
    contrast: "normal" | "high";
    readingFont: "serif" | "sans";
    autoplay: boolean;
    notifDaily: boolean;
    notifTrending: boolean;
    language: Language;
  };
};

const KEY = "peacecode.resources.v1";

const DEFAULT: StoreShape = {
  bookmarks: [], completed: [], history: [], progress: {}, likes: [],
  notes: {}, highlights: {}, downloads: [], playlists: [
    { id: "pl-exam", name: "My Exam Playlist", resourceIds: [] },
    { id: "pl-sleep", name: "Sleep Collection", resourceIds: [] },
  ],
  learnMinutes: {}, achievements: [],
  prefs: { textSize: 17, contrast: "normal", readingFont: "serif", autoplay: false,
    notifDaily: true, notifTrending: false, language: "English" },
};

function read(): StoreShape {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(s) };
  } catch { return DEFAULT; }
}
function write(s: StoreShape) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  window.dispatchEvent(new CustomEvent("peacecode-resources"));
}

export function useResourceStore() {
  // small hook returning live snapshot
  // react imported at top of file
  const [snap, setSnap] = useState<StoreShape>(() => read());
  useEffect(() => {
    const sync = () => setSnap(read());
    window.addEventListener("peacecode-resources", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("peacecode-resources", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return snap;
}

// mutations
export const store = {
  toggleBookmark(id: string) {
    const s = read(); const has = s.bookmarks.includes(id);
    s.bookmarks = has ? s.bookmarks.filter(x => x !== id) : [id, ...s.bookmarks];
    write(s); checkAchievements();
  },
  toggleLike(id: string) {
    const s = read(); const has = s.likes.includes(id);
    s.likes = has ? s.likes.filter(x => x !== id) : [id, ...s.likes]; write(s);
  },
  markComplete(id: string) {
    const s = read(); if (!s.completed.includes(id)) s.completed = [id, ...s.completed];
    s.progress[id] = 1;
    const r = RESOURCES.find(x => x.id === id);
    if (r) {
      const k = new Date().toISOString().slice(0, 10);
      s.learnMinutes[k] = (s.learnMinutes[k] || 0) + r.minutes;
    }
    write(s); checkAchievements();
  },
  setProgress(id: string, p: number) {
    const s = read(); s.progress[id] = Math.max(0, Math.min(1, p)); write(s);
  },
  recordView(id: string) {
    const s = read();
    s.history = [{ id, at: new Date().toISOString() }, ...s.history.filter(h => h.id !== id)].slice(0, 200);
    write(s);
  },
  addNote(id: string, body: string, quote?: string) {
    const s = read();
    s.notes[id] = s.notes[id] || [];
    s.notes[id].unshift({ id: `n${Date.now()}`, at: new Date().toISOString(), body, quote });
    write(s);
  },
  deleteNote(id: string, noteId: string) {
    const s = read();
    s.notes[id] = (s.notes[id] || []).filter(n => n.id !== noteId);
    write(s);
  },
  addHighlight(id: string, text: string) {
    const s = read();
    s.highlights[id] = [...(s.highlights[id] || []), text]; write(s);
  },
  toggleDownload(id: string) {
    const s = read(); const has = s.downloads.includes(id);
    s.downloads = has ? s.downloads.filter(x => x !== id) : [id, ...s.downloads]; write(s);
  },
  createPlaylist(name: string) {
    const s = read();
    const id = `pl-${Date.now()}`;
    s.playlists.push({ id, name, resourceIds: [] }); write(s); return id;
  },
  renamePlaylist(id: string, name: string) {
    const s = read();
    s.playlists = s.playlists.map(p => p.id === id ? { ...p, name } : p); write(s);
  },
  deletePlaylist(id: string) {
    const s = read();
    s.playlists = s.playlists.filter(p => p.id !== id); write(s);
  },
  togglePlaylist(id: string, resourceId: string) {
    const s = read();
    s.playlists = s.playlists.map(p => p.id === id
      ? { ...p, resourceIds: p.resourceIds.includes(resourceId)
          ? p.resourceIds.filter(x => x !== resourceId)
          : [...p.resourceIds, resourceId] }
      : p); write(s);
  },
  setPref<K extends keyof StoreShape["prefs"]>(k: K, v: StoreShape["prefs"][K]) {
    const s = read(); s.prefs = { ...s.prefs, [k]: v }; write(s);
  },
};

// ─── Achievements ─────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: "first-read",       name: "First Read",         hint: "Complete your first resource",   emoji: "🌱" },
  { id: "ten-articles",     name: "Ten Articles",       hint: "Complete 10 articles",           emoji: "📚" },
  { id: "fifty-resources",  name: "Fifty Resources",    hint: "Complete 50 resources",          emoji: "🏔️" },
  { id: "podcast-lover",    name: "Podcast Lover",      hint: "Finish 5 podcasts",              emoji: "🎧" },
  { id: "course-explorer",  name: "Course Explorer",    hint: "Start a course",                 emoji: "🧭" },
  { id: "mindfulness-master", name: "Mindfulness Master", hint: "Complete 10 meditations",     emoji: "🍃" },
  { id: "sleep-champion",   name: "Sleep Champion",     hint: "Finish 5 sleep stories",         emoji: "🌙" },
  { id: "learning-streak",  name: "Learning Streak",    hint: "Learn 7 days in a row",          emoji: "🔥" },
] as const;

function checkAchievements() {
  const s = read();
  const has = new Set(s.achievements);
  const done = s.completed.map(id => RESOURCES.find(r => r.id === id)).filter(Boolean) as Resource[];
  const unlock = (id: string) => { if (!has.has(id)) has.add(id); };
  if (done.length >= 1) unlock("first-read");
  if (done.filter(r => r.format.includes("article") || r.format.includes("read")).length >= 10) unlock("ten-articles");
  if (done.length >= 50) unlock("fifty-resources");
  if (done.filter(r => r.format === "podcast").length >= 5) unlock("podcast-lover");
  if (done.some(r => r.format === "course")) unlock("course-explorer");
  if (done.filter(r => r.format === "meditation").length >= 10) unlock("mindfulness-master");
  if (done.filter(r => r.format === "sleep-story").length >= 5) unlock("sleep-champion");
  if (computeStreak(s.learnMinutes) >= 7) unlock("learning-streak");
  s.achievements = Array.from(has); write(s);
}

export function computeStreak(map: Record<string, number>) {
  let streak = 0; let d = new Date();
  for (;;) {
    const k = d.toISOString().slice(0, 10);
    if ((map[k] || 0) > 0) { streak++; d.setDate(d.getDate() - 1); }
    else break;
    if (streak > 400) break;
  }
  return streak;
}

// ─── Selectors ────────────────────────────────────────────
export const byId = (id: string) => RESOURCES.find(r => r.id === id);
export const bySlug = (slug: string) => RESOURCES.find(r => r.slug === slug);
export const authorById = (id: string) => AUTHORS.find(a => a.id === id);
export const collectionBySlug = (slug: string) => COLLECTIONS.find(c => c.slug === slug);
export const categoryBySlug = (slug: string) => CATEGORIES.find(c => c.slug === slug);
export const resourcesByCategory = (slug: string) => RESOURCES.filter(r => r.category === slug);
export const resourcesByAuthor = (id: string) => RESOURCES.filter(r => r.authorId === id);
export const trending = () => RESOURCES.filter(r => r.trending).slice(0, 12);
export const featured = () => RESOURCES.filter(r => r.featured).slice(0, 6);

export function related(r: Resource, n = 6): Resource[] {
  return RESOURCES
    .filter(x => x.id !== r.id)
    .map(x => ({
      r: x,
      s: (x.category === r.category ? 3 : 0)
       + (x.authorId === r.authorId ? 2 : 0)
       + x.tags.filter(t => r.tags.includes(t)).length
       + (x.format === r.format ? 1 : 0),
    }))
    .sort((a, b) => b.s - a.s).slice(0, n).map(x => x.r);
}

export function recommend(n = 8): Resource[] {
  const s = read();
  const likedCats = new Set<string>();
  [...s.bookmarks, ...s.completed, ...s.history.map(h => h.id)].forEach(id => {
    const r = byId(id); if (r) likedCats.add(r.category);
  });
  const inCat = RESOURCES.filter(r => likedCats.has(r.category));
  const rest = RESOURCES.filter(r => !likedCats.has(r.category));
  const pool = [...inCat, ...rest];
  return pool
    .filter(r => !s.completed.includes(r.id))
    .slice(0, n);
}

export function continueLearning(): { resource: Resource; progress: number }[] {
  const s = read();
  return Object.entries(s.progress)
    .filter(([id, p]) => p > 0 && p < 1)
    .map(([id, p]) => ({ resource: byId(id)!, progress: p }))
    .filter(x => x.resource)
    .slice(0, 8);
}

// ─── Search ────────────────────────────────────────────────
export function search(q: string, filters: {
  category?: CategorySlug | "all";
  format?: ResourceFormat | "all";
  difficulty?: Difficulty | "all";
  language?: Language | "all";
  saved?: boolean;
  completed?: boolean;
  sort?: "trending" | "newest" | "views" | "likes" | "rating" | "shortest" | "longest" | "az" | "recommended";
} = {}): Resource[] {
  const s = read();
  const query = q.trim().toLowerCase();
  let list = RESOURCES.filter(r => {
    if (filters.category && filters.category !== "all" && r.category !== filters.category) return false;
    if (filters.format && filters.format !== "all" && r.format !== filters.format) return false;
    if (filters.difficulty && filters.difficulty !== "all" && r.difficulty !== filters.difficulty) return false;
    if (filters.language && filters.language !== "all" && r.language !== filters.language) return false;
    if (filters.saved && !s.bookmarks.includes(r.id)) return false;
    if (filters.completed && !s.completed.includes(r.id)) return false;
    if (!query) return true;
    return [r.title, r.description, r.tags.join(" "), FORMAT_LABELS[r.format], r.category, authorById(r.authorId)?.name || ""]
      .join(" ").toLowerCase().includes(query);
  });

  const sort = filters.sort || "recommended";
  const cmp: Record<string, (a: Resource, b: Resource) => number> = {
    trending:  (a, b) => Number(b.trending) - Number(a.trending) || b.views - a.views,
    newest:    (a, b) => b.publishedAt.localeCompare(a.publishedAt),
    views:     (a, b) => b.views - a.views,
    likes:     (a, b) => b.likes - a.likes,
    rating:    (a, b) => b.rating - a.rating,
    shortest:  (a, b) => a.minutes - b.minutes,
    longest:   (a, b) => b.minutes - a.minutes,
    az:        (a, b) => a.title.localeCompare(b.title),
    recommended: () => 0,
  };
  return list.sort(cmp[sort]);
}

// recent searches
const SEARCH_KEY = "peacecode.resources.searches";
export function recentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SEARCH_KEY) || "[]"); } catch { return []; }
}
export function pushSearch(q: string) {
  if (typeof window === "undefined" || !q.trim()) return;
  const list = [q, ...recentSearches().filter(x => x !== q)].slice(0, 8);
  localStorage.setItem(SEARCH_KEY, JSON.stringify(list));
}
export const TRENDING_SEARCHES = [
  "exam anxiety", "sleep story", "burnout", "adhd focus", "placement prep",
  "grounding exercise", "homesickness", "confidence",
];

// Hero gradients (stable named tokens)
export const HERO_GRADIENTS: Record<string, string> = {
  sunrise: "linear-gradient(135deg,#FEE9D2 0%,#F5C6A5 55%,#E8A87C 100%)",
  dusk:    "linear-gradient(135deg,#C9A7C1 0%,#9E88AE 55%,#6F6A8B 100%)",
  ocean:   "linear-gradient(135deg,#BEE3F0 0%,#7FB3D5 55%,#4C7BA8 100%)",
  night:   "linear-gradient(135deg,#2C3E63 0%,#42548A 55%,#8FA5C8 100%)",
  paper:   "linear-gradient(135deg,#F3EBDA 0%,#E4D6B7 55%,#C9B48A 100%)",
  warm:    "linear-gradient(135deg,#FBD8B3 0%,#F5B27D 55%,#D48A5E 100%)",
  amber:   "linear-gradient(135deg,#FCE0B2 0%,#F3B26A 55%,#C0803F 100%)",
  peach:   "linear-gradient(135deg,#FDE0D6 0%,#F5B7A6 55%,#DA8A76 100%)",
  lavender:"linear-gradient(135deg,#E9DCF3 0%,#C8AEDA 55%,#9E85BB 100%)",
  cool:    "linear-gradient(135deg,#D8ECF3 0%,#A2C4D6 55%,#5E85A0 100%)",
  mist:    "linear-gradient(135deg,#E4E8EE 0%,#C7CFD9 55%,#8A94A3 100%)",
  garden:  "linear-gradient(135deg,#DCEEDB 0%,#A9DFBF 55%,#6BAF89 100%)",
  sun:     "linear-gradient(135deg,#FCEBB5 0%,#F5D06A 55%,#D0A030 100%)",
  grey:    "linear-gradient(135deg,#DDE3EA 0%,#A6B0BA 55%,#6C7684 100%)",
  rainbow: "linear-gradient(135deg,#FDCB82 0%,#F5A3B0 40%,#B8A1D9 70%,#8FBFD1 100%)",
  rose:    "linear-gradient(135deg,#FBD9E1 0%,#F0A9BC 55%,#C77489 100%)",
};

export function heroBg(name: string) { return HERO_GRADIENTS[name] || HERO_GRADIENTS.sunrise; }
