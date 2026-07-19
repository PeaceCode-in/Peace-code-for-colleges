import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell, Section, Row, Toggle, GhostButton } from "@/components/settings/primitives";
import { useSettings } from "@/lib/settings-store";
import { palette } from "@/components/AppShell";
import logo from "@/assets/peacecode-logo.png";

export const Route = createFileRoute("/settings/about")({
  head: () => ({ meta: [{ title: "About — PeaceCode" }] }),
  component: AboutPage,
});

const { primary, muted, ink } = palette;

const CHANGELOG = [
  { v: "1.4", when: "Jul 2026", note: "Settings rewrite. Live theme, accent, and typography." },
  { v: "1.3", when: "Jun 2026", note: "Mind Gym launched with 37 exercises." },
  { v: "1.2", when: "May 2026", note: "PeaceBot voice mode and long-term memory." },
];
const ROADMAP = [
  { title: "Offline journal", when: "Q3" },
  { title: "Group breathing rooms", when: "Q3" },
  { title: "Wearable sleep insights", when: "Q4" },
];

function AboutPage() {
  const [s, update] = useSettings();
  const toggleBeta = () => update((x) => ({ ...x, betaEnrolled: !x.betaEnrolled }), `Beta · ${!s.betaEnrolled ? "enrolled" : "left"}`);

  return (
    <SettingsShell title="About PeaceCode" description="Made softly, for students, in India.">
      <Section title="Version">
        <div className="px-5 py-6 flex items-center gap-4">
          <img src={logo} alt="" className="w-14 h-14" />
          <div>
            <div className="font-serif text-[22px] leading-tight" style={{ color: ink }}>PeaceCode</div>
            <div className="text-[12px]" style={{ color: muted }}>v1.4.0 · build 2026.07.13 · TanStack Start</div>
          </div>
        </div>
      </Section>

      <Section title="What's new">
        {CHANGELOG.map((c) => (
          <div key={c.v} className="px-5 py-3">
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: ink }}>
              <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: "var(--pc-surface2)", color: primary }}>v{c.v}</span>
              <span style={{ color: muted }}>{c.when}</span>
            </div>
            <p className="text-[12.5px] mt-1" style={{ color: muted }}>{c.note}</p>
          </div>
        ))}
      </Section>

      <Section title="Roadmap">
        {ROADMAP.map((r) => (
          <Row key={r.title} label={r.title} hint={r.when} />
        ))}
      </Section>

      <Section title="Beta features">
        <Row label="Join beta program" hint="Early access to unfinished ideas." action={<Toggle checked={s.betaEnrolled} onChange={toggleBeta} />} />
      </Section>

      <Section title="Team & credits">
        <Row label="Made by" hint="a small team who has been there." />
        <Row label="Open source" hint="Fraunces, DM Sans, Lucide, TanStack, shadcn/ui." action={<GhostButton onClick={() => alert("Licenses in /settings/support")}>View</GhostButton>} />
        <Row label="Acknowledgements" hint="Every student who told us what didn't work." />
      </Section>
    </SettingsShell>
  );
}
