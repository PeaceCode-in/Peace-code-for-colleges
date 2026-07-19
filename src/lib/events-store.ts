// PeaceCode — Community Events store
// Frontend-only mock persistence via localStorage. Everything the module needs
// (events, organizers, RSVP, bookmarks, chat, attendance, feedback, achievements)
// flows through this file.

export type EventCategory =
  | "Meditation" | "Yoga" | "Breathing" | "Mind Gym"
  | "Study Group" | "Exam Prep" | "Hackathon"
  | "Career" | "Internship" | "Resume" | "Placement"
  | "Peer Circle" | "Support Group" | "Book Club"
  | "Fitness" | "Art Therapy" | "Music Therapy" | "Photo Walk"
  | "Volunteering" | "Startup" | "Networking" | "Meetup"
  | "Creative" | "Sports" | "Custom";

export const CATEGORIES: { key: EventCategory; group: string; hue: string }[] = [
  { key: "Meditation",    group: "Mental Wellness", hue: "#a9c4e3" },
  { key: "Yoga",          group: "Mental Wellness", hue: "#bcd0b3" },
  { key: "Breathing",     group: "Mental Wellness", hue: "#c6d9ee" },
  { key: "Mind Gym",      group: "Mental Wellness", hue: "#d4c6ea" },
  { key: "Study Group",   group: "Academic",        hue: "#e5d3b3" },
  { key: "Exam Prep",     group: "Academic",        hue: "#e9c9b0" },
  { key: "Hackathon",     group: "Academic",        hue: "#c8bfe0" },
  { key: "Career",        group: "Career",          hue: "#b8cde0" },
  { key: "Internship",    group: "Career",          hue: "#c1d4e0" },
  { key: "Resume",        group: "Career",          hue: "#d2d5c6" },
  { key: "Placement",     group: "Career",          hue: "#c6d0b8" },
  { key: "Peer Circle",   group: "Community",       hue: "#e8cfc7" },
  { key: "Support Group", group: "Community",       hue: "#e0c8c8" },
  { key: "Book Club",     group: "Community",       hue: "#dfd0b8" },
  { key: "Fitness",       group: "Body",            hue: "#b9d3c6" },
  { key: "Art Therapy",   group: "Creative",        hue: "#e5c8d0" },
  { key: "Music Therapy", group: "Creative",        hue: "#d0c6df" },
  { key: "Photo Walk",    group: "Creative",        hue: "#c9d3bf" },
  { key: "Volunteering",  group: "Society",         hue: "#c9cdb0" },
  { key: "Startup",       group: "Career",          hue: "#c8bfe0" },
  { key: "Networking",    group: "Career",          hue: "#bfcde0" },
  { key: "Meetup",        group: "Community",       hue: "#d2c6d9" },
  { key: "Creative",      group: "Creative",        hue: "#e2c8c0" },
  { key: "Sports",        group: "Body",            hue: "#b6cbc2" },
  { key: "Custom",        group: "Custom",          hue: "#d5d5d5" },
];

export type EventStatus = "upcoming" | "live" | "completed" | "cancelled";
export type EventMode = "online" | "offline" | "hybrid";

export type Organizer = {
  id: string;
  name: string;
  initials: string;
  role: string;
  org: string;
  college: string;
  bio: string;
  eventsHosted: number;
  followers: number;
  rating: number;
  contact: string;
};

export type Speaker = { name: string; role: string; initials: string };
export type AgendaItem = { time: string; title: string; detail?: string };

export type EventItem = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  organizerId: string;
  category: EventCategory;
  date: string;             // ISO
  durationMin: number;
  mode: EventMode;
  location: string;
  city: string;
  college: string;
  language: "English" | "Hindi" | "Bilingual";
  difficulty: "Open" | "Beginner" | "Intermediate" | "Advanced";
  free: boolean;
  price?: string;
  capacity: number;
  registered: number;
  featured?: boolean;
  trending?: boolean;
  requirements: string[];
  agenda: AgendaItem[];
  speakers: Speaker[];
  bannerHue: string;
  tags: string[];
};

export type Rsvp = {
  eventId: string;
  status: "attend" | "maybe" | "not_interested" | "waitlist";
  at: number;
};

