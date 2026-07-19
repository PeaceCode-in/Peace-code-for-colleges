import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Page, BackBar, PageTitle, Card } from "@/components/emergency/primitives";
import { FEELINGS, recommendFor, logEvent, type FeelingKey } from "@/lib/emergency-store";
import { palette } from "@/components/AppShell";
import { ArrowRight } from "lucide-react";

const { surface2, border, muted, ink, primary, soft } = palette;

function CheckIn() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<FeelingKey | null>(null);
  const rec = selected ? recommendFor(selected) : null;

  return (
    <Page>
      <BackBar />
      <PageTitle
        eyebrow="Check in"
        title="What's happening inside right now?"
        sub="Pick whatever fits closest. There's no wrong answer — this only helps us suggest the calmest next step."
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {FEELINGS.map((f) => {
          const active = selected === f.key;
          const critical = f.tone === "critical";
          return (
            <button
              key={f.key}
              onClick={() => setSelected(f.key)}
              className="text-left rounded-2xl p-4 transition"
              style={{
                background: active ? soft : surface2,
                border: `1px solid ${active ? primary : border}`,
                color: ink,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px]">{f.label}</span>
                {critical && (
                  <span className="text-[9.5px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-full" style={{ background: "rgba(217,72,72,0.10)", color: "#c14545" }}>
                    urgent
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {rec && selected && (
        <Card className="mt-8">
          <div className="text-[10.5px] tracking-[0.22em] uppercase mb-1" style={{ color: muted }}>Suggested next step</div>
          <div className="font-serif text-[22px] leading-tight">{rec.label}</div>
          <p className="mt-2 text-[13px]" style={{ color: muted }}>{rec.note}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={() => {
                logEvent({ feeling: selected, actions: [`Checked in: ${selected}`, `Followed suggestion: ${rec.label}`], contactsCalled: [] });
                navigate({ to: rec.to });
              }}
              className="rounded-full h-11 px-5 text-[12.5px] flex items-center gap-2"
              style={{ background: ink, color: "var(--pc-bg)" }}
            >
              {rec.label} <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <Link to="/emergency/helplines" className="rounded-full h-11 px-5 text-[12.5px] flex items-center" style={{ background: surface2, border: `1px solid ${border}` }}>
              Talk to a helpline instead
            </Link>
            <Link to="/emergency" className="rounded-full h-11 px-5 text-[12.5px] flex items-center" style={{ background: surface2, border: `1px solid ${border}` }}>
              Back
            </Link>
          </div>
        </Card>
      )}
    </Page>
  );
}

export const Route = createFileRoute("/emergency/checkin")({
  component: CheckIn,
});
