import { createFileRoute } from "@tanstack/react-router";
import { Page, BackBar, PageTitle, BigAction } from "@/components/emergency/primitives";
import { Wind, Anchor, Music4, Sparkles, Moon, Bot, Volume2, HandHeart } from "lucide-react";

function Calm() {
  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Immediate calm" title="Small, gentle things — pick one." sub="Each is short. Nothing longer than a few minutes. You can stop whenever you want." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <BigAction to="/emergency/breathe"       icon={<Wind className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="60-second breathing" sub="Slow the body first, then the mind." />
        <BigAction to="/emergency/grounding"     icon={<Anchor className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="5-4-3-2-1 grounding" sub="Return to the room, one sense at a time." />
        <BigAction to="/emergency/affirmations"  icon={<HandHeart className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Kind affirmations" sub="A few sentences to hold onto." />
        <BigAction to="/breathe"                 icon={<Wind className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Full breathing library" sub="Techniques, timers, and rhythms." />
        <BigAction to="/resources"               icon={<Music4 className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Calming audio" sub="Guided tracks and soundscapes." />
        <BigAction to="/resources"               icon={<Moon className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Emergency meditation" sub="A short guided reset." />
        <BigAction to="/resources"               icon={<Volume2 className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Relaxing music" sub="Ambient, lo-fi, and nature." />
        <BigAction to="/peacebot"                icon={<Bot className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Emergency PeaceBot" sub="Calm, non-judgmental AI. Not a therapist." />
        <BigAction to="/emergency/toolkit"       icon={<Sparkles className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Full calm toolkit" sub="More gentle tools in one place." />
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/calm")({ component: Calm });
