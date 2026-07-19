import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, BackBar, PageTitle, Card, BigAction } from "@/components/emergency/primitives";
import { PenLine, CalendarCheck, UserCheck, Brain, Wind, BookOpen, Sparkles } from "lucide-react";
import { palette } from "@/components/AppShell";

const { muted, ink } = palette;

function Recovery() {
  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="After the storm" title="Small, kind next steps." sub="Recovery isn't a straight line. These are gentle ways to close the loop and keep the light on." />

      <Card className="mb-6">
        <div className="text-[10.5px] tracking-[0.22em] uppercase mb-2" style={{ color: muted }}>Reflection</div>
        <p className="font-serif text-[18px] leading-snug" style={{ color: ink }}>
          You reached out — that took strength. Now go softer than usual. Water, food, a few minutes outside.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <BigAction to="/journal" icon={<PenLine className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Write it down" sub="One sentence about how you're feeling now." />
        <BigAction to="/counselling" icon={<CalendarCheck className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Book a counsellor" sub="A short follow-up session helps." />
        <BigAction to="/buddies" icon={<UserCheck className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Peace Buddy check-in" sub="A soft, peer conversation." />
        <BigAction to="/mindgym" icon={<Brain className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Mind Gym — light" sub="A tiny 3-minute reset." />
        <BigAction to="/breathe" icon={<Wind className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Slow breathing" sub="4-7-8 or coherent breathing." />
        <BigAction to="/resources" icon={<BookOpen className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Resource library" sub="Reading and audio that fit tonight." />
        <BigAction to="/peacebot" icon={<Sparkles className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="AI reflection" sub="Talk through what happened, gently." />
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="text-[12.5px]" style={{ color: muted }}>Return to Today</Link>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/recovery")({ component: Recovery });
