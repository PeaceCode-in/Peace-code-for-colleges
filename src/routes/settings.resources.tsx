import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell, Section, Row, Toggle, Segmented, Chip } from "@/components/settings/primitives";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/settings/resources")({
  head: () => ({ meta: [{ title: "Resources — Settings" }] }),
  component: ResourceSettings,
});

const TOPICS = ["Stress","Sleep","Exam Anxiety","Relationships","Burnout","Career","Productivity","Meditation","Grief","Self-esteem"];
const TYPES = ["Articles","Videos","Podcasts","Worksheets","Research Papers"];
const LANGS = ["English","Hindi","Tamil","Bengali","Kannada","Marathi"];

function ResourceSettings() {
  const [s, update] = useSettings();
  const r = s.resources;
  const toggleArr = (key: "topics" | "contentTypes" | "languages", v: string) =>
    update((x) => ({ ...x, resources: { ...x.resources, [key]: x.resources[key].includes(v) ? x.resources[key].filter((z) => z !== v) : [...x.resources[key], v] } }), `Resources · ${key}`);
  const set = <K extends keyof typeof r>(k: K, v: (typeof r)[K]) => update((x) => ({ ...x, resources: { ...x.resources, [k]: v } }), `Resources · ${String(k)}`);

  return (
    <SettingsShell title="Resources" description="Tell us what actually helps.">
      <Section title="Topics">
        <div className="px-5 py-4 flex flex-wrap gap-2">
          {TOPICS.map((t) => <Chip key={t} label={t} active={r.topics.includes(t)} onClick={() => toggleArr("topics", t)} />)}
        </div>
      </Section>
      <Section title="Content types">
        <div className="px-5 py-4 flex flex-wrap gap-2">
          {TYPES.map((t) => <Chip key={t} label={t} active={r.contentTypes.includes(t)} onClick={() => toggleArr("contentTypes", t)} />)}
        </div>
      </Section>
      <Section title="Languages">
        <div className="px-5 py-4 flex flex-wrap gap-2">
          {LANGS.map((l) => <Chip key={l} label={l} active={r.languages.includes(l)} onClick={() => toggleArr("languages", l)} />)}
        </div>
      </Section>
      <Section title="Reading">
        <Row label="Reading time preference" action={
          <Segmented value={r.readingTime} onChange={(v) => set("readingTime", v)} options={[{ value: "any", label: "Any" }, { value: "short", label: "≤5m" }, { value: "medium", label: "5–15m" }, { value: "long", label: "15m+" }]} />
        } />
        <Row label="Personalized recommendations" hint="Uses your reading history to suggest what's next." action={<Toggle checked={r.recommendations} onChange={(v) => set("recommendations", v)} />} />
      </Section>
    </SettingsShell>
  );
}
