import { createFileRoute, Link } from "@tanstack/react-router";
import { SettingsShell, Section, Row, Toggle, Segmented, GhostButton } from "@/components/settings/primitives";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/settings/journal")({
  head: () => ({ meta: [{ title: "Journal — Settings" }] }),
  component: JournalSettings,
});

function JournalSettings() {
  const [s, update] = useSettings();
  const j = s.journal;
  const set = <K extends keyof typeof j>(k: K, v: (typeof j)[K]) => update((x) => ({ ...x, journal: { ...x.journal, [k]: v } }), `Journal · ${String(k)}`);
  const exportJournals = () => { const raw = localStorage.getItem("peacecode.journal.entries.v1") || "[]"; const b = new Blob([raw], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "peacecode-journals.json"; a.click(); };

  return (
    <SettingsShell title="Journal" description="Your writing space, tuned to you.">
      <Section title="Writing">
        <Row label="Autosave" hint="Saves every second while you write." action={<Toggle checked={j.autosave} onChange={(v) => set("autosave", v)} />} />
        <Row label="Mood tracking" hint="Adds a mood picker to each entry." action={<Toggle checked={j.moodTracking} onChange={(v) => set("moodTracking", v)} />} />
        <Row label="Prompt frequency" action={<Segmented value={j.promptFrequency} onChange={(v) => set("promptFrequency", v)} options={[{ value: "off", label: "Off" }, { value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }]} />} />
        <Row label="Templates" hint="Weekly review, gratitude, unpack a feeling." action={<Toggle checked={j.templatesOn} onChange={(v) => set("templatesOn", v)} />} />
      </Section>

      <Section title="Privacy">
        <Row label="Private by default" action={<Toggle checked={j.privateDefault} onChange={(v) => set("privateDefault", v)} />} />
        <Row label="Password-protect journals" hint="Requires PIN or biometrics." action={<Toggle checked={j.passwordProtected} onChange={(v) => set("passwordProtected", v)} />} />
        <Row label="AI reflections" hint="Optional summaries and gentle insights." action={<Toggle checked={j.aiAnalysis} onChange={(v) => set("aiAnalysis", v)} />} />
      </Section>

      <Section title="Streak">
        <Row label="Daily goal" hint={`${j.dailyGoal} entry per day`} action={
          <input type="range" min={0} max={3} value={j.dailyGoal} onChange={(e) => set("dailyGoal", parseInt(e.target.value))} className="w-40 accent-[var(--pc-primary)]" />
        } />
        <div className="px-5 py-3 flex flex-wrap gap-2">
          <Link to="/journal"><GhostButton>Open journal</GhostButton></Link>
          <GhostButton onClick={exportJournals}>Export & backup</GhostButton>
        </div>
      </Section>
    </SettingsShell>
  );
}
