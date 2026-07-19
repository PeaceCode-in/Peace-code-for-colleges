import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Sparkles, Trash2 } from "lucide-react";
import { palette } from "@/components/AppShell";
import { loadPrefs, savePrefs, clearRecents, type SearchPrefs } from "@/lib/search-store";

export const Route = createFileRoute("/search/settings")({
  component: SearchSettings,
});

function SearchSettings() {
  const { surface, surface2, border, ink, muted, primary, soft } = palette;
  const [prefs, setPrefs] = useState<SearchPrefs>(() => {
    try { return loadPrefs(); } catch {
      return { pauseHistory: false, excludeJournal: false, excludeGratitude: false, excludeCounselling: false, excludePeaceBot: false, aiMode: false };
    }
  });

  useEffect(() => { savePrefs(prefs); }, [prefs]);

  function Row({ title, note, k }: { title: string; note: string; k: keyof SearchPrefs }) {
    const on = prefs[k];
    return (
      <button
        onClick={() => setPrefs({ ...prefs, [k]: !on })}
        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition"
        style={{ background: surface2, border: `1px solid ${border}` }}
      >
        <div className="flex-1 min-w-0">
          <div className="font-serif text-[14.5px]" style={{ color: ink }}>{title}</div>
          <div className="text-[11.5px] mt-0.5" style={{ color: muted }}>{note}</div>
        </div>
        <span className="relative inline-block w-10 h-6 rounded-full transition" style={{ background: on ? primary : border }}>
          <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform" style={{ background: surface, transform: on ? "translateX(16px)" : "translateX(0)" }}/>
        </span>
      </button>
    );
  }

  return (
    <div className="min-h-screen w-full pb-24 pt-6 lg:pt-10" style={{ color: ink }}>
      <div className="max-w-3xl mx-auto px-5 lg:px-8">
        <Link to="/search" className="inline-flex items-center gap-2 text-[11px] opacity-60 hover:opacity-100 mb-5">
          <ArrowLeft className="w-3 h-3"/> Back to Search
        </Link>
        <div className="text-[9px] tracking-[0.4em] uppercase opacity-50">Search · Privacy</div>
        <h1 className="font-serif text-[28px] lg:text-[34px] leading-tight mt-2 mb-2">You decide what's searchable.</h1>
        <p className="text-[13px] max-w-lg mb-8" style={{ color: muted }}>
          Exclude private modules from the index at any time. Your changes take effect immediately.
        </p>

        <section className="rounded-3xl p-5 lg:p-6 space-y-3" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: soft, color: primary }}><Lock className="w-4 h-4"/></div>
            <div>
              <div className="text-[9px] tracking-[0.3em] uppercase opacity-50">Indexing</div>
              <div className="font-serif text-[15px]">What can search see?</div>
            </div>
          </div>
          <Row title="Pause search history" note="Recent queries won't be recorded while paused." k="pauseHistory" />
          <Row title="Exclude private journals" note="Journal entries won't appear in search results." k="excludeJournal" />
          <Row title="Exclude gratitude entries" note="Personal gratitude notes stay off the index." k="excludeGratitude" />
          <Row title="Exclude counselling records" note="Sessions & notes are hidden from search." k="excludeCounselling" />
          <Row title="Exclude PeaceBot chats" note="Your conversations remain private to the bot." k="excludePeaceBot" />
        </section>

        <section className="mt-6 rounded-3xl p-5 lg:p-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: soft, color: primary }}><Sparkles className="w-4 h-4"/></div>
            <div>
              <div className="text-[9px] tracking-[0.3em] uppercase opacity-50">AI</div>
              <div className="font-serif text-[15px]">Natural-language mode</div>
            </div>
          </div>
          <Row title="Default to AI Search" note="Turn on to make PeaceCode understand full sentences." k="aiMode" />
        </section>

        <section className="mt-6 rounded-3xl p-5 lg:p-6 flex items-center justify-between" style={{ background: surface, border: `1px solid ${border}` }}>
          <div>
            <div className="font-serif text-[15px]">Clear search history</div>
            <div className="text-[11.5px] mt-0.5" style={{ color: muted }}>Removes recent queries. Pinned & saved stay.</div>
          </div>
          <button onClick={() => clearRecents()} className="px-4 py-2 rounded-full text-[12px] flex items-center gap-2" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
            <Trash2 className="w-3.5 h-3.5"/> Clear
          </button>
        </section>
      </div>
    </div>
  );
}
