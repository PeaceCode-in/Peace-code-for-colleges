import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles, Palette, Plug, Search, ChevronRight, Rocket, Bell, Flag, ArrowUpRight, Beaker,
} from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, PageTitle, Card, Chip, ThemePreview, SectionHead, GhostBtn } from "@/components/hub/primitives";
import {
  CURRENT_VERSION, releases, themes, integrations, announcements,
  getState, subscribe, isConnected, isThemeInstalled, activeThemeId,
} from "@/lib/product-hub-store";

const { border, muted, ink, surface2, primary, soft, surface } = palette;

function Home() {
  const [_, tick] = useState(0);
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);

  const state = getState();
  const latest = releases[0];
  const installed = themes.filter((t) => isThemeInstalled(t.id));
  const active = activeThemeId();
  const connectedList = integrations.filter((i) => isConnected(i.id));
  const recentUpdates = releases.slice(0, 3);

  const featuredThemes = themes.filter((t) => t.featured).slice(0, 4);
  const trendingThemes = themes.filter((t) => t.trending).slice(0, 4);

  return (
    <Page wide>
      <PageTitle
        eyebrow="Product hub"
        title="What's new. What's yours."
        sub="Release notes, themes, and integrations — one calm surface across everything you personalize."
        right={
          <Link to="/hub/search"><GhostBtn><Search className="w-3.5 h-3.5"/>Search hub</GhostBtn></Link>
        }
      />

      {/* Version badge / hero */}
      <Card className="mb-8 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: soft }}/>
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-40" style={{ background: latest.hue }}/>
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Chip tone="warm"><Sparkles className="w-3 h-3"/> Latest</Chip>
              <span className="text-[10.5px] tracking-[0.28em] uppercase" style={{ color: muted }}>Version {CURRENT_VERSION} · {latest.codename}</span>
            </div>
            <h2 className="font-serif text-[26px] sm:text-[32px] tracking-tight leading-[1.05]" style={{ color: ink }}>{latest.headline}</h2>
            <p className="text-[13px] mt-2 max-w-xl" style={{ color: muted }}>{latest.highlights.join(" · ")}</p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <Link to="/hub/changelog/$version" params={{ version: latest.version }}
              className="rounded-full h-11 px-5 text-[12.5px] inline-flex items-center gap-2"
              style={{ background: ink, color: "var(--pc-bg)" }}>
              Read release notes <ChevronRight className="w-3.5 h-3.5"/>
            </Link>
            <Link to="/hub/whats-new" className="text-[12px]" style={{ color: primary }}>All updates →</Link>
          </div>
        </div>
      </Card>

      {/* three-way selector */}
      <div className="grid gap-4 md:grid-cols-3 mb-10">
        <Link to="/hub/whats-new" className="group relative rounded-[26px] p-6 overflow-hidden transition hover:-translate-y-[1px]"
          style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-60" style={{ background: "#c6d9ee" }}/>
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: soft, color: primary }}>
              <Sparkles className="w-5 h-5" strokeWidth={1.5}/>
            </div>
            <div className="text-[10.5px] tracking-[0.24em] uppercase mt-4" style={{ color: muted }}>Section one</div>
            <div className="font-serif text-[22px] mt-1 tracking-tight" style={{ color: ink }}>What's new</div>
            <p className="text-[12.5px] mt-1.5" style={{ color: muted }}>Releases, changelog, roadmap, beta, feature requests.</p>
            <div className="mt-4 text-[12px] inline-flex items-center gap-1" style={{ color: primary }}>Open <ChevronRight className="w-3.5 h-3.5"/></div>
          </div>
        </Link>

        <Link to="/hub/themes" className="group relative rounded-[26px] p-6 overflow-hidden transition hover:-translate-y-[1px]"
          style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-60" style={{ background: "#d4c6ea" }}/>
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: soft, color: primary }}>
              <Palette className="w-5 h-5" strokeWidth={1.5}/>
            </div>
            <div className="text-[10.5px] tracking-[0.24em] uppercase mt-4" style={{ color: muted }}>Section two</div>
            <div className="font-serif text-[22px] mt-1 tracking-tight" style={{ color: ink }}>Theme store</div>
            <p className="text-[12.5px] mt-1.5" style={{ color: muted }}>{themes.length} themes · customization · widgets · profile.</p>
            <div className="mt-4 text-[12px] inline-flex items-center gap-1" style={{ color: primary }}>Open <ChevronRight className="w-3.5 h-3.5"/></div>
          </div>
        </Link>

        <Link to="/hub/integrations" className="group relative rounded-[26px] p-6 overflow-hidden transition hover:-translate-y-[1px]"
          style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-60" style={{ background: "#bcd0b3" }}/>
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: soft, color: primary }}>
              <Plug className="w-5 h-5" strokeWidth={1.5}/>
            </div>
            <div className="text-[10.5px] tracking-[0.24em] uppercase mt-4" style={{ color: muted }}>Section three</div>
            <div className="font-serif text-[22px] mt-1 tracking-tight" style={{ color: ink }}>Integrations</div>
            <p className="text-[12.5px] mt-1.5" style={{ color: muted }}>{integrations.length} services · calendars · health · music.</p>
            <div className="mt-4 text-[12px] inline-flex items-center gap-1" style={{ color: primary }}>Open <ChevronRight className="w-3.5 h-3.5"/></div>
          </div>
        </Link>
      </div>

      {/* Recently updated */}
      <section className="mb-10">
        <SectionHead title="Recently updated"
          sub={`${recentUpdates.length} releases in the last months.`}
          action={<Link to="/hub/whats-new" className="text-[12px]" style={{ color: primary }}>All releases →</Link>}
        />
        <div className="grid gap-3">
          {recentUpdates.map((r) => (
            <Link key={r.version} to="/hub/changelog/$version" params={{ version: r.version }}
              className="flex items-center gap-4 rounded-[22px] p-4 pr-5 transition hover:-translate-y-[1px]"
              style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="w-14 h-14 rounded-2xl relative overflow-hidden shrink-0" style={{ background: r.hue }}>
                <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full"><circle cx="18" cy="18" r="16" fill="rgba(255,255,255,0.5)"/><circle cx="45" cy="42" r="18" fill="rgba(255,255,255,0.3)"/></svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-[15.5px]" style={{ color: ink }}>{r.headline}</span>
                  {r.type === "major" && <Chip tone="warm">Major</Chip>}
                </div>
                <div className="text-[11.5px] mt-0.5" style={{ color: muted }}>
                  v{r.version} · {r.codename} · {new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: muted }}/>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently installed themes */}
      <section className="mb-10">
        <SectionHead
          title="Recently installed"
          sub={installed.length ? "Themes you added, close at hand." : "Nothing installed yet."}
          action={<Link to="/hub/themes" className="text-[12px]" style={{ color: primary }}>Store →</Link>}
        />
        {installed.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-[13px]" style={{ color: muted }}>Browse the theme store to install your first look.</p>
            <div className="mt-4"><Link to="/hub/themes"><GhostBtn>Browse themes →</GhostBtn></Link></div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {installed.slice(0, 4).map((t) => (
              <Link key={t.id} to="/hub/themes/$id" params={{ id: t.id }}
                className="rounded-[22px] p-3 transition hover:-translate-y-[1px]"
                style={{ background: surface, border: `1px solid ${active === t.id ? primary : border}` }}>
                <ThemePreview colors={t.colors} className="aspect-[4/3]" />
                <div className="mt-3 flex items-center justify-between">
                  <div className="font-serif text-[14px]" style={{ color: ink }}>{t.name}</div>
                  {active === t.id ? <Chip tone="warm">Active</Chip> : <Chip tone="outline">Installed</Chip>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured & trending themes */}
      <section className="mb-10">
        <SectionHead title="Featured themes"
          action={<Link to="/hub/themes" className="text-[12px]" style={{ color: primary }}>More →</Link>}/>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredThemes.map((t) => (
            <Link key={t.id} to="/hub/themes/$id" params={{ id: t.id }}
              className="rounded-[22px] p-3 transition hover:-translate-y-[1px]"
              style={{ background: surface, border: `1px solid ${border}` }}>
              <ThemePreview colors={t.colors} className="aspect-[4/3]"/>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="font-serif text-[14px]" style={{ color: ink }}>{t.name}</div>
                  <div className="text-[10.5px]" style={{ color: muted }}>{t.category}{t.premium && " · Premium"}</div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5" style={{ color: muted }}/>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionHead title="Trending" action={<Link to="/hub/themes" search={{ tab: "trending" }} className="text-[12px]" style={{ color: primary }}>See all →</Link>}/>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trendingThemes.map((t) => (
            <Link key={t.id} to="/hub/themes/$id" params={{ id: t.id }}
              className="rounded-[22px] p-3 transition hover:-translate-y-[1px]"
              style={{ background: surface, border: `1px solid ${border}` }}>
              <ThemePreview colors={t.colors} className="aspect-[4/3]"/>
              <div className="mt-3 font-serif text-[14px]" style={{ color: ink }}>{t.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Connected integrations quick view */}
      <section className="mb-10">
        <SectionHead
          title="Your connections"
          sub={connectedList.length ? `${connectedList.length} services syncing quietly.` : "Nothing connected yet."}
          action={<Link to="/hub/integrations" className="text-[12px]" style={{ color: primary }}>All services →</Link>}
        />
        {connectedList.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-[13px]" style={{ color: muted }}>Connect a calendar, health service, or music app.</p>
            <div className="mt-4"><Link to="/hub/integrations"><GhostBtn>Explore integrations →</GhostBtn></Link></div>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {connectedList.map((i) => (
              <Link key={i.id} to="/hub/integrations/$id" params={{ id: i.id }}
                className="flex items-center gap-3 rounded-[22px] p-4 transition hover:-translate-y-[1px]"
                style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-[16px] text-white"
                     style={{ background: i.brandHue }}>{i.monogram}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-[14.5px]" style={{ color: ink }}>{i.name}</div>
                  <div className="text-[11px]" style={{ color: muted }}>Connected · {i.category}</div>
                </div>
                <span className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} aria-label="Connected"/>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Beta + Announcements strip */}
      <section className="grid gap-4 lg:grid-cols-3 mb-10">
        <Link to="/hub/beta" className="rounded-[24px] p-5 transition hover:-translate-y-[1px]"
              style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: soft, color: primary }}>
            <Beaker className="w-4 h-4"/>
          </div>
          <div className="font-serif text-[16px] mt-3" style={{ color: ink }}>Beta program</div>
          <div className="text-[12px] mt-1" style={{ color: muted }}>{state.betaEnrolled ? "You're in — thanks for testing." : "Try upcoming features early."}</div>
        </Link>
        <Link to="/hub/roadmap" className="rounded-[24px] p-5 transition hover:-translate-y-[1px]"
              style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: soft, color: primary }}>
            <Rocket className="w-4 h-4"/>
          </div>
          <div className="font-serif text-[16px] mt-3" style={{ color: ink }}>Roadmap</div>
          <div className="text-[12px] mt-1" style={{ color: muted }}>What we're building, quietly, next.</div>
        </Link>
        <Link to="/hub/announcements" className="rounded-[24px] p-5 transition hover:-translate-y-[1px]"
              style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: soft, color: primary }}>
            <Bell className="w-4 h-4"/>
          </div>
          <div className="font-serif text-[16px] mt-3" style={{ color: ink }}>Announcements</div>
          <div className="text-[12px] mt-1" style={{ color: muted }}>{announcements[0].title}.</div>
        </Link>
      </section>

      {/* Version info footer */}
      <Card tone="surface2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-[12px]" style={{ color: muted }}>
            You're on PeaceCode <b style={{ color: ink }}>v{CURRENT_VERSION}</b> · codename <b style={{ color: ink }}>{latest.codename}</b> ·
            {" "}released {new Date(latest.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}.
          </div>
          <div className="flex items-center gap-2">
            <Link to="/hub/feature-requests" className="text-[12px] rounded-full h-9 px-3 inline-flex items-center gap-1.5"
                  style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
              <Flag className="w-3.5 h-3.5"/> Request a feature
            </Link>
            <Link to="/settings/about" className="text-[12px]" style={{ color: primary }}>About PeaceCode →</Link>
          </div>
        </div>
      </Card>
    </Page>
  );
}

export const Route = createFileRoute("/hub/")({ component: Home });
