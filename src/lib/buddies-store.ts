// Peace Buddies — local-first store for peer support ecosystem.
export type Buddy = {
  id: string;
  name: string;
  course: string;
  college: string;
  year: string;
  languages: string[];
  online: boolean;
  responseMin: number;
  interests: string[];
  specializations: string[];
  topics: string[];
  verified: boolean;
  experienceYears: number;
  sessions: number;
  rating: number;
  bio: string;
  supportStyle: string;
  gender: "she/her" | "he/him" | "they/them";
  hobbies: string[];
  achievements: string[];
  reviews: { by: string; rating: number; text: string }[];
  weekly: Record<string, string[]>; // day -> slots
};

export type SessionStatus =
  | "waiting"
  | "accepted"
  | "declined"
  | "rescheduled"
  | "active"
  | "completed"
  | "missed"
  | "cancelled";

export type Session = {
  id: string;
  buddyId: string;
  status: SessionStatus;
  createdAt: number;
  scheduledFor?: number;
  proposedFor?: number;         // buddy's counter-proposal when rescheduling
  respondedAt?: number;
  declineReason?: string;
  slotLabel?: string;           // e.g. "Wed · 7pm"
  duration?: number;
  topic?: string;
  language?: string;
  goal?: string;
  urgency?: string;
  moodBefore?: string;
  moodAfter?: string;
  rating?: number;
  feedback?: string;
  wouldTalkAgain?: boolean;
  messages: Msg[];
};

export type Msg = {
  id: string;
  from: "me" | "buddy" | "system";
  kind: "text" | "voice" | "image" | "file" | "resource";
  text: string;
  ts: number;
  reactions?: string[];
  bookmarked?: boolean;
  read?: boolean;
};

export type Prefs = {
  anonymous: boolean;
  hideIdentity: boolean;
  language: string;
  notifications: {
    accepted: boolean;
    replied: boolean;
    reminders: boolean;
    followUp: boolean;
    recommendations: boolean;
  };
};

const KEY_S = "peacecode.buddies.sessions.v1";
const KEY_F = "peacecode.buddies.favorites.v1";
const KEY_B = "peacecode.buddies.blocked.v1";
const KEY_P = "peacecode.buddies.prefs.v1";

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

export const avatarFor = (id: string) => avatar(id);

const TOPICS = [
  "Academic Stress", "Exam Anxiety", "Homesickness", "Loneliness",
  "Relationships", "Friendship Issues", "Career Confusion", "Burnout",
  "Motivation", "Time Management", "Placement Stress", "Internships",
  "Hostel Life", "Self Confidence", "Adjustment Issues",
];
export const ALL_TOPICS = TOPICS;

