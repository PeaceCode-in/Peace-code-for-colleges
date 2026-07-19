// Counselling — local-first store for the full clinical care ecosystem.
// Psychologists (mock), appointments, wellness plan, homework, assessments,
// messages, documents, medication, billing, resources.

export type Mode = "video" | "audio" | "chat";

export type Expert = {
  id: string;
  name: string;
  title: string;                     // e.g. "Clinical Psychologist"
  license: string;                   // "RCI CRR No. A-XXXXX"
  qualification: string;             // "M.Phil Clinical Psychology, NIMHANS"
  experienceYears: number;
  sessions: number;
  rating: number;
  reviewsCount: number;
  languages: string[];
  gender: "she/her" | "he/him" | "they/them";
  ageGroups: string[];               // "18-24", "adults"
  specializations: string[];
  therapyTypes: string[];
  modes: Mode[];
  fees: number;                      // INR per session
  responseMin: number;
  online: boolean;
  emergency: boolean;
  collegePartner: boolean;
  verified: boolean;
  bio: string;
  approach: string;
  education: string[];
  certificates: string[];
  reviews: { by: string; rating: number; text: string; when: string }[];
  faqs: { q: string; a: string }[];
  cancellationPolicy: string;
  successStories: string[];
  weekly: Record<string, string[]>;  // day -> ["10am","2pm",...]
};

export type AppointmentStatus =
  | "draft"          // being created (questionnaire/consent/pay)
  | "confirmed"      // paid & scheduled
  | "in-progress"    // live now
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "missed";

export type Appointment = {
  id: string;
  expertId: string;
  status: AppointmentStatus;
  createdAt: number;
  scheduledFor: number;              // ms
  duration: number;                  // minutes
  mode: Mode;
  language: string;
  reason: string;
  notes?: string;
  fee: number;
  paid: boolean;
  paymentMethod?: string;
  // questionnaire
  questionnaire?: Questionnaire;
  // consent
  consent?: { privacy: boolean; recording: boolean; emergency: boolean; cancellation: boolean; digital: boolean; signedAt: number };
  // outcome
  moodBefore?: string;
  moodAfter?: string;
  summary?: string;
  keyTakeaways?: string[];
  counsellorNotes?: string;
  homeworkIds?: string[];
  followUpAt?: number;
};

export type Questionnaire = {
  primaryConcern: string;
  currentMood: string;
  stress: number;                    // 0-10
  sleep: number;                     // hours
  appetite: "good" | "okay" | "poor";
  medications: string;
  previousTherapy: boolean;
  goals: string;
  pronouns: string;
  emergencyContact: string;
  anythingElse?: string;
};

export type Homework = {
  id: string;
  apptId?: string;
  expertId: string;
  title: string;
  kind: "reflection" | "breathing" | "meditation" | "habit" | "worksheet" | "reading";
  detail: string;
  due?: number;
  done: boolean;
  createdAt: number;
};

export type WellnessGoal = {
  id: string;
  title: string;
  cadence: "daily" | "weekly";
  progress: number;                  // 0-100
};

export type Msg = {
  id: string;
  threadId: string;                  // expertId
  from: "me" | "expert" | "system";
  text: string;
  ts: number;
  read?: boolean;
  pinned?: boolean;
  archived?: boolean;
  bookmarked?: boolean;
  attachments?: { name: string; kind: "image" | "file" | "audio" }[];
};

export type Doc = {
  id: string;
  name: string;
  kind: "medical" | "prescription" | "journal" | "assessment" | "image" | "voice" | "pdf" | "other";
  sharedWith?: string[];             // expertIds
  size: number;                      // bytes (approx)
  uploadedAt: number;
};

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  reminderAt?: string;               // "08:00"
  notes?: string;
  active: boolean;
  addedAt: number;
};

export type Invoice = {
  id: string;
  apptId?: string;
  expertId?: string;
  amount: number;
  status: "paid" | "pending" | "refunded";
  method?: string;
  when: number;
};

export type Prefs = {
  theme: "system" | "light" | "dark";
  language: string;
  notifications: {
    appointment: boolean; homework: boolean; assessment: boolean;
    messages: boolean; exercises: boolean; followUp: boolean;
  };
  emergencyContacts: { name: string; phone: string; relation: string }[];
  privacy: { shareAssessments: boolean; shareJournal: boolean; anonymized: boolean };
  accessibility: { fontScale: number; highContrast: boolean; reducedMotion: boolean };
};

