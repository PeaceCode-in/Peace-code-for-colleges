import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Page, PageTitle, Card, BigAction } from "@/components/emergency/primitives";
import { Home, PenLine, Bot, Wind, UserCheck, CalendarCheck, LifeBuoy, Sparkles } from "lucide-react";
import { palette } from "@/components/AppShell";

const { muted, ink, soft, primary } = palette;

function Confirm() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const from = search.from ?? "care";

  const message =
    from === "breathe" ? "That was a full minute of care." :
    from === "grounding" ? "You returned, one sense at a time." :
    from === "affirmations" ? "A soft sentence, held. Good." :
    from === "sos" ? "You told someone. That matters." :
    "You supported yourself.";

  return (
    <Page>
      <PageTitle eyebrow="Well done" title={message} sub="Take a slow sip of water if there's some nearby. Nothing else has to happen right now." />

      <Card className="mb-6 text-center py-10" tone="soft">
        <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: "var(--pc-surface)", color: primary, border: `1px solid ${soft}` }}>
          <Sparkles className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <p className="mt-5 font-serif text-[22px] max-w-xl mx-auto" style={{ color: ink }}>
          Rest a moment. There is no next thing you must do.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <BigAction onClick={() => navigate({ to: "/" })} icon={<Home className="w-4.5 h-4.5"/>} title="Back to Today" sub="A calm home screen." />
        <BigAction to="/emergency/recovery" icon={<Sparkles className="w-4.5 h-4.5"/>} title="Recovery plan" sub="Kind next steps." />
        <BigAction to="/journal" icon={<PenLine className="w-4.5 h-4.5"/>} title="One line in your journal" sub="Only if you feel like it." />
        <BigAction to="/peacebot" icon={<Bot className="w-4.5 h-4.5"/>} title="Talk to PeaceBot" sub="Soft, non-judgmental." />
        <BigAction to="/breathe" icon={<Wind className="w-4.5 h-4.5"/>} title="One more breath" sub="Extend the calm a little." />
        <BigAction to="/buddies" icon={<UserCheck className="w-4.5 h-4.5"/>} title="Message a Peace Buddy" sub="Someone kind, standing by." />
        <BigAction to="/counselling" icon={<CalendarCheck className="w-4.5 h-4.5"/>} title="Book a counsellor" sub="If a professional feels right." />
        <BigAction to="/emergency" icon={<LifeBuoy className="w-4.5 h-4.5"/>} title="Back to Emergency" sub="Stay near, if you'd like." />
      </div>

      <div className="mt-8 text-center">
        <Link to="/emergency/history" className="text-[12px]" style={{ color: muted }}>View this in your emergency history</Link>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/confirm")({
  validateSearch: (s: Record<string, unknown>) => ({ from: typeof s.from === "string" ? s.from : undefined }),
  component: Confirm,
});
