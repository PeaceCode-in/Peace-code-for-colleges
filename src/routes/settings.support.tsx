import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell, Section, Row, GhostButton, TextArea } from "@/components/settings/primitives";
import { palette } from "@/components/AppShell";
import { useState } from "react";
import { Star, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/settings/support")({
  head: () => ({ meta: [{ title: "Support — PeaceCode" }] }),
  component: SupportPage,
});

const { primary, muted } = palette;

const FAQS = [
  { q: "Is PeaceCode really private?", a: "Every entry lives on your device unless you export it. Nothing is shared with your college or family." },
  { q: "Can I use PeaceCode without an account?", a: "You can browse resources and try breathing without signing in. Journals and buddy connections need an account so we can sync." },
  { q: "How does PeaceBot know what to say?", a: "PeaceBot uses a language model with a warm, therapist-informed system prompt. It never stores your history on our servers." },
  { q: "What happens in a crisis?", a: "PeaceBot detects concerning phrases and quietly surfaces helplines. You can also tap the SOS button anytime." },
];

function SupportPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);

  return (
    <SettingsShell title="Support" description="Anything we can help with — really.">
      <Section title="Help centre">
        <Row label="Read the help centre" action={<GhostButton onClick={() => window.open("https://docs.lovable.dev", "_blank")}><span className="inline-flex items-center gap-1">Open <ExternalLink className="w-3 h-3" /></span></GhostButton>} />
        <Row label="Contact the team" hint="hi@peacecode.app" action={<GhostButton onClick={() => (location.href = "mailto:hi@peacecode.app")}>Email</GhostButton>} />
        <Row label="Report a bug" action={<GhostButton onClick={() => (location.href = "mailto:bugs@peacecode.app?subject=Bug%20report")}>Report</GhostButton>} />
        <Row label="Feature request" action={<GhostButton onClick={() => (location.href = "mailto:ideas@peacecode.app?subject=Feature%20idea")}>Send idea</GhostButton>} />
      </Section>

      <Section title="FAQs">
        {FAQS.map((f, i) => (
          <div key={f.q} className="px-5 py-3">
            <button className="w-full text-left flex items-center justify-between text-[13px]" onClick={() => setOpen(open === i ? null : i)}>
              <span>{f.q}</span><span className="text-[10px]" style={{ color: muted }}>{open === i ? "hide" : "show"}</span>
            </button>
            {open === i && <p className="text-[12.5px] mt-2 max-w-lg" style={{ color: muted }}>{f.a}</p>}
          </div>
        ))}
      </Section>

      <Section title="Rate PeaceCode">
        <div className="px-5 py-4 flex items-center gap-2">
          {[1,2,3,4,5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star className="w-5 h-5" style={{ color: n <= rating ? primary : "#DCE3EF", fill: n <= rating ? primary : "transparent" }} />
            </button>
          ))}
          <span className="text-[11px] ml-2" style={{ color: muted }}>{rating > 0 ? "Thank you — noted." : "Tap to rate."}</span>
        </div>
      </Section>

      <Section title="Feedback">
        <div className="px-5 py-4">
          <TextArea value={feedback} onChange={setFeedback} placeholder="What would make PeaceCode softer, calmer, better?" rows={4} />
          <div className="mt-2 flex justify-end">
            <GhostButton onClick={() => { if (!feedback.trim()) return; alert("Thanks — sent to the team."); setFeedback(""); }}>Send</GhostButton>
          </div>
        </div>
      </Section>

      <Section title="Legal">
        <Row label="Privacy policy" action={<GhostButton onClick={() => window.open("https://peacecode.app/privacy", "_blank")}>Read</GhostButton>} />
        <Row label="Terms of service" action={<GhostButton onClick={() => window.open("https://peacecode.app/terms", "_blank")}>Read</GhostButton>} />
        <Row label="Licenses" action={<GhostButton onClick={() => alert("Open source licenses © respective authors.")}>View</GhostButton>} />
      </Section>
    </SettingsShell>
  );
}
