import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, palette } from "@/components/AppShell";
import { ArrowLeft, ArrowRight, ChevronDown, ShieldCheck, Clock, ListChecks, BookOpen, Info } from "lucide-react";
import { getTest, loadPrefs, savePrefs } from "@/lib/screening-store";

export const Route = createFileRoute("/screening/test/$id")({
  loader: ({ params }) => {
    const t = getTest(params.id);
    if (!t) throw notFound();
    return { test: t };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.test.name} — PeaceCode Screening` : "Assessment — PeaceCode" }],
  }),
  notFoundComponent: () => <AppShell><div className="p-10 text-center">Assessment not found. <Link to="/screening/library" className="underline">Browse library</Link></div></AppShell>,
  component: TestDetail,
});

const { surface, surface2, border, ink, muted, primary } = palette;

const FAQS = [
  { q: "Is this a diagnosis?", a: "No. It's a validated screening tool that helps you notice patterns. Only a qualified clinician can diagnose." },
  { q: "Where does my data go?", a: "By default, only to this device. You can export or delete it any time in Settings." },
  { q: "How often should I retake it?", a: "Most screens are meaningful every 2–4 weeks. Retaking daily doesn't add much." },
  { q: "What if it upsets me?", a: "You can pause or exit at any moment. Try a 4-minute breathing session afterwards, and reach out if you'd like company." },
];

function TestDetail() {
  const { test } = Route.useLoaderData();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const saved = prefs.bookmarks.includes(test.id);
  const toggle = () => {
    const b = saved ? prefs.bookmarks.filter((x) => x !== test.id) : [...prefs.bookmarks, test.id];
    const n = { ...prefs, bookmarks: b }; setPrefs(n); savePrefs(n);
  };

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
        <nav className="text-[11px] tracking-[0.2em] uppercase mb-6 flex items-center gap-2 flex-wrap" style={{ color: muted }}>
          <Link to="/screening" className="hover:underline">Screening</Link><span>·</span>
          <Link to="/screening/library" className="hover:underline">Library</Link><span>·</span>
          <span style={{ color: ink }}>{test.code}</span>
        </nav>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: primary }}>{test.code} · {test.category}</div>
            <h1 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight">{test.name}</h1>
            <p className="mt-4 text-[15px] leading-relaxed max-w-2xl" style={{ color: muted }}>{test.short}</p>

            <div className="flex flex-wrap gap-2 mt-6">
              <Link to="/screening/instructions/$id" params={{ id: test.id }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] text-white" style={{ background: ink }}>
                Start test <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/screening/instructions/$id" params={{ id: test.id }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px]" style={{ background: surface2, color: ink }}>
                Read instructions
              </Link>
              <button onClick={toggle} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px]" style={{ border: `1px solid ${border}`, color: saved ? primary : muted }}>
                {saved ? "Bookmarked" : "Bookmark"}
              </button>
            </div>

            <Block title="What this measures" body={test.measures} icon={<ListChecks className="w-4 h-4" />} />
            <Block title="Why this matters" body={test.why} icon={<Info className="w-4 h-4" />} />
            <Block title="Who this is for" body={test.whoFor} icon={<BookOpen className="w-4 h-4" />} />

            <div className="mt-8">
              <h3 className="font-serif text-xl mb-3">Frequently asked</h3>
              <div className="rounded-2xl divide-y" style={{ background: surface, border: `1px solid ${border}`, borderColor: border }}>
                {FAQS.map((f, i) => (
                  <button key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left px-5 py-4 flex items-start justify-between gap-3" style={{ borderColor: border }}>
                    <div>
                      <div className="text-[13.5px]">{f.q}</div>
                      {openFaq === i && <div className="text-[12.5px] mt-2 leading-relaxed" style={{ color: muted }}>{f.a}</div>}
                    </div>
                    <ChevronDown className={`w-4 h-4 mt-1 transition ${openFaq === i ? "rotate-180" : ""}`} style={{ color: muted }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* sidebar meta */}
          <aside className="lg:sticky lg:top-6 h-fit rounded-[24px] p-6 flex flex-col gap-4" style={{ background: surface, border: `1px solid ${border}` }}>
            <Meta label="Time required" value={`${test.minutes} minutes`} icon={<Clock className="w-3.5 h-3.5" />} />
            <Meta label="Questions" value={String(test.questions.length)} />
            <Meta label="Difficulty" value={test.difficulty} />
            <Meta label="Category" value={test.category} />
            <Meta label="Source" value={test.source} />
            <Meta label="Accuracy" value={test.accuracy} />
            <Meta label="Last updated" value={test.updated} />
            <div className="pt-4 border-t flex items-center gap-2 text-[11px]" style={{ borderColor: border, color: muted }}>
              <ShieldCheck className="w-3.5 h-3.5" /> Private by default. Stays on your device.
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function Block({ title, body, icon }: { title: string; body: string; icon: React.ReactNode }) {
  return (
    <section className="mt-7">
      <div className="flex items-center gap-2 mb-2" style={{ color: primary }}>{icon}<span className="text-[10px] tracking-[0.3em] uppercase">{title}</span></div>
      <p className="text-[14px] leading-relaxed max-w-2xl" style={{ color: ink }}>{body}</p>
    </section>
  );
}
function Meta({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.3em] uppercase flex items-center gap-1.5" style={{ color: muted }}>{icon}{label}</div>
      <div className="text-[13px] mt-1">{value}</div>
    </div>
  );
}
