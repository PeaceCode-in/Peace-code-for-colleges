// PeaceCode Mind Gym — local-first store.
// Tracks XP, coins, brain score, streak, exercise sessions, achievements,
// challenges, DNA, passport stamps. Everything persists to localStorage.

import { useEffect, useState } from "react";

const KEY = "peacecode.mindgym.v1";

export type SkillKey =
  | "focus" | "memory" | "calm" | "reaction"
  | "consistency" | "confidence" | "resilience" | "creativity";

export type PathSlug =
  | "focus" | "memory" | "confidence" | "calmness" | "emotional-intelligence"
  | "decision-making" | "problem-solving" | "creativity" | "mindfulness"
  | "stress" | "productivity" | "self-awareness" | "critical-thinking"
  | "communication" | "resilience" | "consistency";

export type ExerciseType =
  | "reaction" | "memory" | "attention" | "visual-focus"
  | "breathing" | "emotion-recognition" | "confidence" | "decision"
  | "mindfulness" | "stress-recovery" | "positive-thinking" | "habit"
  | "reflection" | "logic" | "pattern" | "visualization" | "rapid-recall";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Master";

export type Exercise = {
  id: string;
  name: string;
  type: ExerciseType;
  path: PathSlug;
  difficulty: Difficulty;
  minutes: number;
  xp: number;
  coins: number;
  purpose: string;
  benefits: string[];
  skills: SkillKey[];
  mood: "calm" | "energised" | "focused" | "reflective" | "playful";
  instructions: string[];
  premium?: boolean;
};

export type Session = {
  id: string;
  exerciseId: string;
  at: number;
  score: number;        // 0..100
  accuracy: number;     // 0..100
  streak: number;       // best in-session combo
  xp: number;
  coins: number;
  seconds: number;
  skillGains: Partial<Record<SkillKey, number>>;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;         // emoji
  unlockedAt?: number;
  progress?: { current: number; goal: number };
};

export type Challenge = {
  slug: string;
  name: string;
  description: string;
  days: number;
  emoji: string;
  color: string;
  focusSkill: SkillKey;
};

export type PassportStamp = {
  slug: string;
  name: string;
  emoji: string;
  color: string;
  stampedAt?: number;
};

export type State = {
  xp: number;
  coins: number;
  level: number;
  title: string;
  brain: Record<SkillKey, number>; // 0..100
  streak: { current: number; longest: number; lastDay: string | null };
  sessions: Session[];
  achievements: Record<string, Achievement>;
  dailyMissions: { id: string; label: string; goal: number; done: number; type: string }[];
  missionsDate: string; // yyyy-mm-dd
  passport: Record<string, PassportStamp>;
  activeChallenge: { slug: string; startedAt: number; completedDays: number } | null;
  favouriteExercises: string[];
  settings: {
    sound: boolean;
    haptics: boolean;
    adaptive: boolean;
    difficulty: Difficulty;
    accessibility: { reduceMotion: boolean; largeText: boolean };
    anonymousLeaderboard: boolean;
  };
  coach: { messages: { role: "coach" | "you"; text: string; at: number }[] };
};

