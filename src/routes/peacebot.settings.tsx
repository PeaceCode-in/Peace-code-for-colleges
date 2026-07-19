import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Trash2, ShieldCheck, Bell } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import { loadPrefs, savePrefs, loadConvs, saveConvs, loadMems, saveMems, type Prefs } from "@/lib/peacebot-store";

export const Route = createFileRoute("/peacebot/settings")({
  head: () => ({ meta: [{ title: "Peace Bot · settings" }] }),
  component: SettingsPage,
});
const { surface, surface2, border, ink, muted, soft } = palette;

function SettingsPage() {
  const nav = useNavigate();
  const [p, setP] = useState<Prefs | null>(null);
  useEffect(() => setP(loadPrefs()), []);
  if (!p) return null;

  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => { const n = { ...p, [k]: v }; setP(n); savePrefs(n); };
  const setNotif = (k: keyof Prefs["notifs"]) => set("notifs", { ...p.notifs, [k]: !p.notifs[k] });

  const exportAll = () => {
    const data = { conversations: loadConvs(), memories: loadMems(), prefs: p, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `peacebot-export-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const clearConvs = () => { if (confirm("delete all conversations? this can't be undone.")) saveConvs([]); };
  const clearMems  = () => { if (confirm("clear all memories? peace will forget everything.")) saveMems([]); };

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/peacebot" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><ArrowLeft className="w-4 h-4"/></Link>
          <div>
            <div className="text-[10px] tracking-[0.35em] uppercase opacity-50">peace bot</div>
            <h1 className="font-serif text-[36px] leading-tight">ai settings</h1>
            <p className="text-[13px] mt-1" style={{ color: muted }}>memory, privacy, notifications, data.</p>
          </div>
        </div>

        <Panel title="notifications" icon={Bell}>
          {(Object.keys(p.notifs) as (keyof Prefs["notifs"])[]).map((k) => (
            <label key={k} className="flex items-center justify-between py-2.5 border-b last:border-0 text-[13px]" style={{ borderColor: border }}>
              <span className="capitalize" style={{ color: ink }}>{k} check-in</span>
              <input type="checkbox" checked={p.notifs[k]} onChange={() => setNotif(k)}/>
            </label>
          ))}
        </Panel>

        <Panel title="privacy" icon={ShieldCheck}>
          <div className="text-[13px]" style={{ color: muted }}>your conversations, memories, and prefs live only in this browser. peace calls the model to reply — it doesn't store history on our side.</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={exportAll} className="px-4 h-10 rounded-full text-[12px] flex items-center gap-2" style={{ background: ink, color: "var(--pc-bg)" }}><Download className="w-3.5 h-3.5"/> export all data</button>
            <button onClick={() => nav({ to: "/peacebot/memory" })} className="px-4 h-10 rounded-full text-[12px]" style={{ background: surface2, border: `1px solid ${border}` }}>manage memories</button>
          </div>
        </Panel>

        <Panel title="danger zone" icon={Trash2}>
          <div className="flex flex-wrap gap-2">
            <button onClick={clearConvs} className="px-4 h-10 rounded-full text-[12px]" style={{ background: "#c33", color: "#fff" }}>delete all conversations</button>
            <button onClick={clearMems} className="px-4 h-10 rounded-full text-[12px]" style={{ background: "#c33", color: "#fff" }}>clear memory</button>
          </div>
          <div className="mt-3 text-[11px]" style={{ color: muted }}>this can't be undone. export first if you want a copy.</div>
        </Panel>

        <div className="rounded-2xl p-5 text-[12px]" style={{ background: soft, color: ink }}>
          you can change tone, length, and voice anytime in <Link to="/peacebot/avatar" className="underline">avatar & style</Link>.
        </div>
      </main>
    </AppShell>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="p-5 rounded-2xl" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-2 mb-3"><Icon className="w-3.5 h-3.5 opacity-60"/><span className="text-[10px] tracking-[0.3em] uppercase opacity-60">{title}</span></div>
      {children}
    </section>
  );
}