// ─── storage keys ────────────────────────────────────────────────
const K_APPT = "peacecode.counsel.appt.v1";
const K_HW   = "peacecode.counsel.hw.v1";
const K_GOAL = "peacecode.counsel.goals.v1";
const K_MSG  = "peacecode.counsel.msg.v1";
const K_DOC  = "peacecode.counsel.doc.v1";
const K_MED  = "peacecode.counsel.med.v1";
const K_INV  = "peacecode.counsel.inv.v1";
const K_FAV  = "peacecode.counsel.fav.v1";
const K_PREF = "peacecode.counsel.pref.v1";

function load<T>(k: string, d: T): T {
  if (typeof window === "undefined") return d;
  try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; }
}
function save<T>(k: string, v: T) { if (typeof window === "undefined") return; try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

// Profile photo overrides for verified psychologists. Kept empty on the
// deployed build so no `.asset.json` CDN URLs (Lovable-preview-only) leak
// into the Netlify build and render as broken images.
export const PHOTO_OVERRIDES: Record<string, string> = {};

export const photoFor = (id: string) =>
  PHOTO_OVERRIDES[id] ??
  `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(id)}&backgroundColor=c7d9ff,dbe4ff,ffe1d6,e6f0ff,f2e7ff`;

// ─── Specialization + therapy catalogs ───────────────────────────
export const SPECIALIZATIONS = [
  "Depression","Anxiety","Stress","Burnout","Exam Anxiety","Relationships","Family",
  "Grief","Trauma","PTSD","Panic Attacks","OCD","ADHD","Autism","Sleep","Eating Disorders",
  "Self Harm","Substance Use","Career","Identity","LGBTQ+","Confidence","Loneliness",
  "Social Anxiety","Anger",
];
export const THERAPY_TYPES = [
  "CBT","ACT","DBT","REBT","Mindfulness","Solution Focused","Trauma Therapy",
  "Supportive Therapy","Narrative Therapy","Positive Psychology",
];
export const LANGS = ["English","Hindi","Tamil","Bengali","Kannada","Malayalam","Marathi","Gujarati","Punjabi","Telugu","Urdu"];

// ─── Mock psychologists ──────────────────────────────────────────
export const EXPERTS: Expert[] = [
  {
    id: "e_nisha", name: "Nisha Kundu", title: "Counseling Psychologist & Mental Health Coach",
    license: "RCI Registered", qualification: "MA Counseling Psychology, IGNOU · PG Diploma in Guidance & Counseling, Jamia Millia Islamia",
    experienceYears: 2, sessions: 180, rating: 4.9, reviewsCount: 42,
    languages: ["English","Hindi"], gender: "she/her",
    ageGroups: ["18-24","25-34"],
    specializations: ["Anxiety","Stress","Self Harm","Confidence","Career","Relationships","Loneliness"],
    therapyTypes: ["CBT","Mindfulness","Solution Focused","Supportive Therapy","Positive Psychology"],
    modes: ["video","audio","chat"],
    fees: 1100, responseMin: 15, online: true, emergency: true, collegePartner: true, verified: true,
    bio: "Founder of The Antar Journey. I sit with students the way I wish someone had sat with me — patiently, without a script.",
    approach: "Warm and grounded. We start with what's loudest in your head today, then work outward. No lectures, no forced homework.",
    education: [
      "PG Diploma in Guidance & Counseling, Jamia Millia Islamia, 2022–2024",
      "MA Counseling Psychology, Indira Gandhi National Open University, 2019–2022 (Grade A)",
      "PG Diploma in Mental Health, IGNOU (Grade A)",
    ],
    certificates: [
      "Founder — The Antar Journey (2025–Present)",
      "PGT Psychology — Notre Dame School, Delhi",
      "Mental Health Coach — JK Life Skill Academy (2024–2026)",
    ],
    reviews: [
      { by: "DU · 2nd year", rating: 5, text: "She actually listens. First session I didn't feel rushed.", when: "1 week ago" },
      { by: "Jamia · MA student", rating: 5, text: "Helped me through a really dark month. Gentle but honest.", when: "3 weeks ago" },
      { by: "IP University · 3rd year", rating: 5, text: "The Antar Journey sessions feel like coming home.", when: "1 month ago" },
    ],
    faqs: [
      { q: "What is The Antar Journey?", a: "It's my practice — a slow, honest space for students and young adults navigating mental health without judgment." },
      { q: "Do you work with self-harm concerns?", a: "Yes. We go carefully, and safety planning comes first." },
    ],
    cancellationPolicy: "Free cancellation up to 4 hours before the session.",
    successStories: ["A first-year student came in unable to attend classes due to panic. Over 8 sessions we rebuilt her mornings — she's now back on campus and mentoring a junior."],
    weekly: { Mon:["11am","4pm","7pm"], Tue:["11am","6pm"], Wed:["4pm","7pm"], Thu:["11am","4pm","7pm"], Fri:["11am","6pm"], Sat:["10am","12pm"], Sun:[] },
  },
  {
    id: "e_arya", name: "Dr. Arya Menon", title: "Clinical Psychologist",
    license: "RCI CRR A-38214", qualification: "M.Phil Clinical Psychology, NIMHANS",
    experienceYears: 9, sessions: 1240, rating: 4.9, reviewsCount: 214,
    languages: ["English","Malayalam","Hindi"], gender: "she/her",
    ageGroups: ["18-24","25-34"],
    specializations: ["Anxiety","Depression","Exam Anxiety","Panic Attacks","Burnout"],
    therapyTypes: ["CBT","ACT","Mindfulness"], modes: ["video","audio","chat"],
    fees: 1400, responseMin: 12, online: true, emergency: true, collegePartner: true, verified: true,
    bio: "I work slowly and with a lot of warmth. Most students I see are burnt out and pretending they're fine.",
    approach: "Cognitive-behavioural, always paced to the student in front of me. No jargon, no assignments you'll hate.",
    education: ["M.Phil, NIMHANS Bangalore, 2016","MSc Psychology, Delhi University, 2013"],
    certificates: ["Certified CBT Practitioner","Trauma-informed care, 2021"],
    reviews: [
      { by: "IIT-D · 3rd year", rating: 5, text: "First therapist who didn't make me feel like a case file.", when: "2 weeks ago" },
      { by: "AIIMS · MBBS", rating: 5, text: "She helped me sleep for the first time in months.", when: "1 month ago" },
      { by: "SRCC · 2nd year", rating: 4, text: "Very calm energy. Sessions feel unrushed.", when: "3 weeks ago" },
    ],
    faqs: [
      { q: "How many sessions will I need?", a: "Most students see meaningful change in 6-8 sessions. We review together at session 4." },
      { q: "Do you prescribe medication?", a: "I don't. If we think it might help, I'll refer to a trusted psychiatrist." },
    ],
    cancellationPolicy: "Free cancellation up to 4 hours before. Later than that, 50% fee applies.",
    successStories: ["A 3rd-year student who came for exam anxiety left with a working sleep routine and a manageable panic protocol."],
    weekly: { Mon:["10am","4pm","6pm"], Tue:["11am","3pm"], Wed:["10am","6pm","8pm"], Thu:["2pm","4pm"], Fri:["11am","5pm"], Sat:["10am","12pm"], Sun:[] },
  },
  {
    id: "e_rohan", name: "Dr. Rohan Kapoor", title: "Counselling Psychologist",
    license: "RCI CRR B-19402", qualification: "MA Counselling Psychology, TISS",
    experienceYears: 7, sessions: 890, rating: 4.8, reviewsCount: 176,
    languages: ["English","Hindi","Punjabi"], gender: "he/him",
    ageGroups: ["18-24"],
    specializations: ["Relationships","Family","Identity","Loneliness","Social Anxiety"],
    therapyTypes: ["ACT","Narrative Therapy","Supportive Therapy"], modes: ["video","chat"],
    fees: 1200, responseMin: 20, online: true, emergency: false, collegePartner: true, verified: true,
    bio: "I help students figure out who they actually are, not who they were told to be.",
    approach: "Story-first. We look at what's happened, name it clearly, then decide what changes.",
    education: ["MA, TISS Mumbai, 2018","BA Psychology, Panjab University, 2015"],
    certificates: ["Narrative therapy foundations, Dulwich Centre"],
    reviews: [
      { by: "DU · English Hons", rating: 5, text: "He made hostel life feel less crushing.", when: "5 days ago" },
      { by: "NIT · 4th year", rating: 5, text: "Helped me come out to my parents.", when: "2 months ago" },
    ],
    faqs: [{ q: "Do you work with couples?", a: "Not at the moment — individual students only." }],
    cancellationPolicy: "Free cancellation up to 6 hours before.",
    successStories: [],
    weekly: { Mon:["6pm","8pm"], Tue:["7pm"], Wed:["6pm","8pm"], Thu:["7pm","9pm"], Fri:["6pm"], Sat:["11am","3pm"], Sun:["11am"] },
  },
  {
    id: "e_lakshmi", name: "Dr. Lakshmi Iyer", title: "Clinical Psychologist",
    license: "RCI CRR A-40118", qualification: "PhD Clinical Psychology, NIMHANS",
    experienceYears: 12, sessions: 2100, rating: 5.0, reviewsCount: 342,
    languages: ["English","Tamil","Hindi","Kannada"], gender: "she/her",
    ageGroups: ["18-24","25-34"],
    specializations: ["Trauma","PTSD","OCD","Self Harm","Grief"],
    therapyTypes: ["Trauma Therapy","DBT","CBT"], modes: ["video","audio"],
    fees: 1800, responseMin: 30, online: true, emergency: true, collegePartner: false, verified: true,
    bio: "I've spent 12 years sitting with people on their worst days. It's the honour of my life.",
    approach: "Trauma-informed. We go at your pace, always. Nothing is 'too much' or 'not enough'.",
    education: ["PhD, NIMHANS, 2013","M.Phil, NIMHANS, 2010"],
    certificates: ["EMDR Certified","DBT Intensive, Behavioral Tech"],
    reviews: [
      { by: "JNU · MPhil", rating: 5, text: "She helped me stop dissociating. I didn't know that was possible.", when: "1 week ago" },
    ],
    faqs: [{ q: "Do you do EMDR?", a: "Yes, when it's a fit. We'll assess together." }],
    cancellationPolicy: "Free cancellation up to 12 hours before.",
    successStories: [],
    weekly: { Mon:["2pm","4pm"], Tue:["10am","2pm","4pm"], Wed:["10am","2pm"], Thu:["4pm"], Fri:["10am","2pm"], Sat:[], Sun:[] },
  },
  {
    id: "e_devika", name: "Devika Rao", title: "Counselling Psychologist",
    license: "RCI CRR B-22841", qualification: "MSc Counselling Psychology, Christ University",
    experienceYears: 4, sessions: 420, rating: 4.7, reviewsCount: 88,
    languages: ["English","Kannada","Marathi"], gender: "she/her",
    ageGroups: ["18-24"],
    specializations: ["Career","Confidence","Stress","Anxiety","LGBTQ+"],
    therapyTypes: ["Solution Focused","Positive Psychology","CBT"], modes: ["video","chat"],
    fees: 900, responseMin: 15, online: true, emergency: false, collegePartner: true, verified: true,
    bio: "Solution-focused, warm, and I promise I won't ask you to journal three times a day.",
    approach: "We find what already works and build from there. Small wins add up.",
    education: ["MSc, Christ University, 2020"],
    certificates: ["SFBT Level 1"],
    reviews: [
      { by: "IIM-B · PGP", rating: 5, text: "Best career+confidence therapist I've had.", when: "3 weeks ago" },
      { by: "NLSIU · 3rd year", rating: 4, text: "Practical, quick, easy to talk to.", when: "1 month ago" },
    ],
    faqs: [{ q: "Are you queer-affirming?", a: "Yes — always." }],
    cancellationPolicy: "Free cancellation up to 2 hours before.",
    successStories: [],
    weekly: { Mon:["11am","5pm","7pm"], Tue:["11am","7pm"], Wed:["5pm","7pm"], Thu:["11am","5pm"], Fri:["7pm"], Sat:["11am","3pm","5pm"], Sun:["11am","3pm"] },
  },
  {
    id: "e_kabir", name: "Dr. Kabir Sengupta", title: "Clinical Psychologist",
    license: "RCI CRR A-30512", qualification: "M.Phil Clinical Psychology, IHBAS Delhi",
    experienceYears: 10, sessions: 1580, rating: 4.8, reviewsCount: 202,
    languages: ["English","Hindi","Bengali"], gender: "he/him",
    ageGroups: ["18-24","25-34"],
    specializations: ["ADHD","OCD","Anxiety","Sleep","Substance Use"],
    therapyTypes: ["CBT","REBT","DBT"], modes: ["video","audio","chat"],
    fees: 1500, responseMin: 20, online: true, emergency: true, collegePartner: true, verified: true,
    bio: "I specialise in ADHD and OCD in college students. If you're stuck in loops, we'll find the door.",
    approach: "Structured, but never rigid. We use tools that actually fit a student's life.",
    education: ["M.Phil, IHBAS, 2015","MA, Jadavpur University, 2012"],
    certificates: ["ADHD across the lifespan, CADDAC","OCD & ERP, IOCDF"],
    reviews: [
      { by: "IIT-KGP · 4th year", rating: 5, text: "First person who took my ADHD seriously.", when: "2 weeks ago" },
    ],
    faqs: [{ q: "Do you do ERP for OCD?", a: "Yes — it's my primary approach." }],
    cancellationPolicy: "Free cancellation up to 4 hours before.",
    successStories: [],
    weekly: { Mon:["9am","6pm","8pm"], Tue:["9am","6pm"], Wed:["9am","8pm"], Thu:["6pm","8pm"], Fri:["9am","6pm"], Sat:[], Sun:[] },
  },
  {
    id: "e_ishaan", name: "Ishaan Verma", title: "Counselling Psychologist",
    license: "RCI CRR B-25190", qualification: "MSc Counselling Psychology, Amity University",
    experienceYears: 5, sessions: 640, rating: 4.6, reviewsCount: 112,
    languages: ["English","Hindi"], gender: "he/him",
    ageGroups: ["18-24"],
    specializations: ["Anger","Confidence","Career","Stress","Anxiety"],
    therapyTypes: ["REBT","CBT","Solution Focused"], modes: ["video","chat"],
    fees: 850, responseMin: 25, online: false, emergency: false, collegePartner: true, verified: true,
    bio: "I'm the therapist for the student who's tired of being told to 'just relax'.",
    approach: "Direct, warm, and evidence-based. We do the actual work.",
    education: ["MSc, Amity University, 2019"],
    certificates: ["REBT Primary Certificate, Albert Ellis Institute"],
    reviews: [{ by: "DTU · 3rd year", rating: 5, text: "Called me out lovingly. It worked.", when: "1 month ago" }],
    faqs: [],
    cancellationPolicy: "Free cancellation up to 3 hours before.",
    successStories: [],
    weekly: { Mon:["5pm","7pm"], Tue:["5pm","7pm","9pm"], Wed:["7pm","9pm"], Thu:["5pm","7pm"], Fri:["5pm"], Sat:["3pm","5pm"], Sun:["3pm"] },
  },
];

export const getExpert = (id: string) => EXPERTS.find((e) => e.id === id);

// ─── Availability parsing ────────────────────────────────────────
const DAY_ORDER = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export function parseSlot(slot: string): { h: number; m: number } | null {
  const s = slot.trim().toLowerCase();
  const match = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!match) return null;
  let h = parseInt(match[1], 10); const m = parseInt(match[2] ?? "0", 10);
  const pm = match[3] === "pm";
  if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12;
  return { h, m };
}
export type UpcomingSlot = { ts: number; label: string; slot: string; isSoon: boolean; day: string };
export function upcomingSlots(expertId: string, days = 14, limit = 32): UpcomingSlot[] {
  const e = getExpert(expertId); if (!e) return [];
  const now = new Date(); const out: UpcomingSlot[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    const key = DAY_ORDER[d.getDay()];
    for (const slot of (e.weekly[key] ?? [])) {
      const p = parseSlot(slot); if (!p) continue;
      const when = new Date(d); when.setHours(p.h, p.m, 0, 0);
      if (when.getTime() <= now.getTime()) continue;
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : when.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
      out.push({ ts: when.getTime(), label, slot, day: key, isSoon: when.getTime() - now.getTime() < 6 * 3600_000 });
    }
  }
  return out.slice(0, limit);
}
export function nextAvailable(expertId: string): UpcomingSlot | null {
  return upcomingSlots(expertId, 14, 1)[0] ?? null;
}

