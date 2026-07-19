import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plug, Search as SearchIcon, CheckCircle2 } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, TextInput, SectionHead } from "@/components/hub/primitives";
import { integrations, isConnected, subscribe } from "@/lib/product-hub-store";
import type { Integration } from "@/lib/product-hub-store";

const { border, muted, ink, surface, primary } = palette;

const CATS: (Integration["category"] | "All")[] = ["All", "Calendar", "Files", "Health", "Music", "Productivity", "Comms", "Campus"];

function Integrations() {
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    let l = integrations;
    if (cat !== "All") l = l.filter((i) => i.category === cat);
    if (q.trim()) {
      const t = q.toLowerCase();
      l = l.filter((i) => i.name.toLowerCase().includes(t) || i.tagline.toLowerCase().includes(t));
    }
    return l;
  }, [cat, q]);

  const connectedCount = integrations.filter((i) => isConnected(i.id)).length;

  return (
    <Page wide>
      <BackBar />
      <PageTitle
        eyebrow="Integrations"
        title="Bring your world in, quietly."
        sub={`${integrations.length} services · ${connectedCount} connected. Nothing syncs without your permission.`}
        right={<div className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: muted }}><Plug className="w-3.5 h-3.5"/> {connectedCount}/{integrations.length}</div>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {CATS.map((c) => (
          <Chip key={c} tone="quiet" active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
        ))}
      </div>

      <div className="mb-6 relative">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }}/>
        <TextInput className="pl-9" placeholder="Search integrations…" value={q} onChange={(e) => setQ(e.target.value)}/>
      </div>

      <SectionHead title={cat === "All" ? "All services" : cat} sub={`${list.length} available`}/>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((i) => {
          const connected = isConnected(i.id);
          return (
            <Link key={i.id} to="/hub/integrations/$id" params={{ id: i.id }}
              className="flex items-start gap-3 rounded-[22px] p-4 transition hover:-translate-y-[1px]"
              style={{ background: surface, border: `1px solid ${connected ? primary : border}` }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-[16px] text-white shrink-0"
                   style={{ background: i.brandHue }}>{i.monogram}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif text-[15px]" style={{ color: ink }}>{i.name}</span>
                  {connected && <Chip tone="warm"><CheckCircle2 className="w-3 h-3"/> Connected</Chip>}
                </div>
                <div className="text-[11.5px]" style={{ color: muted }}>{i.category}</div>
                <div className="text-[12px] mt-1" style={{ color: muted }}>{i.tagline}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/hub/integrations")({ component: Integrations });