export const PATHS: { slug: PathSlug; name: string; emoji: string; color: string; blurb: string; skill: SkillKey }[] = [
  { slug: "focus",                  name: "Focus",                emoji: "🎯", color: "#7EA8FF", blurb: "Sharpen attention like a laser.",                skill: "focus" },
  { slug: "memory",                 name: "Memory",               emoji: "🧠", color: "#B39DFF", blurb: "Recall patterns, faces, and detail.",           skill: "memory" },
  { slug: "confidence",             name: "Confidence",           emoji: "🌟", color: "#F5B36B", blurb: "Small daily reps to trust yourself.",           skill: "confidence" },
  { slug: "calmness",               name: "Calmness",             emoji: "🌊", color: "#8FD3D0", blurb: "Lower the noise, widen the pause.",             skill: "calm" },
  { slug: "emotional-intelligence", name: "Emotional Intelligence", emoji: "💗", color: "#F49FBF", blurb: "Read the room. Read yourself.",             skill: "resilience" },
  { slug: "decision-making",        name: "Decision Making",      emoji: "🧭", color: "#9FCFA8", blurb: "Choose with clarity, not panic.",              skill: "reaction" },
  { slug: "problem-solving",        name: "Problem Solving",      emoji: "🧩", color: "#FFD08A", blurb: "Untangle knots step by step.",                  skill: "focus" },
  { slug: "creativity",             name: "Creativity",           emoji: "🎨", color: "#F09E8C", blurb: "Notice more. Combine unexpectedly.",            skill: "creativity" },
  { slug: "mindfulness",            name: "Mindfulness",          emoji: "🕊️", color: "#B7D2FF", blurb: "Return to the present, gently.",              skill: "calm" },
  { slug: "stress",                 name: "Stress Management",    emoji: "🌤️", color: "#FFC2A8", blurb: "Move stress out of the body.",                skill: "resilience" },
  { slug: "productivity",           name: "Productivity",         emoji: "⚡", color: "#FCE38A", blurb: "Do less, better, on purpose.",                  skill: "consistency" },
  { slug: "self-awareness",         name: "Self Awareness",       emoji: "🪞", color: "#C7B8F5", blurb: "Meet yourself without judgment.",              skill: "resilience" },
  { slug: "critical-thinking",      name: "Critical Thinking",    emoji: "🔎", color: "#9BCBEE", blurb: "Question the obvious.",                         skill: "focus" },
  { slug: "communication",          name: "Communication",        emoji: "💬", color: "#F7B7A3", blurb: "Say what you mean, warmly.",                    skill: "confidence" },
  { slug: "resilience",             name: "Resilience",           emoji: "🛡️", color: "#B5C7F2", blurb: "Bend without breaking.",                       skill: "resilience" },
  { slug: "consistency",            name: "Consistency",          emoji: "📈", color: "#A7D8B9", blurb: "Small reps, every single day.",                 skill: "consistency" },
];

export const CHALLENGES: Challenge[] = [
  { slug: "7-focus",       name: "7 Day Focus",         description: "One focus rep every day for a week.",         days: 7,  emoji: "🎯", color: "#7EA8FF", focusSkill: "focus" },
  { slug: "21-confidence", name: "21 Day Confidence",   description: "Rewire self-talk in three weeks.",            days: 21, emoji: "🌟", color: "#F5B36B", focusSkill: "confidence" },
  { slug: "30-calm",       name: "30 Day Calm Journey", description: "Daily calm practice for a month.",            days: 30, emoji: "🌊", color: "#8FD3D0", focusSkill: "calm" },
  { slug: "exam-mode",     name: "Exam Mode",           description: "14 days of pre-exam focus + calm stack.",     days: 14, emoji: "📚", color: "#B39DFF", focusSkill: "focus" },
  { slug: "placement",     name: "Placement Challenge", description: "10 days of confidence + communication reps.", days: 10, emoji: "💼", color: "#F49FBF", focusSkill: "confidence" },
  { slug: "hostel",        name: "Hostel Challenge",    description: "Sleep-hostile? Nightly wind-down for 14 days.", days: 14, emoji: "🌙", color: "#C7B8F5", focusSkill: "calm" },
];

export const PASSPORT: PassportStamp[] = [
  { slug: "focus-island",     name: "Focus Island",     emoji: "🏝️", color: "#7EA8FF" },
  { slug: "calm-valley",      name: "Calm Valley",      emoji: "🏞️", color: "#8FD3D0" },
  { slug: "confidence-peak",  name: "Confidence Peak",  emoji: "⛰️", color: "#F5B36B" },
  { slug: "creativity-galaxy", name: "Creativity Galaxy", emoji: "🌌", color: "#F09E8C" },
  { slug: "resilience-forest", name: "Resilience Forest", emoji: "🌲", color: "#B5C7F2" },
  { slug: "memory-cove",      name: "Memory Cove",      emoji: "🏖️", color: "#B39DFF" },
];

