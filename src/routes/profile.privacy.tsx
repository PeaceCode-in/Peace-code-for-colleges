import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Globe, Users, Lock } from "lucide-react";
import { loadProfile, saveProfile, type Visibility } from "@/lib/profile-store";
import { surface2, border, ink, muted, primary, Panel, Toasts, pushToast } from "@/components/profile/primitives";

export const Route = createFileRoute("/profile/privacy")({
  head: () => ({ meta: [{ title: "Profile privacy · PeaceCode" }] }),
  component: PrivacyPage,
});

const SECTIONS: { key: string; label: string; hint: string }[] = [
  { key: "overview", label: "Overview & bio", hint: "your headline and summary" },
  { key: "journey", label: "Wellness journey", hint: "your timeline of milestones" },
  { key: "achievements", label: "Achievements", hint: "badges you've earned" },
  { key: "garden", label: "Mind Garden", hint: "your tree of growth" },
  { key: "activity", label: "Activity feed", hint: "what you did and when" },
  { key: "stats", label: "Statistics", hint: "peace score, sleep, mood trend" },
  { key: "friends", label: "Friends list", hint: "who you're connected with" },
  { key: "bookmarks", label: "Saved shelf", hint: "articles, videos, meditations" },
  { key: "interests", label: "Interests", hint: "chips shown on your profile" },
  { key: "emergency", label: "Emergency contact", hint: "always kept only-me" },
];

const OPTIONS: { v: Visibility; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { v: "everyone", label: "Everyone", icon: Globe },
  { v: "friends", label: "Friends", icon: Users },
  { v: "only-me", label: "Only me", icon: Lock },
];

function PrivacyPage() {
  const [p, setP] = useState(loadProfile());
  const set = (key: string, v: Visibility) => {
    const next = { ...p, privacy: { ...p.privacy, [key]: v } }; setP(next); saveProfile(next); pushToast("Saved");
  };

  return (
    <div className="px-4 lg:pl-32 lg:pr-10 py-8 pb-32 lg:pb-16 max-w-3xl">
      <Link to="/profile" className="inline-flex items-center gap-2 text-[12px] mb-4" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5"/> Back to profile
      </Link>
      <h1 className="font-serif text-[32px] leading-tight" style={{ color: ink }}>Privacy</h1>
      <p className="text-[13px] mb-8" style={{ color: muted }}>Decide who sees each part of your profile.</p>

      <Panel className="!p-0 overflow-hidden">
        {SECTIONS.map((s, i) => {
          const current = (p.privacy[s.key] ?? "friends") as Visibility;
          const forced = s.key === "emergency";
          return (
            <div key={s.key} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between" style={{ borderTop: i > 0 ? `1px solid ${border}` : "none" }}>
              <div className="min-w-0">
                <div className="text-[13px]" style={{ color: ink }}>{s.label}</div>
                <div className="text-[11px]" style={{ color: muted }}>{s.hint}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                {OPTIONS.map((o) => {
                  const Icon = o.icon; const active = current === o.v;
                  return (
                    <button key={o.v} disabled={forced && o.v !== "only-me"}
                      onClick={() => set(s.key, o.v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition disabled:opacity-40"
                      style={{ background: active ? ink : surface2, color: active ? "var(--pc-bg)" : ink }}>
                      <Icon className="w-3 h-3"/>{o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Panel>

      <Toasts/>
    </div>
  );
}
