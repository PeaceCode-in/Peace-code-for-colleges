// Per-institution context, persisted to localStorage.
// Populated at sign-in from src/lib/college-registry.ts.
import { useEffect, useState } from "react";
import { COLLEGES, collegeFor, type College } from "./college-registry";

const KEY = "pc.college.v1";

export type CollegeSession = {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  colorAccent: string;
  role: string;
  email: string;
};

export function loadCollege(): CollegeSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CollegeSession;
    // Re-validate against the registry so a removed college can't linger.
    const found = Object.values(COLLEGES).find((c) => c.id === parsed.id);
    return found ? parsed : null;
  } catch { return null; }
}

export function setCollegeFromEmail(email: string): CollegeSession | null {
  const c = collegeFor(email);
  if (!c) return null;
  const session: CollegeSession = {
    id: c.id, name: c.name, shortName: c.shortName,
    initials: c.initials, colorAccent: c.colorAccent, role: c.role,
    email: email.trim().toLowerCase(),
  };
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("pc-college", { detail: session }));
  return session;
}

export function clearCollege() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("pc-college", { detail: null }));
}

export function useCollegeContext(): CollegeSession | null {
  const [c, setC] = useState<CollegeSession | null>(null);
  useEffect(() => {
    setC(loadCollege());
    const onSync = (e: Event) => setC((e as CustomEvent<CollegeSession | null>).detail);
    window.addEventListener("pc-college", onSync);
    return () => window.removeEventListener("pc-college", onSync);
  }, []);
  return c;
}
