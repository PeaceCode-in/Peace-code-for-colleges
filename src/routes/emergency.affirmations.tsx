import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Page, BackBar, PageTitle, Card } from "@/components/emergency/primitives";
import { palette } from "@/components/AppShell";
import { ArrowRight, Sparkles } from "lucide-react";

const { border, muted, ink, primary, soft, surface2 } = palette;

const LINES = [
  "This feeling is real, and it will pass.",
  "I don't have to solve everything tonight.",
  "I can ask for help. Asking is brave.",
  "My worth isn't measured by this moment.",
  "I've survived hard days before. This one, too.",
  "Slow is okay. Slow is still moving.",
  "I am not alone, even when it feels that way.",
  "Small kindness to myself counts.",
  "Breath by breath, I'm coming back.",
  "There is a version of tomorrow where I feel lighter.",
];

function Affirmations() {
  const [i, setI] = useState(0);
  const line = LINES[i % LINES.length];

  return (
    <Page>
      <BackBar to="/emergency/calm" label="Back to calm" />
      <PageTitle eyebrow="Affirmations" title="A few sentences to hold onto." sub="Read slowly. Tap for another when you're ready." />

      <Card className="text-center py-14">
        <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-6" style={{ background: soft, color: primary }}>
          <Sparkles className="w-5 h-5" strokeWidth={1.5}/>
        </div>
        <p className="font-serif text-[26px] sm:text-[32px] leading-[1.15] max-w-xl mx-auto" style={{ color: ink }}>
          "{line}"
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button onClick={() => setI((v) => v + 1)} className="rounded-full h-11 px-5 text-[12.5px] flex items-center gap-2" style={{ background: ink, color: "var(--pc-bg)" }}>
            Next affirmation <ArrowRight className="w-3.5 h-3.5"/>
          </button>
          <Link to="/emergency/confirm" search={{ from: "affirmations" }} className="rounded-full h-11 px-5 text-[12.5px] flex items-center" style={{ background: surface2, border: `1px solid ${border}` }}>
            I feel a little softer
          </Link>
        </div>
        <div className="mt-4 text-[11px]" style={{ color: muted }}>{(i % LINES.length) + 1} / {LINES.length}</div>
      </Card>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/affirmations")({ component: Affirmations });