// ─── Appointments ────────────────────────────────────────────────
export function listAppointments(): Appointment[] {
  return load<Appointment[]>(K_APPT, []).sort((a,b)=>b.createdAt-a.createdAt);
}
export function getAppointment(id: string) { return listAppointments().find((a) => a.id === id); }
export function upsertAppointment(a: Appointment) {
  const all = listAppointments().filter((x) => x.id !== a.id);
  save(K_APPT, [a, ...all]);
}
export function createAppointment(partial: Partial<Appointment> & { expertId: string; scheduledFor: number; mode: Mode; language: string; reason: string; fee: number; duration?: number }): Appointment {
  const a: Appointment = {
    id: uid("appt"),
    status: "draft",
    createdAt: Date.now(),
    paid: false,
    duration: partial.duration ?? 45,
    ...partial,
  } as Appointment;
  upsertAppointment(a);
  return a;
}
export function updateAppointment(id: string, patch: Partial<Appointment>) {
  const a = getAppointment(id); if (!a) return;
  upsertAppointment({ ...a, ...patch });
}
export function cancelAppointment(id: string) { updateAppointment(id, { status: "cancelled" }); }

export const upcomingAppointments = () =>
  listAppointments().filter((a) => a.scheduledFor > Date.now() && (a.status === "confirmed" || a.status === "draft"))
    .sort((a,b)=>a.scheduledFor-b.scheduledFor);
