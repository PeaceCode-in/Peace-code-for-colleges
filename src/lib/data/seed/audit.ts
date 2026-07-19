import { mulberry32, rPick, SEED_ROOT, SEED_TODAY } from "./rng";

const TODAY = new Date(SEED_TODAY + "T00:00:00Z");
const ACTIONS = [
  "member.invited", "member.role_changed", "member.removed", "member.reveal",
  "report.generated", "report.exported", "policy.updated", "policy.domain_added",
  "session.revoked_all", "login.success", "login.failed", "audit.export",
] as const;

const ACTORS = [
  "an•••@iitb.ac.in", "ka•••@iitb.ac.in", "pr•••@iitb.ac.in",
  "sh•••@iitb.ac.in", "ra•••@iitb.ac.in",
] as const;

export function seedAudit(): Array<{
  id: string;
  timestampISO: string;
  actorRole: "admin" | "viewer";
  actorEmail: string;
  action: string;
  target?: string;
  ipHash?: string;
}> {
  const rand = mulberry32(SEED_ROOT ^ 0xAD);
  const out: Array<{
    id: string;
    timestampISO: string;
    actorRole: "admin" | "viewer";
    actorEmail: string;
    action: string;
    target?: string;
    ipHash?: string;
  }> = [];
  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(rand() * 90);
    const hoursAgo = Math.floor(rand() * 24);
    const d = new Date(TODAY);
    d.setUTCDate(d.getUTCDate() - daysAgo);
    d.setUTCHours(d.getUTCHours() - hoursAgo);
    out.push({
      id: `aud-${i + 1}`,
      timestampISO: d.toISOString(),
      actorRole: rand() > 0.15 ? "admin" : "viewer",
      actorEmail: rPick(rand, ACTORS),
      action: rPick(rand, ACTIONS),
      target: rand() > 0.5 ? `mem-${Math.floor(rand() * 12) + 1}` : undefined,
      ipHash: `hash-${Math.floor(rand() * 1e6).toString(16)}`,
    });
  }
  return out.sort((a, b) => b.timestampISO.localeCompare(a.timestampISO));
}