export type ChatMessage = {
  id: string;
  eventId: string;
  author: string;
  initials: string;
  text: string;
  at: number;
  pinned?: boolean;
  reactions?: string[];
  replyToId?: string;
};

export type FeedbackEntry = {
  eventId: string;
  event: number;   // 1-5
  speaker: number;
  venue: number;
  again: boolean;
  moment: string;
  suggestion: string;
  at: number;
};

export type AttendanceRecord = {
  eventId: string;
  status: "completed" | "missed" | "late" | "no_show";
  checkInAt?: number;
};

const KEY = "peacecode.events.v1";
type Persist = {
  rsvp: Record<string, Rsvp>;
  bookmarks: string[];
  chats: Record<string, ChatMessage[]>;
  attendance: Record<string, AttendanceRecord>;
  feedback: Record<string, FeedbackEntry>;
  notes: Record<string, string>;
  followedOrganizers: string[];
};

const empty: Persist = {
  rsvp: {}, bookmarks: [], chats: {}, attendance: {}, feedback: {}, notes: {}, followedOrganizers: [],
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return { ...fallback, ...(JSON.parse(raw) as object) } as T; } catch { return fallback; }
}
function load(): Persist {
  if (typeof window === "undefined") return empty;
  return safeParse<Persist>(window.localStorage.getItem(KEY), empty);
}
function save(p: Persist) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  try { window.dispatchEvent(new Event("peacecode-events-changed")); } catch {}
}

// ─── seeded organizers ─────────────────────────────────────────────────
export const organizers: Organizer[] = [
  { id: "org-priya",  name: "Dr. Priya Menon",   initials: "PM", role: "Counselling Psychologist", org: "PeaceCode Care", college: "IIT Bombay",         bio: "Guides students through mindfulness and stress. Warm, evidence-based.", eventsHosted: 42, followers: 1284, rating: 4.9, contact: "priya@peacecode.in" },
  { id: "org-arjun",  name: "Arjun Rathore",     initials: "AR", role: "Career Coach",             org: "Rise Collective", college: "IIT Delhi",         bio: "Ex-consultant helping students land their first internships.",       eventsHosted: 28, followers: 903,  rating: 4.7, contact: "arjun@rise.in"     },
  { id: "org-neha",   name: "Neha Kapoor",       initials: "NK", role: "Yoga Instructor",          org: "Studio Prana",   college: "Delhi University",  bio: "Slow yoga and breath work, morning batches. Nothing loud.",           eventsHosted: 61, followers: 2140, rating: 4.9, contact: "neha@prana.in"     },
  { id: "org-vikram", name: "Vikram Iyer",       initials: "VI", role: "Peer Facilitator",         org: "Circle Room",    college: "IIIT Hyderabad",    bio: "Runs peer circles for anxious weeks. Safe, quiet, un-fixing.",         eventsHosted: 18, followers: 512,  rating: 4.8, contact: "vikram@circle.in"  },
  { id: "org-sana",   name: "Sana Ali",          initials: "SA", role: "Art Therapist",            org: "Soft Studio",     college: "NID Ahmedabad",     bio: "Art as regulation. Paper, colour, no judgment.",                       eventsHosted: 22, followers: 767,  rating: 4.9, contact: "sana@softstudio.in"},
  { id: "org-team",   name: "PeaceCode Community", initials: "PC", role: "Community Team",         org: "PeaceCode",      college: "Pan India",         bio: "The team stitching campus life together, quietly.",                    eventsHosted: 130, followers: 5420, rating: 4.9, contact: "hello@peacecode.in"},
];

export function organizerById(id: string) { return organizers.find((o) => o.id === id); }

