import { useMemo, useState } from "react";
import { GlassCard } from "@/components/college/primitives";
import { MaskedEmail } from "@/components/primitives/MaskedEmail";
import { RoleBadge } from "./RoleBadge";
import { StatusBadge } from "./StatusBadge";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  changeMemberRole, removeMember, revealMember, setMemberStatus,
  useAdminState, useCurrentRole,
  type AdminRole, type Member, type MemberStatus,
} from "@/lib/admin-mock";
import { MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";

type Pending =
  | { kind: "role"; member: Member; toRole: AdminRole }
  | { kind: "status"; member: Member; toStatus: MemberStatus }
  | { kind: "remove"; member: Member }
  | null;

function relativeDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function MembersTable() {
  const members = useAdminState((s) => s.members);
  const role = useCurrentRole();
  const readonly = role !== "admin";
  const [q, setQ] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((m) => m.email.toLowerCase().includes(needle) || m.role.includes(needle) || m.status.includes(needle));
  }, [members, q]);

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--pc-border)" }}>
        <div className="min-w-0">
          <div className="text-[11px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>Members</div>
          <div className="mt-1 text-[13px]" style={{ color: "var(--pc-ink-2)" }}>
            {members.length} admins &amp; viewers at your institution
          </div>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--pc-muted)" }} />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search members…"
            className="pl-7 pr-3 py-1.5 rounded-full text-[12.5px] outline-none"
            style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)", minWidth: 220 }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">Institutional members</caption>
          <thead>
            <tr style={{ background: "var(--pc-surface2)" }}>
              {["Member", "Role", "Status", "Invited by", "Added", "Last active", ""].map((h) => (
                <th key={h} className="text-[10.5px] uppercase px-4 py-2.5 font-normal"
                    style={{ letterSpacing: "0.12em", color: "var(--pc-muted)", borderBottom: "1px solid var(--pc-border)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--pc-muted)" }}>
                  No members match "{q}".
                </td>
              </tr>
            )}
            {rows.map((m) => (
              <tr key={m.id} className="group" style={{ borderBottom: "1px solid var(--pc-border)" }}>
                <td className="px-4 py-3">
                  <MaskedEmail email={m.email} allowReveal onReveal={() => revealMember(m.id)} />
                </td>
                <td className="px-4 py-3"><RoleBadge role={m.role} /></td>
                <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                <td className="px-4 py-3">
                  {m.invitedBy === "system"
                    ? <span className="text-[12px]" style={{ color: "var(--pc-muted)" }}>System</span>
                    : <MaskedEmail email={m.invitedBy} />}
                </td>
                <td className="px-4 py-3 text-[12.5px]" style={{ color: "var(--pc-ink-2)" }}>{relativeDate(m.invitedAt)}</td>
                <td className="px-4 py-3 text-[12.5px]" style={{ color: "var(--pc-ink-2)" }}>{relativeDate(m.lastActiveAt)}</td>
                <td className="px-4 py-3 text-right relative">
                  {!readonly && (
                    <>
                      <button
                        onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                        className="p-1 rounded-md hover:bg-[color:var(--pc-surface2)]"
                        aria-label="Row actions"
                      >
                        <MoreHorizontal className="w-4 h-4" style={{ color: "var(--pc-muted)" }} />
                      </button>
                      {openMenu === m.id && (
                        <div
                          className="absolute right-4 top-10 z-10 min-w-[180px] rounded-lg p-1 text-[12.5px]"
                          style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", boxShadow: "0 14px 30px -18px color-mix(in oklab, var(--pc-ink) 30%, transparent)" }}
                          onMouseLeave={() => setOpenMenu(null)}
                        >
                          {m.role !== "admin" && (
                            <MenuItem onClick={() => { setPending({ kind: "role", member: m, toRole: "admin" }); setOpenMenu(null); }}>
                              Change role → Admin
                            </MenuItem>
                          )}
                          {m.role !== "viewer" && (
                            <MenuItem onClick={() => { setPending({ kind: "role", member: m, toRole: "viewer" }); setOpenMenu(null); }}>
                              Change role → Viewer
                            </MenuItem>
                          )}
                          {m.status !== "disabled" && (
                            <MenuItem onClick={() => { setPending({ kind: "status", member: m, toStatus: "disabled" }); setOpenMenu(null); }}>
                              Disable access
                            </MenuItem>
                          )}
                          {m.status === "disabled" && (
                            <MenuItem onClick={() => { setPending({ kind: "status", member: m, toStatus: "active" }); setOpenMenu(null); }}>
                              Re-enable access
                            </MenuItem>
                          )}
                          <MenuItem danger onClick={() => { setPending({ kind: "remove", member: m }); setOpenMenu(null); }}>
                            Remove from institution
                          </MenuItem>
                        </div>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pending?.kind === "role"}
        title="Change role"
        description={
          pending?.kind === "role"
            ? <>Set <MaskedEmail email={pending.member.email} /> to <strong>{pending.toRole}</strong>. This writes an audit entry.</>
            : null
        }
        confirmLabel="Change role"
        onConfirm={() => {
          if (pending?.kind === "role") {
            changeMemberRole(pending.member.id, pending.toRole);
            toast.success(`Role updated for ${maskShort(pending.member.email)}`);
          }
        }}
        onClose={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === "status"}
        title={pending?.kind === "status" && pending.toStatus === "disabled" ? "Disable member" : "Re-enable member"}
        danger={pending?.kind === "status" && pending.toStatus === "disabled"}
        description={
          pending?.kind === "status"
            ? <>This will {pending.toStatus === "disabled" ? "revoke sign-in for" : "restore sign-in for"} <MaskedEmail email={pending.member.email} />. The change is audited.</>
            : null
        }
        confirmLabel={pending?.kind === "status" && pending.toStatus === "disabled" ? "Disable" : "Re-enable"}
        onConfirm={() => {
          if (pending?.kind === "status") {
            setMemberStatus(pending.member.id, pending.toStatus);
            toast.success(`Member ${pending.toStatus === "disabled" ? "disabled" : "re-enabled"}`);
          }
        }}
        onClose={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === "remove"}
        danger
        title="Remove member"
        typeToConfirm="REMOVE"
        description={
          pending?.kind === "remove"
            ? <>Permanently removes <MaskedEmail email={pending.member.email} /> from the institution roster. They will need a new invite to return.</>
            : null
        }
        confirmLabel="Remove"
        onConfirm={() => {
          if (pending?.kind === "remove") {
            removeMember(pending.member.id);
            toast.success("Member removed");
          }
        }}
        onClose={() => setPending(null)}
      />
    </GlassCard>
  );
}

function maskShort(email: string) {
  const [l, d] = email.split("@");
  return `${l[0]}**@${d}`;
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 rounded-md hover:bg-[color:var(--pc-surface2)]"
      style={{ color: danger ? "var(--pc-warn)" : "var(--pc-ink)" }}
    >
      {children}
    </button>
  );
}
