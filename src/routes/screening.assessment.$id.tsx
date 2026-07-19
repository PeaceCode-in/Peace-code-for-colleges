import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Check, X, Save, LogOut } from "lucide-react";
import { getTest, loadSessions, upsertSession, newSessionId, scoreSession, type Session } from "@/lib/screening-store";
import { palette } from "@/components/AppShell";

type Search = { resume?: string };

export const Route = createFileRoute("/screening/assessment/$id")({
  validateSearch: (s: Record<string, unknown>): Search => ({ resume: typeof s.resume === "string" ? s.resume : undefined }),
  loader: ({ params }) => {
    const t = getTest(params.id);
    if (!t) throw notFound();
    return { test: t };
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `Taking — ${loaderData.test.name}` : "Assessment" }] }),
  notFoundComponent: () => <div className="p-10 text-center">Not found. <Link to="/screening/library" className="underline">Library</Link></div>,
  component: Assessment,
});

const { surface, surface2, border, ink, muted, primary } = palette;

function Assessment() {
  const { test } = Route.useLoaderData();
  const { resume } = Route.useSearch();
  const nav = useNavigate();

  const [session, setSession] = useState<Session>(() => {
    const all = loadSessions();
    const found = resume ? all.find((s) => s.id === resume) : all.find((s) => s.testId === test.id && s.status === "in_progress");
    return found ?? { id: newSessionId(), testId: test.id, startedAt: Date.now(), updatedAt: Date.now(), answers: {}, currentIndex: 0, status: "in_progress" };
  });
  const [exiting, setExiting] = useState(false);
  const [saved, setSaved] = useState(false);

  const idx = session.currentIndex;
  const question = test.questions[idx];
  const total = test.questions.length;
  const progress = ((idx + (session.answers[question?.id ?? ""] !== undefined ? 1 : 0)) / total) * 100;

  const persist = useCallback((s: Session) => {
    const next = { ...s, updatedAt: Date.now() };
    setSession(next);
    upsertSession(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 900);
  }, []);

  const answer = (val: number) => {
    persist({ ...session, answers: { ...session.answers, [question.id]: val } });
  };
  const next = useCallback(() => {
    if (idx < total - 1) persist({ ...session, currentIndex: idx + 1 });
    else finish();
  }, [session, idx, total]);
  const back = () => { if (idx > 0) persist({ ...session, currentIndex: idx - 1 }); };

  const finish = () => {
    const { score, scorePct, bandLabel, bandTone } = scoreSession(test, session.answers);
    const done: Session = { ...session, status: "completed", completedAt: Date.now(), score, scorePct, bandLabel, bandTone };
    upsertSession(done);
    nav({ to: "/screening/processing/$id", params: { id: done.id } });
  };

  // keyboard: number keys to select, arrow keys to navigate, esc to exit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (exiting) return;
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && question && n >= 1 && n <= question.options.length) {
        answer(question.options[n - 1].value);
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (session.answers[question?.id ?? ""] !== undefined) next();
      } else if (e.key === "ArrowLeft") back();
      else if (e.key === "Escape") setExiting(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session, question, exiting, next]);

  const answered = session.answers[question?.id ?? ""];
  const answeredCount = Object.keys(session.answers).length;

  return (
    <div className="min-h-screen w-full font-sans relative overflow-hidden" style={{ background: "#F7FAFF", color: ink }}>
      {/* ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle,#D5C9F7,transparent 70%)" }} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle,#AFC9F5,transparent 70%)" }} />
      </div>

      {/* top strip */}
      <div className="fixed top-0 inset-x-0 z-20 backdrop-blur-md" style={{ background: "rgba(247,250,255,0.85)", borderBottom: `1px solid ${border}` }}>
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-4">
          <button onClick={() => setExiting(true)} className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full" style={{ background: surface2, color: ink }}>
            <LogOut className="w-3.5 h-3.5" /> Exit
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase mb-1.5" style={{ color: muted }}>
              <span>{test.code} · {test.name}</span>
              <span>{idx + 1} / {total} · {Math.round(progress)}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: surface2 }}>
              <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: primary }} />
            </div>
          </div>
          <span className={`text-[10px] transition-opacity ${saved ? "opacity-100" : "opacity-0"}`} style={{ color: primary }}>
            <Save className="w-3 h-3 inline mr-1" /> saved
          </span>
        </div>
      </div>

      {/* question */}
      <main className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 pt-24 pb-32 min-h-screen flex flex-col justify-center">
        <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: primary }}>Question {idx + 1}</div>
        <h2 className="font-serif text-[30px] sm:text-[38px] leading-[1.15] tracking-tight max-w-2xl">{question?.text}</h2>
        <p className="text-[12px] mt-3" style={{ color: muted }}>Over the last two weeks, how often has this been true?</p>

        <div className="mt-8 flex flex-col gap-2.5 max-w-2xl">
          {question?.options.map((o: { label: string; value: number }, i: number) => {
            const sel = answered === o.value;
            return (
              <button
                key={o.label}
                onClick={() => answer(o.value)}
                className="group text-left rounded-2xl px-5 py-4 flex items-center gap-4 transition"
                style={{ background: sel ? "#EAF3FF" : surface, border: `1px solid ${sel ? primary : border}`, boxShadow: sel ? `0 8px 24px -12px ${primary}55` : "none" }}
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] shrink-0" style={{ background: sel ? primary : surface2, color: sel ? "white" : muted }}>
                  {sel ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : i + 1}
                </span>
                <span className="text-[14px] flex-1">{o.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button onClick={back} disabled={idx === 0} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] transition" style={{ background: surface2, color: ink, opacity: idx === 0 ? 0.4 : 1 }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button onClick={next} disabled={answered === undefined} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[12px] text-white transition" style={{ background: ink, opacity: answered === undefined ? 0.4 : 1 }}>
            {idx === total - 1 ? "Finish" : "Next"} <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <div className="ml-auto text-[11px]" style={{ color: muted }}>
            {answeredCount} answered · press 1–{question?.options.length ?? 4} or ← → to navigate
          </div>
        </div>
      </main>

      {exiting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" role="dialog" aria-modal="true">
          <div className="absolute inset-0" style={{ background: "rgba(29,42,68,0.4)" }} onClick={() => setExiting(false)} />
          <div className="relative max-w-md w-full rounded-3xl p-7" style={{ background: surface, border: `1px solid ${border}` }}>
            <h3 className="font-serif text-2xl">Leave for now?</h3>
            <p className="text-[13px] mt-2 leading-relaxed" style={{ color: muted }}>Your progress is already saved. You can pick this up any time from the Screening home.</p>
            <div className="mt-5 flex flex-col gap-2">
              <button onClick={() => setExiting(false)} className="px-4 py-2.5 rounded-full text-[13px] text-white" style={{ background: ink }}>Continue test</button>
              <button onClick={() => { upsertSession({ ...session, updatedAt: Date.now() }); nav({ to: "/screening" }); }} className="px-4 py-2.5 rounded-full text-[13px]" style={{ background: surface2, color: ink }}>Save & exit</button>
              <button
                onClick={() => { upsertSession({ ...session, status: "abandoned", updatedAt: Date.now() }); nav({ to: "/screening" }); }}
                className="px-4 py-2.5 rounded-full text-[13px]"
                style={{ color: "#B54848" }}
              >
                Discard this attempt
              </button>
            </div>
            <button onClick={() => setExiting(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: surface2 }} aria-label="close"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