// ─── seeded events ─────────────────────────────────────────────────
function iso(daysFromNow: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const events: EventItem[] = [
  {
    id: "ev-sunrise-yoga",
    title: "Sunrise Yoga on the Lawns",
    tagline: "Gentle stretches, easy breath, cold morning air.",
    description:
      "Meet on the north lawns before class. We move slowly through a 45-minute sequence made for stiff student bodies — no yoga background needed. Bring a mat or a large towel; tea after.",
    organizerId: "org-neha",
    category: "Yoga",
    date: iso(0, 6, 30),
    durationMin: 60,
    mode: "offline",
    location: "North Lawns, Main Campus",
    city: "New Delhi",
    college: "Delhi University",
    language: "English",
    difficulty: "Open",
    free: true,
    capacity: 40,
    registered: 27,
    featured: true,
    trending: true,
    requirements: ["Yoga mat or towel", "Water bottle", "Warm layer"],
    agenda: [
      { time: "06:30", title: "Arrival & grounding" },
      { time: "06:40", title: "Slow warm-up flow" },
      { time: "07:05", title: "Standing sequence" },
      { time: "07:20", title: "Cooldown & short meditation" },
    ],
    speakers: [{ name: "Neha Kapoor", role: "Yoga Instructor", initials: "NK" }],
    bannerHue: "#bcd0b3",
    tags: ["morning", "beginner", "outdoor"],
  },
  {
    id: "ev-mindful-monday",
    title: "Mindful Monday — 15 Minute Reset",
    tagline: "A short, guided breathing session to start the week.",
    description:
      "A quiet 15-minute session on Zoom. Cameras optional, mics off, one guided breath practice, one short reflection prompt. Perfect between classes.",
    organizerId: "org-priya",
    category: "Breathing",
    date: iso(0, 13, 0),
    durationMin: 15,
    mode: "online",
    location: "Zoom (link on RSVP)",
    city: "Online",
    college: "Pan India",
    language: "Bilingual",
    difficulty: "Open",
    free: true,
    capacity: 200,
    registered: 143,
    trending: true,
    requirements: ["Headphones", "A quiet spot"],
    agenda: [
      { time: "13:00", title: "Land in the room" },
      { time: "13:03", title: "Box breathing 4-4-4-4" },
      { time: "13:10", title: "Short reflection" },
      { time: "13:14", title: "Set intention for the week" },
    ],
    speakers: [{ name: "Dr. Priya Menon", role: "Counselling Psychologist", initials: "PM" }],
    bannerHue: "#c6d9ee",
    tags: ["quick", "online", "wellness"],
  },
  {
    id: "ev-resume-clinic",
    title: "Resume Clinic — 1:1 Rounds",
    tagline: "Bring your resume. Leave with one that reads clearly.",
    description:
      "Two-hour rolling clinic. Sign up for a 12-minute slot with a mentor who'll rewrite the top of your resume with you. First internship applications welcome.",
    organizerId: "org-arjun",
    category: "Resume",
    date: iso(2, 16, 0),
    durationMin: 120,
    mode: "hybrid",
    location: "Career Cell + Google Meet",
    city: "New Delhi",
    college: "IIT Delhi",
    language: "English",
    difficulty: "Open",
    free: true,
    capacity: 60,
    registered: 51,
    featured: true,
    requirements: ["Latest resume (PDF)", "Target role in mind"],
    agenda: [
      { time: "16:00", title: "Welcome + slot check-in" },
      { time: "16:10", title: "Round 1: 12-min mentor rounds" },
      { time: "17:00", title: "Round 2: rewrites in the room" },
      { time: "17:50", title: "Wrap + shared checklist" },
    ],
    speakers: [
      { name: "Arjun Rathore", role: "Career Coach", initials: "AR" },
      { name: "Naina Shah",    role: "Mentor",       initials: "NS" },
    ],
    bannerHue: "#d2d5c6",
    tags: ["career", "resume", "1-1"],
  },
  {
    id: "ev-exam-week-circle",
    title: "Peer Circle — Exam Week Feelings",
    tagline: "A quiet room to say the hard thing out loud.",
    description:
      "45-minute peer circle. No advice, no fixing. We sit in a small group and each share, if we want, one honest sentence about how exam week is landing.",
    organizerId: "org-vikram",
    category: "Peer Circle",
    date: iso(3, 19, 30),
    durationMin: 45,
    mode: "online",
    location: "Zoom (link on RSVP)",
    city: "Online",
    college: "IIIT Hyderabad",
    language: "English",
    difficulty: "Open",
    free: true,
    capacity: 12,
    registered: 8,
    trending: true,
    requirements: ["A private spot", "Willingness to listen"],
    agenda: [
      { time: "19:30", title: "Land + agreements" },
      { time: "19:40", title: "First round" },
      { time: "20:00", title: "Second round" },
      { time: "20:15", title: "Close" },
    ],
    speakers: [{ name: "Vikram Iyer", role: "Peer Facilitator", initials: "VI" }],
    bannerHue: "#e8cfc7",
    tags: ["support", "peer", "small"],
  },
  {
    id: "ev-photowalk",
    title: "Old Delhi — Slow Photo Walk",
    tagline: "Walk, watch, click. Talk very little.",
    description:
      "Three hours through Chandni Chowk with a small group and one guiding prompt for the day. Any camera, including phones. We meet at a cafe after.",
    organizerId: "org-sana",
    category: "Photo Walk",
    date: iso(5, 17, 0),
    durationMin: 180,
    mode: "offline",
    location: "Jama Masjid Gate 1",
    city: "New Delhi",
    college: "NID Ahmedabad",
    language: "English",
    difficulty: "Open",
    free: false,
    price: "₹250 — covers chai + zine",
    capacity: 15,
    registered: 12,
    featured: true,
    requirements: ["Any camera or phone", "Walking shoes", "Water"],
    agenda: [
      { time: "17:00", title: "Meet + prompt of the day" },
      { time: "17:30", title: "Walk begins" },
      { time: "19:00", title: "Chai break + share" },
      { time: "19:30", title: "Second walk + close" },
    ],
    speakers: [{ name: "Sana Ali", role: "Art Therapist", initials: "SA" }],
    bannerHue: "#c9d3bf",
    tags: ["creative", "outdoor", "camera"],
  },
  {
    id: "ev-mind-gym-30",
    title: "Mind Gym — 30-Day Focus Challenge",
    tagline: "Small daily reps for a calmer brain.",
    description:
      "A community round of Mind Gym. Two 20-minute live sessions each week, everything else self-paced inside PeaceCode. Leaderboard optional.",
    organizerId: "org-team",
    category: "Mind Gym",
    date: iso(7, 20, 0),
    durationMin: 30,
    mode: "online",
    location: "PeaceCode Mind Gym",
    city: "Online",
    college: "Pan India",
    language: "English",
    difficulty: "Beginner",
    free: true,
    capacity: 500,
    registered: 312,
    featured: true,
    trending: true,
    requirements: ["A PeaceCode account", "10 min a day"],
    agenda: [
      { time: "20:00", title: "Kick-off + how the 30 days work" },
      { time: "20:10", title: "Guided round of exercises" },
      { time: "20:25", title: "Buddy pairing (optional)" },
    ],
    speakers: [{ name: "PeaceCode Community", role: "Community", initials: "PC" }],
    bannerHue: "#d4c6ea",
    tags: ["challenge", "focus", "community"],
  },
  {
    id: "ev-startup-brew",
    title: "Startup Brew — First Idea Night",
    tagline: "Bring the smallest version of your idea.",
    description:
      "Casual meetup for students at idea-stage. Round-robin two-minute pitches, honest questions, and a soft round of feedback. Founders in the room to mentor.",
    organizerId: "org-arjun",
    category: "Startup",
    date: iso(9, 18, 30),
    durationMin: 120,
    mode: "offline",
    location: "IIC Innovation Hub",
    city: "Bengaluru",
    college: "IIIT Bangalore",
    language: "English",
    difficulty: "Open",
    free: true,
    capacity: 80,
    registered: 43,
    requirements: ["A one-line idea", "Notebook"],
    agenda: [
      { time: "18:30", title: "Doors + coffee" },
      { time: "18:45", title: "Two-minute rounds" },
      { time: "19:45", title: "Small-group feedback" },
      { time: "20:20", title: "Open mingling" },
    ],
    speakers: [{ name: "Arjun Rathore", role: "Career Coach", initials: "AR" }],
    bannerHue: "#c8bfe0",
    tags: ["startup", "meetup", "career"],
  },
  {
    id: "ev-art-therapy",
    title: "Art Therapy — Colour and Quiet",
    tagline: "Ninety minutes with paper, paint, and no pressure.",
    description:
      "Come as you are. We work through three light art prompts designed to move stuck feelings. No skill required. Materials provided.",
    organizerId: "org-sana",
    category: "Art Therapy",
    date: iso(10, 15, 0),
    durationMin: 90,
    mode: "offline",
    location: "Studio 3, Design Block",
    city: "Ahmedabad",
    college: "NID Ahmedabad",
    language: "English",
    difficulty: "Open",
    free: false,
    price: "₹150 — materials",
    capacity: 20,
    registered: 14,
    requirements: ["Nothing"],
    agenda: [
      { time: "15:00", title: "Ground + first prompt" },
      { time: "15:25", title: "Second prompt" },
      { time: "16:00", title: "Reflect + share (optional)" },
      { time: "16:25", title: "Close" },
    ],
    speakers: [{ name: "Sana Ali", role: "Art Therapist", initials: "SA" }],
    bannerHue: "#e5c8d0",
    tags: ["creative", "therapy", "in-person"],
  },
  {
    id: "ev-hackathon-open",
    title: "Open Hack — 24 Hours, Any Idea",
    tagline: "Small teams. Real caffeine. No theme.",
    description:
      "A quiet, well-lit hack. Bring a team or find one on the ground. Judging is soft — the point is to ship one small thing you'll actually keep using.",
    organizerId: "org-team",
    category: "Hackathon",
    date: iso(12, 9, 0),
    durationMin: 24 * 60,
    mode: "offline",
    location: "TechPark Auditorium",
    city: "Mumbai",
    college: "IIT Bombay",
    language: "English",
    difficulty: "Intermediate",
    free: true,
    capacity: 200,
    registered: 138,
    featured: true,
    requirements: ["Laptop + charger", "Team of 1-4"],
    agenda: [
      { time: "09:00", title: "Doors + team forming" },
      { time: "10:00", title: "Kick-off" },
      { time: "10:30", title: "Hack begins" },
      { time: "09:00 (next day)", title: "Demos + soft judging" },
    ],
    speakers: [{ name: "PeaceCode Community", role: "Community", initials: "PC" }],
    bannerHue: "#c8bfe0",
    tags: ["hack", "build", "team"],
  },
  {
    id: "ev-book-club",
    title: "Book Club — 'The Boy, the Mole, the Fox and the Horse'",
    tagline: "A soft book, read together in one sitting.",
    description:
      "We read one short book together over 90 minutes. Snacks, blankets, and one prompt at the end. No prep needed — copies provided.",
    organizerId: "org-vikram",
    category: "Book Club",
    date: iso(14, 17, 30),
    durationMin: 90,
    mode: "offline",
    location: "Library Reading Room",
    city: "Hyderabad",
    college: "IIIT Hyderabad",
    language: "English",
    difficulty: "Open",
    free: true,
    capacity: 25,
    registered: 18,
    requirements: ["Nothing"],
    agenda: [
      { time: "17:30", title: "Arrival + tea" },
      { time: "17:45", title: "Silent reading, round one" },
      { time: "18:30", title: "Short pause" },
      { time: "18:40", title: "Reading, round two + share" },
    ],
    speakers: [{ name: "Vikram Iyer", role: "Peer Facilitator", initials: "VI" }],
    bannerHue: "#dfd0b8" ,
    tags: ["reading", "quiet"],
  },
  {
    id: "ev-cricket-sunday",
    title: "Sunday Gully Cricket",
    tagline: "Casual game, mixed teams, no scorekeeping.",
    description:
      "We split into two teams on the spot, play three overs each, and call it a morning. Beginners welcome — the softest of tennis balls only.",
    organizerId: "org-team",
    category: "Sports",
    date: iso(6, 8, 0),
    durationMin: 90,
    mode: "offline",
    location: "Sports Ground B",
    city: "Bengaluru",
    college: "IIIT Bangalore",
    language: "Bilingual",
    difficulty: "Open",
    free: true,
    capacity: 30,
    registered: 22,
    requirements: ["Shoes with grip"],
    agenda: [
      { time: "08:00", title: "Warm-up" },
      { time: "08:15", title: "First set" },
      { time: "09:00", title: "Second set + close" },
    ],
    speakers: [{ name: "PeaceCode Community", role: "Community", initials: "PC" }],
    bannerHue: "#b6cbc2",
    tags: ["sports", "morning"],
  },
  {
    id: "ev-volunteer-orphanage",
    title: "Volunteer Saturday — Reading with Kids",
    tagline: "Two hours reading storybooks at Asha Home.",
    description:
      "We drive together to Asha Home, read for two hours with a small group of kids, and drive back. Transport arranged. No teaching skill needed.",
    organizerId: "org-team",
    category: "Volunteering",
    date: iso(11, 10, 0),
    durationMin: 180,
    mode: "offline",
    location: "Asha Home, Whitefield",
    city: "Bengaluru",
    college: "IIIT Bangalore",
    language: "Bilingual",
    difficulty: "Open",
    free: true,
    capacity: 20,
    registered: 11,
    requirements: ["Comfortable clothes", "Water"],
    agenda: [
      { time: "10:00", title: "Gather at campus gate" },
      { time: "10:30", title: "Arrive + intro" },
      { time: "11:00", title: "Reading circles" },
      { time: "12:30", title: "Return" },
    ],
    speakers: [{ name: "PeaceCode Community", role: "Community", initials: "PC" }],
    bannerHue: "#c9cdb0",
    tags: ["volunteer", "kids"],
  },
];

export function eventById(id: string): EventItem | undefined {
  return events.find((e) => e.id === id);
}

// ─── derived helpers ─────────────────────────────────────────────────
export function statusOf(e: EventItem): EventStatus {
  const now = Date.now();
  const start = new Date(e.date).getTime();
  const end = start + e.durationMin * 60_000;
  if (now < start) return "upcoming";
  if (now <= end) return "live";
  return "completed";
}

export function formatDateParts(dateISO: string) {
  const d = new Date(dateISO);
  const day = d.getDate();
  const month = d.toLocaleString(undefined, { month: "short" });
  const weekday = d.toLocaleString(undefined, { weekday: "short" });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { day, month, weekday, time, date: d };
}

export function relativeDay(dateISO: string): string {
  const d = new Date(dateISO);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const diff = Math.round((start.getTime() - today.getTime()) / (24 * 3600 * 1000));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// ─── RSVP ─────────────────────────────────────────────────
export function loadRsvps() { return load().rsvp; }
export function rsvpFor(eventId: string) { return load().rsvp[eventId]; }
export function setRsvp(eventId: string, status: Rsvp["status"]) {
  const p = load();
  p.rsvp[eventId] = { eventId, status, at: Date.now() };
  save(p);
}
export function clearRsvp(eventId: string) {
  const p = load();
  delete p.rsvp[eventId];
  save(p);
}

// ─── bookmarks ─────────────────────────────────────────────────
export function isBookmarked(eventId: string) { return load().bookmarks.includes(eventId); }
export function toggleBookmark(eventId: string) {
  const p = load();
  const i = p.bookmarks.indexOf(eventId);
  if (i >= 0) p.bookmarks.splice(i, 1); else p.bookmarks.push(eventId);
  save(p);
}
export function bookmarks() { return load().bookmarks; }

// ─── chat ─────────────────────────────────────────────────
export function chatFor(eventId: string): ChatMessage[] {
  const p = load();
  const own = p.chats[eventId] ?? [];
  return [...seedChat(eventId), ...own].sort((a, b) => a.at - b.at);
}
export function postChat(eventId: string, text: string, author = "You", initials = "YO") {
  if (!text.trim()) return;
  const p = load();
  const msg: ChatMessage = {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    eventId, author, initials, text: text.trim(), at: Date.now(),
  };
  p.chats[eventId] = [...(p.chats[eventId] ?? []), msg];
  save(p);
}
export function reactChat(eventId: string, id: string, emoji: string) {
  const p = load();
  const list = p.chats[eventId] ?? [];
  const idx = list.findIndex((m) => m.id === id);
  if (idx < 0) return;
  const set = new Set(list[idx].reactions ?? []);
  set.has(emoji) ? set.delete(emoji) : set.add(emoji);
  list[idx] = { ...list[idx], reactions: [...set] };
  p.chats[eventId] = list;
  save(p);
}
function seedChat(eventId: string): ChatMessage[] {
  const base = Date.now() - 3 * 3600_000;
  return [
    { id: `s-${eventId}-1`, eventId, author: "Aanya", initials: "AA", text: "So excited for this — first time joining!", at: base, reactions: ["💛"] },
    { id: `s-${eventId}-2`, eventId, author: "Kabir", initials: "KA", text: "Anyone coming from north campus? Sharing a cab?", at: base + 20 * 60_000 },
    { id: `s-${eventId}-3`, eventId, author: "Organizer", initials: "OR", text: "Doors open 10 min early. Bring a friend if you like.", at: base + 45 * 60_000, pinned: true },
  ];
}

// ─── attendance ─────────────────────────────────────────────────
export function attendanceFor(eventId: string) { return load().attendance[eventId]; }
export function checkIn(eventId: string) {
  const p = load();
  p.attendance[eventId] = { eventId, status: "completed", checkInAt: Date.now() };
  save(p);
}
export function markAttendance(eventId: string, s: AttendanceRecord["status"]) {
  const p = load();
  p.attendance[eventId] = { eventId, status: s, checkInAt: Date.now() };
  save(p);
}

// ─── notes ─────────────────────────────────────────────────
export function noteFor(eventId: string) { return load().notes[eventId] ?? ""; }
export function saveNote(eventId: string, text: string) {
  const p = load();
  p.notes[eventId] = text;
  save(p);
}

// ─── feedback ─────────────────────────────────────────────────
export function feedbackFor(eventId: string) { return load().feedback[eventId]; }
export function saveFeedback(f: FeedbackEntry) {
  const p = load();
  p.feedback[f.eventId] = f;
  save(p);
}

// ─── organizer follow ─────────────────────────────────────────────────
export function isFollowingOrg(id: string) { return load().followedOrganizers.includes(id); }
export function toggleFollowOrg(id: string) {
  const p = load();
  const i = p.followedOrganizers.indexOf(id);
  if (i >= 0) p.followedOrganizers.splice(i, 1); else p.followedOrganizers.push(id);
  save(p);
}

// ─── achievements (derived from state) ─────────────────────────────────
export type Achievement = { key: string; title: string; sub: string; icon: string; unlocked: boolean };
export function achievements(): Achievement[] {
  const p = load();
  const attended = Object.values(p.attendance).filter((a) => a.status === "completed").length;
  const rsvpCount = Object.keys(p.rsvp).length;
  const bookmarkCount = p.bookmarks.length;
  const feedbackCount = Object.keys(p.feedback).length;
  const wellnessAttended = Object.values(p.attendance).filter((a) => {
    const e = eventById(a.eventId);
    return e && ["Meditation", "Yoga", "Breathing", "Mind Gym", "Art Therapy"].includes(e.category);
  }).length;
  const volunteered = Object.values(p.attendance).some((a) => eventById(a.eventId)?.category === "Volunteering");
  const networking = Object.values(p.attendance).some((a) => eventById(a.eventId)?.category === "Networking");
  const workshops = Object.values(p.attendance).filter((a) => {
    const e = eventById(a.eventId);
    return e && ["Career", "Resume", "Hackathon", "Startup"].includes(e.category);
  }).length;

  return [
    { key: "first",       title: "First Event",         sub: "Attended your first event",        icon: "sparkle", unlocked: attended >= 1 },
    { key: "five",        title: "Regular",             sub: "Attended 5 events",                icon: "flame",   unlocked: attended >= 5 },
    { key: "ten",         title: "Community Leader",    sub: "Attended 10 events",               icon: "crown",   unlocked: attended >= 10 },
    { key: "explorer",    title: "Workshop Explorer",   sub: "3 career or hackathon events",     icon: "compass", unlocked: workshops >= 3 },
    { key: "networking",  title: "Networking Pro",      sub: "Attended a networking event",      icon: "handshake", unlocked: networking },
    { key: "volunteer",   title: "Volunteer",           sub: "Attended a volunteering event",    icon: "heart",   unlocked: volunteered },
    { key: "wellness",    title: "Wellness Champion",   sub: "3 wellness sessions",              icon: "leaf",    unlocked: wellnessAttended >= 3 },
    { key: "bookmarker",  title: "Curator",             sub: "Bookmarked 5 events",              icon: "bookmark", unlocked: bookmarkCount >= 5 },
    { key: "rsvper",      title: "Committed",           sub: "RSVP'd to 10 events",              icon: "check",   unlocked: rsvpCount >= 10 },
    { key: "voice",       title: "Voice",               sub: "Left 3 feedback entries",          icon: "mic",     unlocked: feedbackCount >= 3 },
  ];
}

// ─── filters ─────────────────────────────────────────────────
export type FilterState = {
  q: string;
  category?: EventCategory;
  when: "any" | "today" | "tomorrow" | "week" | "month";
  mode: "any" | "online" | "offline";
  free: "any" | "free" | "paid";
  college?: string;
  language?: string;
  sort: "trending" | "newest" | "popularity" | "recommended";
};

export function defaultFilters(): FilterState {
  return { q: "", when: "any", mode: "any", free: "any", sort: "trending" };
}

export function applyFilters(list: EventItem[], f: FilterState): EventItem[] {
  const q = f.q.trim().toLowerCase();
  const now = Date.now();
  return list.filter((e) => {
    if (q) {
      const hay = [
        e.title, e.tagline, e.description, e.location, e.city, e.college,
        organizerById(e.organizerId)?.name ?? "",
        ...e.speakers.map((s) => s.name), ...e.tags, e.category,
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.category && e.category !== f.category) return false;
    if (f.mode !== "any" && e.mode !== f.mode && e.mode !== "hybrid") return false;
    if (f.free === "free" && !e.free) return false;
    if (f.free === "paid" && e.free) return false;
    if (f.college && e.college !== f.college) return false;
    if (f.language && e.language !== f.language) return false;

    const t = new Date(e.date).getTime();
    if (f.when === "today") {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      const nd = new Date(d); nd.setDate(d.getDate() + 1);
      if (t < d.getTime() || t >= nd.getTime()) return false;
    } else if (f.when === "tomorrow") {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1);
      const nd = new Date(d); nd.setDate(d.getDate() + 1);
      if (t < d.getTime() || t >= nd.getTime()) return false;
    } else if (f.when === "week") {
      if (t < now || t > now + 7 * 86400_000) return false;
    } else if (f.when === "month") {
      if (t < now || t > now + 30 * 86400_000) return false;
    }
    return true;
  }).sort((a, b) => {
    if (f.sort === "newest") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (f.sort === "popularity") return b.registered - a.registered;
    if (f.sort === "trending") {
      const score = (e: EventItem) => (e.trending ? 100 : 0) + (e.featured ? 50 : 0) + e.registered / Math.max(1, e.capacity) * 40;
      return score(b) - score(a);
    }
    // recommended — cheap heuristic, wellness bias
    const bias = (e: EventItem) => {
      const w = ["Meditation", "Breathing", "Yoga", "Mind Gym", "Peer Circle"];
      return (w.includes(e.category) ? 30 : 0) + e.registered;
    };
    return bias(b) - bias(a);
  });
}

// ─── uniques ─────────────────────────────────────────────────
export const uniqueColleges = () => Array.from(new Set(events.map((e) => e.college)));
export const uniqueLanguages = () => Array.from(new Set(events.map((e) => e.language)));

// ─── AI-ish recommendations (mock) ─────────────────────────────────────
export function recommendationsFor(context: {
  mood?: "calm" | "tense" | "low" | "energised";
} = {}): EventItem[] {
  const { mood } = context;
  const list = [...events];
  const boost = (e: EventItem) => {
    let s = 0;
    if (mood === "tense" && ["Breathing", "Yoga", "Meditation", "Peer Circle"].includes(e.category)) s += 40;
    if (mood === "low"   && ["Peer Circle", "Support Group", "Art Therapy", "Volunteering"].includes(e.category)) s += 40;
    if (mood === "energised" && ["Hackathon", "Sports", "Networking", "Startup"].includes(e.category)) s += 30;
    if (e.trending) s += 10;
    if (e.featured) s += 5;
    return s + e.registered / 20;
  };
  return list.sort((a, b) => boost(b) - boost(a)).slice(0, 6);
}
