import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, MessageCircle, Mic, Brain, Wrench, Sparkles, HeartPulse, TrendingUp,
  Palette, Settings2, ChevronRight, Plus, Clock, Pin, Archive, Star, Flame, BookOpen,
} from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import {
  loadConvs, newConv, upsertConv, STUDENT_CONTEXT,
  type ConvType, CONV_TITLES,
} from "@/lib/peacebot-store";

export const Route = createFileRoute("/peacebot/")({
  head: () => ({ meta: [
    { title: "Peace Bot — your quiet companion · PeaceCode" },
    { name: "description", content: "An emotionally intelligent AI companion for students. Talk, reflect, focus, sleep, celebrate." },
  ]}),
  component: PeaceBotHome,
});

const { surface, surface2, border, ink, muted, primary, soft } = palette;

const QUICK: { type: ConvType; label: string; hint: string }[] = [
  { type: "free", label: "Talk freely", hint: "just be here" },
  { type: "anxious", label: "I'm feeling anxious", hint: "settle the body first" },
  { type: "overthinking", label: "I'm overthinking", hint: "slow the loop" },
  { type: "focus", label: "Help me focus", hint: "one small hour" },
  { type: "motivation", label: "Motivation", hint: "not toxic, just honest" },
  { type: "study", label: "Study planning", hint: "shape the week" },
  { type: "relationship", label: "Relationship advice", hint: "gentle mirror" },
  { type: "placement", label: "Placement stress", hint: "one step at a time" },
  { type: "homesick", label: "Homesickness", hint: "home in small things" },
  { type: "sleep", label: "Sleep help", hint: "soften into night" },
  { type: "exam", label: "Exam panic", hint: "breathe, then plan" },
  { type: "career", label: "Career confusion", hint: "map the fog" },
  { type: "vent", label: "Vent", hint: "no advice, just space" },
  { type: "celebrate", label: "Celebrate something", hint: "i want to hear it" },
  { type: "ask", label: "Ask anything", hint: "no wrong questions" },
];

const HUBS = [
  { to: "/peacebot/voice",    icon: Mic,        title: "Voice mode",         sub: "talk out loud, hands free" },
  { to: "/peacebot/memory",   icon: Brain,      title: "Memory",             sub: "what peace remembers about you" },
  { to: "/peacebot/tools",    icon: Wrench,     title: "AI tools hub",       sub: "study, career, writing, coding" },
  { to: "/peacebot/mental",   icon: HeartPulse, title: "Mental health tools", sub: "cbt, grounding, self-compassion" },
  { to: "/peacebot/insights", icon: TrendingUp, title: "AI insights",        sub: "your emotional trends this week" },
  { to: "/peacebot/prompts",  icon: BookOpen,   title: "Prompt library",     sub: "100+ one-tap starters" },
  { to: "/peacebot/avatar",   icon: Palette,    title: "Avatar & style",     sub: "choose peace's voice" },
  { to: "/peacebot/settings", icon: Settings2,  title: "AI settings",        sub: "memory, privacy, export" },
] as const;

const TRENDING = [
  { tool: "study planner", to: "/peacebot/tools" },
  { tool: "assignment breakdown", to: "/peacebot/tools" },
  { tool: "interview practice", to: "/peacebot/tools" },
  { tool: "cbt conversation", to: "/peacebot/mental" },
  { tool: "grounding 5-4-3-2-1", to: "/peacebot/mental" },
];