// ─── Exercise library (37 curated) ────────────────────────────────
export const EXERCISES: Exercise[] = [
  // FOCUS
  { id: "reaction-01", name: "Green Light", type: "reaction", path: "focus", difficulty: "Beginner", minutes: 2, xp: 40, coins: 8,
    purpose: "Train your reflexes and decision speed.", benefits: ["Sharper reflexes", "Cleaner attention"], skills: ["reaction","focus"], mood: "energised",
    instructions: ["A shape appears at random.", "Tap it as fast as you can — only when it's green.", "Ten rounds, best of the streak counts."]},
  { id: "attention-01", name: "Odd One Out", type: "attention", path: "focus", difficulty: "Intermediate", minutes: 3, xp: 60, coins: 10,
    purpose: "Filter distraction, lock on to signal.", benefits: ["Selective attention", "Working memory"], skills: ["focus","memory"], mood: "focused",
    instructions: ["A grid of tiles appears.", "One tile is a slightly different shade.", "Find and tap it."] },
  { id: "visual-01", name: "Steady Gaze", type: "visual-focus", path: "focus", difficulty: "Beginner", minutes: 2, xp: 50, coins: 8,
    purpose: "Hold soft focus on a single point.", benefits: ["Calm attention", "Mind-body sync"], skills: ["focus","calm"], mood: "calm",
    instructions: ["A dot pulses at the center.", "Follow it with your eyes only.", "Don't chase — receive."] },
  { id: "critical-01", name: "Assumption Check", type: "logic", path: "critical-thinking", difficulty: "Advanced", minutes: 4, xp: 90, coins: 14,
    purpose: "Notice the belief behind the thought.", benefits: ["Metacognition", "Better decisions"], skills: ["focus","reaction"], mood: "reflective",
    instructions: ["Read the statement.", "Pick the hidden assumption.", "Five rounds."] },

  // MEMORY
  { id: "memory-01", name: "Sequence Recall", type: "memory", path: "memory", difficulty: "Beginner", minutes: 3, xp: 60, coins: 10,
    purpose: "Rebuild short-term recall.", benefits: ["Working memory", "Pattern recognition"], skills: ["memory","focus"], mood: "focused",
    instructions: ["Watch the sequence of tiles.", "Repeat it in order.", "Each round adds one."] },
  { id: "memory-02", name: "Face + Name", type: "rapid-recall", path: "memory", difficulty: "Intermediate", minutes: 4, xp: 80, coins: 12,
    purpose: "Anchor names to details.", benefits: ["Social recall", "Confidence"], skills: ["memory","confidence"], mood: "playful",
    instructions: ["A card appears with a name.", "It flips. Recall the name.", "Ten rounds."] },
  { id: "pattern-01", name: "Pattern Bloom", type: "pattern", path: "memory", difficulty: "Advanced", minutes: 4, xp: 90, coins: 14,
    purpose: "Spot patterns that others miss.", benefits: ["Abstract reasoning", "Focus"], skills: ["memory","focus"], mood: "focused",
    instructions: ["A pattern of dots grows.", "Predict the next dot.", "Six rounds."] },

  // CALM / MINDFULNESS / STRESS
  { id: "breath-01", name: "Box Breath 4·4·4·4", type: "breathing", path: "calmness", difficulty: "Beginner", minutes: 3, xp: 50, coins: 10,
    purpose: "Regulate nervous system in 3 minutes.", benefits: ["Lower HRV noise", "Sharper mind"], skills: ["calm","reaction"], mood: "calm",
    instructions: ["Inhale 4, hold 4, exhale 4, hold 4.", "Follow the orb.", "Six full rounds."] },
  { id: "breath-02", name: "4·7·8 Wind-down", type: "breathing", path: "stress", difficulty: "Beginner", minutes: 4, xp: 60, coins: 10,
    purpose: "Move stress out of the body.", benefits: ["Downregulate", "Prepare for sleep"], skills: ["calm","resilience"], mood: "calm",
    instructions: ["Inhale 4, hold 7, exhale 8.", "Four full rounds."] },
  { id: "mindful-01", name: "Sound Map", type: "mindfulness", path: "mindfulness", difficulty: "Beginner", minutes: 3, xp: 45, coins: 8,
    purpose: "Return to the present through hearing.", benefits: ["Grounding", "Anxiety relief"], skills: ["calm"], mood: "calm",
    instructions: ["Close eyes.", "Name three sounds you hear.", "Two rounds."] },
  { id: "stress-01", name: "5-4-3-2-1 Grounding", type: "stress-recovery", path: "stress", difficulty: "Beginner", minutes: 3, xp: 50, coins: 10,
    purpose: "Pull yourself back into the room.", benefits: ["Fast anxiety break", "Body awareness"], skills: ["calm","resilience"], mood: "calm",
    instructions: ["Name 5 things you see.", "4 you touch, 3 hear, 2 smell, 1 taste.", "Move slowly."] },
  { id: "visualise-01", name: "Safe Place", type: "visualization", path: "mindfulness", difficulty: "Intermediate", minutes: 4, xp: 70, coins: 12,
    purpose: "Build a mental retreat you can visit anytime.", benefits: ["Emotional regulation", "Sleep prep"], skills: ["calm","confidence"], mood: "reflective",
    instructions: ["Picture a place you feel safe.", "Move through it slowly.", "Name what you notice."] },

  // CONFIDENCE / EI
  { id: "confidence-01", name: "Power Pose Reps", type: "confidence", path: "confidence", difficulty: "Beginner", minutes: 2, xp: 40, coins: 8,
    purpose: "Rewire posture-belief loop.", benefits: ["Presence", "Voice"], skills: ["confidence"], mood: "energised",
    instructions: ["Stand tall.", "Follow the on-screen prompts.", "Hold each pose 20s."] },
  { id: "confidence-02", name: "Reframe It", type: "positive-thinking", path: "confidence", difficulty: "Intermediate", minutes: 4, xp: 80, coins: 12,
    purpose: "Turn a harsh thought into a kind one.", benefits: ["Self-talk repair", "Resilience"], skills: ["confidence","resilience"], mood: "reflective",
    instructions: ["Read the thought.", "Write a kinder rewrite.", "Six rounds."] },
  { id: "ei-01", name: "Feel the Face", type: "emotion-recognition", path: "emotional-intelligence", difficulty: "Beginner", minutes: 3, xp: 55, coins: 10,
    purpose: "Sharpen social perception.", benefits: ["Empathy", "EQ"], skills: ["resilience","reaction"], mood: "playful",
    instructions: ["A face appears.", "Name the emotion.", "Ten rounds."] },
  { id: "ei-02", name: "Body Weather", type: "reflection", path: "self-awareness", difficulty: "Beginner", minutes: 3, xp: 50, coins: 8,
    purpose: "Read your own inner weather.", benefits: ["Interoception", "Regulation"], skills: ["calm","resilience"], mood: "reflective",
    instructions: ["Scan head to toe.", "Report the 'weather' at each region.", "One pass."] },

  // DECISION / PROBLEM / CRITICAL
  { id: "decision-01", name: "Two Doors", type: "decision", path: "decision-making", difficulty: "Intermediate", minutes: 4, xp: 80, coins: 12,
    purpose: "Practice fast, clean choices.", benefits: ["Decisiveness", "Confidence"], skills: ["reaction","confidence"], mood: "focused",
    instructions: ["A scenario appears.", "Pick left or right in 5 seconds.", "Eight rounds."] },
  { id: "problem-01", name: "Untangle", type: "logic", path: "problem-solving", difficulty: "Advanced", minutes: 5, xp: 100, coins: 16,
    purpose: "Deconstruct a knot in steps.", benefits: ["Structured thinking", "Persistence"], skills: ["focus","memory"], mood: "focused",
    instructions: ["Read the puzzle.", "Choose the next best step.", "Five stages."] },

  // CREATIVITY
  { id: "creative-01", name: "Ten Uses", type: "reflection", path: "creativity", difficulty: "Beginner", minutes: 3, xp: 55, coins: 10,
    purpose: "Loosen fixed thinking.", benefits: ["Divergent thought", "Playfulness"], skills: ["creativity","confidence"], mood: "playful",
    instructions: ["A common object appears.", "Type ten uses for it.", "Any use counts."] },
  { id: "creative-02", name: "Word Bridge", type: "rapid-recall", path: "creativity", difficulty: "Intermediate", minutes: 4, xp: 70, coins: 12,
    purpose: "Connect distant ideas.", benefits: ["Creativity", "Vocabulary"], skills: ["creativity","memory"], mood: "playful",
    instructions: ["Two random words appear.", "Bridge them in three steps.", "Five rounds."] },

  // COMMUNICATION
  { id: "comms-01", name: "Warm Sentences", type: "reflection", path: "communication", difficulty: "Beginner", minutes: 3, xp: 55, coins: 10,
    purpose: "Rewrite cold sentences with warmth.", benefits: ["Better texts", "Better meetings"], skills: ["confidence","resilience"], mood: "reflective",
    instructions: ["A blunt sentence appears.", "Warm it up in one line.", "Six rounds."] },

  // PRODUCTIVITY / CONSISTENCY
  { id: "habit-01", name: "Two-Minute Rule", type: "habit", path: "productivity", difficulty: "Beginner", minutes: 2, xp: 40, coins: 8,
    purpose: "Bank a tiny win right now.", benefits: ["Momentum", "Consistency"], skills: ["consistency","confidence"], mood: "energised",
    instructions: ["Pick one 2-minute task.", "Start a timer.", "Do it."] },
  { id: "consistency-01", name: "Streak Check-in", type: "habit", path: "consistency", difficulty: "Beginner", minutes: 1, xp: 30, coins: 6,
    purpose: "Show up. That's it.", benefits: ["Identity building"], skills: ["consistency"], mood: "reflective",
    instructions: ["Log one honest sentence.", "That's the whole rep."] },

  // RESILIENCE
  { id: "resilience-01", name: "Setback Rehearsal", type: "visualization", path: "resilience", difficulty: "Advanced", minutes: 5, xp: 100, coins: 16,
    purpose: "Pre-plan how you recover.", benefits: ["Anti-fragility", "Confidence"], skills: ["resilience","confidence"], mood: "reflective",
    instructions: ["Picture a likely setback.", "Rehearse your recovery.", "Two passes."] },
];

