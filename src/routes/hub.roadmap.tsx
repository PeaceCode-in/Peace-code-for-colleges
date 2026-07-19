import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Rocket, ChevronUp, Filter } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, SectionHead } from "@/components/hub/primitives";
import { roadmap, hasVoted, toggleVote, subscribe } from "@/lib/product-hub-store";
import type { RoadmapItem } from "@/lib/product-hub-store";

const { border, muted, ink, surface2, primary, surface, soft } = palette;

const STATUS: RoadmapItem["status"][] = ["now", "coming", "in_dev", "planned", "completed"];
const STATUS_LABEL: Record<RoadmapItem["status"], string> = {
  now: "Now", coming: "Coming soon", in_dev: "In development", planned: "Planned", completed: "Completed",
};

function Roadmap() {
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);
  const [cat, setCat] = useState<RoadmapItem["category"] | "All">("All");

  const cats = useMemo(() => {
    const s = new Set<RoadmapItem["category"]>();
    roadmap.forEach((r) => s.add(r.category));
    return ["All", ...Array.from(s)] as const;
  }, []);

  return (
    <Page wide>
      <BackBar />
      <PageTitle
        eyebrow="Roadmap"
        title="What we're building next."
        sub="Community-voted, transparent progress. Vote quietly on what you'd like to see."
        right={<div className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: muted }}><Rocket className="w-3.5 h-3.5"/> {roadmap.length} items</div>}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-[11px] tracking-wide inline-flex items-center gap-1" style={{ color: muted }}><Filter className="w-3.5 h-3.5"/> Filter</span>
        {cats.map((c) => (
          <Chip key={c} tone="quiet" active={cat === c} onClick={() => setCat(c as RoadmapItem["category"] | "All")}>{c}</Chip>
        ))}
      </div>

      <div className="grid gap-6">
        {STATUS.map((s) => {
          const list = roadmap.filter((r) => r.status === s && (cat === "All" || r.category === cat));
          if (list.length === 0) return null;
          return (
            <section key={s}>
              <SectionHead title={STATUS_LABEL[s]} sub={`${list.length} items`} />
              <div className="grid gap-3 sm:grid-cols-2">
                {list.map((r) => {
                  const voted = hasVoted(r.id);
                  return (
                    <Card key={r.id}>
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Chip tone="outline">{r.category}</Chip>
                            {s === "now" && <Chip tone="warm">Now</Chip>}
                          </div>
                          <div className="font-serif text-[17px]" style={{ color: ink }}>{r.title}</div>
                          <div className="text-[12.5px] mt-1" style={{ color: muted }}>{r.summary}</div>
                          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: border }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${r.progress}%`, background: primary }}/>
                          </div>
                          <div className="text-[10.5px] mt-1.5" style={{ color: muted }}>{r.progress}% · {r.eta}</div>
                        </div>
                        <button onClick={() => toggleVote(r.id)}
                          className="shrink-0 rounded-2xl flex flex-col items-center justify-center w-14 h-16 transition"
                          style={{
                            background: voted ? soft : surface2,
                            border: `1px solid ${voted ? primary : border}`,
                            color: voted ? primary : ink,
                          }}>
                          <ChevronUp className="w-4 h-4" strokeWidth={2}/>
                          <span className="text-[12px] font-medium tabular-nums">{r.votes + (voted ? 1 : 0)}</span>
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/hub/roadmap")({ component: Roadmap });
