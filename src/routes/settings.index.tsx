import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User, Bell, Shield, Palette, Accessibility, Bot, PenLine, Wind,
  Users, BookOpen, Database, Link2, LifeBuoy, HelpCircle, Info, LogOut,
  ChevronRight, Clock, Sparkles, ArrowUpRight,
} from "lucide-react";
import { palette } from "@/components/AppShell";
import { SettingsSearch } from "@/components/settings/primitives";
import { loadActivity, useSettings } from "@/lib/settings-store";
import { loadSessions as loadBreathSessions } from "@/lib/breathe-store";

export const Route = createFileRoute("/settings/")({
  head: () => ({ meta: [{ title: "Settings — PeaceCode" }] }),
  component: SettingsHome,
});

const { ink, muted, primary } = palette;

// White glass tokens (kept local so we don't muddy the blue global surface).
const glass = {
  card: "rgba(255,255,255,0.42)",
  cardStrong: "rgba(255,255,255,0.62)",
  hairline: "rgba(255,255,255,0.55)",
  hairlineSoft: "rgba(15,23,42,0.06)",
};

type Cat = {
  icon: React.ElementType;
  label: string;
  to: string;
  hint: string;
  tone: [string, string]; // gradient for icon tile
  span?: "sm" | "md" | "lg"; // bento width on desktop
};

const GROUPS: { title: string; items: Cat[] }[] = [
  {
    title: "Personal",
    items: [
      { icon: User, label: "Profile", to: "/settings/profile", hint: "Name, college, bio, interests", tone: ["#C7D9FF", "#E9D5FF"], span: "lg" },
      { icon: Palette, label: "Appearance", to: "/settings/appearance", hint: "Theme, accent, typography", tone: ["#FDE1D3", "#FBD5E4"], span: "sm" },
      { icon: Accessibility, label: "Accessibility", to: "/settings/accessibility", hint: "Contrast, motion, dyslexia", tone: ["#D9F2E4", "#CFE7FF"], span: "md" },
    ],
  },
  {
    title: "App",
    items: [
      { icon: Bot, label: "PeaceBot", to: "/settings/peacebot", hint: "AI personality, voice, memory", tone: ["#DDD6FE", "#C4B5FD"], span: "lg" },
      { icon: PenLine, label: "Journal", to: "/settings/journal", hint: "Autosave, prompts, streak", tone: ["#FEF3C7", "#FDE68A"], span: "sm" },
      { icon: Wind, label: "Breathing", to: "/settings/breathing", hint: "Sessions & background sounds", tone: ["#CFFAFE", "#DBEAFE"], span: "sm" },
      { icon: Users, label: "Community", to: "/settings/community", hint: "Anonymity, requests, mutes", tone: ["#E9D5FF", "#FBCFE8"], span: "md" },
      { icon: BookOpen, label: "Resources", to: "/settings/resources", hint: "Topics & content types", tone: ["#FEE2E2", "#FED7AA"], span: "sm" },
      { icon: Bell, label: "Notifications", to: "/settings/notifications", hint: "Reminders, quiet hours, DND", tone: ["#FDE68A", "#FBBF24"], span: "sm" },
    ],
  },
  {
    title: "Security",
    items: [
      { icon: Shield, label: "Privacy & Security", to: "/settings/privacy", hint: "Password, 2FA, biometrics", tone: ["#DBEAFE", "#BFDBFE"], span: "md" },
      { icon: Database, label: "Data & Storage", to: "/settings/data", hint: "Cache, backup, offline", tone: ["#E5E7EB", "#D1D5DB"], span: "sm" },
      { icon: Link2, label: "Connected", to: "/settings/connected", hint: "Google, wearables, SSO", tone: ["#CFFAFE", "#A5F3FC"], span: "sm" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: LifeBuoy, label: "Emergency & Safety", to: "/settings/emergency", hint: "SOS, helplines, quick call", tone: ["#FECACA", "#FCA5A5"], span: "md" },
      { icon: HelpCircle, label: "Support", to: "/settings/support", hint: "Help centre, feedback", tone: ["#E0E7FF", "#C7D2FE"], span: "sm" },
      { icon: Sparkles, label: "Product Hub", to: "/hub", hint: "What's new, themes, integrations", tone: ["#FBCFE8", "#F5D0FE"], span: "sm" },
      { icon: Info, label: "About PeaceCode", to: "/settings/about", hint: "Version, team, roadmap", tone: ["#E5E7EB", "#F3F4F6"], span: "sm" },
    ],
  },
];

