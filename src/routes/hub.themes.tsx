import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, Heart, Palette as PaletteIcon, Wand2 } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, TextInput, ThemePreview, SectionHead, GhostBtn } from "@/components/hub/primitives";
import {
  themes, isThemeInstalled, isThemeFavorite, activeThemeId, favoriteTheme, subscribe,
} from "@/lib/product-hub-store";
import type { ThemeItem, ThemeCategory } from "@/lib/product-hub-store";

const { border, muted, ink, surface2, primary, surface } = palette;

type Tab = "featured" | "trending" | "new" | "installed" | "favorites" | "premium";
const CATEGORIES: (ThemeCategory | "All")[] = ["All", "Minimal", "Lavender", "Ocean", "Forest", "Cloud", "Sunrise", "Midnight", "Paper", "Glass", "Gradient", "Monochrome", "Student Mode", "Festival", "Seasonal"];

function Themes() {
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);

  const [tab, setTab] = useState<Tab>("featured");
  const [cat, setCat] = useState<(ThemeCategory | "All")>("All");
  const [q, setQ] = useState("");
  const active = activeThemeId();

  const list = useMemo(() => {
    let l: ThemeItem[] = [...themes];
    if (tab === "featured") l = l.filter((t) => t.featured);
    else if (tab === "trending") l = l.filter((t) => t.trending);
    else if (tab === "new") l = [...l].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (tab === "installed") l = l.filter((t) => isThemeInstalled(t.id));
    else if (tab === "favorites") l = l.filter((t) => isThemeFavorite(t.id));
    else if (tab === "premium") l = l.filter((t) => t.premium);
    if (cat !== "All") l = l.filter((t) => t.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((t) => t.name.toLowerCase().includes(s) || t.tagline.toLowerCase().includes(s));
    }
    return l;
  }, [tab, cat, q]);

  return (
    <Page wide>
      <BackBar />
      <PageTitle
        eyebrow="Theme store"
        title="Dress your PeaceCode."
        sub={`${themes.length} themes, curated. Preview before you apply — nothing changes without your tap.`}
        right={
          <div className="flex items-center gap-2">
            <Link to="/hub/customize"><GhostBtn><Wand2 className="w-3.5 h-3.5"/>Customize</GhostBtn></Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["featured", "trending", "new", "installed", "favorites", "premium"] as Tab[]).map((t) => (
          <Chip key={t} tone="quiet" active={tab === t} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </Chip>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] tracking-wide" style={{ color: muted }}>Category</span>
        {CATEGORIES.map((c) => (
          <Chip key={c} tone="quiet" active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
        ))}
      </div>

      <div className="mb-6 relative">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }}/>
        <TextInput className="pl-9" placeholder="Search themes…" value={q} onChange={(e) => setQ(e.target.value)}/>
      </div>

      {list.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: surface2, color: primary }}>
            <PaletteIcon className="w-5 h-5"/>
          </div>
          <div className="font-serif text-[17px] mt-3" style={{ color: ink }}>No themes match</div>
          <p className="text-[12px] mt-1" style={{ color: muted }}>Try a different tab or clear the search.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((t) => {
            const installed = isThemeInstalled(t.id);
            const fav = isThemeFavorite(t.id);
            const isActive = active === t.id;
            return (
              <div key={t.id} className="rounded-[22px] p-3 relative transition hover:-translate-y-[1px]"
                   style={{ background: surface, border: `1px solid ${isActive ? primary : border}` }}>
                <Link to="/hub/themes/$id" params={{ id: t.id }} className="block">
                  <ThemePreview colors={t.colors} className="aspect-[4/3]"/>
                </Link>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-serif text-[15px] truncate" style={{ color: ink }}>{t.name}</div>
                    <div className="text-[11px] truncate" style={{ color: muted }}>{t.tagline}</div>
                  </div>
                  <button onClick={() => favoriteTheme(t.id)} aria-label="Favorite"
                    className="shrink-0 w-8 h-8 rounded-full inline-flex items-center justify-center"
                    style={{ background: surface2, border: `1px solid ${border}`, color: fav ? primary : muted }}>
                    <Heart className="w-3.5 h-3.5" fill={fav ? "currentColor" : "none"}/>
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <Chip tone="outline">{t.category}</Chip>
                  {t.premium && <Chip tone="warm">Premium</Chip>}
                  {isActive && <Chip tone="warm">Active</Chip>}
                  {installed && !isActive && <Chip tone="outline">Installed</Chip>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SectionHead title=" " sub={`${list.length} of ${themes.length} themes`} />
    </Page>
  );
}

export const Route = createFileRoute("/hub/themes")({ component: Themes });
