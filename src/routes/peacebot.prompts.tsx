import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import { newConv, upsertConv, addMsg } from "@/lib/peacebot-store";

export const Route = createFileRoute("/peacebot/prompts")({
  head: () => ({ meta: [{ title: "Peace Bot · prompt library" }] }),
  component: PromptLibrary,
});
const { surface, surface2, border, ink, muted, soft } = palette;

type P = { cat: string; text: string };
const PROMPTS: P[] = [
  ...[
    "help me untangle a thought that keeps coming back",
    "i had a panic moment — walk me through it slowly",
    "why do i feel low without a reason today",
    "i keep comparing myself to my friends — help",
    "i can't sleep, my head won't stop",
    "help me feel less lonely tonight",
    "i want to cry but i can't — hold space",
    "give me a 2-minute grounding exercise",
    "help me reframe: 'i'm falling behind'",
    "check in with me like an old friend",
  ].map((t) => ({ cat: "mental health", text: t })),
  ...[
    "help me talk to my parents about my career choice",
    "my best friend hurt me — help me process",
    "i think i'm in love and it's scary",
    "how do i set a boundary without guilt",
    "help me write a message i've been avoiding",
    "we had a fight — help me see their side",
    "i miss someone who's not good for me",
    "help me feel less clingy",
  ].map((t) => ({ cat: "relationships", text: t })),
  ...[
    "i want to switch fields — help me think",
    "help me answer 'tell me about yourself'",
    "review my resume line by line",
    "10 project ideas for my portfolio",
    "explain a career path in ux design",
    "help me negotiate an internship stipend",
    "prep me for a technical interview tomorrow",
    "help me pick between two offers",
  ].map((t) => ({ cat: "career", text: t })),
  ...[
    "explain recursion like i'm 15",
    "debug this code with me — i'll paste it",
    "walk me through dsa week 1",
    "help me understand async/await",
    "give me a small react project idea",
    "explain big-o with everyday examples",
  ].map((t) => ({ cat: "coding", text: t })),
  ...[
    "i'm homesick — sit with me",
    "help me plan a hostel-friendly workout",
    "my hostel food is depressing — cheer me up",
    "i failed an internal — what now",
    "how do i make new friends in college",
    "help me talk to a professor about a mistake",
  ].map((t) => ({ cat: "college", text: t })),
  ...[
    "how do i pick a research topic",
    "summarize this paper simply — i'll paste",
    "help me write a research question",
    "explain the difference between qualitative and quantitative",
  ].map((t) => ({ cat: "research", text: t })),
  ...[
    "rewrite this paragraph warmly",
    "make this email shorter and kinder",
    "help me write a caption that's honest",
    "tighten my personal statement",
  ].map((t) => ({ cat: "writing", text: t })),
  ...[
    "design my ideal morning",
    "help me stop opening instagram every 10 minutes",
    "make me a soft 3-hour study block",
    "help me finish something i've been avoiding",
  ].map((t) => ({ cat: "productivity", text: t })),
  ...[
    "i'm turning 21 and feel behind — talk to me",
    "help me build a small ritual for sundays",
    "what would a slower life look like for me",
    "help me name what i actually want",
  ].map((t) => ({ cat: "life", text: t })),
];

function PromptLibrary() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const cats = useMemo(() => Array.from(new Set(PROMPTS.map((p) => p.cat))), []);
  const filtered = PROMPTS.filter((p) =>
    (cat === "all" || p.cat === cat) &&
    (!q || p.text.toLowerCase().includes(q.toLowerCase()))
  );

  const use = (text: string) => {
    const c = newConv("free"); c.title = text.slice(0, 40);
    upsertConv(c);
    addMsg(c.id, { from: "me", text });
    nav({ to: "/peacebot/c/$id", params: { id: c.id } });
  };

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/peacebot" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><ArrowLeft className="w-4 h-4"/></Link>
          <div>
            <div className="text-[10px] tracking-[0.35em] uppercase opacity-50">peace bot</div>
            <h1 className="font-serif text-[36px] leading-tight">prompt library</h1>
            <p className="text-[13px] mt-1" style={{ color: muted }}>{PROMPTS.length}+ one-tap starters. no prompt is wrong.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: surface, border: `1px solid ${border}` }}>
          <Search className="w-4 h-4 opacity-50"/>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search prompts…" className="flex-1 bg-transparent outline-none text-[13px]"/>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>all</Chip>
          {cats.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5">
          {filtered.map((p, i) => (
            <button key={i} onClick={() => use(p.text)} className="text-left p-4 rounded-2xl transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="text-[10px] uppercase tracking-[0.3em] opacity-50 mb-1.5">{p.cat}</div>
              <div className="text-[14px] leading-relaxed" style={{ color: ink }}>{p.text}</div>
            </button>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="px-3 h-9 rounded-full text-[11px] capitalize" style={{ background: active ? ink : surface, color: active ? "var(--pc-bg)" : ink, border: `1px solid ${border}` }}>{children}</button>;
}
void surface2; void soft;
