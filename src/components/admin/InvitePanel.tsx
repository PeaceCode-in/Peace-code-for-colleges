import { useState } from "react";
import { GlassCard } from "@/components/college/primitives";
import { inviteMember, useAdminState, type AdminRole } from "@/lib/admin-mock";
import { X } from "lucide-react";
import { toast } from "sonner";

export function InvitePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const domains = useAdminState((s) => s.policies.domains);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("viewer");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const domainOk = domain && domains.includes(domain);

  const submit = () => {
    setErr(null);
    try {
      inviteMember({ email, role, note: note.trim() || undefined });
      toast.success(`Invite sent to ${maskShort(email)}`);
      setEmail(""); setNote(""); setRole("viewer");
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="flex-1" style={{ background: "color-mix(in oklab, var(--pc-ink) 40%, transparent)" }} onClick={onClose} />
      <aside
        className="w-[420px] max-w-full p-6 flex flex-col gap-4"
        style={{ background: "var(--pc-surface)", borderLeft: "1px solid var(--pc-border)" }}
      >
        <header className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>Admin console</div>
            <h2 className="font-serif text-[22px] mt-1" style={{ color: "var(--pc-ink)" }}>Invite a member</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md" style={{ color: "var(--pc-muted)" }}><X className="w-4 h-4" /></button>
        </header>

        <p className="text-[12.5px]" style={{ color: "var(--pc-muted)" }}>
          Invited members receive a magic-link sign-in for their institutional email. Only addresses on your verified domains can be invited.
        </p>

        <Field label="Institution email">
          <input
            type="email" autoFocus value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. r.mehta@iitb.ac.in"
            className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}
          />
          <div className="mt-1.5 text-[11px]" style={{ color: domain && !domainOk ? "var(--pc-warn)" : "var(--pc-muted)" }}>
            {!domain
              ? `Verified domains: ${domains.map((d) => "@" + d).join(", ")}`
              : domainOk ? "Domain verified." : `@${domain} is not on your institution's verified list.`}
          </div>
        </Field>

        <Field label="Role">
          <div className="flex gap-2">
            {(["viewer", "admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="flex-1 px-3 py-2 rounded-lg text-[12.5px] text-left"
                style={{
                  background: role === r ? "color-mix(in oklab, var(--pc-primary) 12%, var(--pc-surface2))" : "var(--pc-surface2)",
                  border: "1px solid " + (role === r ? "var(--pc-primary)" : "var(--pc-border)"),
                  color: role === r ? "var(--pc-primary)" : "var(--pc-ink)",
                }}
              >
                <div className="font-medium capitalize">{r}</div>
                <div className="text-[11px] opacity-70 mt-0.5">
                  {r === "admin" ? "Full access + exports + policy edits" : "Read-only, no exports"}
                </div>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Note (optional)">
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Context that will appear in the invite email."
            className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-none"
            style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}
          />
        </Field>

        {err && (
          <div className="text-[12.5px] p-3 rounded-lg"
               style={{ background: "color-mix(in oklab, var(--pc-warn) 12%, var(--pc-surface2))", color: "var(--pc-warn)", border: "1px solid var(--pc-border)" }}>
            {err}
          </div>
        )}

        <div className="mt-auto flex justify-end gap-2">
          <button onClick={onClose}
            className="px-3.5 py-1.5 rounded-full text-[12.5px]"
            style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink-2)" }}
          >Cancel</button>
          <button onClick={submit} disabled={!domainOk}
            className="px-3.5 py-1.5 rounded-full text-[12.5px] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--pc-primary)", color: "white" }}
          >Send invite</button>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase mb-1.5" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>{label}</div>
      {children}
    </label>
  );
}

function maskShort(email: string) {
  const [l, d] = email.split("@");
  return `${l[0]}**@${d}`;
}
