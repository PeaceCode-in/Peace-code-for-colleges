import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, palette } from "@/components/AppShell";
import { ArrowLeft, Trash2, Download, Bell, Moon, Languages, Save } from "lucide-react";
import { loadPrefs, savePrefs, loadSessions, saveSessions } from "@/lib/screening-store";

export const Route = createFileRoute("/screening/settings")({
  head: () => ({ meta: [{ title: "Settings — PeaceCode Screening" }] }),
  component: SettingsPage,
});

const { surface, surface2, border, ink, muted, primary } = palette;

function SettingsPage() {
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const [saved, setSaved] = useState(false);
  const nav = useNavigate();

  const update = <K extends keyof typeof prefs>(k: K, v: (typeof prefs)[K]) => {
    const next = { ...prefs, [k]: v }; setPrefs(next); savePrefs(next);
    setSaved(true); setTimeout(() => setSaved(false), 800);
  };
  const updateReminder = (k: keyof typeof prefs.reminders, v: boolean) => update("reminders", { ...prefs.reminders, [k]: v });

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ prefs, sessions: loadSessions() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `peacecode-screening-backup.json`; a.click(); URL.revokeObjectURL(url);
  };
  const deleteAll = () => {
    if (!confirm("Delete every screening result and setting? This can't be undone.")) return;
    saveSessions([]);
    savePrefs({ bookmarks: [], reminders: { monthly: true, incomplete: true, milestones: true }, autosave: true, darkMode: false, language: "en" });
    nav({ to: "/screening" });
  };

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
        <nav className="text-[11px] tracking-[0.2em] uppercase mb-6 flex items-center gap-2" style={{ color: muted }}>
          <Link to="/screening" className="hover:underline">Screening</Link><span>·</span><span style={{ color: ink }}>Settings</span>
        </nav>

        <div className="flex items-end justify-between mb-6">
          <h1 className="font-serif text-3xl">Settings</h1>
          {saved && <span className="text-[11px] inline-flex items-center gap-1" style={{ color: primary }}><Save className="w-3 h-3" /> saved</span>}
        </div>

        <Section title="Reminders" icon={<Bell className="w-4 h-4" />}>
          <Toggle label="Monthly retake nudge" checked={prefs.reminders.monthly} onChange={(v) => updateReminder("monthly", v)} />
          <Toggle label="Nudge if I leave something incomplete" checked={prefs.reminders.incomplete} onChange={(v) => updateReminder("incomplete", v)} />
          <Toggle label="Celebrate wellness milestones" checked={prefs.reminders.milestones} onChange={(v) => updateReminder("milestones", v)} />
        </Section>

        <Section title="Experience" icon={<Moon className="w-4 h-4" />}>
          <Toggle label="Auto-save answers" checked={prefs.autosave} onChange={(v) => update("autosave", v)} />
          <Toggle label="Prefer dark screening mode" checked={prefs.darkMode} onChange={(v) => update("darkMode", v)} />
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 text-[13px]"><Languages className="w-3.5 h-3.5" style={{ color: primary }} /> Language</div>
            <select value={prefs.language} onChange={(e) => update("language", e.target.value as never)} className="text-[12px] px-3 py-1.5 rounded-full" style={{ background: surface2 }}>
              <option value="en">English</option>
              <option value="hi">हिन्दी (coming soon)</option>
            </select>
          </div>
        </Section>

        <Section title="Your data">
          <button onClick={exportAll} className="w-full flex items-center justify-between py-3 text-[13px]">
            <span className="inline-flex items-center gap-2"><Download className="w-3.5 h-3.5" style={{ color: primary }} /> Export all data (JSON)</span>
            <span className="text-[11px]" style={{ color: muted }}>backup</span>
          </button>
          <button onClick={deleteAll} className="w-full flex items-center justify-between py-3 text-[13px]" style={{ color: "#B54848" }}>
            <span className="inline-flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete all screening data</span>
            <span className="text-[11px]" style={{ color: muted }}>can't be undone</span>
          </button>
        </Section>

        <div className="mt-8">
          <Link to="/screening" className="text-[12px] inline-flex items-center gap-1.5" style={{ color: muted }}><ArrowLeft className="w-3.5 h-3.5" /> Back</Link>
        </div>
      </main>
    </AppShell>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-5 mb-4" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: primary }}>{icon}<span className="text-[10px] tracking-[0.3em] uppercase">{title}</span></div>
      <div className="divide-y" style={{ borderColor: border }}>{children}</div>
    </section>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <span className="text-[13px]">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        type="button"
        role="switch"
        aria-checked={checked}
        className="relative w-10 h-6 rounded-full transition"
        style={{ background: checked ? primary : "#DCE3EF" }}
      >
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }} />
      </button>
    </label>
  );
}
