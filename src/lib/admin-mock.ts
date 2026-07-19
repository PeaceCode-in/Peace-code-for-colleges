// Mock admin/members/policies/audit store for the /admin surface.
// UI-only: no backend, no Supabase. Everything persists to localStorage so
// changes survive a reload and the audit log grows as the user interacts.
//
// When the real backend lands, replace this file with server-fn calls; the
// component contracts (types + functions) are shaped to line up.

import { useSyncExternalStore } from "react";

// ─── Roles ──────────────────────────────────────────────────────
export type AdminRole = "admin" | "viewer";

export type AdminActionKey =
  | "member.invited"
  | "member.role_changed"
  | "member.disabled"
  | "member.removed"
  | "member.reveal"
  | "policy.updated"
  | "policy.domain_added"
  | "policy.domain_removed"
  | "report.generated"
  | "report.exported"
  | "session.revoked_all"
  | "audit.export";

export type MemberStatus = "active" | "invited" | "disabled";

export type Member = {
  id: string;
  email: string;
  role: AdminRole;
  status: MemberStatus;
  invitedBy: string;   // masked email of inviter
  invitedAt: string;   // ISO
  lastActiveAt?: string;
};

export type Policies = {
  kThreshold: number;        // locked: 10
  exports: { pdf: boolean; xlsx: boolean; csv: boolean };
  benchmarks: { peer: boolean; national: boolean };
  domains: string[];         // verified email domains for this institution
  sessionTimeoutMinutes: 15 | 30 | 60 | 240;
  defaultReportTemplate: "board-snapshot" | "term-review" | "regulator-packet";
};

export type AuditEntry = {
  id: string;
  timestampISO: string;
  actorEmail: string;        // full email (masked at render time)
  actorRole: AdminRole;
  action: AdminActionKey;
  target: string;            // e.g. "member:<id>", "policy:exports.csv", "report:board-snapshot"
  result: "ok" | "denied";
  ipHash: string;            // 8-char pseudo hash
  meta?: Record<string, string | number | boolean>;
};

// ─── Persistence ────────────────────────────────────────────────
const LS_KEY = "pc.admin.state.v1";
const K_MEMBERS = "members";
const K_POLICIES = "policies";
const K_AUDIT = "audit";

type State = {
  currentUserEmail: string;
  currentUserRole: AdminRole;
  members: Member[];
  policies: Policies;
  audit: AuditEntry[];
};

function seedIpHash(seed: string) {
  // Not cryptographic — a stable 8-char string per seed. Enough for a mock.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}

function isoDaysAgo(days: number, hourJitter = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9 + hourJitter, 24, 0, 0);
  return d.toISOString();
}

function defaultState(): State {
  const currentUserEmail = "priya.menon@iitb.ac.in";
  const members: Member[] = [
    { id: "m1", email: currentUserEmail, role: "admin", status: "active", invitedBy: "system", invitedAt: isoDaysAgo(180), lastActiveAt: isoDaysAgo(0, 1) },
    { id: "m2", email: "arjun.rao@iitb.ac.in",     role: "admin",  status: "active",   invitedBy: currentUserEmail, invitedAt: isoDaysAgo(120), lastActiveAt: isoDaysAgo(1, -2) },
    { id: "m3", email: "s.iyer@iitb.ac.in",        role: "viewer", status: "active",   invitedBy: currentUserEmail, invitedAt: isoDaysAgo(96),  lastActiveAt: isoDaysAgo(3, 0) },
    { id: "m4", email: "kabir.deshpande@iitb.ac.in", role: "viewer", status: "active", invitedBy: "arjun.rao@iitb.ac.in", invitedAt: isoDaysAgo(72),  lastActiveAt: isoDaysAgo(8, -1) },
    { id: "m5", email: "meera.pillai@iitb.ac.in",   role: "viewer", status: "invited",  invitedBy: currentUserEmail, invitedAt: isoDaysAgo(4) },
    { id: "m6", email: "r.narayan@iitb.ac.in",      role: "admin",  status: "disabled", invitedBy: "system",         invitedAt: isoDaysAgo(220), lastActiveAt: isoDaysAgo(46, 0) },
  ];
  const policies: Policies = {
    kThreshold: 10,
    exports: { pdf: true, xlsx: true, csv: true },
    benchmarks: { peer: true, national: true },
    domains: ["iitb.ac.in"],
    sessionTimeoutMinutes: 60,
    defaultReportTemplate: "board-snapshot",
  };
  const audit: AuditEntry[] = seedAudit(currentUserEmail);
  return { currentUserEmail, currentUserRole: "admin", members, policies, audit };
}

