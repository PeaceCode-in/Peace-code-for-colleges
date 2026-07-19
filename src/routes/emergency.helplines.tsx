import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Page, BackBar, PageTitle, Card, Chip } from "@/components/emergency/primitives";
import { HELPLINES, type Helpline } from "@/lib/emergency-store";
import { palette } from "@/components/AppShell";
import { Phone, Copy, MapPin, Search } from "lucide-react";

const { border, muted, ink, surface2, primary } = palette;

const TABS: { key: Helpline["category"] | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mental", label: "Mental health" },
  { key: "medical", label: "Medical" },
  { key: "women", label: "Women" },
  { key: "child", label: "Child" },
  { key: "police", label: "Police" },
  { key: "campus", label: "Campus" },
  { key: "hospital", label: "Hospital" },
];

function copy(n: string) { try { navigator.clipboard.writeText(n); } catch {} }

function Helplines() {
  const [tab, setTab] = useState<typeof TABS[number]["key"]>("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => HELPLINES.filter((h) => (tab === "all" || h.category === tab) && (!q || h.name.toLowerCase().includes(q.toLowerCase()))), [tab, q]);

  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Helplines" title="Trained, kind, on-call." sub="These lines are free and confidential. If a line is busy, try another — someone will pick up." />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-2 rounded-full h-10 pl-3 pr-4 min-w-[220px] flex-1 max-w-md" style={{ background: surface2, border: `1px solid ${border}` }}>
          <Search className="w-3.5 h-3.5 opacity-50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search helplines" className="bg-transparent outline-none text-[12.5px] flex-1" style={{ color: ink }} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-5 [-ms-overflow-style:none] [scrollbar-width:none]">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="rounded-full h-9 px-3.5 text-[11.5px] whitespace-nowrap"
              style={{ background: active ? ink : surface2, color: active ? "var(--pc-bg)" : muted, border: `1px solid ${active ? ink : border}` }}>
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((h) => (
          <Card key={h.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-serif text-[17px] leading-tight">{h.name}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <Chip>{h.hours}</Chip>
                  {h.languages && <Chip>{h.languages}</Chip>}
                </div>
                <p className="text-[12.5px] mt-2" style={{ color: muted }}>{h.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-serif text-[18px]" style={{ color: primary }}>{h.number}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-4">
              <a href={`tel:${h.number.replace(/[^0-9+]/g, "")}`} className="rounded-xl h-10 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ background: surface2, border: `1px solid ${border}` }}>
                <Phone className="w-3.5 h-3.5" strokeWidth={1.6}/> Call
              </a>
              <button onClick={() => copy(h.number)} className="rounded-xl h-10 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ background: surface2, border: `1px solid ${border}` }}>
                <Copy className="w-3.5 h-3.5" strokeWidth={1.6}/> Copy
              </button>
              <button className="rounded-xl h-10 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ background: surface2, border: `1px solid ${border}` }} title="Directions (placeholder)">
                <MapPin className="w-3.5 h-3.5" strokeWidth={1.6}/> Directions
              </button>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/helplines")({ component: Helplines });
