import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Pencil, Share2, Download, QrCode, Check, Flame, ChevronRight, Sparkles, Command,
  BookOpen, Heart, PenLine, Bot, CalendarCheck, UserCheck, Wind, Brain, Users, Target,
  MapPin, Cake, GraduationCap, Languages, Copy, X,
} from "lucide-react";
import {
  loadProfile, THEMES, MOOD_META, completionPercent, formatWhen, type Profile,
} from "@/lib/profile-store";
import {
  surface, surface2, border, ink, muted, primary, soft,
  Panel, SectionLabel, StatTile, Sheet, useCountUp, Toasts, pushToast, Chip,
} from "@/components/profile/primitives";

export const Route = createFileRoute("/profile/")({
  head: () => ({ meta: [{ title: "Your profile · PeaceCode" }, { name: "description", content: "Your PeaceCode identity — journey, achievements, mind garden, and quiet growth over time." }] }),
  component: ProfilePage,
});

const TABS = [
  { key: "overview",     label: "Overview",     to: "/profile" as const },
  { key: "journey",      label: "Journey",      to: "/profile/journey" as const },
  { key: "achievements", label: "Achievements", to: "/profile/achievements" as const },
  { key: "garden",       label: "Mind Garden",  to: "/profile/garden" as const },
  { key: "activity",     label: "Activity",     to: "/profile/activity" as const },
  { key: "friends",      label: "Friends",      to: "/profile/friends" as const },
  { key: "bookmarks",    label: "Resources",    to: "/profile/bookmarks" as const },
  { key: "stats",        label: "Statistics",   to: "/profile/stats" as const },
];