function SettingsHome() {
  const [s] = useSettings();
  const [activity, setActivity] = useState(() => loadActivity());
  const [breathCount, setBreathCount] = useState(0);
  useEffect(() => {
    setActivity(loadActivity());
    setBreathCount(loadBreathSessions().length);
  }, []);

  const suggestions: { text: string; to: string }[] = [];
  if (!s.notifications.types.journalReminders) suggestions.push({ text: "You journal often — turn on nightly reminders?", to: "/settings/notifications" });
  if (breathCount === 0) suggestions.push({ text: "Haven't tried breathing this week — set a gentle reminder?", to: "/settings/breathing" });
  if (!s.privacy.twoFA) suggestions.push({ text: "Add two-factor for extra peace of mind.", to: "/settings/privacy" });
  if (!s.privacy.journalLock) suggestions.push({ text: "Lock your journal with a PIN?", to: "/settings/privacy" });

  const completion = calcCompletion(s.profile);
  const initial = (s.profile.preferredName || s.profile.fullName || "K").slice(0, 1);

  return (
    <main className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-16 lg:pt-14 lg:pb-20">
      {/* soft radial wash — very subtle, breaks the flat blue */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[520px] h-[520px] rounded-full blur-3xl opacity-40" style={{ background: "radial-gradient(circle, #FFE4CF 0%, transparent 60%)" }} />
        <div className="absolute top-40 -right-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, #DCEBFF 0%, transparent 60%)" }} />
      </div>

      {/* ── Hero ── compact, one focal line */}
      <header className="mb-8">
        <div className="text-[10.5px] tracking-[0.35em] uppercase mb-3" style={{ color: muted }}>settings</div>
        <h1 className="font-serif text-[clamp(2.2rem,4.4vw,3.4rem)] leading-[1.02] tracking-[-0.02em]" style={{ color: ink }}>
          A quieter place<br/>to shape your PeaceCode.
        </h1>
      </header>

      {/* ── Search: narrow, not full-width ── */}
      <div className="max-w-xl mb-10"><SettingsSearch /></div>

      {/* ── Focal card: Profile ── large, richer, single anchor */}
      <Link
        to="/settings/profile"
        className="group relative block mb-12 rounded-[22px] overflow-hidden transition duration-200 hover:-translate-y-[2px]"
        style={{
          background: glass.cardStrong,
          border: `1px solid ${glass.hairline}`,
          backdropFilter: "blur(28px) saturate(140%)",
          WebkitBackdropFilter: "blur(28px) saturate(140%)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 20px 60px -30px rgba(30,41,59,0.18)",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-6 p-6 sm:p-8">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center font-serif text-[34px] shrink-0"
            style={{ background: `linear-gradient(135deg, #C7D9FF, #F9D5E4 60%, #FFE4CF)`, color: "#3b3b57" }}
          >
            {initial}
          </div>

          <div className="min-w-0">
            <div className="text-[10.5px] tracking-[0.3em] uppercase mb-2" style={{ color: muted }}>your profile</div>
            <div className="font-serif text-[26px] sm:text-[30px] leading-tight tracking-tight" style={{ color: ink }}>{s.profile.fullName || "Your name"}</div>
            <div className="text-[12.5px] mt-1" style={{ color: muted }}>
              {s.profile.college || "Add college"} · Sem {s.profile.semester || "—"} · {s.profile.pronouns || "add pronouns"}
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
              <Stat label="Streak" value={`${activity.length > 0 ? Math.min(activity.length, 12) : 0}d`} />
              <Stat label="Breath sessions" value={`${breathCount}`} />
              <Stat label="Profile" value={`${completion}%`} />
              <Stat label="Peace score" value="74" />
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end gap-2">
            <span className="text-[11px] px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.65)", color: ink, border: `1px solid ${glass.hairlineSoft}` }}>Edit profile</span>
            <ArrowUpRight className="w-4 h-4 opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* progress bar under focal card */}
        <div className="h-[3px] w-full" style={{ background: "rgba(15,23,42,0.06)" }}>
          <div className="h-full transition-all" style={{ width: `${completion}%`, background: "linear-gradient(90deg, #7BA6FF, #C79BFF)" }} />
        </div>
      </Link>

      {/* ── Grouped bento ── */}
      <div className="space-y-12">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-serif text-[20px] tracking-tight" style={{ color: ink }}>{g.title}</h2>
              <div className="text-[10.5px] tracking-[0.28em] uppercase" style={{ color: muted }}>{g.items.length} settings</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {g.items.map((c) => <CategoryCard key={c.to} c={c} />)}
            </div>
          </section>
        ))}
      </div>

      {/* ── Suggestions & activity ── */}
      {suggestions.length > 0 && (
        <section className="mt-14">
          <h2 className="font-serif text-[20px] tracking-tight mb-4" style={{ color: ink }}>Gentle suggestions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.slice(0, 4).map((sug) => (
              <Link key={sug.to + sug.text} to={sug.to}
                className="rounded-[18px] p-4 flex items-center justify-between gap-3 transition hover:-translate-y-[1px]"
                style={{ background: glass.card, border: `1px solid ${glass.hairline}`, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
                <span className="text-[13px]" style={{ color: ink }}>{sug.text}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-[20px] tracking-tight" style={{ color: ink }}>Recent activity</h2>
          <span className="text-[10.5px] tracking-[0.28em] uppercase" style={{ color: muted }}>last {activity.length}</span>
        </div>
        <div className="rounded-[18px] overflow-hidden" style={{ background: glass.card, border: `1px solid ${glass.hairline}`, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
          {activity.length === 0 && <div className="px-5 py-5 text-[12.5px]" style={{ color: muted }}>No changes yet — anything you tweak will show up here.</div>}
          {activity.slice(0, 6).map((a, i) => (
            <div key={a.id} className="px-5 py-3.5 flex items-center justify-between text-[12.5px]" style={{ borderTop: i === 0 ? "none" : `1px solid ${glass.hairlineSoft}`, color: ink }}>
              <div className="flex items-center gap-2"><Clock className="w-3 h-3 opacity-45" />{a.label}</div>
              <span className="text-[11px]" style={{ color: muted }}>{timeAgo(a.ts)}</span>
            </div>
          ))}
        </div>
      </section>

      <Link to="/settings/logout"
        className="mt-8 w-full flex items-center justify-between px-5 py-4 rounded-[18px] transition hover:-translate-y-[1px]"
        style={{ background: "rgba(255,240,240,0.5)", border: `1px solid rgba(220,120,120,0.25)`, color: "#B54848", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <span className="inline-flex items-center gap-2 text-[13px]"><LogOut className="w-4 h-4" /> Log out</span>
        <ChevronRight className="w-4 h-4 opacity-50" />
      </Link>

      <p className="text-center text-[11px] mt-10" style={{ color: muted }}>PeaceCode · made softly, for you.</p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.55)", border: `1px solid ${glass.hairlineSoft}` }}>
      <div className="text-[10px] tracking-[0.22em] uppercase" style={{ color: muted }}>{label}</div>
      <div className="font-serif text-[18px] leading-tight mt-0.5" style={{ color: ink }}>{value}</div>
    </div>
  );
}

function CategoryCard({ c }: { c: Cat }) {
  const Icon = c.icon;
  const span = c.span === "lg" ? "col-span-2 sm:col-span-3" : c.span === "md" ? "col-span-2" : "col-span-1 sm:col-span-2";
  return (
    <Link
      to={c.to}
      className={`group relative rounded-[18px] p-4 sm:p-5 transition duration-200 hover:-translate-y-[2px] ${span}`}
      style={{
        background: glass.card,
        border: `1px solid ${glass.hairline}`,
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.55) inset",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-[-3deg]"
          style={{ background: `linear-gradient(135deg, ${c.tone[0]}, ${c.tone[1]})`, color: "#2d3748" }}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium tracking-tight" style={{ color: ink }}>{c.label}</div>
          <div className="text-[11.5px] mt-1 line-clamp-2" style={{ color: muted }}>{c.hint}</div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-25 group-hover:opacity-70 group-hover:translate-x-0.5 transition" />
      </div>
    </Link>
  );
}

function calcCompletion(p: { fullName: string; preferredName: string; college: string; degree: string; bio: string; pronouns: string; birthday: string; wellnessGoal: string; interests: string[]; emergencyName: string }) {
  const fields = [p.fullName, p.preferredName, p.college, p.degree, p.bio, p.pronouns, p.birthday, p.wellnessGoal, p.emergencyName];
  let done = fields.filter((v) => v && v.trim().length > 0).length;
  if (p.interests.length > 0) done++;
  return Math.round((done / (fields.length + 1)) * 100);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
