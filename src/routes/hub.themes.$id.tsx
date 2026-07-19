import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Download, Trash2, Check, Sparkles } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, ThemePreview, SectionHead, PrimaryBtn, GhostBtn } from "@/components/hub/primitives";
import {
  themeById, themes, isThemeInstalled, isThemeFavorite, activeThemeId,
  installTheme, uninstallTheme, favoriteTheme, applyTheme, restoreDefaultTheme, subscribe,
} from "@/lib/product-hub-store";

const { border, muted, ink, surface2, primary, surface } = palette;

function ThemeDetail() {
  const { id } = Route.useParams();
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);
  const t = themeById(id);
  if (!t) throw notFound();

  const installed = isThemeInstalled(t.id);
  const fav = isThemeFavorite(t.id);
  const isActive = activeThemeId() === t.id;

  const related = themes.filter((x) => x.category === t.category && x.id !== t.id).slice(0, 4);

  return (
    <Page wide>
      <BackBar to="/hub/themes" label="Theme store"/>
      <PageTitle
        eyebrow={`${t.category}${t.premium ? " · Premium" : ""}`}
        title={t.name}
        sub={t.tagline}
        right={
          <div className="flex items-center gap-2">
            <button onClick={() => favoriteTheme(t.id)}
              className="rounded-full h-11 px-4 text-[12px] inline-flex items-center gap-1.5"
              style={{ background: surface2, border: `1px solid ${border}`, color: fav ? primary : ink }}>
              <Heart className="w-3.5 h-3.5" fill={fav ? "currentColor" : "none"}/> {fav ? "Favorited" : "Favorite"}
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <div>
          <ThemePreview colors={t.colors} radius={28} className="aspect-[4/3]" />
          <div className="mt-4 grid grid-cols-4 gap-2">
            {t.colors.map((c, i) => (
              <div key={i} className="rounded-xl p-2 text-center" style={{ background: surface2, border: `1px solid ${border}` }}>
                <div className="w-full h-10 rounded-lg mb-1.5" style={{ background: c }}/>
                <div className="text-[10.5px] font-mono" style={{ color: muted }}>{c.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            {isActive && <Chip tone="warm"><Check className="w-3 h-3"/> Active</Chip>}
            {installed && !isActive && <Chip tone="outline">Installed</Chip>}
            {t.trending && <Chip tone="warm">Trending</Chip>}
            {t.featured && <Chip tone="outline">Featured</Chip>}
            {t.seasonal && <Chip tone="outline">Seasonal</Chip>}
          </div>
          <div className="text-[13px]" style={{ color: muted }}>By <b style={{ color: ink }}>{t.developer}</b> · {t.downloads.toLocaleString()} installs</div>

          <SectionHead title="Details" />
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-xl p-3" style={{ background: surface2, border: `1px solid ${border}` }}>
              <div className="text-[10px] tracking-widest uppercase" style={{ color: muted }}>Heading</div>
              <div className="mt-1" style={{ color: ink, fontFamily: t.fontHeading }}>{t.fontHeading}</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: surface2, border: `1px solid ${border}` }}>
              <div className="text-[10px] tracking-widest uppercase" style={{ color: muted }}>Body</div>
              <div className="mt-1" style={{ color: ink }}>{t.fontBody}</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: surface2, border: `1px solid ${border}` }}>
              <div className="text-[10px] tracking-widest uppercase" style={{ color: muted }}>Radius</div>
              <div className="mt-1" style={{ color: ink }}>{t.radius.toUpperCase()}</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: surface2, border: `1px solid ${border}` }}>
              <div className="text-[10px] tracking-widest uppercase" style={{ color: muted }}>Motion</div>
              <div className="mt-1 capitalize" style={{ color: ink }}>{t.animation}</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {!installed && (
              <PrimaryBtn onClick={() => installTheme(t.id)}>
                <Download className="w-3.5 h-3.5"/> Install
              </PrimaryBtn>
            )}
            {installed && !isActive && (
              <PrimaryBtn onClick={() => applyTheme(t.id)}>
                <Sparkles className="w-3.5 h-3.5"/> Apply theme
              </PrimaryBtn>
            )}
            {isActive && (
              <GhostBtn onClick={restoreDefaultTheme}>Restore default</GhostBtn>
            )}
            {installed && !isActive && (
              <GhostBtn onClick={() => uninstallTheme(t.id)}>
                <Trash2 className="w-3.5 h-3.5"/> Uninstall
              </GhostBtn>
            )}
          </div>

          <p className="text-[11px] mt-4" style={{ color: muted }}>
            Themes are cosmetic previews — your data never changes.
          </p>
        </Card>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <SectionHead title="More like this" sub={`Other ${t.category.toLowerCase()} themes`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <Link key={r.id} to="/hub/themes/$id" params={{ id: r.id }}
                className="rounded-[22px] p-3 transition hover:-translate-y-[1px]"
                style={{ background: surface, border: `1px solid ${border}` }}>
                <ThemePreview colors={r.colors} className="aspect-[4/3]" />
                <div className="mt-3 font-serif text-[14px]" style={{ color: ink }}>{r.name}</div>
                <div className="text-[11px]" style={{ color: muted }}>{r.tagline}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}

export const Route = createFileRoute("/hub/themes/$id")({ component: ThemeDetail });