function ProfilePage() {
  const [p, setP] = useState<Profile>(loadProfile());
  const [share, setShare] = useState(false);
  const [cmd, setCmd] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const on = () => setP(loadProfile());
    window.addEventListener("peacecode-profile-updated", on);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd(true); }
    };
    document.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("peacecode-profile-updated", on); document.removeEventListener("keydown", onKey); };
  }, []);

  const theme = THEMES[p.theme];
  const mood = MOOD_META[p.currentMood];
  const { pct, missing } = completionPercent(p);
  const score = useCountUp(p.peaceScore);

  return (
    <div className="relative min-h-screen">
      {/* HERO / cover */}
      <div className="relative pt-6 lg:pt-10 px-4 lg:pl-32 lg:pr-10">
        <div className="relative h-[220px] sm:h-[260px] lg:h-[300px] rounded-[28px] overflow-hidden"
             style={{ background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)` }}>
          <CoverArt />
          <button onClick={() => nav({ to: "/profile/themes" })}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] backdrop-blur-md hover:scale-[1.02] transition"
            style={{ background: "rgba(255,255,255,0.55)", color: theme.ink }}>
            <Sparkles className="w-3.5 h-3.5"/> Change theme
          </button>
          <button onClick={() => nav({ to: "/profile/edit" })}
            className="absolute top-4 right-40 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] backdrop-blur-md hover:scale-[1.02] transition"
            style={{ background: "rgba(255,255,255,0.55)", color: theme.ink }}>
            <Pencil className="w-3.5 h-3.5"/> Edit cover
          </button>
        </div>

        {/* Profile card floating over cover */}
        <div className="relative -mt-16 lg:-mt-20 mx-1 sm:mx-6">
          <Panel className="!p-5 sm:!p-7">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-end">
              {/* Avatar with halo */}
              <div className="relative shrink-0">
                <div className="absolute inset-[-8px] rounded-full opacity-60 animate-[pulseHalo_3.5s_ease-in-out_infinite]"
                     style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 68%)` }} />
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center overflow-hidden font-serif text-[40px]"
                     style={{ background: `linear-gradient(140deg, ${theme.from}, ${theme.glow})`, color: theme.ink, border: `3px solid var(--pc-bg)` }}>
                  {p.photo ? <img src={p.photo} className="w-full h-full object-cover" alt=""/> : (p.preferredName[0] ?? "K")}
                </div>
                {p.verified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center" title="Verified student" style={{ background: primary, color: "#fff", border: `2px solid var(--pc-bg)` }}>
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5}/>
                  </div>
                )}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h1 className="font-serif text-[26px] sm:text-[32px] leading-tight" style={{ color: ink }}>{p.displayName}</h1>
                  <span className="text-[13px]" style={{ color: muted }}>{p.username}</span>
                </div>
                <p className="text-[12.5px] mt-1" style={{ color: muted }}>
                  {p.college} · {p.degree} · Year {p.year}
                </p>
                <p className="text-[13px] mt-3 italic max-w-xl" style={{ color: ink }}>"{p.bio}"</p>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="px-3 py-1 rounded-full text-[11px] flex items-center gap-1.5"
                        style={{ background: soft, color: ink }}>
                    <span>{mood.emoji}</span>{mood.label}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] flex items-center gap-1.5"
                        style={{ background: surface2, color: ink }}>
                    <Flame className="w-3 h-3" style={{ color: primary }}/> {p.streaks.peace} day streak
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px]" style={{ background: surface2, color: muted }}>
                    Member since {new Date(p.memberSince).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Peace score ring */}
              <div className="flex sm:items-center gap-4 lg:gap-6 sm:justify-end">
                <ScoreRing value={score} accent={theme.glow}/>
                <div className="flex flex-col gap-2 sm:min-w-[140px]">
                  <button onClick={() => nav({ to: "/profile/edit" })}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-[12px] transition hover:opacity-90"
                    style={{ background: ink, color: "var(--pc-bg)" }}>
                    <Pencil className="w-3.5 h-3.5"/> Edit
                  </button>
                  <button onClick={() => setShare(true)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-[12px]"
                    style={{ background: surface2, color: ink }}>
                    <Share2 className="w-3.5 h-3.5"/> Share
                  </button>
                </div>
              </div>
            </div>
          </Panel>

          {/* Profile completion */}
          {pct < 100 && (
            <Panel className="mt-4 !p-5">
              <div className="flex items-center gap-4">
                <CompletionRing pct={pct}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <div className="font-serif text-[17px]" style={{ color: ink }}>Profile {pct}% complete</div>
                    <div className="text-[11.5px]" style={{ color: muted }}>{missing.length} left</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {missing.slice(0, 4).map((m) => (
                      <Link key={m} to="/profile/edit" className="px-2.5 py-1 rounded-full text-[10.5px]" style={{ background: soft, color: ink }}>{m}</Link>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 lg:pl-32 lg:pr-10 mt-8">
        <div className="flex items-center justify-between gap-4 pb-3" style={{ borderBottom: `1px solid ${border}` }}>
          <nav className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <Link key={t.key} to={t.to} activeOptions={{ exact: t.key === "overview" }}
                    activeProps={{ style: { color: ink, background: surface2 } }}
                    inactiveProps={{ style: { color: muted } }}
                    className="px-3.5 py-2 rounded-full text-[12.5px] whitespace-nowrap transition hover:opacity-90">
                {t.label}
              </Link>
            ))}
          </nav>
          <button onClick={() => setCmd(true)} className="hidden md:flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full shrink-0" style={{ background: surface2, color: muted }}>
            <Command className="w-3 h-3"/> K
          </button>
        </div>
      </div>

      {/* OVERVIEW body */}
      <div className="px-4 lg:pl-32 lg:pr-10 py-8 pb-32 lg:pb-16 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          <Panel>
            <SectionLabel>About</SectionLabel>
            <p className="text-[13.5px] leading-relaxed" style={{ color: ink }}>{p.about}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <MiniFact icon={<GraduationCap className="w-3.5 h-3.5"/>} label="Department" value={p.department}/>
              <MiniFact icon={<Languages className="w-3.5 h-3.5"/>} label="Languages" value={p.languages.slice(0, 2).join(", ")}/>
              <MiniFact icon={<MapPin className="w-3.5 h-3.5"/>} label="Location" value={p.location}/>
              <MiniFact icon={<Cake className="w-3.5 h-3.5"/>} label="Birthday" value={new Date(p.birthday).toLocaleDateString(undefined, { month: "short", day: "numeric" })}/>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Interests</SectionLabel>
              <Link to="/profile/edit" className="text-[11px]" style={{ color: primary }}>Edit</Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {p.interests.map((i) => <Chip key={i.id} tone="soft">{i.label}</Chip>)}
            </div>
          </Panel>

          {/* Highlights grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Peace Score" value={p.peaceScore} hint="+6 this week"/>
            <StatTile label="Journal" value={`${p.streaks.journal}d`} hint="streak"/>
            <StatTile label="Breathing" value={`${p.streaks.breathing}d`} hint="streak"/>
            <StatTile label="Mind Gym" value={`Lv ${p.garden.level}`} hint={`${p.stats.xp} XP`}/>
          </div>

          {/* Reflection card */}
          <Panel>
            <SectionLabel>Daily reflection</SectionLabel>
            <details className="group">
              <summary className="list-none cursor-pointer flex items-center justify-between">
                <div>
                  <div className="font-serif text-[19px]" style={{ color: ink }}>Today felt <span style={{ color: primary }}>{mood.label.toLowerCase()}</span></div>
                  <div className="text-[12px] mt-0.5" style={{ color: muted }}>{mood.sub}</div>
                </div>
                <ChevronRight className="w-4 h-4 transition group-open:rotate-90" style={{ color: muted }}/>
              </summary>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Link to="/journal" className="p-3 rounded-2xl text-[12px]" style={{ background: soft }}>
                  <PenLine className="w-3.5 h-3.5 mb-1.5" style={{ color: primary }}/>
                  Write a line
                </Link>
                <Link to="/breathe" className="p-3 rounded-2xl text-[12px]" style={{ background: soft }}>
                  <Wind className="w-3.5 h-3.5 mb-1.5" style={{ color: primary }}/>
                  Breathe 4 min
                </Link>
                <Link to="/peacebot" className="p-3 rounded-2xl text-[12px]" style={{ background: soft }}>
                  <Bot className="w-3.5 h-3.5 mb-1.5" style={{ color: primary }}/>
                  Ask Peace Bot
                </Link>
              </div>
            </details>
          </Panel>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Panel>
            <SectionLabel>Mood identity</SectionLabel>
            <div className="text-[36px] mb-1">{mood.emoji}</div>
            <div className="font-serif text-[22px]" style={{ color: ink }}>{p.moodIdentity}</div>
            <div className="text-[12px] mt-1" style={{ color: muted }}>You lean introspective this month — deep listener, slow processor. That's a strength.</div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Quick actions</SectionLabel>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <QA to="/journal" icon={<PenLine className="w-3.5 h-3.5"/>} label="Journal"/>
              <QA to="/breathe" icon={<Wind className="w-3.5 h-3.5"/>} label="Breathe"/>
              <QA to="/peacebot" icon={<Bot className="w-3.5 h-3.5"/>} label="Peace Bot"/>
              <QA to="/resources" icon={<BookOpen className="w-3.5 h-3.5"/>} label="Read"/>
              <QA to="/counselling" icon={<CalendarCheck className="w-3.5 h-3.5"/>} label="Counselling"/>
              <QA to="/mindgym" icon={<Brain className="w-3.5 h-3.5"/>} label="Mind Gym"/>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Notifications</SectionLabel>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: soft, color: primary }}>
                {p.notifications.filter(n => !n.read).length} new
              </span>
            </div>
            <div className="space-y-2">
              {p.notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="flex items-start gap-2.5 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ background: n.read ? "transparent" : primary, border: n.read ? `1px solid ${border}` : "none" }}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] truncate" style={{ color: ink }}>{n.title}</div>
                    <div className="text-[10.5px]" style={{ color: muted }}>{formatWhen(n.at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionLabel>Community</SectionLabel>
            <div className="grid grid-cols-3 gap-2 text-center">
              <SmallStat n={128} label="Followers"/>
              <SmallStat n={94} label="Following"/>
              <SmallStat n={p.friends.filter(f => f.status === "friend").length} label="Friends"/>
            </div>
            <Link to="/profile/friends" className="mt-3 inline-flex items-center gap-1 text-[11.5px]" style={{ color: primary }}>
              See all friends <ChevronRight className="w-3 h-3"/>
            </Link>
          </Panel>

          <Panel>
            <SectionLabel>Privacy</SectionLabel>
            <div className="text-[12px]" style={{ color: muted }}>Fine-tune who sees each section of your profile.</div>
            <Link to="/profile/privacy" className="mt-3 inline-flex items-center gap-1 text-[11.5px]" style={{ color: primary }}>
              Manage visibility <ChevronRight className="w-3 h-3"/>
            </Link>
          </Panel>
        </div>
      </div>

      {/* Share modal */}
      <Sheet open={share} onClose={() => setShare(false)} title="Share your profile">
        <ShareCard p={p}/>
      </Sheet>

      {/* Cmd-K palette */}
      {cmd && <CommandPalette onClose={() => setCmd(false)}/>}

      <Toasts/>

      <style>{`
        @keyframes pulseHalo { 0%,100% { transform: scale(1); opacity: .55 } 50% { transform: scale(1.08); opacity: .75 } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/* ─── subcomponents ─── */

function CoverArt() {
  return (
    <svg viewBox="0 0 800 300" className="absolute inset-0 w-full h-full opacity-60 mix-blend-soft-light">
      <defs>
        <radialGradient id="g1" cx="20%" cy="30%"><stop offset="0%" stopColor="#fff" stopOpacity="0.6"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></radialGradient>
        <radialGradient id="g2" cx="80%" cy="80%"><stop offset="0%" stopColor="#fff" stopOpacity="0.4"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="800" height="300" fill="url(#g1)"/>
      <rect width="800" height="300" fill="url(#g2)"/>
      <g stroke="#fff" strokeOpacity="0.25" fill="none">
        <path d="M0,220 C200,180 400,260 800,200" strokeWidth="1"/>
        <path d="M0,240 C200,210 400,280 800,220" strokeWidth="0.6"/>
        <path d="M0,260 C200,240 400,300 800,240" strokeWidth="0.6"/>
      </g>
    </svg>
  );
}

function ScoreRing({ value, accent }: { value: number; accent: string }) {
  const r = 34, C = 2 * Math.PI * r, off = C - (C * value) / 100;
  return (
    <div className="relative w-[92px] h-[92px] shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke={border} strokeWidth="6"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)" }}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-serif text-[22px] leading-none" style={{ color: ink }}>{value}</div>
        <div className="text-[8px] tracking-[0.24em] uppercase mt-1" style={{ color: muted }}>peace</div>
      </div>
    </div>
  );
}

function CompletionRing({ pct }: { pct: number }) {
  const r = 24, C = 2 * Math.PI * r, off = C - (C * pct) / 100;
  return (
    <div className="relative w-[62px] h-[62px]">
      <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" stroke={border} strokeWidth="4"/>
        <circle cx="30" cy="30" r={r} fill="none" stroke={primary} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={off}/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[12px] font-medium" style={{ color: ink }}>{pct}%</div>
    </div>
  );
}

function MiniFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-2xl" style={{ background: surface2 }}>
      <div className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase" style={{ color: muted }}>{icon}{label}</div>
      <div className="text-[13px] mt-1 truncate" style={{ color: ink }}>{value || "—"}</div>
    </div>
  );
}

function QA({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-[12px] hover:-translate-y-[1px] transition" style={{ background: surface2, color: ink }}>
      <span style={{ color: primary }}>{icon}</span>{label}
    </Link>
  );
}

function SmallStat({ n, label }: { n: number; label: string }) {
  return (
    <div className="p-2 rounded-2xl" style={{ background: surface2 }}>
      <div className="font-serif text-[18px]" style={{ color: ink }}>{n}</div>
      <div className="text-[9.5px] tracking-[0.2em] uppercase" style={{ color: muted }}>{label}</div>
    </div>
  );
}

function ShareCard({ p }: { p: Profile }) {
  const theme = THEMES[p.theme];
  const mood = MOOD_META[p.currentMood];
  const url = typeof window !== "undefined" ? `${window.location.origin}/profile` : "";
  const copy = async () => { try { await navigator.clipboard.writeText(url); pushToast("Link copied"); } catch { pushToast("Couldn't copy"); } };
  const download = () => {
    const blob = new Blob([JSON.stringify({ profile: p.username, peaceScore: p.peaceScore, streak: p.streaks.peace, mood: mood.label, generatedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `peacecode-${p.username.replace("@","")}.json`; a.click();
    pushToast("Wellness card downloaded");
  };
  return (
    <div className="space-y-4">
      <div className="rounded-3xl overflow-hidden p-6 text-center"
           style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, color: theme.ink }}>
        <div className="text-[10px] tracking-[0.4em] uppercase opacity-60">PeaceCode</div>
        <div className="mt-6 text-6xl">{mood.emoji}</div>
        <div className="font-serif text-[26px] mt-3">{p.displayName}</div>
        <div className="text-[12px] opacity-70">{p.username} · {p.college}</div>
        <div className="mt-5 flex justify-center gap-6 text-[11px]">
          <div><div className="font-serif text-[22px]">{p.peaceScore}</div>peace</div>
          <div><div className="font-serif text-[22px]">{p.streaks.peace}</div>day streak</div>
          <div><div className="font-serif text-[22px]">Lv{p.garden.level}</div>mind gym</div>
        </div>
        <div className="mt-5 text-[11.5px] italic opacity-80">"{p.bio}"</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={copy} className="py-3 rounded-2xl text-[12px] flex items-center justify-center gap-1.5" style={{ background: ink, color: "var(--pc-bg)" }}><Copy className="w-3.5 h-3.5"/> Copy link</button>
        <button onClick={download} className="py-3 rounded-2xl text-[12px] flex items-center justify-center gap-1.5" style={{ background: surface2, color: ink }}><Download className="w-3.5 h-3.5"/> Download card</button>
      </div>
      <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: surface2 }}>
        <div className="w-16 h-16 grid grid-cols-6 gap-[2px] p-1.5 rounded-xl" style={{ background: "#fff" }}>
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} style={{ background: (i * 7 + p.username.length) % 3 === 0 ? ink : "transparent", borderRadius: 1 }}/>
          ))}
        </div>
        <div className="min-w-0">
          <div className="text-[11.5px]" style={{ color: ink }}>Scan to open my profile</div>
          <div className="text-[10.5px] mt-0.5 truncate" style={{ color: muted }}>{url}</div>
        </div>
        <QrCode className="w-4 h-4" style={{ color: muted }}/>
      </div>
    </div>
  );
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const items = [
    { label: "Edit profile", to: "/profile/edit", icon: <Pencil className="w-3.5 h-3.5"/> },
    { label: "Change theme", to: "/profile/themes", icon: <Sparkles className="w-3.5 h-3.5"/> },
    { label: "Achievements", to: "/profile/achievements", icon: <Sparkles className="w-3.5 h-3.5"/> },
    { label: "Mind Garden", to: "/profile/garden", icon: <Sparkles className="w-3.5 h-3.5"/> },
    { label: "Friends", to: "/profile/friends", icon: <Users className="w-3.5 h-3.5"/> },
    { label: "Privacy", to: "/profile/privacy", icon: <Sparkles className="w-3.5 h-3.5"/> },
    { label: "Statistics", to: "/profile/stats", icon: <Target className="w-3.5 h-3.5"/> },
    { label: "Journal", to: "/journal", icon: <PenLine className="w-3.5 h-3.5"/> },
    { label: "Breathe", to: "/breathe", icon: <Wind className="w-3.5 h-3.5"/> },
    { label: "Peace Bot", to: "/peacebot", icon: <Bot className="w-3.5 h-3.5"/> },
    { label: "Book counselling", to: "/counselling", icon: <CalendarCheck className="w-3.5 h-3.5"/> },
    { label: "Peace Buddies", to: "/buddies", icon: <UserCheck className="w-3.5 h-3.5"/> },
    { label: "Resources", to: "/resources", icon: <BookOpen className="w-3.5 h-3.5"/> },
    { label: "Gratitude", to: "/gratitude", icon: <Heart className="w-3.5 h-3.5"/> },
    { label: "Settings", to: "/settings", icon: <Sparkles className="w-3.5 h-3.5"/> },
  ];
  const filtered = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[16vh] px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(20,24,40,0.4)", backdropFilter: "blur(6px)" }} onClick={onClose}/>
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden animate-[slideIn_.22s_ease-out]"
           style={{ background: "var(--pc-bg)", border: `1px solid ${border}` }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${border}` }}>
          <Command className="w-4 h-4" style={{ color: muted }}/>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search anywhere on PeaceCode…"
            className="flex-1 bg-transparent outline-none text-[13px]" />
          <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: surface2 }}><X className="w-3 h-3"/></button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12px]" style={{ color: muted }}>Nothing found.</div>
          ) : filtered.map((i) => (
            <button key={i.to} onClick={() => { nav({ to: i.to }); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-left hover:bg-black/5 dark:hover:bg-white/5 transition"
                    style={{ color: ink }}>
              <span style={{ color: primary }}>{i.icon}</span>{i.label}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 text-[10px] flex items-center justify-between" style={{ borderTop: `1px solid ${border}`, color: muted }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
}
