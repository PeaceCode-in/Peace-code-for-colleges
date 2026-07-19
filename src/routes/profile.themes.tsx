import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { loadProfile, saveProfile, THEMES, type ThemeKey } from "@/lib/profile-store";
import { surface, surface2, border, ink, muted, primary, Panel, Toasts, pushToast } from "@/components/profile/primitives";

export const Route = createFileRoute("/profile/themes")({
  head: () => ({ meta: [{ title: "Profile themes · PeaceCode" }] }),
  component: ThemesPage,
});

function ThemesPage() {
  const [p, setP] = useState(loadProfile());
  const pick = (k: ThemeKey) => {
    const next = { ...p, theme: k }; setP(next); saveProfile(next); pushToast(`Theme set to ${THEMES[k].label}`);
  };

  return (
    <div className="px-4 lg:pl-32 lg:pr-10 py-8 pb-32 lg:pb-16 max-w-5xl">
      <Link to="/profile" className="inline-flex items-center gap-2 text-[12px] mb-4" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5"/> Back to profile
      </Link>
      <h1 className="font-serif text-[32px] leading-tight" style={{ color: ink }}>Profile themes</h1>
      <p className="text-[13px] mb-8" style={{ color: muted }}>Set the mood of your identity. Changes your cover, halo, and share card.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
          const t = THEMES[k]; const active = p.theme === k;
          return (
            <button key={k} onClick={() => pick(k)}
              className="text-left rounded-3xl overflow-hidden transition hover:-translate-y-0.5"
              style={{ border: `2px solid ${active ? primary : border}` }}>
              <div className="relative h-24" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
                <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full" style={{ background: t.glow, opacity: 0.7 }}/>
                {active && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full grid place-items-center" style={{ background: primary, color: "#fff" }}>
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5}/>
                  </div>
                )}
              </div>
              <div className="p-3" style={{ background: surface }}>
                <div className="font-serif text-[14px]" style={{ color: ink }}>{t.label}</div>
                <div className="text-[10.5px] mt-0.5" style={{ color: muted }}>{k}</div>
              </div>
            </button>
          );
        })}
      </div>

      <Panel className="mt-8">
        <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: muted }}>Preview</div>
        <div className="h-32 rounded-2xl" style={{ background: `linear-gradient(135deg, ${THEMES[p.theme].from}, ${THEMES[p.theme].to})` }}/>
      </Panel>

      <Toasts/>
    </div>
  );
}
