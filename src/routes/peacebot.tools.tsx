import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Sparkles, Send } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import { peacebotTask } from "@/lib/peacebot-ai.functions";

export const Route = createFileRoute("/peacebot/tools")({
  head: () => ({ meta: [{ title: "Peace Bot · AI tools hub" }] }),
  component: ToolsHub,
});
const { surface, surface2, border, ink, muted, soft } = palette;

const TOOLS = [
  { id: "study-planner", title: "study planner", hint: "shape a walkable week", ph: "paste your subjects, deadlines, exam dates…" },
  { id: "assignment-breakdown", title: "assignment breakdown", hint: "large task → small steps", ph: "paste your assignment brief" },
  { id: "resume-review", title: "resume review", hint: "sharpen wording and impact", ph: "paste your resume text" },
  { id: "cover-letter", title: "cover letter", hint: "warm, specific, human", ph: "role + a few lines about you" },
  { id: "career-guidance", title: "career guidance", hint: "map the fog", ph: "what's confusing you right now?" },
  { id: "productivity-coach", title: "productivity coach", hint: "one honest system", ph: "describe how your day usually goes" },
  { id: "habit-builder", title: "habit builder", hint: "small, repeatable", ph: "the habit you want to build" },
  { id: "daily-planner", title: "daily planner", hint: "a soft schedule", ph: "what's on your plate today?" },
  { id: "research-assistant", title: "research assistant", hint: "sources, summaries, structure", ph: "your topic or question" },
  { id: "brainstorm", title: "brainstorming", hint: "10 angles, then narrow", ph: "what are you trying to think through?" },
  { id: "interview-practice", title: "interview practice", hint: "questions with feedback", ph: "role + your background" },
  { id: "coding-helper", title: "coding helper", hint: "explain, refactor, debug", ph: "paste your code or error" },
  { id: "writing-coach", title: "writing coach", hint: "clearer, warmer, tighter", ph: "paste your draft" },
  { id: "presentation", title: "presentation builder", hint: "slide outline + speaker notes", ph: "topic and audience" },
  { id: "flashcards", title: "flashcard generator", hint: "q → a pairs", ph: "paste your notes or topic" },
  { id: "quiz", title: "quiz generator", hint: "test yourself", ph: "topic + difficulty" },
  { id: "email", title: "email writer", hint: "professional, kind, brief", ph: "who + why + what outcome" },
  { id: "timeblocking", title: "time blocking", hint: "gentle, realistic blocks", ph: "your tasks and available hours" },
  { id: "decision", title: "decision helper", hint: "pros, cons, gut", ph: "the decision + options" },
];

function ToolsHub() {
  const [active, setActive] = useState<typeof TOOLS[number] | null>(null);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!active || !input.trim()) return;
    setBusy(true); setReply("");
    try {
      const r = await peacebotTask({ data: { tool: active.title, input } });
      setReply(r.reply);
    } finally { setBusy(false); }
  };

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/peacebot" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><ArrowLeft className="w-4 h-4"/></Link>
          <div>
            <div className="text-[10px] tracking-[0.35em] uppercase opacity-50">peace bot</div>
            <h1 className="font-serif text-[36px] leading-tight">ai tools hub</h1>
            <p className="text-[13px] mt-1" style={{ color: muted }}>focused, one-shot tools for study, career, writing, coding.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOLS.map((t) => (
            <button key={t.id} onClick={() => { setActive(t); setInput(""); setReply(""); }} className={`text-left p-5 rounded-2xl transition hover:-translate-y-0.5`} style={{ background: active?.id === t.id ? soft : surface, border: `1px solid ${border}` }}>
              <div className="text-[13px] font-medium" style={{ color: ink }}>{t.title}</div>
              <div className="mt-1 text-[11px]" style={{ color: muted }}>{t.hint}</div>
            </button>
          ))}
        </div>

        {active && (
          <div className="p-5 rounded-2xl space-y-3" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 flex items-center gap-2"><Sparkles className="w-3 h-3"/> {active.title}</div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5} placeholder={active.ph} className="w-full rounded-xl px-4 py-3 bg-transparent outline-none text-[14px]" style={{ background: surface2, border: `1px solid ${border}` }}/>
            <div className="flex justify-end">
              <button onClick={run} disabled={busy || !input.trim()} className="h-10 px-5 rounded-full text-[13px] flex items-center gap-2 disabled:opacity-40" style={{ background: ink, color: "var(--pc-bg)" }}>
                <Send className="w-4 h-4"/> {busy ? "thinking…" : "run"}
              </button>
            </div>
            {reply && (
              <div className="whitespace-pre-wrap text-[14px] leading-relaxed rounded-xl p-4" style={{ background: surface2, border: `1px solid ${border}` }}>{reply}</div>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}