// ─── Achievement templates ─────────────────────────────────────────
export const ACHIEVEMENT_LIST: Achievement[] = [
  { id: "first-session",     name: "First Session",    icon: "🌱", description: "Complete your first Mind Gym rep." },
  { id: "streak-7",          name: "7 Day Streak",     icon: "🔥", description: "Show up seven days in a row." },
  { id: "streak-30",         name: "30 Day Streak",    icon: "🌟", description: "A whole month of showing up." },
  { id: "memory-master",     name: "Memory Master",    icon: "🧠", description: "Complete 10 memory reps." },
  { id: "focus-champion",    name: "Focus Champion",   icon: "🎯", description: "Complete 10 focus reps." },
  { id: "calm-mind",         name: "Calm Mind",        icon: "🌊", description: "Complete 10 calm reps." },
  { id: "growth-explorer",   name: "Growth Explorer",  icon: "🧭", description: "Try 5 different training paths." },
  { id: "level-5",           name: "Brain Level 5",    icon: "🥉", description: "Reach Level 5." },
  { id: "level-10",          name: "Brain Level 10",   icon: "🥈", description: "Reach Level 10." },
  { id: "brain-80",          name: "Sharp Mind",       icon: "🏆", description: "Overall brain fitness above 80." },
];

// ─── level thresholds (XP curve) ──────────────────────────────────
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.35));
}
export function levelFromXp(xp: number): number {
  let lvl = 1;
  while (xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}
export function titleForLevel(lvl: number): string {
  if (lvl < 3)  return "Seedling";
  if (lvl < 6)  return "Sapling";
  if (lvl < 10) return "Voyager";
  if (lvl < 15) return "Explorer";
  if (lvl < 20) return "Ascendant";
  if (lvl < 30) return "Luminary";
  return "Sage";
}

// ─── State bootstrap ────────────────────────────────────────────
function todayStr(d = new Date()): string { return d.toISOString().slice(0, 10); }

const initial: State = {
  xp: 0, coins: 0, level: 1, title: "Seedling",
  brain: { focus: 45, memory: 42, calm: 48, reaction: 40, consistency: 30, confidence: 44, resilience: 46, creativity: 41 },
  streak: { current: 0, longest: 0, lastDay: null },
  sessions: [],
  achievements: Object.fromEntries(ACHIEVEMENT_LIST.map(a => [a.id, { ...a }])),
  dailyMissions: [],
  missionsDate: "",
  passport: Object.fromEntries(PASSPORT.map(p => [p.slug, { ...p }])),
  activeChallenge: null,
  favouriteExercises: [],
  settings: {
    sound: true, haptics: true, adaptive: true,
    difficulty: "Beginner",
    accessibility: { reduceMotion: false, largeText: false },
    anonymousLeaderboard: false,
  },
  coach: { messages: [] },
};

function load(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    // shallow merge to survive schema growth
    return {
      ...initial,
      ...parsed,
      brain: { ...initial.brain, ...(parsed.brain || {}) },
      achievements: { ...initial.achievements, ...(parsed.achievements || {}) },
      passport: { ...initial.passport, ...(parsed.passport || {}) },
      settings: { ...initial.settings, ...(parsed.settings || {}), accessibility: { ...initial.settings.accessibility, ...((parsed.settings || {}).accessibility || {}) } },
      coach: { ...initial.coach, ...(parsed.coach || {}) },
    };
  } catch { return initial; }
}

