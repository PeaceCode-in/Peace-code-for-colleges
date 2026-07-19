// Minimal placeholder auth store for PeaceCode for Colleges.
// Real auth (institution-provisioned admin accounts) will be wired via
// Lovable Cloud in a later step. For now this only tracks a local session
// stub so /auth can navigate forward without a backend.

const SESSION_KEY = "pcc.auth.session.v1";

export type AdminSession = { email: string; startedAt: number };

export function loadSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function startSession(email: string) {
  if (typeof window === "undefined") return;
  const s: AdminSession = { email: email.trim().toLowerCase(), startedAt: Date.now() };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function endSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function isInstitutionEmail(raw: string): { ok: boolean; reason?: string } {
  const email = raw.trim().toLowerCase();
  const m = email.match(/^[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})$/);
  if (!m) return { ok: false, reason: "Enter a valid email address." };
  return { ok: true };
}