export const pastAppointments = () =>
  listAppointments().filter((a) => a.status === "completed" || a.status === "missed" || a.scheduledFor < Date.now())
    .sort((a,b)=>b.scheduledFor-a.scheduledFor);
export const myCounsellors = () => {
  const ids = Array.from(new Set(listAppointments().filter(a => a.status !== "cancelled").map(a => a.expertId)));
  return ids.map(getExpert).filter(Boolean) as Expert[];
};

// ─── Homework ────────────────────────────────────────────────────
export function listHomework(): Homework[] { return load<Homework[]>(K_HW, []).sort((a,b)=>b.createdAt-a.createdAt); }
export function upsertHomework(h: Homework) { const all = listHomework().filter(x=>x.id!==h.id); save(K_HW, [h, ...all]); }
export function toggleHomework(id: string) {
  const all = listHomework();
  const h = all.find(x=>x.id===id); if (!h) return;
  h.done = !h.done; upsertHomework(h);
}
export function addHomework(input: Omit<Homework, "id"|"createdAt"|"done">) {
  const h: Homework = { ...input, id: uid("hw"), createdAt: Date.now(), done: false };
  upsertHomework(h); return h;
}

// ─── Wellness plan / goals ───────────────────────────────────────
export function listGoals(): WellnessGoal[] { return load<WellnessGoal[]>(K_GOAL, []); }
export function upsertGoal(g: WellnessGoal) { const all = listGoals().filter(x=>x.id!==g.id); save(K_GOAL, [g, ...all]); }
export function addGoal(title: string, cadence: WellnessGoal["cadence"] = "daily") {
  const g: WellnessGoal = { id: uid("goal"), title, cadence, progress: 0 }; upsertGoal(g); return g;
}
export function bumpGoal(id: string, delta = 20) {
  const all = listGoals(); const g = all.find(x=>x.id===id); if (!g) return;
  g.progress = Math.min(100, Math.max(0, g.progress + delta)); upsertGoal(g);
}
export function removeGoal(id: string) { save(K_GOAL, listGoals().filter(g=>g.id!==id)); }