let cache: State | null = null;
const listeners = new Set<() => void>();

export function getState(): State {
  if (!cache) cache = load();
  return cache;
}
function persist() {
  if (!cache || typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {}
  listeners.forEach(fn => fn());
}
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function useMindGym(): State {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force(x => x + 1)), []);
  return getState();
}

// ─── Mutations ────────────────────────────────────────────────────
function ensureMissions() {
  const s = getState();
  const t = todayStr();
  if (s.missionsDate === t && s.dailyMissions.length) return;
  s.missionsDate = t;
  s.dailyMissions = [
    { id: "m1", label: "Complete 3 focus exercises",  goal: 3, done: 0, type: "focus" },
    { id: "m2", label: "Practice a breathing rep",    goal: 1, done: 0, type: "breathing" },
    { id: "m3", label: "Write a reflection",          goal: 1, done: 0, type: "reflection" },
    { id: "m4", label: "One memory rep",              goal: 1, done: 0, type: "memory" },
    { id: "m5", label: "Two minutes of mindfulness",  goal: 1, done: 0, type: "mindfulness" },
  ];
  persist();
}

function bumpStreak() {
  const s = getState();
  const t = todayStr();
  if (s.streak.lastDay === t) return;
  const yesterday = todayStr(new Date(Date.now() - 86_400_000));
  if (s.streak.lastDay === yesterday) s.streak.current += 1;
  else s.streak.current = 1;
  s.streak.longest = Math.max(s.streak.longest, s.streak.current);
  s.streak.lastDay = t;
}

