import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, palette } from "@/components/AppShell";
import {
  ArrowLeft, ArrowRight, Download, Printer, RefreshCw, Sparkles, Trash2,
  Wind, Target, PenLine, Heart, Users, Phone, Bot, MessageCircle,
} from "lucide-react";
import { getTest, loadSessions, deleteSession, upsertSession, type Session } from "@/lib/screening-store";
import { generateInsights, type InsightsOutput } from "@/lib/screening-ai.functions";

export const Route = createFileRoute("/screening/results/$id")({
  loader: ({ params }) => ({ id: params.id }),
  head: () => ({ meta: [{ title: "Your results — PeaceCode Screening" }] }),
  component: Results,
});

const { surface, surface2, border, ink, muted, primary } = palette;

const TONE_COLORS: Record<string, { bg: string; ink: string }> = {
  calm:     { bg: "#DDEBD9", ink: "#2E5A3B" },
  mild:     { bg: "#E3EEFB", ink: "#2A4F7A" },
  moderate: { bg: "#F1E4C9", ink: "#7A5B2A" },
  elevated: { bg: "#F1D9C9", ink: "#7A3F2A" },
  high:     { bg: "#F2C7C7", ink: "#7A2A2A" },
};

function Results() {
  const { id } = Route.useLoaderData();
  const nav = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [insights, setInsights] = useState<InsightsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSessions().find((x) => x.id === id) ?? null;
    setSession(s);
  }, [id]);

  const test = session ? getTest(session.testId) : null;
  const previous = useMemo(() => {
    if (!session || !test) return null;
    const prior = loadSessions().find((s) => s.testId === test.id && s.status === "completed" && s.id !== session.id && (s.completedAt ?? 0) < (session.completedAt ?? 0));
    if (!prior?.completedAt || !prior.score || !prior.scorePct) return null;
    return {
      score: prior.score,
      scorePct: prior.scorePct,
      bandLabel: prior.bandLabel ?? "",
      daysAgo: Math.max(1, Math.floor(((session.completedAt ?? Date.now()) - prior.completedAt) / 86400000)),
    };
  }, [session, test]);

  const fetchInsights = async () => {
    if (!session || !test) return;
    setLoading(true); setError(null);
    try {
      const answers = test.questions.map((q) => {
        const val = session.answers[q.id];
        const opt = q.options.find((o) => o.value === val);
        return { question: q.text, answer: opt?.label ?? "—", value: val ?? 0 };
      });
      const out = await generateInsights({
        data: {
          testName: test.name, testCode: test.code, category: test.category,
          score: session.score ?? 0, scorePct: session.scorePct ?? 0,
          bandLabel: session.bandLabel ?? "", bandTone: session.bandTone ?? "mild",
          answers, previous,
        },
      });
      setInsights(out);
    } catch (e) {
      setError("Insights couldn't load right now. Your results are still yours to read below.");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (session && test && !insights) fetchInsights(); }, [session?.id]);

  if (!session || !test) {
    return <AppShell><div className="p-10 text-center">Result not found. <Link to="/screening" className="underline">Back to Screening</Link></div></AppShell>;
  }
  const tone = TONE_COLORS[session.bandTone ?? "mild"];

  const onDelete = () => {
    if (!confirm("Delete this result forever?")) return;
    deleteSession(session.id); nav({ to: "/screening" });
  };
  const onRetake = () => {
    nav({ to: "/screening/instructions/$id", params: { id: test.id } });
  };
  const onExport = () => {
    const data = { test: test.name, code: test.code, completedAt: session.completedAt, score: session.score, scorePct: session.scorePct, band: session.bandLabel, answers: session.answers };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${test.code}-${session.id}.json`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 lg:py-12 print:py-4">
        <nav className="text-[11px] tracking-[0.2em] uppercase mb-6 flex items-center gap-2 flex-wrap print:hidden" style={{ color: muted }}>
          <Link to="/screening" className="hover:underline">Screening</Link><span>·</span>
          <Link to="/screening/history" className="hover:underline">History</Link><span>·</span>
          <span style={{ color: ink }}>Result</span>
        </nav>

        {/* hero result card */}
        <section className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 mb-8">
          <div className="rounded-[28px] p-8 lg:p-10 relative overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: primary }}>{test.code} · {test.category}</div>
            <h1 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight mt-2">{test.name}</h1>
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px]" style={{ background: tone.bg, color: tone.ink }}>
              {session.bandLabel}
            </div>
            <p className="mt-5 text-[14px] leading-relaxed max-w-2xl" style={{ color: muted }}>
              This is a snapshot of the last two weeks. Read it slowly. It's information, not a verdict.
            </p>

            <div className="mt-6 flex items-baseline gap-4">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>Score</div>
                <div className="font-serif text-5xl">{session.score}</div>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>Level</div>
                <div className="font-serif text-2xl">{session.scorePct}%</div>
              </div>
              {previous && (
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>Previous</div>
                  <div className="font-serif text-2xl">{previous.score}</div>
                </div>
              )}
            </div>

            {/* band bar */}
            <div className="mt-6 max-w-xl">
              <div className="flex items-center h-3 rounded-full overflow-hidden" style={{ background: surface2 }}>
                {test.bands.map((b) => {
                  const span = (b.max - b.min + 1);
                  const total = test.bands.reduce((a, x) => a + (x.max - x.min + 1), 0);
                  const c = TONE_COLORS[b.tone];
                  const isActive = b.label === session.bandLabel;
                  return <div key={b.label} style={{ width: `${(span / total) * 100}%`, background: c.bg, opacity: isActive ? 1 : 0.5 }} />;
                })}
              </div>
              <div className="flex justify-between text-[10px] mt-2" style={{ color: muted }}>
                {test.bands.map((b) => <span key={b.label} style={{ fontWeight: b.label === session.bandLabel ? 600 : 400, color: b.label === session.bandLabel ? ink : muted }}>{b.label}</span>)}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 print:hidden">
              <button onClick={onRetake} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] text-white" style={{ background: ink }}>
                <RefreshCw className="w-3.5 h-3.5" /> Retake
              </button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px]" style={{ background: surface2 }}>
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={onExport} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px]" style={{ background: surface2 }}>
                <Download className="w-3.5 h-3.5" /> Export JSON
              </button>
              <button onClick={onDelete} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px]" style={{ color: "#B54848" }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

          {/* score dial */}
          <div className="rounded-[28px] p-6 flex flex-col items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}>
            <ScoreDial pct={session.scorePct ?? 0} tone={session.bandTone ?? "mild"} />
            <div className="mt-4 text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>Interpretation</div>
              <div className="font-serif text-lg mt-1">{session.bandLabel}</div>
            </div>
          </div>
        </section>

        {/* AI insights */}
        <section className="rounded-[28px] p-8 mb-8 relative overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: surface2, color: primary }}><Sparkles className="w-4 h-4" /></span>
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: primary }}>Peace Bot</div>
                <div className="font-serif text-xl">Insights, softly.</div>
              </div>
            </div>
            {!loading && insights && (
              <button onClick={fetchInsights} className="text-[11px] inline-flex items-center gap-1.5" style={{ color: muted }}>
                <RefreshCw className="w-3 h-3" /> regenerate
              </button>
            )}
          </div>

          {loading && <div className="text-[13px] py-8 text-center" style={{ color: muted }}>Reading between your lines…</div>}
          {error && <div className="text-[13px]" style={{ color: "#B54848" }}>{error}</div>}

          {insights && (
            <div className="grid md:grid-cols-2 gap-5">
              <InsightCard title="Summary" body={insights.summary} />
              <InsightCard title="Snapshot" body={insights.snapshot} />
              <InsightList title="Emotional strengths" items={insights.strengths} />
              <InsightList title="Areas to tend" items={insights.concerns} />
              <InsightList title="Suggestions" items={insights.suggestions} />
              <InsightList title="Study–life balance" items={insights.balanceTips} />
              <InsightList title="Self-care" items={insights.selfCare} />
              <InsightCard title="Compared to before" body={insights.comparison} />
            </div>
          )}
        </section>

        {/* recommendations */}
        <section className="mb-8">
          <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: muted }}>Next best step</div>
          <h2 className="font-serif text-2xl mb-4">{insights?.nextAction ?? "Move slowly. Kindly."}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Recommendation to="/breathe" icon={<Wind className="w-4 h-4" />} title="Breathe" hint="4-minute reset" />
            <Recommendation to="/journal" icon={<PenLine className="w-4 h-4" />} title="Journal" hint="One honest line" />
            <Recommendation to="/focus" icon={<Target className="w-4 h-4" />} title="Focus" hint="A quiet 25-minute block" />
            <Recommendation to="/gratitude" icon={<Heart className="w-4 h-4" />} title="Gratitude" hint="Plant one small seed" />
            <Recommendation to="/community" icon={<Users className="w-4 h-4" />} title="Community" hint="You're not alone here" />
            <Recommendation to="/screening/resources" icon={<Phone className="w-4 h-4" />} title="Counsellor" hint="Talk to someone trained" />
            <Recommendation to="/" icon={<Bot className="w-4 h-4" />} title="Peace Bot" hint="Chat softly" />
            <Recommendation to="/screening/history" icon={<MessageCircle className="w-4 h-4" />} title="See history" hint="How you're shifting" />
          </div>
        </section>

        {/* footer nav */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t print:hidden" style={{ borderColor: border }}>
          <Link to="/screening" className="text-[12px] inline-flex items-center gap-1.5" style={{ color: muted }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Screening home
          </Link>
          <Link to="/screening/library" className="text-[12px] inline-flex items-center gap-1.5" style={{ color: primary }}>
            Take another assessment <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </AppShell>
  );
}

function ScoreDial({ pct, tone }: { pct: number; tone: string }) {
  const r = 62, C = 2 * Math.PI * r;
  const off = C - (pct / 100) * C;
  const c = TONE_COLORS[tone] ?? TONE_COLORS.mild;
  return (
    <div className="relative w-[160px] h-[160px]">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke={surface2} strokeWidth="10" />
        <circle cx="80" cy="80" r={r} fill="none" stroke={c.ink} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 800ms" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-serif text-4xl">{pct}</div>
        <div className="text-[10px] tracking-[0.3em] uppercase mt-1" style={{ color: muted }}>percent</div>
      </div>
    </div>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: surface2 }}>
      <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: primary }}>{title}</div>
      <p className="text-[13.5px] mt-2 leading-relaxed">{body}</p>
    </div>
  );
}
function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: surface2 }}>
      <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: primary }}>{title}</div>
      <ul className="flex flex-col gap-1.5 text-[13px]">
        {items.map((s, i) => <li key={i} className="flex gap-2"><span style={{ color: primary }}>·</span>{s}</li>)}
      </ul>
    </div>
  );
}
function Recommendation({ to, icon, title, hint }: { to: string; icon: React.ReactNode; title: string; hint: string }) {
  return (
    <Link to={to as never} className="rounded-2xl p-4 flex items-center gap-3 transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
      <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: surface2, color: primary }}>{icon}</span>
      <div className="min-w-0">
        <div className="text-[13px]">{title}</div>
        <div className="text-[11px]" style={{ color: muted }}>{hint}</div>
      </div>
    </Link>
  );
}
