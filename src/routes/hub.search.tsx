import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, TextInput, SectionHead } from "@/components/hub/primitives";
import { themes, integrations, releases, roadmap } from "@/lib/product-hub-store";

const { border, muted, ink, surface, primary } = palette;

type Hit = { kind: "theme" | "integration" | "release" | "roadmap"; id: string; title: string; sub: string; to: string; params?: Record<string, string> };

function Search() {
  const [q, setQ] = useState("");
  const hits = useMemo<Hit[]>(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const out: Hit[] = [];
    themes.forEach((x) => {
      if (x.name.toLowerCase().includes(t) || x.tagline.toLowerCase().includes(t) || x.category.toLowerCase().includes(t))
        out.push({ kind: "theme", id: x.id, title: x.name, sub: x.tagline, to: "/hub/themes/$id", params: { id: x.id } });
    });
    integrations.forEach((x) => {
      if (x.name.toLowerCase().includes(t) || x.tagline.toLowerCase().includes(t))
        out.push({ kind: "integration", id: x.id, title: x.name, sub: x.tagline, to: "/hub/integrations/$id", params: { id: x.id } });
    });
    releases.forEach((x) => {
      if (x.version.includes(t) || x.codename.toLowerCase().includes(t) || x.headline.toLowerCase().includes(t))
        out.push({ kind: "release", id: x.version, title: `v${x.version} · ${x.codename}`, sub: x.headline, to: "/hub/changelog/$version", params: { version: x.version } });
    });
    roadmap.forEach((x) => {
      if (x.title.toLowerCase().includes(t) || x.summary.toLowerCase().includes(t))
        out.push({ kind: "roadmap", id: x.id, title: x.title, sub: x.summary, to: "/hub/roadmap" });
    });
    return out.slice(0, 60);
  }, [q]);

  const grouped = useMemo(() => {
    const g: Record<string, Hit[]> = {};
    hits.forEach((h) => { (g[h.kind] ??= []).push(h); });
    return g;
  }, [hits]);

  const LABEL: Record<Hit["kind"], string> = { theme: "Themes", integration: "Integrations", release: "Releases", roadmap: "Roadmap" };

  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Search hub" title="Find anything, quietly." sub="Themes, integrations, releases, roadmap — one field."/>

      <div className="mb-6 relative">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }}/>
        <TextInput className="pl-9 h-12" autoFocus placeholder="Try Aurora, Spotify, roadmap, 2.4…"
          value={q} onChange={(e) => setQ(e.target.value)}/>
      </div>

      {q.trim() === "" ? (
        <Card className="text-center py-10">
          <div className="text-[13px]" style={{ color: muted }}>Start typing to search the hub.</div>
        </Card>
      ) : hits.length === 0 ? (
        <Card className="text-center py-10">
          <div className="text-[13px]" style={{ color: muted }}>No results for "{q}".</div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {(Object.keys(grouped) as Hit["kind"][]).map((k) => (
            <section key={k}>
              <SectionHead title={LABEL[k]} sub={`${grouped[k].length} matches`}/>
              <div className="grid gap-2">
                {grouped[k].map((h) => (
                  <Link key={`${h.kind}-${h.id}`} to={h.to as never} params={h.params as never}
                    className="rounded-2xl p-3 flex items-center gap-3 transition hover:-translate-y-[1px]"
                    style={{ background: surface, border: `1px solid ${border}` }}>
                    <Chip tone="outline">{LABEL[h.kind]}</Chip>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] truncate" style={{ color: ink }}>{h.title}</div>
                      <div className="text-[11.5px] truncate" style={{ color: muted }}>{h.sub}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}

// silence
void primary;

export const Route = createFileRoute("/hub/search")({ component: Search });
