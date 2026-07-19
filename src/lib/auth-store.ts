// Institutional sign-in stub. Validates that the email belongs to a
// whitelisted partner college (src/lib/college-registry.ts). Real auth
// lands via Lovable Cloud later.
import { collegeFor, domainFor } from "./college-registry";
import { clearCollege } from "./college-context";

const SESSION_KEY = "pcc.auth.session.v1";

export type AdminSession = { email: string; startedAt: number };

export function loadSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch { return null; }
}

export function startSession(email: string) {
  if (typeof window === "undefined") return;
  const s: AdminSession = { email: email.trim().toLowerCase(), startedAt: Date.now() };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function endSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  clearCollege();
}

export function isInstitutionEmail(raw: string): { ok: boolean; reason?: string } {
  const email = raw.trim().toLowerCase();
  const d = domainFor(email);
  if (!d) return { ok: false, reason: "Enter a valid institutional email address." };
  if (!collegeFor(email)) {
    return {
      ok: false,
      reason: "This email isn't linked to a partner institution. Contact partnerships@peacecode.in.",
    };
  }
  return { ok: true };
}