function tickMissions(ex: Exercise) {
  const s = getState();
  ensureMissions();
  s.dailyMissions = s.dailyMissions.map(m => {
    if (m.done >= m.goal) return m;
    // "focus" mission ticks for path=focus. Type-based missions match ex.type.
    if (m.type === "focus" && ex.path === "focus")            return { ...m, done: m.done + 1 };
    if (m.type === "breathing" && ex.type === "breathing")    return { ...m, done: m.done + 1 };
    if (m.type === "memory" && ex.type === "memory")          return { ...m, done: m.done + 1 };
    if (m.type === "mindfulness" && ex.path === "mindfulness")return { ...m, done: m.done + 1 };
    if (m.type === "reflection" && ex.type === "reflection")  return { ...m, done: m.done + 1 };
    return m;
  });
}

function checkAchievements() {
  const s = getState();
  const now = Date.now();
  const unlock = (id: string) => {
    if (s.achievements[id] && !s.achievements[id].unlockedAt) {
      s.achievements[id] = { ...s.achievements[id], unlockedAt: now };
    }
  };
  if (s.sessions.length >= 1) unlock("first-session");
  if (s.streak.current >= 7)  unlock("streak-7");
  if (s.streak.current >= 30) unlock("streak-30");
  const byPath = new Set(s.sessions.map(x => EXERCISES.find(e => e.id === x.exerciseId)?.path).filter(Boolean));
  if (byPath.size >= 5) unlock("growth-explorer");
  const memCount = s.sessions.filter(x => EXERCISES.find(e => e.id === x.exerciseId)?.type === "memory").length;
  if (memCount >= 10) unlock("memory-master");
  const focusCount = s.sessions.filter(x => EXERCISES.find(e => e.id === x.exerciseId)?.path === "focus").length;
  if (focusCount >= 10) unlock("focus-champion");
  const calmCount = s.sessions.filter(x => {
    const ex = EXERCISES.find(e => e.id === x.exerciseId); return ex && (ex.path === "calmness" || ex.path === "mindfulness");
  }).length;
  if (calmCount >= 10) unlock("calm-mind");
  if (s.level >= 5)  unlock("level-5");
  if (s.level >= 10) unlock("level-10");
  const overall = brainOverall(s.brain);
  if (overall >= 80) unlock("brain-80");
  // stamp passport for path milestones
  const pathToStamp: Record<string, string> = {
    "focus": "focus-island", "calmness": "calm-valley", "mindfulness": "calm-valley",
    "confidence": "confidence-peak", "creativity": "creativity-galaxy",
    "resilience": "resilience-forest", "memory": "memory-cove",
  };
  Array.from(byPath).forEach((p) => {
    if (!p) return;
    const stamp = pathToStamp[p as string];
    if (stamp && s.passport[stamp] && !s.passport[stamp].stampedAt) {
      s.passport[stamp] = { ...s.passport[stamp], stampedAt: now };
    }
  });
}

