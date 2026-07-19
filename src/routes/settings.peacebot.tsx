import { createFileRoute, Link } from "@tanstack/react-router";
import { SettingsShell, Section, Row, Toggle, Segmented, Select, GhostButton } from "@/components/settings/primitives";
import { useSettings, type Personality, type ResponseLength } from "@/lib/settings-store";

export const Route = createFileRoute("/settings/peacebot")({
  head: () => ({ meta: [{ title: "PeaceBot — Settings" }] }),
  component: PeaceBotSettings,
});

function PeaceBotSettings() {
  const [s, update] = useSettings();
  const p = s.peacebot;
  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) => update((x) => ({ ...x, peacebot: { ...x.peacebot, [k]: v } }), `PeaceBot · ${String(k)}`);
  const clearHistory = () => { if (confirm("Delete every PeaceBot conversation?")) localStorage.removeItem("peacecode.peacebot.convs.v1"); };

  return (
    <SettingsShell title="PeaceBot" description="How your companion sounds and remembers.">
      <Section title="Personality">
        <Row label="Tone" action={<Segmented<Personality> value={p.personality} onChange={(v) => set("personality", v)}
          options={[{ value: "gentle", label: "Gentle" }, { value: "friendly", label: "Friendly" }, { value: "motivational", label: "Motivational" }, { value: "professional", label: "Professional" }, { value: "reflective", label: "Reflective" }]} />} />
        <Row label="Response length" action={<Segmented<ResponseLength> value={p.responseLength} onChange={(v) => set("responseLength", v)}
          options={[{ value: "short", label: "Short" }, { value: "balanced", label: "Balanced" }, { value: "detailed", label: "Detailed" }]} />} />
      </Section>

      <Section title="Memory">
        <Row label="Remember what we talk about" hint="Helps PeaceBot pick up where you left off." action={<Toggle checked={p.memory} onChange={(v) => set("memory", v)} />} />
        <Row label="Save conversation history" action={<Toggle checked={p.saveHistory} onChange={(v) => set("saveHistory", v)} />} />
        <div className="px-5 py-4 flex flex-wrap gap-2">
          <Link to="/peacebot/memory"><GhostButton>Manage memories</GhostButton></Link>
          <GhostButton onClick={clearHistory}>Delete all chats</GhostButton>
        </div>
      </Section>

      <Section title="Voice">
        <Row label="Voice speed" hint={p.voiceSpeed.toFixed(2) + "×"} action={<input type="range" min={0.75} max={1.5} step={0.05} value={p.voiceSpeed} onChange={(e) => set("voiceSpeed", parseFloat(e.target.value))} className="w-40 accent-[var(--pc-primary)]" />} />
        <Row label="Voice" action={<Select value={p.voiceGender} onChange={(v) => set("voiceGender", v)} options={[{ value: "neutral", label: "Neutral" }, { value: "warm-f", label: "Warm · femme" }, { value: "warm-m", label: "Warm · masc" }]} />} />
        <Row label="Voice language" action={<Select value={p.voiceLanguage} onChange={(v) => set("voiceLanguage", v)} options={[{ value: "English", label: "English" }, { value: "Hindi", label: "Hindi" }, { value: "Tamil", label: "Tamil" }, { value: "Bengali", label: "Bengali" }]} />} />
      </Section>

      <Section title="Wellbeing">
        <Row label="Crisis detection" hint="PeaceBot offers helplines when concerning language appears." action={<Toggle checked={p.crisisDetection} onChange={(v) => set("crisisDetection", v)} />} />
        <Row label="Daily check-in" action={<Toggle checked={p.dailyCheckin} onChange={(v) => set("dailyCheckin", v)} />} />
        <Row label="Reflective suggestions" action={<Toggle checked={p.suggestions} onChange={(v) => set("suggestions", v)} />} />
        <Row label="Reflection reminders" action={<Toggle checked={p.reflectionReminders} onChange={(v) => set("reflectionReminders", v)} />} />
        <Row label="Sleep reminders" action={<Toggle checked={p.sleepReminders} onChange={(v) => set("sleepReminders", v)} />} />
      </Section>
    </SettingsShell>
  );
}
