import { createFileRoute } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card } from "./counselling";
import { listAppointments, listHomework, listGoals } from "@/lib/counselling-store";
import { useMemo } from "react";
import { Download } from "lucide-react";

export const Route = createFileRoute("/counselling/reports")({
  component: Reports,
});

function Reports() {
  const { ink, muted, primary, surface2, border } = palette;
  const appts = listAppointments();

  const moodScale: Record<string, number> = { calm: 8, hopeful: 7, okay: 6, tired: 4, anxious: 3, low: 2, overwhelmed: 2 };
  const scoreMood = (m?: string) => (m ? moodScale[m.toLowerCase()] ?? 5 : 5);

  const stats = useMemo(() => {
    const total = appts.length;
    const completed = appts.filter(a => a.status === "completed").length;
    const attendance = total ? Math.round((completed / total) * 100) : 0;
    const homework = listHomework();
    const hwRate = homework.length ? Math.round(homework.filter(h => h.done).length / homework.length * 100) : 0;

    // Real trend derived from chronological questionnaire + mood entries.
    const chrono = [...appts].sort((a, b) => a.scheduledFor - b.scheduledFor);
    const series = chrono
      .filter(a => a.questionnaire || a.moodBefore || a.moodAfter)
      .slice(-8)
      .map((a, i) => ({
        i,
        label: new Date(a.scheduledFor).toLocaleDateString([], { day: "numeric", month: "short" }),
        mood: scoreMood(a.moodAfter ?? a.moodBefore ?? a.questionnaire?.currentMood),
        stress: a.questionnaire ? 10 - a.questionnaire.stress : 5,
        sleep: a.questionnaire ? Math.max(0, Math.min(10, a.questionnaire.sleep)) : 6,
      }));

    return { total, completed, attendance, hwRate, series };
  }, [appts]);

  const goals = listGoals();

  const exportPdf = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <>
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Reports</div>
          <h1 className="font-serif text-[26px]" style={{ color: ink }}>Your progress, quietly measured</h1>
        </div>
        <button onClick={exportPdf} className="rounded-full px-3 py-1.5 text-[12.5px] inline-flex items-center gap-1.5" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
          <Download className="w-3.5 h-3.5" /> Download PDF
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <StatBig label="Sessions" value={stats.total} />
        <StatBig label="Completed" value={stats.completed} />
        <StatBig label="Attendance" value={`${stats.attendance}%`} />
        <StatBig label="Homework done" value={`${stats.hwRate}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <Card>
          <div className="font-serif text-[17px] mb-3" style={{ color: ink }}>Mood, calm & sleep · your sessions</div>
          {stats.series.length < 2 ? (
            <p className="text-[13px]" style={{ color: muted }}>
              Trends appear after your second session. We derive them from the mood + intake answers you share before each meeting.
            </p>
          ) : (
            <>
              <TrendChart weeks={stats.series} />
              <div className="mt-2 flex flex-wrap gap-3 text-[11.5px]" style={{ color: muted }}>
                <Legend color="#3f6d51" label="Mood" />
                <Legend color="#c14a5a" label="Calm (10 − stress)" />
                <Legend color={primary} label="Sleep (hrs)" />
              </div>
            </>
          )}
        </Card>

        <Card>
          <div className="font-serif text-[17px] mb-3" style={{ color: ink }}>Wellness goals</div>
          {goals.length === 0 ? (
            <p className="text-[13px]" style={{ color: muted }}>Your counsellor will add goals with you after the first session.</p>
          ) : (
            <div className="space-y-3">
              {goals.map(g => (
                <div key={g.id}>
                  <div className="flex justify-between text-[12.5px] mb-1" style={{ color: muted }}>
                    <span style={{ color: ink }}>{g.title}</span><span>{g.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: surface2 }}>
                    <div style={{ width: `${g.progress}%`, height: "100%", background: primary, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="font-serif text-[17px] mb-2" style={{ color: ink }}>What this means</div>
        <p className="text-[14px]" style={{ color: muted }}>
          Progress in mental health is rarely linear. Look for gentler troughs and higher plateaus, not straight climbs.
          If your attendance holds and homework averages above 60%, you're doing more than most.
        </p>
      </Card>
    </>
  );
}

function StatBig({ label, value }: { label: string; value: number | string }) {
  const { ink, muted } = palette;
  return (
    <Card>
      <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>{label}</div>
      <div className="font-serif text-[30px] leading-tight mt-1" style={{ color: ink }}>{value}</div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />{label}</span>;
}

function TrendChart({ weeks }: { weeks: { i: number; mood: number; stress: number; sleep: number }[] }) {
  const w = 520, h = 180, pad = 20;
  const xs = weeks.map((_, i) => pad + (i * (w - pad * 2)) / (weeks.length - 1));
  const yFor = (v: number) => pad + (h - pad * 2) * (1 - Math.max(0, Math.min(10, v)) / 10);

  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${yFor(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <g stroke="rgba(0,0,0,0.06)">
        {[2,4,6,8].map(t => (<line key={t} x1={pad} x2={w-pad} y1={yFor(t)} y2={yFor(t)} />))}
      </g>
      <path d={path(weeks.map(w => w.mood))} fill="none" stroke="#3f6d51" strokeWidth="2.5" strokeLinecap="round" />
      <path d={path(weeks.map(w => w.stress))} fill="none" stroke="#c14a5a" strokeWidth="2.5" strokeLinecap="round" />
      <path d={path(weeks.map(w => w.sleep))} fill="none" stroke="var(--pc-primary)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
