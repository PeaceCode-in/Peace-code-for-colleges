import { createFileRoute } from "@tanstack/react-router";
import { Page, BackBar, PageTitle, BigAction } from "@/components/emergency/primitives";
import { Wind, Moon, BookOpen, Heart, PenLine, Sparkles, Waves, Target, ListMusic, Quote } from "lucide-react";

function Toolkit() {
  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Calm toolkit" title="Small, warm, well-lit things." sub="Nothing here needs willpower. Pick what feels light — leave the rest." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <BigAction to="/breathe"       icon={<Wind className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Breathing" sub="Techniques, timers, and rhythms." />
        <BigAction to="/resources"     icon={<Moon className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Meditation" sub="Short guided sessions." />
        <BigAction to="/resources"     icon={<BookOpen className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Sleep story" sub="Slow, quiet audio for tonight." />
        <BigAction to="/journal"       icon={<PenLine className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Journal" sub="One line is enough." />
        <BigAction to="/gratitude"     icon={<Heart className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Gratitude" sub="Name a small good thing." />
        <BigAction to="/mindgym"       icon={<Target className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Mindfulness" sub="Short attention exercises." />
        <BigAction to="/resources"     icon={<Waves className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Nature sounds" sub="Rain, waves, forest." />
        <BigAction to="/focus"         icon={<ListMusic className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Focus music" sub="Gentle instrumentals." />
        <BigAction to="/resources"     icon={<Sparkles className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Emergency playlist" sub="Soft songs saved by students." />
        <BigAction to="/emergency/affirmations" icon={<Quote className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Affirmation cards" sub="A sentence to hold onto." />
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/toolkit")({ component: Toolkit });