// ─── Messages ────────────────────────────────────────────────────
export function listMessages(threadId?: string): Msg[] {
  const all = load<Msg[]>(K_MSG, []);
  return (threadId ? all.filter(m=>m.threadId===threadId) : all).sort((a,b)=>a.ts-b.ts);
}
export function threadIds(): string[] {
  return Array.from(new Set(load<Msg[]>(K_MSG, []).map(m=>m.threadId)));
}
export function addMessage(m: Omit<Msg,"id"|"ts">): Msg {
  const msg: Msg = { ...m, id: uid("m"), ts: Date.now() };
  save(K_MSG, [...load<Msg[]>(K_MSG, []), msg]);
  return msg;
}
export function patchMessage(id: string, patch: Partial<Msg>) {
  const all = load<Msg[]>(K_MSG, []);
  save(K_MSG, all.map(m => m.id === id ? { ...m, ...patch } : m));
}

// ─── Documents ───────────────────────────────────────────────────
export function listDocs(): Doc[] { return load<Doc[]>(K_DOC, []).sort((a,b)=>b.uploadedAt-a.uploadedAt); }
export function addDoc(d: Omit<Doc,"id"|"uploadedAt">): Doc {
  const doc: Doc = { ...d, id: uid("doc"), uploadedAt: Date.now() };
  save(K_DOC, [doc, ...listDocs()]); return doc;
}
export function removeDoc(id: string) { save(K_DOC, listDocs().filter(x=>x.id!==id)); }
export function shareDoc(id: string, expertId: string) {
  const all = listDocs(); const d = all.find(x=>x.id===id); if (!d) return;
  d.sharedWith = Array.from(new Set([...(d.sharedWith ?? []), expertId]));
  save(K_DOC, all);
}

