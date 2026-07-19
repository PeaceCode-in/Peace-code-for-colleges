import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { getPrefs, setPrefs, blocked, toggleBlock, BUDDIES } from "@/lib/buddies-store";
import { ArrowLeft, Bell, Lock, Globe, Ban } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/buddies/settings")({
  head: () => ({ meta: [{ title: "Peace Buddies settings" }] }),
  component: Settings,
});

function Settings() {
  const { surface, surface2, border, ink, muted, primary } = palette;
  const [prefs, setP] = useState(getPrefs());
  const [blockedList, setBlockedList] = useState(blocked());

  const update = (patch: Partial<typeof prefs>) => {
    const next = { ...prefs, ...patch }; setP(next); setPrefs(next);
  };
  const updateNotif = (key: keyof typeof prefs.notifications, val: boolean) => {
    update({ notifications: { ...prefs.notifications, [key]: val } });
  };

  const notifItems: { key: keyof typeof prefs.notifications; label: string }[] = [
    { key: "accepted", label: "Buddy accepts my request" },
    { key: "replied", label: "New reply from buddy" },
    { key: "reminders", label: "Session reminders" },
    { key: "followUp", label: "Follow-up check-ins" },
    { key: "recommendations", label: "New buddy recommendations" },
  ];

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies" className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back
        </Link>
        <h1 className="font-serif text-[clamp(1.7rem,3.5vw,2.3rem)] leading-tight mb-8" style={{ color: ink }}>Settings</h1>

        <Section icon={Lock} title="Privacy">
          <Toggle label="Anonymous chat by default" checked={prefs.anonymous} onChange={(v)=>update({ anonymous: v })}/>
          <Toggle label="Hide my real identity from buddies" checked={prefs.hideIdentity} onChange={(v)=>update({ hideIdentity: v })}/>
        </Section>

        <Section icon={Bell} title="Notifications">
          {notifItems.map((n) => <Toggle key={n.key} label={n.label} checked={prefs.notifications[n.key]} onChange={(v)=>updateNotif(n.key, v)}/>)}
        </Section>

        <Section icon={Globe} title="Language">
          <select value={prefs.language} onChange={(e)=>update({ language: e.target.value })}
            className="w-full text-[13px] px-4 py-3 rounded-2xl outline-none"
            style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
            {["English","Hindi","Tamil","Kannada","Bengali","Malayalam","Gujarati","Punjabi","Marathi","Telugu","Urdu"].map((l)=><option key={l}>{l}</option>)}
          </select>
        </Section>

        <Section icon={Ban} title="Blocked buddies">
          {blockedList.length === 0 ? <p className="text-[12px]" style={{ color: muted }}>No blocked buddies.</p> : (
            <div className="space-y-2">
              {blockedList.map((id: string) => {
                const b = BUDDIES.find(x=>x.id===id); if (!b) return null;
                return (
                  <div key={id} className="flex items-center justify-between rounded-2xl p-3" style={{ background: surface2 }}>
                    <span className="text-[13px]" style={{ color: ink }}>{b.name}</span>
                    <button onClick={()=>{ toggleBlock(id); setBlockedList(blocked()); }} className="text-[11px]" style={{ color: primary }}>unblock</button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <div className="mt-8 rounded-3xl p-5 text-center" style={{ background: surface, border: `1px solid ${border}` }}>
          <p className="text-[12px] mb-3" style={{ color: muted }}>Need to leave? Export your chat data or clear it entirely.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={()=>{ const data = localStorage.getItem("peacecode.buddies.sessions.v1"); const blob = new Blob([data ?? "[]"], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "peace-buddies-export.json"; a.click(); }}
              className="px-4 py-2 rounded-full text-[11px]" style={{ background: surface2, color: ink }}>Export data</button>
            <button onClick={()=>{ if (confirm("Delete all buddy conversations?")) { localStorage.removeItem("peacecode.buddies.sessions.v1"); alert("Cleared."); }}}
              className="px-4 py-2 rounded-full text-[11px]" style={{ background: "#fef2f2", color: "#e63946" }}>Clear all conversations</button>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  const { surface, border, ink, muted } = palette;
  return (
    <section className="rounded-3xl p-6 mb-4" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4" style={{ color: muted }}/>
        <h2 className="font-serif text-[16px]" style={{ color: ink }}>{title}</h2></div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const { surface2, primary, ink } = palette;
  return (
    <label className="flex items-center justify-between text-[13px] cursor-pointer" style={{ color: ink }}>
      <span>{label}</span>
      <button onClick={()=>onChange(!checked)} className="relative w-10 h-6 rounded-full transition" style={{ background: checked ? primary : surface2 }} type="button">
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}/>
      </button>
    </label>
  );
}