export const BUDDIES: Buddy[] = [
  {
    id: "aanya",
    name: "Aanya Rao",
    course: "B.Tech Computer Science",
    college: "IIT Bombay",
    year: "3rd year",
    languages: ["English", "Hindi", "Kannada"],
    online: true,
    responseMin: 3,
    interests: ["poetry", "chai", "indie music"],
    specializations: ["Exam Anxiety", "Homesickness", "Loneliness"],
    topics: ["Exam Anxiety", "Homesickness", "Loneliness", "Time Management"],
    verified: true,
    experienceYears: 2,
    sessions: 148,
    rating: 4.9,
    bio: "i believe most of us just need to feel heard. i listen slowly, and i'll never rush you.",
    supportStyle: "gentle, reflective, listens more than she speaks",
    gender: "she/her",
    hobbies: ["journaling", "sketching", "long walks"],
    achievements: ["100+ sessions", "Top rated", "Weekend warrior"],
    reviews: [
      { by: "Anon · 2nd yr", rating: 5, text: "she made me feel like a person again, not a syllabus." },
      { by: "Anon · 1st yr", rating: 5, text: "the calmest 40 minutes of my week." },
    ],
    weekly: { Mon: ["6pm","8pm"], Tue: ["7pm"], Wed: ["6pm","9pm"], Thu: [], Fri: ["5pm","7pm"], Sat: ["11am","4pm","8pm"], Sun: ["10am","6pm"] },
  },
  {
    id: "kabir",
    name: "Kabir Menon",
    course: "M.A. Psychology",
    college: "Delhi University",
    year: "Final year",
    languages: ["English", "Hindi", "Malayalam"],
    online: true,
    responseMin: 5,
    interests: ["philosophy", "football", "cinema"],
    specializations: ["Burnout", "Placement Stress", "Career Confusion"],
    topics: ["Burnout", "Placement Stress", "Career Confusion", "Motivation"],
    verified: true,
    experienceYears: 3,
    sessions: 212,
    rating: 4.8,
    bio: "i've been through the placement season storm. i'll sit with you in yours.",
    supportStyle: "grounded, honest, gently practical",
    gender: "he/him",
    hobbies: ["film essays", "cooking", "reading fiction"],
    achievements: ["200+ sessions", "Certified peer trainer", "Kindness award"],
    reviews: [
      { by: "Anon · Final yr", rating: 5, text: "talked me off the placement ledge. genuinely." },
      { by: "Anon · 3rd yr", rating: 4, text: "great listener. asks the right questions." },
    ],
    weekly: { Mon: ["7pm","9pm"], Tue: ["8pm"], Wed: [], Thu: ["6pm","8pm"], Fri: ["7pm"], Sat: ["10am","3pm"], Sun: ["11am","7pm"] },
  },
  {
    id: "meera",
    name: "Meera Sharma",
    course: "B.A. English Literature",
    college: "St. Stephen's",
    year: "2nd year",
    languages: ["English", "Hindi", "Punjabi"],
    online: false,
    responseMin: 12,
    interests: ["books", "poetry slams", "cats"],
    specializations: ["Relationships", "Friendship Issues", "Self Confidence"],
    topics: ["Relationships", "Friendship Issues", "Self Confidence", "Adjustment Issues"],
    verified: true,
    experienceYears: 1,
    sessions: 74,
    rating: 4.7,
    bio: "words help. so does silence. i'll offer whichever you need.",
    supportStyle: "warm, expressive, curious",
    gender: "she/her",
    hobbies: ["poetry", "letter writing", "baking"],
    achievements: ["Rising buddy", "50+ sessions"],
    reviews: [
      { by: "Anon · 2nd yr", rating: 5, text: "she gets what heartbreak actually feels like." },
    ],
    weekly: { Mon: ["5pm"], Tue: ["6pm","8pm"], Wed: ["7pm"], Thu: ["6pm"], Fri: [], Sat: ["12pm","5pm"], Sun: ["4pm"] },
  },
  {
    id: "arjun",
    name: "Arjun Patel",
    course: "B.Com Honours",
    college: "SRCC",
    year: "3rd year",
    languages: ["English", "Hindi", "Gujarati"],
    online: true,
    responseMin: 4,
    interests: ["startups", "cricket", "music production"],
    specializations: ["Internships", "Career Confusion", "Motivation"],
    topics: ["Internships", "Career Confusion", "Motivation", "Time Management"],
    verified: true,
    experienceYears: 2,
    sessions: 121,
    rating: 4.8,
    bio: "figuring it out with you. one messy step at a time.",
    supportStyle: "energetic, honest, action-friendly",
    gender: "he/him",
    hobbies: ["gym", "beats", "podcasts"],
    achievements: ["100+ sessions", "Career mentor badge"],
    reviews: [{ by: "Anon · 3rd yr", rating: 5, text: "clear head. good vibes." }],
    weekly: { Mon: ["7pm"], Tue: ["8pm"], Wed: ["7pm","9pm"], Thu: [], Fri: ["8pm"], Sat: ["11am","6pm"], Sun: ["12pm","7pm"] },
  },
  {
    id: "ishita",
    name: "Ishita Banerjee",
    course: "MBBS",
    college: "AIIMS Delhi",
    year: "4th year",
    languages: ["English", "Hindi", "Bengali"],
    online: false,
    responseMin: 15,
    interests: ["classical dance", "medical humanities", "tea"],
    specializations: ["Burnout", "Academic Stress", "Hostel Life"],
    topics: ["Burnout", "Academic Stress", "Hostel Life", "Loneliness"],
    verified: true,
    experienceYears: 3,
    sessions: 186,
    rating: 4.9,
    bio: "hostel life is a strange country. i've lived there. tell me about yours.",
    supportStyle: "steady, empathetic, medically aware",
    gender: "she/her",
    hobbies: ["dance", "reading essays", "long calls with mom"],
    achievements: ["Top rated", "150+ sessions", "Night shift buddy"],
    reviews: [
      { by: "Anon · 2nd yr", rating: 5, text: "she just... gets hostel loneliness." },
      { by: "Anon · 1st yr", rating: 5, text: "kind. never made me feel dramatic." },
    ],
    weekly: { Mon: ["10pm"], Tue: [], Wed: ["9pm","11pm"], Thu: ["10pm"], Fri: [], Sat: ["2pm","8pm"], Sun: ["11am","9pm"] },
  },
  {
    id: "rohan",
    name: "Rohan Iyer",
    course: "B.Tech Electrical",
    college: "IIT Madras",
    year: "2nd year",
    languages: ["English", "Tamil", "Hindi"],
    online: true,
    responseMin: 2,
    interests: ["climbing", "chess", "coffee"],
    specializations: ["Adjustment Issues", "Homesickness", "Friendship Issues"],
    topics: ["Adjustment Issues", "Homesickness", "Friendship Issues", "Loneliness"],
    verified: true,
    experienceYears: 1,
    sessions: 61,
    rating: 4.7,
    bio: "moved 1800 km from home at 17. hostel life took a while. happy to sit with you.",
    supportStyle: "warm, no pressure, slow-paced",
    gender: "he/him",
    hobbies: ["climbing", "chess", "sketching"],
    achievements: ["Fresher buddy badge", "50+ sessions"],
    reviews: [{ by: "Anon · 1st yr", rating: 5, text: "made me feel less alone in hostel." }],
    weekly: { Mon: ["9pm"], Tue: ["8pm","10pm"], Wed: ["9pm"], Thu: ["8pm"], Fri: ["9pm"], Sat: ["3pm","9pm"], Sun: ["10am","8pm"] },
  },
];