function bumpChallenge() {
  const s = getState();
  if (!s.activeChallenge) return;
  const started = new Date(s.activeChallenge.startedAt).toISOString().slice(0, 10);
  const t = todayStr();
  // if we haven't logged today for the challenge, tick
  const daysSince = Math.floor((Date.now() - s.activeChallenge.startedAt) / 86_400_000);
  const expected = Math.min(daysSince + 1, CHALLENGES.find(c => c.slug === s.activeChallenge!.slug)?.days ?? 7);
  s.activeChallenge = { ...s.activeChallenge, completedDays: Math.min(expected, s.activeChallenge.completedDays + 1) };
  void started; void t;
}

export function completeSession(exerciseId: string, opts: { score: number; accuracy: number; streak: number; seconds: number }) {
  const ex = EXERCISES.find(e => e.id === exerciseId); if (!ex) return;
  const s = getState();
  bumpStreak();
  const xp = Math.round(ex.xp * (0.6 + opts.score / 100 * 0.8));
  const coins = Math.round(ex.coins * (0.7 + opts.score / 100 * 0.6));
  const gains: Partial<Record<SkillKey, number>> = {};
  ex.skills.forEach(k => { gains[k] = Math.round(1 + opts.score / 100 * 3); });
  gains.consistency = (gains.consistency ?? 0) + 1;
  ex.skills.forEach(k => { s.brain[k] = Math.min(100, s.brain[k] + (gains[k] ?? 0)); });
  s.brain.consistency = Math.min(100, s.brain.consistency + 1);
  const session: Session = {
    id: `s-${Date.now()}`, exerciseId, at: Date.now(),
    score: opts.score, accuracy: opts.accuracy, streak: opts.streak,
    xp, coins, seconds: opts.seconds, skillGains: gains,
  };
  s.sessions = [session, ...s.sessions].slice(0, 500);
  s.xp += xp; s.coins += coins;
  const newLevel = levelFromXp(s.xp);
  s.level = newLevel; s.title = titleForLevel(newLevel);
  tickMissions(ex);
  bumpChallenge();
  checkAchievements();
  persist();
  return session;
}

