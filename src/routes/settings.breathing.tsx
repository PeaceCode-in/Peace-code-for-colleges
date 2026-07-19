import { createFileRoute, Link } from "@tanstack/react-router";
import { SettingsShell, Section, Row, Toggle, Select, TextField, GhostButton } from "@/components/settings/primitives";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/settings/breathing")({
  head: () => ({ meta: [{ title: "Breathing — Settings" }] }),
  component: BreathingSettings,
});

function BreathingSettings() {
  const [s, update] = useSettings();
  const b = s.breathing;
  const set = <K extends keyof typeof b>(k: K, v: (typeof b)[K]) => update((x) => ({ ...x, breathing: { ...x.breathing, [k]: v } }), `Breathing · ${String(k)}`);

  return (
    <SettingsShell title="Breathing" description="Pick a default rhythm — you can always change mid-session.">
      <Section title="Session">
        <Row label="Preferred technique" action={<Select value={b.preferred} onChange={(v) => set("preferred", v)} options={[{ value: "box", label: "Box (4-4-4-4)" }, { value: "478", label: "4-7-8" }, { value: "cyclic", label: "Cyclic sigh" }, { value: "resonance", label: "Resonance 5.5" }, { value: "triangle", label: "Triangle" }]} />} />
        <Row label="Default length" hint={`${b.defaultLength} min`} action={<input type="range" min={2} max={20} value={b.defaultLength} onChange={(e) => set("defaultLength", parseInt(e.target.value))} className="w-40 accent-[var(--pc-primary)]" />} />
        <Row label="Auto-start on open" action={<Toggle checked={b.autoStart} onChange={(v) => set("autoStart", v)} />} />
        <Row label="Vibration cues" action={<Toggle checked={b.vibration} onChange={(v) => set("vibration", v)} />} />
      </Section>

      <Section title="Ambience">
        <Row label="Background sound" action={<Select value={b.background} onChange={(v) => set("background", v)} options={[{ value: "silence", label: "Silence" }, { value: "rain", label: "Rain" }, { value: "ocean", label: "Ocean" }, { value: "forest", label: "Forest" }, { value: "brown", label: "Brown noise" }]} />} />
        <Row label="Focus timer integration" hint="Pause your Pomodoro during a session." action={<Toggle checked={b.focusTimer} onChange={(v) => set("focusTimer", v)} />} />
      </Section>

      <Section title="Habit">
        <Row label="Daily goal (minutes)" action={<input type="number" min={1} max={60} value={b.dailyGoal} onChange={(e) => set("dailyGoal", parseInt(e.target.value) || 0)} className="w-20 text-[13px] px-3 py-2 rounded-xl outline-none" style={{ background: "var(--pc-surface2)", color: "var(--pc-ink)" }} />} />
        <Row label="Reminder time" action={<TextField type="time" value={b.reminderTime} onChange={(v) => set("reminderTime", v)} />} />
        <div className="px-5 py-3"><Link to="/breathe"><GhostButton>Try a session now</GhostButton></Link></div>
      </Section>
    </SettingsShell>
  );
}