export function getBuddy(id: string) { return BUDDIES.find((b) => b.id === id); }

// ─── Sessions ────────────────────────────────────────────────────
const load = <T,>(k: string, fb: T): T => {
  if (typeof window === "undefined") return fb;
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; }
};
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function listSessions(): Session[] { return load<Session[]>(KEY_S, []); }
export function getSession(id: string): Session | undefined { return listSessions().find((s) => s.id === id); }
export function upsertSession(s: Session) {
  const all = listSessions().filter((x) => x.id !== s.id);
  all.unshift(s); save(KEY_S, all);
}
export function createSession(partial: Partial<Session> & { buddyId: string }): Session {
  const s: Session = {
    status: "waiting",
    messages: [],
    ...partial,
    id: `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };
  upsertSession(s);
  return s;
}
export function addMessage(sessionId: string, msg: Omit<Msg, "id" | "ts">) {
  const s = getSession(sessionId); if (!s) return;
  s.messages.push({ ...msg, id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ts: Date.now() });
  upsertSession(s);
}

// ─── Availability & request lifecycle ────────────────────────────
const DAY_ORDER = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Parse a slot like "6pm" / "11am" / "9:30pm" into hour/min (24h).
export function parseSlot(slot: string): { h: number; m: number } | null {
  const s = slot.trim().toLowerCase();
  const match = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!match) return null;
  let h = parseInt(match[1], 10); const m = parseInt(match[2] ?? "0", 10);
  const pm = match[3] === "pm";
  if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12;
  return { h, m };
}

export type UpcomingSlot = { date: Date; day: string; label: string; slot: string; ts: number; isSoon: boolean };

// Return the next N upcoming slots from a buddy's weekly schedule.
export function upcomingSlots(buddyId: string, days = 14, limit = 24): UpcomingSlot[] {
  const b = getBuddy(buddyId); if (!b) return [];
  const now = new Date(); const out: UpcomingSlot[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    const dayKey = DAY_ORDER[d.getDay()];
    const slots = b.weekly[dayKey] ?? [];
    for (const slot of slots) {
      const p = parseSlot(slot); if (!p) continue;
      const when = new Date(d); when.setHours(p.h, p.m, 0, 0);
      if (when.getTime() <= now.getTime()) continue;
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : when.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
      out.push({
        date: when, day: dayKey, label, slot,
        ts: when.getTime(), isSoon: when.getTime() - now.getTime() < 6 * 60 * 60 * 1000,
      });
    }
  }
  return out.slice(0, limit);
}

export function isBuddyAvailable(buddyId: string): boolean {
  return upcomingSlots(buddyId, 7, 1).length > 0;
}

export function respondToRequest(
  sessionId: string,
  action: "accept" | "decline" | "reschedule",
  opts?: { reason?: string; proposedFor?: number }
) {
  const s = getSession(sessionId); if (!s) return;
  s.respondedAt = Date.now();
  if (action === "accept") s.status = "accepted";
  if (action === "decline") { s.status = "declined"; s.declineReason = opts?.reason; }
  if (action === "reschedule") { s.status = "rescheduled"; s.proposedFor = opts?.proposedFor; }
  upsertSession(s);
}

export function acceptProposal(sessionId: string) {
  const s = getSession(sessionId); if (!s || !s.proposedFor) return;
  s.scheduledFor = s.proposedFor; s.proposedFor = undefined;
  s.status = "accepted"; upsertSession(s);
}

export function cancelSession(sessionId: string) {
  const s = getSession(sessionId); if (!s) return;
  s.status = "cancelled"; upsertSession(s);
}

// Auto-simulate a buddy response for demo purposes (deterministic per session).
export function simulateBuddyResponse(sessionId: string) {
  const s = getSession(sessionId); if (!s || s.status !== "waiting") return;
  const seed = sessionId.charCodeAt(sessionId.length - 1) + sessionId.length;
  const roll = seed % 10;
  if (roll < 7) respondToRequest(sessionId, "accept");
  else if (roll < 9) {
    const next = upcomingSlots(s.buddyId, 14, 4)[1];
    if (next) respondToRequest(sessionId, "reschedule", { proposedFor: next.ts });
    else respondToRequest(sessionId, "accept");
  } else {
    respondToRequest(sessionId, "decline", { reason: "I'm at capacity today — please try another buddy." });
  }
}

// ─── Favorites / Blocked ─────────────────────────────────────────
export function favorites(): string[] { return load<string[]>(KEY_F, []); }
export function toggleFavorite(id: string) {
  const f = favorites();
  save(KEY_F, f.includes(id) ? f.filter((x) => x !== id) : [...f, id]);
}
export function blocked(): string[] { return load<string[]>(KEY_B, []); }
export function toggleBlock(id: string) {
  const b = blocked();
  save(KEY_B, b.includes(id) ? b.filter((x) => x !== id) : [...b, id]);
}

// ─── Prefs ──────────────────────────────────────────────────────
const defaultPrefs: Prefs = {
  anonymous: false, hideIdentity: false, language: "English",
  notifications: { accepted: true, replied: true, reminders: true, followUp: true, recommendations: true },
};
export function getPrefs(): Prefs { return { ...defaultPrefs, ...load<Partial<Prefs>>(KEY_P, {}) } as Prefs; }
export function setPrefs(p: Prefs) { save(KEY_P, p); }

// ─── Psychologists (referral) ────────────────────────────────────
export type Psychologist = {
  id: string; name: string; title: string; specializations: string[];
  languages: string[]; mode: ("online" | "offline")[]; fee: number; next: string;
  rating: number; sessions: number; verified: boolean;
};
export const PSYCHOLOGISTS: Psychologist[] = [
  { id: "dr-neha", name: "Dr. Neha Kapoor", title: "Clinical Psychologist, M.Phil RCI", specializations: ["Anxiety", "Depression", "Student Burnout"], languages: ["English", "Hindi"], mode: ["online", "offline"], fee: 1200, next: "Tomorrow · 6pm", rating: 4.9, sessions: 1800, verified: true },
  { id: "dr-vikram", name: "Dr. Vikram Shetty", title: "Counselling Psychologist, PhD", specializations: ["Career Anxiety", "OCD", "Family"], languages: ["English", "Hindi", "Kannada"], mode: ["online"], fee: 1500, next: "Today · 8pm", rating: 4.8, sessions: 2400, verified: true },
  { id: "dr-fatima", name: "Dr. Fatima Ansari", title: "Psychiatrist, MD Psychiatry", specializations: ["Mood disorders", "Sleep", "Medication review"], languages: ["English", "Hindi", "Urdu"], mode: ["online", "offline"], fee: 2000, next: "Fri · 4pm", rating: 4.9, sessions: 3200, verified: true },
];

// ─── Groups & Events ─────────────────────────────────────────────
export const GROUPS = [
  { id: "exams", title: "Exam Support", members: 412, tag: "high-activity", desc: "syllabus panic, study rhythms, small wins" },
  { id: "freshers", title: "Freshers", members: 328, tag: "warm", desc: "first-year everything — hostel, food, homesickness" },
  { id: "placements", title: "Placements", members: 267, tag: "career", desc: "interviews, rejections, waiting rooms" },
  { id: "loneliness", title: "Loneliness", members: 189, tag: "gentle", desc: "quiet company for hard evenings" },
  { id: "women", title: "Women Support", members: 245, tag: "safe", desc: "for women-identifying students only" },
  { id: "international", title: "International Students", members: 118, tag: "global", desc: "different timezone, same feelings" },
  { id: "hostel", title: "Hostel Students", members: 302, tag: "warm", desc: "roommate drama, mess food, quiet nights" },
  { id: "burnout", title: "Burnout Recovery", members: 156, tag: "recovery", desc: "slow return to yourself" },
];

export const EVENTS = [
  { id: "circle-wed", title: "Wednesday Listening Circle", when: "Wed · 8pm", host: "Aanya + Kabir", tag: "circle" },
  { id: "study-sat", title: "Saturday Study Together", when: "Sat · 10am", host: "Arjun", tag: "study" },
  { id: "checkin-sun", title: "Sunday Weekly Check-in", when: "Sun · 7pm", host: "Meera", tag: "check-in" },
  { id: "workshop", title: "Sleep & Anxiety Workshop", when: "Fri · 6pm", host: "Dr. Neha (guest)", tag: "workshop" },
  { id: "meetup", title: "Campus Peer Meetup", when: "Sat · 4pm", host: "Ishita + Rohan", tag: "meetup" },
];
