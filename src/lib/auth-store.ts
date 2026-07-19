// Local-first mock auth for PeaceCode. Backend can replace these later.

const USERS_KEY = "pc.auth.users.v1";
const SESSION_KEY = "pc.auth.session.v1";
const DRAFT_KEY = "pc.auth.signup-draft.v1";

export type StudentUser = {
  email: string;              // college email (lowercased)
  passwordHash: string;       // simple hash — NOT for production
  fullName: string;
  studentId: string;
  college: string;
  course: string;
  year: string;
  concern?: string;           // primary reason for joining
  createdAt: number;
};

export type Session = { email: string; startedAt: number };

export type SignupDraft = Partial<Omit<StudentUser, "passwordHash" | "createdAt">> & { password?: string };

// Personal email providers — reject these; require a college domain.
const PERSONAL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.in", "yahoo.co.in",
  "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com",
  "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me",
  "rediffmail.com", "zoho.com", "yandex.com", "gmx.com", "mail.com",
  "duck.com", "fastmail.com", "tutanota.com",
]);

export function isCollegeEmail(raw: string): { ok: boolean; reason?: string } {
  const email = raw.trim().toLowerCase();
  const m = email.match(/^[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})$/);
  if (!m) return { ok: false, reason: "Enter a valid email address." };
  const domain = m[1];
  if (PERSONAL_DOMAINS.has(domain)) return { ok: false, reason: "Please use your college email — not a personal one." };
  const looksAcademic = /\.(edu|edu\.[a-z]{2,})$/.test(domain)
    || /\.ac\.[a-z]{2,}$/.test(domain)
    || /(^|\.)(iit|nit|iim|iiit|bits|srm|vit|manipal|amity|jamia|ignou|du|jnu)\./.test(domain)
    || domain.endsWith(".ac.in") || domain.endsWith(".edu.in");
  if (!looksAcademic) return { ok: false, reason: "This doesn't look like a college email. Try your university address." };
  return { ok: true };
}

// tiny non-cryptographic hash — good enough for a demo, not for real auth
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return "h_" + (h >>> 0).toString(36);
}

const readJSON = <T,>(k: string, fb: T): T => {
  if (typeof window === "undefined") return fb;
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) as T : fb; } catch { return fb; }
};
const writeJSON = (k: string, v: unknown) => { if (typeof window !== "undefined") localStorage.setItem(k, JSON.stringify(v)); };

export function loadUsers(): Record<string, StudentUser> { return readJSON(USERS_KEY, {}); }
export function findUser(email: string): StudentUser | null {
  return loadUsers()[email.trim().toLowerCase()] ?? null;
}
export function isRegistered(email: string): boolean { return !!findUser(email); }

export function createUser(u: Omit<StudentUser, "passwordHash" | "createdAt"> & { password: string }): StudentUser {
  const users = loadUsers();
  const email = u.email.trim().toLowerCase();
  const record: StudentUser = {
    email,
    passwordHash: hash(u.password),
    fullName: u.fullName,
    studentId: u.studentId,
    college: u.college,
    course: u.course,
    year: u.year,
    concern: u.concern,
    createdAt: Date.now(),
  };
  users[email] = record;
  writeJSON(USERS_KEY, users);
  return record;
}

export function verifyPassword(email: string, password: string): boolean {
  const u = findUser(email); if (!u) return false;
  return u.passwordHash === hash(password);
}

export function startSession(email: string): void {
  writeJSON(SESSION_KEY, { email: email.trim().toLowerCase(), startedAt: Date.now() } satisfies Session);
}
export function loadSession(): Session | null { return readJSON<Session | null>(SESSION_KEY, null); }
export function endSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("pc.auth.guest");
  }
}

/** Current signed-in student's display name, or a graceful guest fallback. */
export function currentDisplayName(): { full: string; first: string; isGuest: boolean } {
  const s = loadSession();
  if (s) {
    const u = findUser(s.email);
    const full = (u?.fullName ?? "").trim();
    if (full) return { full, first: full.split(/\s+/)[0], isGuest: false };
  }
  return { full: "Guest Student", first: "Guest", isGuest: true };
}

export function loadDraft(): SignupDraft { return readJSON<SignupDraft>(DRAFT_KEY, {}); }
export function saveDraft(d: SignupDraft): void { writeJSON(DRAFT_KEY, d); }
export function clearDraft(): void { if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY); }
