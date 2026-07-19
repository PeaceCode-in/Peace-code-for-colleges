// Emergency Center store — contacts, safety plan, hope box, history, settings.

export type Contact = {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  initials?: string;
  isDefault?: boolean;
  note?: string;
};

export type SafetyPlan = {
  warningSigns: string[];
  triggers: string[];
  helps: string[];
  peopleToCall: string[];         // Contact ids
  safePlaces: string[];
  reasonsToLive: string[];
  favouriteMusic: string[];
  favouritePhotos: string[];      // data URLs
  groundingActivities: string[];
  breathingFavourite?: string;    // technique key
  updatedAt: number;
};

export type HopeBoxItem = {
  id: string;
  kind: "photo" | "voice" | "letter" | "memory" | "quote" | "achievement" | "goal" | "smile" | "dream" | "video" | "music";
  title: string;
  body?: string;
  media?: string;                 // data URL
  createdAt: number;
};

export type EmergencyEvent = {
  id: string;
  ts: number;
  feeling?: string;
  actions: string[];              // e.g. "60-sec breathing", "called Mom"
  contactsCalled: string[];       // Contact ids
  outcome?: "resolved" | "supported" | "escalated";
  note?: string;
};

export type EmergencySettings = {
  defaultContactId?: string;
  sosMessage: string;
  locationSharing: boolean;
  quickLaunch: boolean;
  largeButtons: boolean;
  highContrast: boolean;
  simpleMode: boolean;
  voiceCommands: boolean;
  followUpReminders: boolean;
};

const K = {
  contacts: "peacecode.emergency.contacts.v1",
  safety: "peacecode.emergency.safetyplan.v1",
  hope: "peacecode.emergency.hopebox.v1",
  history: "peacecode.emergency.history.v1",
  settings: "peacecode.emergency.settings.v1",
  seed: "peacecode.emergency.seed.v1",
};

function read<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

export const DEFAULT_SOS =
  "I'm not feeling safe right now. Can you please contact me?";

const EMPTY_PLAN: SafetyPlan = {
  warningSigns: [], triggers: [], helps: [],
  peopleToCall: [], safePlaces: [], reasonsToLive: [],
  favouriteMusic: [], favouritePhotos: [], groundingActivities: [],
  updatedAt: 0,
};

const DEFAULT_SETTINGS: EmergencySettings = {
  sosMessage: DEFAULT_SOS,
  locationSharing: false,
  quickLaunch: true,
  largeButtons: false,
  highContrast: false,
  simpleMode: false,
  voiceCommands: false,
  followUpReminders: true,
};

export const RELATIONSHIPS = ["Mother", "Father", "Sibling", "Friend", "Guardian", "Roommate", "Teacher", "Mentor", "Partner", "Other"];

export const FEELINGS = [
  { key: "overwhelmed",  label: "I feel overwhelmed",     tone: "medium" as const },
  { key: "anxious",      label: "I'm anxious",            tone: "medium" as const },
  { key: "panicking",    label: "I'm panicking",          tone: "high" as const },
  { key: "crying",       label: "I'm crying",             tone: "medium" as const },
  { key: "cantsleep",    label: "I can't sleep",          tone: "low" as const },
  { key: "lonely",       label: "I'm lonely",             tone: "low" as const },
  { key: "stressed",     label: "I'm stressed",           tone: "low" as const },
  { key: "hopeless",     label: "I'm hopeless",           tone: "high" as const },
  { key: "unsafe",       label: "I feel unsafe",          tone: "critical" as const },
  { key: "harm",         label: "I'm having harmful thoughts", tone: "critical" as const },
  { key: "urgent",       label: "I need urgent help",     tone: "critical" as const },
];

export type FeelingKey = typeof FEELINGS[number]["key"];

// Recommend a flow based on the selected feeling.
export function recommendFor(feeling: FeelingKey): { to: string; label: string; note: string } {
  if (["urgent", "unsafe", "harm"].includes(feeling))
    return { to: "/emergency/helplines", label: "Talk to a helpline now", note: "Please reach out — a trained person is available 24×7." };
  if (feeling === "panicking")
    return { to: "/emergency/calm", label: "Start the 60-second breath", note: "We'll slow the body first, then the mind." };
  if (feeling === "hopeless")
    return { to: "/emergency/human", label: "Connect to a human", note: "Someone kind is one tap away." };
  if (["lonely"].includes(feeling))
    return { to: "/emergency/contacts", label: "Message a trusted person", note: "Even a short hello can help." };
  if (feeling === "cantsleep")
    return { to: "/breathe", label: "Try a slow breathing rhythm", note: "4-7-8 or box breathing works well tonight." };
  if (feeling === "crying")
    return { to: "/emergency/calm", label: "A gentle grounding first", note: "5-4-3-2-1 helps the body settle." };
  return { to: "/emergency/calm", label: "Open the calm toolkit", note: "Small, kind things — pick what feels right." };
}