function PeaceBotHome() {
  const nav = useNavigate();
  const [convs, setConvs] = useState(() => loadConvs());
  const [q, setQ] = useState("");

  useEffect(() => {
    const sync = () => setConvs(loadConvs());
    window.addEventListener("peacebot-store", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("peacebot-store", sync); window.removeEventListener("storage", sync); };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "still awake" : hour < 12 ? "good morning" : hour < 17 ? "good afternoon" : hour < 21 ? "good evening" : "quiet night";

  const filtered = useMemo(() => {
    if (!q.trim()) return convs;
    const s = q.toLowerCase();
    return convs.filter((c) =>
      c.title.toLowerCase().includes(s) ||
      c.messages.some((m) => m.text.toLowerCase().includes(s))
    );
  }, [q, convs]);

  const recent = filtered.filter((c) => !c.archived).slice(0, 6);
  const pinned = filtered.filter((c) => c.pinned && !c.archived).slice(0, 4);
  const last = convs.filter((c) => !c.archived)[0];

  const start = (type: ConvType) => {
    const c = newConv(type);
    upsertConv(c);
    nav({ to: "/peacebot/c/$id", params: { id: c.id } });
  };

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-10">
        {/* hero */}
        <header className="relative rounded-[32px] overflow-hidden p-8 lg:p-12" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="absolute -top-24 -right-24 w-[380px] h-[380px] rounded-full blur-3xl opacity-40" style={{ background: `radial-gradient(circle, ${soft}, transparent 70%)` }}/>
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-3">peace bot</div>
              <h1 className="font-serif text-[42px] sm:text-[52px] leading-[1.05] tracking-tight" style={{ color: ink }}>
                {greeting}, {STUDENT_CONTEXT.name}.
              </h1>
              <p className="mt-3 text-[15px] max-w-xl" style={{ color: muted }}>
                i've been keeping your day in mind — {STUDENT_CONTEXT.mood} mood, {STUDENT_CONTEXT.sleepHours}h of sleep, day {STUDENT_CONTEXT.streak} of your streak. what feels true right now?
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => start("free")} className="px-5 h-11 rounded-full text-[13px] flex items-center gap-2 transition hover:opacity-90" style={{ background: ink, color: "var(--pc-bg)" }}>
                  <MessageCircle className="w-4 h-4" strokeWidth={1.5}/> new conversation
                </button>
                {last && (
                  <Link to="/peacebot/c/$id" params={{ id: last.id }} className="px-5 h-11 rounded-full text-[13px] flex items-center gap-2" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
                    <Clock className="w-4 h-4" strokeWidth={1.5}/> continue: {last.title}
                  </Link>
                )}
                <Link to="/peacebot/voice" className="px-5 h-11 rounded-full text-[13px] flex items-center gap-2" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
                  <Mic className="w-4 h-4" strokeWidth={1.5}/> voice mode
                </Link>
              </div>
            </div>
            <div className="rounded-2xl p-4 min-w-[220px]" style={{ background: "var(--pc-surface2)", border: `1px solid ${border}` }}>
              <div className="text-[9px] tracking-[0.3em] uppercase opacity-50 mb-2">daily check-in</div>
              <div className="font-serif text-[22px] leading-tight">how is your chest today?</div>
              <div className="mt-3 flex gap-1.5">
                {["tight", "settled", "light"].map((w) => (
                  <button key={w} onClick={() => { const c = newConv("reflection"); c.messages.push({ id: Math.random().toString(36).slice(2), from: "me", text: `my chest feels ${w}`, ts: Date.now() }); upsertConv(c); nav({ to: "/peacebot/c/$id", params: { id: c.id }}); }} className="flex-1 h-9 rounded-full text-[11px] transition hover:opacity-90" style={{ background: surface, border: `1px solid ${border}` }}>{w}</button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[10px]" style={{ color: primary }}>
                <Flame className="w-3 h-3" strokeWidth={1.5}/> day {STUDENT_CONTEXT.streak} — bloom
              </div>
            </div>
          </div>
        </header>

        {/* search */}
        <div className="flex items-center gap-3 rounded-2xl px-5 py-3.5" style={{ background: surface, border: `1px solid ${border}` }}>
          <Search className="w-4 h-4 opacity-50"/>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search conversations, memories, prompts…" className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-40"/>
          <span className="text-[10px] opacity-40">{convs.length} chats</span>
        </div>

        {/* quick actions */}
        <section>
          <SectionTitle title="quick actions" hint="each opens a different conversation" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-4">
            {QUICK.map((q) => (
              <button key={q.type} onClick={() => start(q.type)} className="group text-left p-4 rounded-2xl transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-30px_rgba(0,0,0,0.35)]" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="text-[13px] font-medium" style={{ color: ink }}>{q.label}</div>
                <div className="mt-1 text-[11px]" style={{ color: muted }}>{q.hint}</div>
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition text-[10px] flex items-center gap-1" style={{ color: primary }}>
                  open <ChevronRight className="w-3 h-3"/>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* recent + suggested + pinned */}
        <section className="grid lg:grid-cols-3 gap-5">
          <Card title="continue" icon={Clock}>
            {recent.length === 0 && <Empty label="no conversations yet — start one above" />}
            <div className="flex flex-col divide-y" style={{ borderColor: border }}>
              {recent.map((c) => (
                <Link key={c.id} to="/peacebot/c/$id" params={{ id: c.id }} className="flex items-center justify-between py-3 group">
                  <div className="min-w-0">
                    <div className="text-[13px] truncate" style={{ color: ink }}>{c.title}</div>
                    <div className="text-[11px] truncate" style={{ color: muted }}>{c.messages.at(-1)?.text}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition"/>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="suggested for tonight" icon={Sparkles}>
            <div className="flex flex-col gap-2.5">
              <SuggestBtn label="reflect on today's small win" onClick={() => start("reflection")}/>
              <SuggestBtn label="4-7-8 breath together" onClick={() => nav({ to: "/breathe" })}/>
              <SuggestBtn label="write one line in your journal" onClick={() => nav({ to: "/journal" })}/>
              <SuggestBtn label="sleep help conversation" onClick={() => start("sleep")}/>
            </div>
            <div className="mt-3 text-[10px] opacity-50">why this? your sleep dipped last night · you journaled 2 days ago</div>
          </Card>

          <Card title="pinned" icon={Pin}>
            {pinned.length === 0 && <Empty label="pin conversations to keep them close"/>}
            {pinned.map((c) => (
              <Link key={c.id} to="/peacebot/c/$id" params={{ id: c.id }} className="flex items-center justify-between py-2.5 border-b last:border-0 group" style={{ borderColor: border }}>
                <span className="text-[13px] truncate" style={{ color: ink }}>{c.title}</span>
                <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition"/>
              </Link>
            ))}
          </Card>
        </section>

        {/* trending tools */}
        <section>
          <SectionTitle title="trending ai tools" hint="what students are using this week"/>
          <div className="flex gap-2 mt-4 flex-wrap">
            {TRENDING.map((t) => (
              <Link key={t.tool} to={t.to} className="px-4 h-9 rounded-full text-[12px] flex items-center gap-2 transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
                <Sparkles className="w-3 h-3" strokeWidth={1.5}/> {t.tool}
              </Link>
            ))}
          </div>
        </section>

        {/* hubs */}
        <section>
          <SectionTitle title="peace bot ecosystem" hint="every page has its own space"/>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {HUBS.map((h) => {
              const Icon = h.icon;
              return (
                <Link key={h.to} to={h.to} className="group p-5 rounded-2xl transition hover:-translate-y-0.5 hover:shadow-[0_25px_50px_-30px_rgba(0,0,0,0.4)]" style={{ background: surface, border: `1px solid ${border}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: soft, color: ink }}>
                    <Icon className="w-4 h-4" strokeWidth={1.5}/>
                  </div>
                  <div className="font-serif text-[18px]" style={{ color: ink }}>{h.title}</div>
                  <div className="mt-1 text-[12px]" style={{ color: muted }}>{h.sub}</div>
                  <div className="mt-3 text-[11px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition" style={{ color: primary }}>
                    open <ChevronRight className="w-3 h-3"/>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* history preview */}
        <section>
          <div className="flex items-center justify-between">
            <SectionTitle title="conversation history" hint={`${convs.length} in total`}/>
            <button onClick={() => start("free")} className="text-[11px] flex items-center gap-1 px-3 h-8 rounded-full" style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
              <Plus className="w-3 h-3"/> new
            </button>
          </div>
          <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
            {filtered.slice(0, 10).map((c, i) => (
              <Link key={c.id} to="/peacebot/c/$id" params={{ id: c.id }} className="flex items-center justify-between px-5 py-3.5 group" style={{ borderTop: i ? `1px solid ${border}` : "none" }}>
                <div className="flex items-center gap-3 min-w-0">
                  {c.pinned ? <Pin className="w-3.5 h-3.5" style={{ color: primary }}/> : c.favorite ? <Star className="w-3.5 h-3.5" style={{ color: primary }}/> : c.archived ? <Archive className="w-3.5 h-3.5 opacity-40"/> : <MessageCircle className="w-3.5 h-3.5 opacity-40"/>}
                  <div className="min-w-0">
                    <div className="text-[13px] truncate" style={{ color: ink }}>{c.title}</div>
                    <div className="text-[11px] truncate" style={{ color: muted }}>{c.messages.at(-1)?.text}</div>
                  </div>
                </div>
                <div className="text-[10px] opacity-40 shrink-0 ml-3">{fmtWhen(c.updatedAt)}</div>
              </Link>
            ))}
            {filtered.length === 0 && <div className="p-8 text-center text-[13px]" style={{ color: muted }}>no conversations yet.</div>}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="text-[9px] tracking-[0.35em] uppercase opacity-50">{title}</div>
        {hint && <div className="mt-1 text-[12px]" style={{ color: muted }}>{hint}</div>}
      </div>
    </div>
  );
}
function Card({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5 opacity-60" strokeWidth={1.5}/>
        <span className="text-[10px] tracking-[0.32em] uppercase opacity-60">{title}</span>
      </div>
      {children}
    </div>
  );
}
function Empty({ label }: { label: string }) {
  return <div className="text-[12px] py-3" style={{ color: muted }}>{label}</div>;
}
function SuggestBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left w-full p-3 rounded-xl text-[13px] transition hover:-translate-y-0.5 flex items-center justify-between group" style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
      <span>{label}</span>
      <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition"/>
    </button>
  );
}
function fmtWhen(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}
