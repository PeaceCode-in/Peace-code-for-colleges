import { createFileRoute, Link } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip } from "./counselling";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { loadSessions, TESTS, type Session } from "@/lib/screening-store";

export const Route = createFileRoute("/counselling/assessments")({
  component: Assessments,
});

// Curated set that most counsellors ask about first.
const FEATURED_IDS = ["phq9", "gad7", "who5", "dass21"];

function Assessments() {
  const { ink, muted, surface, surface2, border, soft } = palette;
  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => { setSessions(loadSessions()); }, []);

  const tests = FEATURED_IDS
    .map((id) => TESTS.find((t) => t.id === id))
    .filter(Boolean) as (typeof TESTS)[number][];

  const latestFor = (testId: string) =>
    sessions
      .filter((s) => s.testId === testId)
      .sort((a, b) => (b.completedAt ?? b.updatedAt) - (a.completedAt ?? a.updatedAt))[0];

  const completed = sessions.filter((s) => s.status === "completed").length;

  return (
    <>
      <div className="mb-6">
        <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Assessments</div>
        <h1 className="font-serif text-[26px]" style={{ color: ink }}>Validated screeners, five minutes each</h1>
        <p className="text-[13.5px] mt-1" style={{ color: muted }}>
          {completed > 0
            ? `You've completed ${completed} screener${completed === 1 ? "" : "s"}. Take them again periodically so trends stay honest.`
            : "Take one before your session so your counsellor has a fuller picture."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {tests.map((t) => {
          const last = latestFor(t.id);
          const status: "not_started" | "in_progress" | "completed" = last
            ? last.status === "completed"
              ? "completed"
              : "in_progress"
            : "not_started";
          const tone = status === "completed" ? "success" : status === "in_progress" ? "warn" : "info";
          const statusLabel = status === "completed" ? "Completed" : status === "in_progress" ? "In progress" : "Not started";
          const ctaLabel = status === "completed" ? "Retake" : status === "in_progress" ? "Continue" : "Take now";
          const to = status === "completed" ? "/screening/instructions/$id" : status === "in_progress" ? "/screening/test/$id" : "/screening/instructions/$id";
          return (
            <Card key={t.id}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-serif text-[15px]" style={{ background: soft, color: ink }}>
                  {t.code.replace("-", "")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-[18px]" style={{ color: ink }}>{t.code}</div>
                  <div className="text-[12px]" style={{ color: muted }}>{t.category} · {t.minutes} min</div>
                  <p className="mt-1 text-[13px]" style={{ color: muted }}>{t.short}</p>
                </div>
              </div>

              {last && last.status === "completed" && (
                <div className="mt-3 rounded-2xl p-3" style={{ background: surface2, border: `1px solid ${border}` }}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span style={{ color: muted }}>Last score</span>
                    <span style={{ color: ink }}>{last.score} · <span className="font-serif">{last.bandLabel}</span></span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: muted }}>
                    {new Date(last.completedAt ?? last.updatedAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5 items-center justify-between">
                <Chip tone={tone}>{statusLabel}</Chip>
                <Link
                  to={to}
                  params={{ id: t.id }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px]"
                  style={{ background: ink, color: "#fff" }}>
                  {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4" style={{ background: `linear-gradient(180deg, ${soft} 0%, ${surface} 100%)` }}>
        <div className="font-serif text-[17px] mb-1" style={{ color: ink }}>Results, trends & retakes</div>
        <p className="text-[13.5px]" style={{ color: muted }}>Scored results, trend lines, and retake reminders live in the Screening module — with {TESTS.length} validated tests in total.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/screening/library" className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px]" style={{ background: ink, color: "#fff" }}>Browse all tests <ArrowRight className="w-3.5 h-3.5" /></Link>
          <Link to="/screening/history" className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>My history <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
      </Card>
    </>
  );
}
