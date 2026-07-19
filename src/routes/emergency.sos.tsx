import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page, BackBar, PageTitle, Card, TextArea, Chip } from "@/components/emergency/primitives";
import { loadContacts, loadSettings, saveSettings, logEvent, DEFAULT_SOS, type Contact } from "@/lib/emergency-store";
import { palette } from "@/components/AppShell";
import { MessageSquare, Mail, RotateCcw, Check } from "lucide-react";

const { border, muted, ink, surface2, primary, soft } = palette;

function SOSPage() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const s = loadSettings();
    setMsg(s.sosMessage || DEFAULT_SOS);
    const list = loadContacts();
    setContacts(list);
    const def = list.find((c) => c.isDefault);
    setSelectedIds(def ? [def.id] : list.slice(0, 1).map((c) => c.id));
  }, []);

  const toggle = (id: string) => setSelectedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const send = (kind: "sms" | "email") => {
    const targets = contacts.filter((c) => selectedIds.includes(c.id));
    if (targets.length === 0) return;
    try {
      const s = loadSettings();
      saveSettings({ ...s, sosMessage: msg });
      logEvent({ actions: [`Sent SOS via ${kind}`], contactsCalled: targets.map((t) => t.id), outcome: "supported" });
    } catch {}
    // Open the default mail/sms client with prefilled body & recipients.
    if (kind === "sms") {
      const numbers = targets.map((t) => t.phone?.replace(/\s/g, "") ?? "").filter(Boolean).join(",");
      window.location.href = `sms:${numbers}?&body=${encodeURIComponent(msg)}`;
    } else {
      const emails = targets.map((t) => t.email ?? "").filter(Boolean).join(",");
      window.location.href = `mailto:${emails}?subject=${encodeURIComponent("Checking in — I need you")}&body=${encodeURIComponent(msg)}`;
    }
    setTimeout(() => navigate({ to: "/emergency/confirm", search: { from: "sos" } }), 250);
  };

  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Emergency message" title="One tap. One kind sentence." sub="Edit it if you'd like. It won't be sent until you tap a button below." />

      <Card>
        <div className="text-[10.5px] tracking-[0.22em] uppercase mb-2" style={{ color: muted }}>The message</div>
        <TextArea rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} />
        <div className="flex justify-end mt-2">
          <button onClick={() => setMsg(DEFAULT_SOS)} className="text-[11px] inline-flex items-center gap-1" style={{ color: muted }}>
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="text-[10.5px] tracking-[0.22em] uppercase mt-6 mb-3" style={{ color: muted }}>Send to</div>
        {contacts.length === 0 ? (
          <div className="text-[13px]" style={{ color: muted }}>
            No trusted contacts yet. <Link to="/emergency/contacts" style={{ color: primary }}>Add one first</Link>.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {contacts.map((c) => {
              const on = selectedIds.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggle(c.id)} className="rounded-full h-9 px-3.5 text-[11.5px] flex items-center gap-1.5"
                  style={{ background: on ? soft : surface2, color: on ? primary : muted, border: `1px solid ${on ? primary : border}` }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "var(--pc-surface)", color: ink }}>{(c.initials || c.name[0] || "?").toUpperCase()}</span>
                  {c.name} {c.isDefault && <Chip tone="warm">default</Chip>}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-6">
          <button onClick={() => send("sms")} disabled={selectedIds.length === 0} className="rounded-full h-11 px-5 text-[12.5px] flex items-center gap-2 disabled:opacity-50" style={{ background: ink, color: "var(--pc-bg)" }}>
            <MessageSquare className="w-3.5 h-3.5" /> Send as SMS
          </button>
          <button onClick={() => send("email")} disabled={selectedIds.length === 0} className="rounded-full h-11 px-5 text-[12.5px] flex items-center gap-2" style={{ background: surface2, border: `1px solid ${border}` }}>
            <Mail className="w-3.5 h-3.5" /> Send as Email
          </button>
          <Link to="/emergency/confirm" search={{ from: "sos" }} className="rounded-full h-11 px-5 text-[12.5px] flex items-center gap-2" style={{ background: surface2, border: `1px solid ${border}` }}>
            <Check className="w-3.5 h-3.5" /> I've told someone another way
          </Link>
        </div>
      </Card>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/sos")({
  validateSearch: (s: Record<string, unknown>) => ({ from: typeof s.from === "string" ? s.from : undefined }),
  component: SOSPage,
});