export function brainOverall(b: Record<SkillKey, number>): number {
  const vals = Object.values(b);
  return Math.round(vals.reduce((a, x) => a + x, 0) / vals.length);
}

export function startChallenge(slug: string) {
  const s = getState();
  s.activeChallenge = { slug, startedAt: Date.now(), completedDays: 0 };
  persist();
}
export function endChallenge() {
  const s = getState(); s.activeChallenge = null; persist();
}

export function toggleFavourite(id: string) {
  const s = getState();
  s.favouriteExercises = s.favouriteExercises.includes(id)
    ? s.favouriteExercises.filter(x => x !== id)
    : [...s.favouriteExercises, id];
  persist();
}

export function updateSettings(patch: Partial<State["settings"]>) {
  const s = getState();
  s.settings = { ...s.settings, ...patch, accessibility: { ...s.settings.accessibility, ...(patch.accessibility || {}) } };
  persist();
}

export function addCoachMessage(role: "coach" | "you", text: string) {
  const s = getState();
  s.coach.messages = [...s.coach.messages.slice(-50), { role, text, at: Date.now() }];
  persist();
}

export function ensureBootstrapped() { ensureMissions(); }

// ─── Selectors / helpers ───────────────────────────────────────
export function recommendNext(): Exercise {
  const s = getState();
  const weakest = (Object.entries(s.brain).sort((a, b) => a[1] - b[1])[0]?.[0] || "focus") as SkillKey;
  const pool = EXERCISES.filter(e => e.skills.includes(weakest));
  return pool[Math.floor(Math.random() * pool.length)] || EXERCISES[0];
}

export function weeklyStats() {
  const s = getState();
  const start = Date.now() - 7 * 86_400_000;
  const week = s.sessions.filter(x => x.at >= start);
  const minutes = week.reduce((a, x) => a + x.seconds / 60, 0);
  const xp = week.reduce((a, x) => a + x.xp, 0);
  const skillGains: Record<SkillKey, number> = { focus: 0, memory: 0, calm: 0, reaction: 0, consistency: 0, confidence: 0, resilience: 0, creativity: 0 };
  week.forEach(w => Object.entries(w.skillGains).forEach(([k, v]) => { skillGains[k as SkillKey] += v || 0; }));
  const top = Object.entries(skillGains).sort((a, b) => b[1] - a[1])[0];
  return { count: week.length, minutes: Math.round(minutes), xp, top: top?.[0] as SkillKey || "focus", skillGains };
}

export function dailyHeatmap(days = 28) {
  const s = getState();
  const buckets: { date: string; count: number; minutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = todayStr(d);
    const same = s.sessions.filter(x => todayStr(new Date(x.at)) === key);
    buckets.push({ date: key, count: same.length, minutes: Math.round(same.reduce((a, x) => a + x.seconds / 60, 0)) });
  }
  return buckets;
}
