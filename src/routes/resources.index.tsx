import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ResourceCard, ResourceRow } from "@/components/resources/ResourceCard";
import { LanguageToggle } from "@/components/resources/LanguageToggle";
import {
  RESOURCES, CATEGORIES, COLLECTIONS, AUTHORS, trending, featured,
  recommend, continueLearning, useResourceStore, byId, heroBg, TRENDING_SEARCHES,
} from "@/lib/resources-store";
import { useLang, UI, CATEGORY_HI, TRENDING_HI, useResourceI18n, tCached } from "@/lib/resources-i18n";
import { Search, Sparkles, Compass, Bookmark, History, Trophy, ListMusic, Download, Filter, Loader2 } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/resources/")({
  head: () => ({
    meta: [
      { title: "Resource Library — PeaceCode" },
      { name: "description", content: "A quiet library of articles, meditations, podcasts, worksheets and courses for student mental wellness." },
      { property: "og:title", content: "Resource Library — PeaceCode" },
      { property: "og:description", content: "Discover, save and learn — a Netflix-meets-Spotify library for student wellbeing." },
    ],
  }),
  component: ResourcesHome,
});

function ResourcesHome() {
  const snap = useResourceStore();
  const [lang] = useLang();
  const t = UI[lang];
  const cont = useMemo(() => continueLearning(), [snap]);
  const recs = useMemo(() => recommend(10), [snap]);
  const trend = useMemo(() => trending(), []);
  const recent = snap.history.slice(0, 8).map(h => byId(h.id)).filter(Boolean) as any[];
  const feat = featured();
  const featuredCollection = COLLECTIONS[0];

  // Prewarm the translation cache with everything visible on this page.
  const visible = useMemo(
    () => Array.from(new Set([...cont.map(c => c.resource), ...recs, ...trend, ...recent, ...feat])),
    [cont, recs, trend, recent, feat],
  );
  const { loading } = useResourceI18n(visible);

  return (
    <AppShell>
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10"
        style={lang === "hi" ? { fontFamily: '"Noto Sans Devanagari", "DM Sans", sans-serif' } : undefined}>
        {/* Welcome + Search */}
        <header className="mb-10 sm:mb-14">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="text-[10px] tracking-[0.32em] uppercase" style={{ color: "var(--pc-muted)" }}>{t.library}</div>
            <div className="flex items-center gap-2">
              {loading && <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--pc-muted)" }}><Loader2 className="w-3 h-3 animate-spin"/>{t.translating}</span>}
              <LanguageToggle />
            </div>
          </div>
          <h1 className="font-serif text-[34px] sm:text-[46px] leading-[1.05] mb-4 max-w-[720px]" style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
            {t.heroTitle}
          </h1>
          <p className="text-[15px] max-w-[560px]" style={{ color: "var(--pc-muted)" }}>
            {t.heroSub(RESOURCES.length)}
          </p>

          <Link to="/resources/search" className="mt-6 flex items-center gap-3 rounded-full px-5 py-4 max-w-[640px] transition hover:shadow-md"
            style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <Search className="w-4 h-4 opacity-60"/>
            <span className="text-[14px] flex-1" style={{ color: "var(--pc-muted)" }}>{t.searchPh}</span>
            <span className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px]" style={{ background: "var(--pc-surface2)", color: "var(--pc-muted)" }}>
              <Filter className="w-3 h-3"/> {t.filters}
            </span>
          </Link>

          <div className="mt-4 flex flex-wrap gap-2">
            {TRENDING_SEARCHES.slice(0, 6).map(term => {
              const display = lang === "hi" ? (TRENDING_HI[term] || term) : term;
              return (
                <Link key={term} to="/resources/search" search={{ q: display } as any}
                  className="text-[11px] px-3 py-1.5 rounded-full transition hover:bg-[var(--pc-surface2)]"
                  style={{ border: "1px solid var(--pc-border)", color: "var(--pc-muted)" }}>
                  {display}
                </Link>
              );
            })}
          </div>

          <nav className="mt-6 flex flex-wrap gap-2">
            <QuickLink to="/resources/categories" icon={Compass} label={t.allCategories}/>
            <QuickLink to="/resources/collections" icon={Sparkles} label={t.collections}/>
            <QuickLink to="/resources/library" icon={Bookmark} label={t.myLibrary}/>
            <QuickLink to="/resources/history" icon={History} label={t.history}/>
            <QuickLink to="/resources/playlists" icon={ListMusic} label={t.playlists}/>
            <QuickLink to="/resources/downloads" icon={Download} label={t.downloads}/>
            <QuickLink to="/resources/achievements" icon={Trophy} label={t.achievements}/>
          </nav>
        </header>

        {/* Continue learning */}
        {cont.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-[22px] sm:text-[26px] mb-4" style={{ color: "var(--pc-ink)" }}>{t.continueLearning}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cont.map(({ resource, progress }) => (
                <div key={resource.id} className="relative">
                  <ResourceCard r={resource}/>
                  <div className="mt-2 flex items-center gap-2 text-[10px]" style={{ color: "var(--pc-muted)" }}>
                    <div className="flex-1 h-1 rounded-full" style={{ background: "var(--pc-surface2)" }}>
                      <div className="h-full rounded-full" style={{ width: `${progress*100}%`, background: "var(--pc-primary)" }}/>
                    </div>
                    <span>{Math.round(progress*100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI picks */}
        <section className="mb-10">
          <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,var(--pc-soft) 0%,var(--pc-surface) 100%)", border: "1px solid var(--pc-border)" }}>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: "var(--pc-primary)" }}>
              <Sparkles className="w-3.5 h-3.5"/> {t.aiPicksKicker}
            </div>
            <h2 className="font-serif text-[24px] sm:text-[30px] leading-[1.15] mb-2 max-w-[540px]" style={{ color: "var(--pc-ink)" }}>
              {t.aiPicksTitle}
            </h2>
            <p className="text-[13px] mb-6 max-w-[520px]" style={{ color: "var(--pc-muted)" }}>
              {t.aiPicksSub}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recs.slice(0, 4).map(r => <ResourceCard key={r.id} r={r} size="sm"/>)}
            </div>
          </div>
        </section>

        {/* Recommended */}
        <ResourceRow title={t.recommended} items={recs} seeAll="/resources/search"/>

        {/* Trending */}
        <ResourceRow title={t.trendingToday} items={trend} seeAll="/resources/search"/>

        {/* Recently viewed */}
        {recent.length > 0 && <ResourceRow title={t.recentlyViewed} items={recent} seeAll="/resources/history"/>}

        {/* Categories */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-serif text-[22px] sm:text-[26px]" style={{ color: "var(--pc-ink)" }}>{t.browseTopic}</h2>
            <Link to="/resources/categories" className="text-[12px] tracking-[0.18em] uppercase hover:opacity-70" style={{ color: "var(--pc-muted)" }}>{t.allCategories} →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.slice(0, 12).map(c => (
              <Link key={c.slug} to="/resources/c/$slug" params={{ slug: c.slug }}
                className="group rounded-2xl p-4 flex flex-col gap-2 transition hover:-translate-y-0.5"
                style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: c.color + "33" }}>{c.emoji}</div>
                <div className="font-serif text-[14px]" style={{ color: "var(--pc-ink)" }}>
                  {lang === "hi" ? CATEGORY_HI[c.slug] : c.name}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Collection */}
        <section className="mb-12">
          <Link to="/resources/collection/$slug" params={{ slug: featuredCollection.slug }}
            className="block rounded-3xl overflow-hidden relative min-h-[240px] sm:min-h-[300px] group"
            style={{ background: heroBg(featuredCollection.hero) }}>
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10"
              style={{ background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.5) 100%)" }}>
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/80 mb-2">{t.featuredCollection}</div>
              <div className="text-4xl mb-2">{featuredCollection.emoji}</div>
              <h3 className="font-serif text-white text-[28px] sm:text-[36px] leading-[1.1] max-w-[520px]">
                {tCached(featuredCollection.title, lang)}
              </h3>
              <p className="text-white/85 text-[13px] sm:text-[14px] mt-2 max-w-[540px]">
                {tCached(featuredCollection.description, lang)}
              </p>
              <div className="mt-4 flex items-center gap-4 text-white/80 text-[11px]">
                <span>{lang === "hi" ? "क्यूरेटर:" : "Curated by"} {tCached(featuredCollection.curator, lang)}</span>
                <span>·</span>
                <span>{featuredCollection.resourceIds.length} {lang === "hi" ? "टुकड़े" : "pieces"}</span>
              </div>
            </div>
          </Link>
        </section>

        {/* Featured Authors */}
        <section className="mb-12">
          <h2 className="font-serif text-[22px] sm:text-[26px] mb-4" style={{ color: "var(--pc-ink)" }}>{t.voicesTrust}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {AUTHORS.map(a => (
              <Link key={a.id} to="/resources/author/$id" params={{ id: a.id }}
                className="rounded-2xl p-4 flex flex-col gap-2 items-start transition hover:-translate-y-0.5"
                style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-serif text-[16px]"
                  style={{ background: "var(--pc-soft)", color: "var(--pc-primary)" }}>{a.name[0]}</div>
                <div className="font-serif text-[13px] leading-tight" style={{ color: "var(--pc-ink)" }}>
                  {tCached(a.name, lang)}
                </div>
                <div className="text-[10px]" style={{ color: "var(--pc-muted)" }}>
                  {tCached(a.title, lang)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 px-3 py-2 rounded-full text-[12px] transition hover:bg-[var(--pc-surface2)]"
      style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-muted)" }}>
      <Icon className="w-3.5 h-3.5"/> {label}
    </Link>
  );
}