// ─── seed helplines (India-focused, placeholders where needed) ────────
export type Helpline = {
  id: string; name: string; number: string; hours: string;
  description: string; category: "mental" | "medical" | "women" | "child" | "police" | "campus" | "hospital";
  languages?: string;
};
export const HELPLINES: Helpline[] = [
  { id: "vandrevala", name: "Vandrevala Foundation — Mental Health", number: "1860-2662-345", hours: "24×7", description: "Free, confidential mental-health helpline across India.", category: "mental", languages: "Hindi, English" },
  { id: "icall",      name: "iCall — Psychosocial Helpline",         number: "9152-987-821",  hours: "Mon–Sat 8am–10pm", description: "TISS-run counselling helpline.", category: "mental", languages: "Hindi, English, 8+ regional" },
  { id: "kiran",      name: "KIRAN National Mental Health Helpline", number: "1800-599-0019", hours: "24×7", description: "Government of India mental-health support.", category: "mental", languages: "13 languages" },
  { id: "aasra",      name: "AASRA — Suicide Prevention",            number: "9820-466-726",  hours: "24×7", description: "Confidential emotional support.", category: "mental" },
  { id: "ambulance",  name: "Ambulance",                              number: "108",           hours: "24×7", description: "Emergency medical services.", category: "medical" },
  { id: "erss",       name: "Emergency Response",                     number: "112",           hours: "24×7", description: "All-India single emergency number.", category: "medical" },
  { id: "women",      name: "Women's Helpline",                       number: "1091",          hours: "24×7", description: "Women in distress.", category: "women" },
  { id: "child",      name: "Childline",                              number: "1098",          hours: "24×7", description: "Support for children in need.", category: "child" },
  { id: "police",     name: "Police",                                 number: "100",           hours: "24×7", description: "Immediate police help.", category: "police" },
  { id: "campus",     name: "Campus Security",                        number: "—",             hours: "Ask your campus", description: "Add your campus number in Settings.", category: "campus" },
  { id: "counsellor", name: "College Counsellor",                     number: "—",             hours: "Weekday hours", description: "Add your on-campus counsellor's number.", category: "campus" },
  { id: "hospital",   name: "Nearest Hospital",                       number: "—",             hours: "24×7", description: "Save your local hospital's line.", category: "hospital" },
];

// Seed a couple of contacts so the module never feels empty.
function seedIfNeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(K.seed)) return;
  const seed: Contact[] = [
    { id: "c_1", name: "Mom",   relationship: "Mother",  phone: "+91 98••• •••••", initials: "M",  isDefault: true },
    { id: "c_2", name: "Riya",  relationship: "Friend",  phone: "+91 98••• •••••", initials: "R" },
    { id: "c_3", name: "Warden", relationship: "Guardian", phone: "+91 98••• •••••", initials: "W" },
  ];
  write(K.contacts, seed);
  const settings: EmergencySettings = { ...DEFAULT_SETTINGS, defaultContactId: "c_1" };
  write(K.settings, settings);
  try { localStorage.setItem(K.seed, "1"); } catch {}
}

// contacts
export function loadContacts(): Contact[] { seedIfNeeded(); return read<Contact[]>(K.contacts, []); }
export function saveContacts(v: Contact[]) { write(K.contacts, v); }
export function upsertContact(c: Contact) {
  const list = loadContacts();
  const i = list.findIndex((x) => x.id === c.id);
  if (i >= 0) list[i] = c; else list.push(c);
  saveContacts(list);
}
export function removeContact(id: string) { saveContacts(loadContacts().filter((c) => c.id !== id)); }
export function setDefaultContact(id: string) {
  saveContacts(loadContacts().map((c) => ({ ...c, isDefault: c.id === id })));
  const s = loadSettings(); saveSettings({ ...s, defaultContactId: id });
}

// safety plan
export function loadPlan(): SafetyPlan { seedIfNeeded(); return read<SafetyPlan>(K.safety, EMPTY_PLAN); }
export function savePlan(p: SafetyPlan) { write(K.safety, { ...p, updatedAt: Date.now() }); }

// hope box
export function loadHope(): HopeBoxItem[] { seedIfNeeded(); return read<HopeBoxItem[]>(K.hope, []); }
export function saveHope(v: HopeBoxItem[]) { write(K.hope, v); }
export function addHope(item: HopeBoxItem) { saveHope([item, ...loadHope()]); }
export function removeHope(id: string) { saveHope(loadHope().filter((h) => h.id !== id)); }

// history
export function loadHistory(): EmergencyEvent[] { seedIfNeeded(); return read<EmergencyEvent[]>(K.history, []); }
export function logEvent(e: Omit<EmergencyEvent, "id" | "ts"> & Partial<Pick<EmergencyEvent, "ts">>) {
  const item: EmergencyEvent = { id: crypto.randomUUID(), ts: Date.now(), ...e };
  write(K.history, [item, ...loadHistory()].slice(0, 200));
  return item;
}
export function clearHistory() { write(K.history, []); }

// settings
export function loadSettings(): EmergencySettings { seedIfNeeded(); return { ...DEFAULT_SETTINGS, ...read<Partial<EmergencySettings>>(K.settings, {}) }; }
export function saveSettings(s: EmergencySettings) { write(K.settings, s); }
