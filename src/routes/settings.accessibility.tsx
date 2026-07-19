import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell, Section, Row, Toggle, Segmented, Select } from "@/components/settings/primitives";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/settings/accessibility")({
  head: () => ({ meta: [{ title: "Accessibility — PeaceCode" }] }),
  component: AccessibilityPage,
});

function AccessibilityPage() {
  const [s, update] = useSettings();
  const ax = s.accessibility;
  const set = <K extends keyof typeof ax>(k: K, v: (typeof ax)[K]) => update((x) => ({ ...x, accessibility: { ...x.accessibility, [k]: v } }), `Accessibility · ${String(k)}`);

  return (
    <SettingsShell title="Accessibility" description="PeaceCode should meet you where you are.">
      <Section title="Vision">
        <Row label="High contrast" hint="Bolder text and stronger borders." action={<Toggle checked={ax.highContrast} onChange={(v) => set("highContrast", v)} />} />
        <Row label="Large text" hint="Bumps base size to at least 18px." action={<Toggle checked={ax.largeText} onChange={(v) => set("largeText", v)} />} />
        <Row label="Color-blind mode" action={<Select value={ax.colorBlind} onChange={(v) => set("colorBlind", v)} options={[{ value: "none", label: "None" }, { value: "protanopia", label: "Protanopia" }, { value: "deuteranopia", label: "Deuteranopia" }, { value: "tritanopia", label: "Tritanopia" }]} />} />
        <Row label="Reading width" action={<Segmented value={ax.readingWidth} onChange={(v) => set("readingWidth", v)} options={[{ value: "narrow", label: "Narrow" }, { value: "regular", label: "Regular" }, { value: "wide", label: "Wide" }]} />} />
        <Row label="Dyslexia-friendly font" action={<Toggle checked={ax.dyslexiaFont} onChange={(v) => set("dyslexiaFont", v)} />} />
      </Section>

      <Section title="Motion & input">
        <Row label="Reduce animation" action={<Toggle checked={ax.reduceAnim} onChange={(v) => set("reduceAnim", v)} />} />
        <Row label="Keyboard navigation hints" action={<Toggle checked={ax.keyboardNav} onChange={(v) => set("keyboardNav", v)} />} />
        <Row label="Voice navigation" hint="Coming soon — say “open journal”." action={<Toggle checked={ax.voiceNav} onChange={(v) => set("voiceNav", v)} />} />
      </Section>

      <Section title="Media">
        <Row label="Screen-reader mode" hint="Adds descriptive labels to visual elements." action={<Toggle checked={ax.screenReader} onChange={(v) => set("screenReader", v)} />} />
        <Row label="Captions on video" action={<Toggle checked={ax.captions} onChange={(v) => set("captions", v)} />} />
      </Section>
    </SettingsShell>
  );
}