function seedAudit(actor: string): AuditEntry[] {
  const rows: Omit<AuditEntry, "id" | "ipHash">[] = [
    { timestampISO: isoDaysAgo(0, 1),  actorEmail: actor,                  actorRole: "admin",  action: "report.generated", target: "report:board-snapshot",  result: "ok" },
    { timestampISO: isoDaysAgo(0, -1), actorEmail: "arjun.rao@iitb.ac.in", actorRole: "admin",  action: "policy.updated",    target: "policy:sessionTimeout", result: "ok", meta: { to: 60 } },
    { timestampISO: isoDaysAgo(1, 0),  actorEmail: actor,                  actorRole: "admin",  action: "member.invited",    target: "member:m5",             result: "ok" },
    { timestampISO: isoDaysAgo(2, -2), actorEmail: "s.iyer@iitb.ac.in",    actorRole: "viewer", action: "report.exported",   target: "report:term-review",    result: "ok", meta: { format: "pdf" } },
    { timestampISO: isoDaysAgo(3, 1),  actorEmail: actor,                  actorRole: "admin",  action: "member.role_changed", target: "member:m3",           result: "ok", meta: { from: "admin", to: "viewer" } },
    { timestampISO: isoDaysAgo(4, 0),  actorEmail: "arjun.rao@iitb.ac.in", actorRole: "admin",  action: "audit.export",      target: "audit:filtered",         result: "ok", meta: { rows: 128 } },
    { timestampISO: isoDaysAgo(5, -1), actorEmail: actor,                  actorRole: "admin",  action: "policy.domain_added", target: "policy:domains",       result: "ok", meta: { domain: "iitb.ac.in" } },
    { timestampISO: isoDaysAgo(6, 2),  actorEmail: "kabir.deshpande@iitb.ac.in", actorRole: "viewer", action: "report.exported", target: "report:board-snapshot", result: "denied", meta: { reason: "viewer role" } },
    { timestampISO: isoDaysAgo(8, 0),  actorEmail: actor,                  actorRole: "admin",  action: "member.disabled",   target: "member:m6",              result: "ok" },
    { timestampISO: isoDaysAgo(11, 1), actorEmail: "arjun.rao@iitb.ac.in", actorRole: "admin",  action: "session.revoked_all", target: "institution:iitb",     result: "ok" },
    { timestampISO: isoDaysAgo(14, 0), actorEmail: actor,                  actorRole: "admin",  action: "member.reveal",     target: "member:m3",              result: "ok" },
    { timestampISO: isoDaysAgo(18, -2),actorEmail: actor,                  actorRole: "admin",  action: "policy.updated",    target: "policy:exports.csv",    result: "ok", meta: { to: true } },
    { timestampISO: isoDaysAgo(22, 1), actorEmail: "arjun.rao@iitb.ac.in", actorRole: "admin",  action: "report.generated",  target: "report:regulator-packet", result: "ok" },
    { timestampISO: isoDaysAgo(26, -1),actorEmail: actor,                  actorRole: "admin",  action: "member.invited",    target: "member:m4",              result: "ok" },
    { timestampISO: isoDaysAgo(31, 0), actorEmail: actor,                  actorRole: "admin",  action: "policy.updated",    target: "policy:benchmarks.national", result: "ok", meta: { to: true } },
  ];
  return rows.map((r, i) => ({
    id: `a${Date.now()}-${i}`,
    ipHash: seedIpHash(r.actorEmail + r.timestampISO),
    ...r,
  }));
}

// ─── Store ──────────────────────────────────────────────────────
let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) {
      const s = defaultState();
      window.localStorage.setItem(LS_KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as Partial<State>;
    const base = defaultState();
    return {
      currentUserEmail: parsed.currentUserEmail ?? base.currentUserEmail,
      currentUserRole: parsed.currentUserRole ?? base.currentUserRole,
      members: parsed.members ?? base.members,
      policies: { ...base.policies, ...(parsed.policies ?? {}) },
      audit: parsed.audit ?? base.audit,
    };
  } catch { return defaultState(); }
}

function persist() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function notify() {
  for (const l of listeners) l();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// ─── Selectors ──────────────────────────────────────────────────
export function useAdminState<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => sel(state),
    () => sel(state),
  );
}

export function useCurrentRole(): AdminRole {
  return useAdminState((s) => s.currentUserRole);
}

export function useCurrentEmail(): string {
  return useAdminState((s) => s.currentUserEmail);
}

