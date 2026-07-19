import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, palette } from "@/components/AppShell";
import { ArrowRight, Check, Clock, Heart, Lock, Pause, ShieldCheck } from "lucide-react";
import { getTest } from "@/lib/screening-store";

export const Route = createFileRoute("/screening/instructions/$id")({
  loader: ({ params }) => {
    const t = getTest(params.id);
    if (!t) throw notFound();
    return { test: t };
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `Instructions — ${loaderData.test.name}` : "Instructions" }] }),
  notFoundComponent: () => <AppShell><div className="p-10 text-center">Not found. <Link to="/screening/library" className="underline">Library</Link></div></AppShell>,
  component: Instructions,
});

const { surface, surface2, border, ink, muted, primary } = palette;

const POINTS = [
  { icon: Heart, title: "Answer honestly", body: "There are no right or wrong answers. The kindest thing is truth." },
  { icon: Clock, title: "Think of the last two weeks", body: "Unless a question says otherwise, reflect on how it's been recently." },
  { icon: Lock, title: "Your responses stay private", body: "By default nothing leaves your device. You choose what to share." },
  { icon: Pause, title: "Pause anytime", body: "Your progress is auto-saved. Come back when you're ready." },
  { icon: ShieldCheck, title: "Not a diagnosis", body: "This is a mirror, not a verdict. Care comes after." },
];

function Instructions() {
  const { test } = Route.useLoaderData();
  const [read, setRead] = useState(false);
  const nav = useNavigate();

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
        <nav className="text-[11px] tracking-[0.2em] uppercase mb-6 flex items-center gap-2 flex-wrap" style={{ color: muted }}>
          <Link to="/screening" className="hover:underline">Screening</Link><span>·</span>
          <Link to="/screening/test/$id" params={{ id: test.id }} className="hover:underline">{test.code}</Link><span>·</span>
          <span style={{ color: ink }}>Instructions</span>
        </nav>

        <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: primary }}>Before you begin</div>
        <h1 className="font-serif text-4xl leading-tight mt-2">Read this softly.</h1>
        <p className="text-[14px] mt-3" style={{ color: muted }}>You're about to take the {test.name}. It'll take about {test.minutes} minutes.</p>

        <ul className="mt-8 flex flex-col gap-3">
          {POINTS.map((p) => (
            <li key={p.title} className="rounded-2xl p-5 flex items-start gap-4" style={{ background: surface, border: `1px solid ${border}` }}>
              <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: surface2, color: primary }}>
                <p.icon className="w-4 h-4" strokeWidth={1.5} />
              </span>
              <div>
                <div className="text-[14px]">{p.title}</div>
                <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: muted }}>{p.body}</div>
              </div>
            </li>
          ))}
        </ul>

        <label className="mt-8 flex items-center gap-3 cursor-pointer select-none">
          <span className={`w-5 h-5 rounded-md flex items-center justify-center transition`} style={{ background: read ? primary : surface, border: `1px solid ${read ? primary : border}` }}>
            {read && <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
          </span>
          <input type="checkbox" className="sr-only" checked={read} onChange={(e) => setRead(e.target.checked)} />
          <span className="text-[13.5px]">I have read and understood the instructions.</span>
        </label>

        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <button
            disabled={!read}
            onClick={() => nav({ to: "/screening/consent/$id", params: { id: test.id } })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] text-white transition"
            style={{ background: ink, opacity: read ? 1 : 0.4, cursor: read ? "pointer" : "not-allowed" }}
          >
            Continue to consent <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <Link to="/screening/test/$id" params={{ id: test.id }} className="text-[12px]" style={{ color: muted }}>Back to details</Link>
        </div>
      </main>
    </AppShell>
  );
}
