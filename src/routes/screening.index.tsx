import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, palette } from "@/components/AppShell";
import {
  ArrowRight, ClipboardList, Sparkles, PlayCircle, History, BookOpen, Shield,
  HelpCircle, Settings2, Bookmark, TrendingUp, Bell,
} from "lucide-react";
import { TESTS, loadSessions, loadPrefs, overallWellness, type Session } from "@/lib/screening-store";

export const Route = createFileRoute("/screening/")({
  head: () => ({
    meta: [
      { title: "Mental Health Screening — PeaceCode" },
      { name: "description", content: "Validated, gentle screening for depression, anxiety, stress, sleep, and wellbeing — with AI insights that stay with you." },
    ],
  }),
  component: ScreeningHome,
});

const { surface, surface2, border, ink, muted, primary, soft } = palette;

function ScreeningHome() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [prefs, setPrefs] = useState(() => loadPrefs());
  useEffect(() => { setSessions(loadSessions()); }, []);

  const last = sessions.find((s) => s.status === "completed");
  const inProgress = sessions.find((s) => s.status === "in_progress");
  const wellness = overallWellness(sessions);
  const nextRecommended = useMemo(() => {
    if (!last) return TESTS.find((t) => t.id === "phq9")!;
    const seen = new Set(sessions.filter((s) => s.status === "completed").map((s) => s.testId));
    return TESTS.find((t) => !seen.has(t.id)) ?? TESTS[0];
  }, [last, sessions]);

  const featured = TESTS.filter((t) => t.featured);
  const daysSince = last?.completedAt ? Math.floor((Date.now() - last.completedAt) / 86400000) : null;

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
        {/* breadcrumb */}
        <nav className="text-[11px] tracking-[0.2em] uppercase mb-6 flex items-center gap-2" style={{ color: muted }}>
          <Link to="/" className="hover:underline">Home</Link>
          <span>·</span>
          <span style={{ color: ink }}>Screening</span>
        </nav>

        {/* hero */}
        <section className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 mb-10">
          <div className="rounded-[28px] p-8 lg:p-10 relative overflow-hidden flex" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle,#D5C9F7,transparent 70%)" }} />
            <div className="relative flex flex-col justify-center w-full">
              <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase px-2.5 py-1 rounded-full mb-4" style={{ background: surface2, color: primary }}>
                <ClipboardList className="w-3 h-3" strokeWidth={1.5} /> Screening
              </div>
              <h1 className="font-serif text-[38px] sm:text-[46px] leading-[1.05] tracking-tight">A quiet check-in with yourself.</h1>
              <p className="mt-4 max-w-lg text-[14px] leading-relaxed" style={{ color: muted }}>
                Validated assessments — trusted by clinicians, worded gently for students. Take one at a time. Your answers stay on this device unless you say otherwise.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link to="/screening/library" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] text-white transition hover:opacity-90" style={{ background: ink }}>
                  Start a new assessment <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {inProgress && (
                  <Link to="/screening/assessment/$id" params={{ id: inProgress.testId }} search={{ resume: inProgress.id }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px]" style={{ background: surface2, color: ink }}>
                    <PlayCircle className="w-3.5 h-3.5" /> Resume previous
                  </Link>
                )}
                <Link to="/screening/history" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px]" style={{ border: `1px solid ${border}`, color: muted }}>
                  <History className="w-3.5 h-3.5" /> History
                </Link>
              </div>
            </div>
          </div>

          {/* wellness ring */}
          <div className="rounded-[28px] p-6 flex flex-col" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>Overall wellness</div>
            <div className="flex-1 flex items-center justify-center py-4">
              <WellnessRing value={wellness} />
            </div>
            <div className="text-[12px] text-center leading-relaxed" style={{ color: muted }}>
              {wellness === null ? "Take your first assessment to see a soft baseline." : "Averaged across your latest completed checks."}
            </div>
          </div>
        </section>

        {/* status strip */}
        <section className="grid sm:grid-cols-3 gap-4 mb-10">
          <StatusCard
            title="Last screening"
            body={last ? `${TESTS.find((t) => t.id === last.testId)?.code} · ${last.bandLabel}` : "None yet"}
            hint={daysSince !== null ? `${daysSince === 0 ? "today" : daysSince + " days ago"}` : "start any time"}
            to={last ? "/screening/results/$id" : "/screening/library"}
            params={last ? { id: last.id } : undefined}
          />
          <StatusCard
            title="Next recommended"
            body={`${nextRecommended.code} · ${nextRecommended.name}`}
            hint={`${nextRecommended.minutes} min · ${nextRecommended.difficulty}`}
            to="/screening/test/$id"
            params={{ id: nextRecommended.id }}
          />
          <StatusCard
            title="Continue previous"
            body={inProgress ? TESTS.find((t) => t.id === inProgress.testId)?.name ?? "In progress" : "Nothing paused"}
            hint={inProgress ? `${inProgress.currentIndex + 1} / ${TESTS.find((t) => t.id === inProgress.testId)?.questions.length}` : "clean slate"}
            to={inProgress ? "/screening/assessment/$id" : "/screening/library"}
            params={inProgress ? { id: inProgress.testId } : undefined}
            search={inProgress ? { resume: inProgress.id } : undefined}
          />
        </section>

        {/* featured tests */}
        <section className="mb-10">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>Featured</div>
              <h2 className="font-serif text-2xl mt-1">Three gentle places to start</h2>
            </div>
            <Link to="/screening/library" className="text-[12px] inline-flex items-center gap-1" style={{ color: primary }}>
              Browse all 12 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {featured.map((t) => (
              <Link key={t.id} to="/screening/test/$id" params={{ id: t.id }} className="group rounded-[24px] p-5 transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] tracking-[0.25em] uppercase px-2 py-1 rounded-full" style={{ background: surface2, color: primary }}>{t.code}</span>
                  <ArrowRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                </div>
                <h3 className="font-serif text-lg mb-1.5">{t.name}</h3>
                <p className="text-[12.5px] leading-relaxed line-clamp-3" style={{ color: muted }}>{t.short}</p>
                <div className="mt-4 flex items-center gap-3 text-[11px]" style={{ color: muted }}>
                  <span>{t.minutes} min</span><span>·</span><span>{t.questions.length} questions</span><span>·</span><span>{t.difficulty}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* history preview + quick links */}
        <section className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 mb-10">
          <div className="rounded-[28px] p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>Recent</div>
                <h2 className="font-serif text-xl mt-1">Your quiet log</h2>
              </div>
              <Link to="/screening/history" className="text-[12px]" style={{ color: primary }}>View all</Link>
            </div>
            {sessions.filter((s) => s.status === "completed").slice(0, 4).length === 0 ? (
              <div className="text-[13px] py-6 text-center" style={{ color: muted }}>
                No screenings yet. Start with one when you have five quiet minutes.
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: border }}>
                {sessions.filter((s) => s.status === "completed").slice(0, 4).map((s) => {
                  const t = TESTS.find((x) => x.id === s.testId);
                  if (!t) return null;
                  return (
                    <li key={s.id}>
                      <Link to="/screening/results/$id" params={{ id: s.id }} className="flex items-center justify-between py-3 hover:opacity-80">
                        <div className="min-w-0">
                          <div className="text-[13px]">{t.name}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: muted }}>
                            {new Date(s.completedAt ?? s.updatedAt).toLocaleDateString()} · {s.bandLabel}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <QuickLink to="/screening/library" icon={<Sparkles className="w-4 h-4" />} title="All assessments" hint="Browse 12 validated screens" />
            <QuickLink to="/screening/history" icon={<TrendingUp className="w-4 h-4" />} title="Trends & history" hint="See how you're shifting" />
            <QuickLink to="/screening/resources" icon={<BookOpen className="w-4 h-4" />} title="Resources & help" hint="FAQ · emergency · privacy" />
            <QuickLink to="/screening/settings" icon={<Settings2 className="w-4 h-4" />} title="Screening settings" hint="Reminders · language · data" />
          </div>
        </section>

        <footer className="text-center text-[11px] pt-4 pb-8" style={{ color: muted }}>
          Not a medical diagnosis. In crisis, call iCall <span style={{ color: ink }}>9152987821</span> or Vandrevala Foundation <span style={{ color: ink }}>1860-2662-345</span>.
        </footer>
      </main>
    </AppShell>
  );
}

function WellnessRing({ value }: { value: number | null }) {
  const v = value ?? 0;
  const r = 62, C = 2 * Math.PI * r;
  const off = C - (v / 100) * C;
  return (
    <div className="relative w-[160px] h-[160px]">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke={surface2} strokeWidth="10" />
        <circle cx="80" cy="80" r={r} fill="none" stroke={primary} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={value === null ? C : off} style={{ transition: "stroke-dashoffset 800ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-serif text-4xl">{value === null ? "—" : value}</div>
        <div className="text-[10px] tracking-[0.3em] uppercase mt-1" style={{ color: muted }}>/ 100</div>
      </div>
    </div>
  );
}

function StatusCard({ title, body, hint, to, params, search }: { title: string; body: string; hint: string; to: string; params?: Record<string, string>; search?: Record<string, string> }) {
  return (
    <Link to={to as never} params={params as never} search={search as never} className="rounded-2xl p-5 flex items-start justify-between gap-3 transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="min-w-0">
        <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>{title}</div>
        <div className="text-[14px] mt-1.5 truncate">{body}</div>
        <div className="text-[11px] mt-1" style={{ color: muted }}>{hint}</div>
      </div>
      <ArrowRight className="w-4 h-4 opacity-30 shrink-0 mt-1" />
    </Link>
  );
}

function QuickLink({ to, icon, title, hint }: { to: string; icon: React.ReactNode; title: string; hint: string }) {
  return (
    <Link to={to as never} className="rounded-2xl p-4 flex items-center gap-3 transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: surface2, color: primary }}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px]">{title}</div>
        <div className="text-[11px]" style={{ color: muted }}>{hint}</div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 opacity-40" />
    </Link>
  );
}