// ─── Medication ──────────────────────────────────────────────────
export function listMeds(): Medication[] { return load<Medication[]>(K_MED, []).sort((a,b)=>b.addedAt-a.addedAt); }
export function upsertMed(m: Medication) { const all = listMeds().filter(x=>x.id!==m.id); save(K_MED, [m, ...all]); }
export function addMed(input: Omit<Medication, "id"|"addedAt"|"active">) {
  const m: Medication = { ...input, id: uid("med"), active: true, addedAt: Date.now() };
  upsertMed(m); return m;
}
export function removeMed(id: string) { save(K_MED, listMeds().filter(m=>m.id!==id)); }

// ─── Invoices / billing ─────────────────────────────────────────
export function listInvoices(): Invoice[] { return load<Invoice[]>(K_INV, []).sort((a,b)=>b.when-a.when); }
export function addInvoice(i: Omit<Invoice,"id">) {
  const inv: Invoice = { ...i, id: uid("inv") };
  save(K_INV, [inv, ...listInvoices()]); return inv;
}

// ─── Favorites ───────────────────────────────────────────────────
export function favorites(): string[] { return load<string[]>(K_FAV, []); }
export function toggleFavorite(id: string) {
  const f = favorites(); save(K_FAV, f.includes(id) ? f.filter(x=>x!==id) : [...f, id]);
}