// ─── Audit helper (client-side; simulates server writeAudit) ────
export function writeAudit(entry: Omit<AuditEntry, "id" | "timestampISO" | "actorEmail" | "actorRole" | "ipHash">) {
  const stamp = new Date().toISOString();
  const row: AuditEntry = {
    id: `a${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestampISO: stamp,
    actorEmail: state.currentUserEmail,
    actorRole: state.currentUserRole,
    ipHash: seedIpHash(state.currentUserEmail + stamp),
    ...entry,
  };
  state = { ...state, audit: [row, ...state.audit] };
  persist(); notify();
  return row;
}

// ─── Mutations ──────────────────────────────────────────────────
export function inviteMember(input: { email: string; role: AdminRole; note?: string }) {
  const domain = input.email.split("@")[1]?.toLowerCase() ?? "";
  if (!state.policies.domains.includes(domain)) {
    writeAudit({ action: "member.invited", target: `pending:${input.email}`, result: "denied", meta: { reason: "domain not verified" } });
    throw new Error(`Domain @${domain} is not verified for this institution.`);
  }
  if (state.members.some((m) => m.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("A member with that email already exists.");
  }
  const id = `m${Date.now()}`;
  const member: Member = {
    id,
    email: input.email,
    role: input.role,
    status: "invited",
    invitedBy: state.currentUserEmail,
    invitedAt: new Date().toISOString(),
  };
  state = { ...state, members: [...state.members, member] };
  persist(); notify();
  writeAudit({ action: "member.invited", target: `member:${id}`, result: "ok", meta: { role: input.role } });
  return member;
}

export function changeMemberRole(id: string, role: AdminRole) {
  const before = state.members.find((m) => m.id === id);
  if (!before) return;
  state = { ...state, members: state.members.map((m) => m.id === id ? { ...m, role } : m) };
  persist(); notify();
  writeAudit({ action: "member.role_changed", target: `member:${id}`, result: "ok", meta: { from: before.role, to: role } });
}

export function setMemberStatus(id: string, status: MemberStatus) {
  const before = state.members.find((m) => m.id === id);
  if (!before) return;
  state = { ...state, members: state.members.map((m) => m.id === id ? { ...m, status } : m) };
  persist(); notify();
  if (status === "disabled") writeAudit({ action: "member.disabled", target: `member:${id}`, result: "ok" });
}

export function removeMember(id: string) {
  state = { ...state, members: state.members.filter((m) => m.id !== id) };
  persist(); notify();
  writeAudit({ action: "member.removed", target: `member:${id}`, result: "ok" });
}

export function revealMember(id: string) {
  writeAudit({ action: "member.reveal", target: `member:${id}`, result: "ok" });
}

export function updatePolicy<K extends keyof Policies>(key: K, value: Policies[K]) {
  if (key === "kThreshold") return; // locked
  state = { ...state, policies: { ...state.policies, [key]: value } };
  persist(); notify();
  writeAudit({ action: "policy.updated", target: `policy:${String(key)}`, result: "ok", meta: { to: JSON.stringify(value) } });
}

export function updateExportPolicy(fmt: keyof Policies["exports"], enabled: boolean) {
  state = { ...state, policies: { ...state.policies, exports: { ...state.policies.exports, [fmt]: enabled } } };
  persist(); notify();
  writeAudit({ action: "policy.updated", target: `policy:exports.${fmt}`, result: "ok", meta: { to: enabled } });
}

export function updateBenchmarkPolicy(kind: keyof Policies["benchmarks"], enabled: boolean) {
  state = { ...state, policies: { ...state.policies, benchmarks: { ...state.policies.benchmarks, [kind]: enabled } } };
  persist(); notify();
  writeAudit({ action: "policy.updated", target: `policy:benchmarks.${kind}`, result: "ok", meta: { to: enabled } });
}

export function addDomain(domain: string) {
  const clean = domain.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) throw new Error("Not a valid DNS-safe domain.");
  if (state.policies.domains.includes(clean)) return;
  state = { ...state, policies: { ...state.policies, domains: [...state.policies.domains, clean] } };
  persist(); notify();
  writeAudit({ action: "policy.domain_added", target: `policy:domains`, result: "ok", meta: { domain: clean } });
}

export function removeDomain(domain: string) {
  state = { ...state, policies: { ...state.policies, domains: state.policies.domains.filter((d) => d !== domain) } };
  persist(); notify();
  writeAudit({ action: "policy.domain_removed", target: `policy:domains`, result: "ok", meta: { domain } });
}

export function revokeAllSessions() {
  writeAudit({ action: "session.revoked_all", target: "institution:iitb", result: "ok" });
}

export function switchRoleForDemo(role: AdminRole) {
  state = { ...state, currentUserRole: role };
  persist(); notify();
}

// ─── Metrics (Overview) ─────────────────────────────────────────
export function overviewMetrics() {
  const activeAdmins = state.members.filter((m) => m.status === "active" && m.role === "admin").length;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30 = state.audit.filter((a) => new Date(a.timestampISO).getTime() >= cutoff);
  const exports30 = last30.filter((a) => a.action === "report.exported");
  const exportsOk = exports30.filter((a) => a.result === "ok").length;
  const exportSuccessRate = exports30.length ? Math.round((exportsOk / exports30.length) * 100) : 100;
  const failedLogins = 3; // aggregate mock
  const lastAggregation = new Date();
  lastAggregation.setHours(lastAggregation.getHours() - 4);
  return {
    activeAdmins,
    activeAdmins30d: state.members.filter((m) => m.status === "active" && m.lastActiveAt && new Date(m.lastActiveAt).getTime() >= cutoff).length,
    exportSuccessRate,
    failedLogins,
    lastAggregationISO: lastAggregation.toISOString(),
  };
}