// ─── Prefs ───────────────────────────────────────────────────────
const defaultPrefs: Prefs = {
  theme: "system", language: "English",
  notifications: { appointment: true, homework: true, assessment: true, messages: true, exercises: true, followUp: true },
  emergencyContacts: [],
  privacy: { shareAssessments: false, shareJournal: false, anonymized: true },
  accessibility: { fontScale: 1, highContrast: false, reducedMotion: false },
};
export function getPrefs(): Prefs {
  return { ...defaultPrefs, ...load<Partial<Prefs>>(K_PREF, {}) } as Prefs;
}
export function setPrefs(p: Prefs) { save(K_PREF, p); }

// ─── Seed a demo homework/plan on first visit (idempotent) ───────
export function seedIfEmpty() {
  if (typeof window === "undefined") return;
  if (listGoals().length === 0) {
    ["Sleep before 12:30am","Journal 3 lines","10-min walk","5 min box breathing"].forEach(t => addGoal(t, "daily"));
    ["Weekly reflection with counsellor","Complete assigned worksheet"].forEach(t => addGoal(t, "weekly"));
  }
}

// ─── Resources catalog (frontend-only) ──────────────────────────
export type Resource = {
  id: string; title: string; kind: "article" | "video" | "worksheet" | "meditation" | "podcast" | "download";
  minutes: number; topic: string; blurb: string;
};
export const RESOURCES: Resource[] = [
  { id: "r1", title: "The night before an exam", kind: "article", minutes: 4, topic: "Exam Anxiety", blurb: "A 4-minute read for the panic that shows up at 2am." },
  { id: "r2", title: "Box breathing, done properly", kind: "meditation", minutes: 5, topic: "Anxiety", blurb: "A guided 5-minute practice." },
  { id: "r3", title: "Why you can't 'just sleep'", kind: "video", minutes: 8, topic: "Sleep", blurb: "Sleep hygiene without the lecture." },
  { id: "r4", title: "Values worksheet (ACT)", kind: "worksheet", minutes: 10, topic: "Identity", blurb: "The single worksheet most students say changed something." },
  { id: "r5", title: "Grounding when it's too much", kind: "meditation", minutes: 3, topic: "Panic Attacks", blurb: "5-4-3-2-1 senses reset." },
  { id: "r6", title: "Homesickness, honestly", kind: "podcast", minutes: 22, topic: "Loneliness", blurb: "Two former hostellers, no toxic positivity." },
  { id: "r7", title: "Study without hating yourself", kind: "article", minutes: 6, topic: "Burnout", blurb: "A gentler frame for the semester." },
  { id: "r8", title: "PDF: 7-day sleep reset", kind: "download", minutes: 0, topic: "Sleep", blurb: "Print or save to phone." },
];
