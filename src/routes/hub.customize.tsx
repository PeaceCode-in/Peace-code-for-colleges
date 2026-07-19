import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wand2, LayoutGrid, RefreshCcw, GripVertical, EyeOff, Eye } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, SectionHead, GhostBtn } from "@/components/hub/primitives";
import {
  getCustomization, updateCustomization,
  getWidgets, updateWidget, moveWidget, resetWidgets,
  subscribe,
} from "@/lib/product-hub-store";

const { border, muted, ink, surface2, primary, surface, soft } = palette;

const ACCENTS = [
  { id: "sky",      hue: "#7fa5d8", label: "Sky" },
  { id: "lavender", hue: "#8a7ec9", label: "Lavender" },
  { id: "sage",     hue: "#6b8a5d", label: "Sage" },
  { id: "sunset",   hue: "#e88a68", label: "Sunset" },
  { id: "rose",     hue: "#c9a0dc", label: "Rose" },
  { id: "ocean",    hue: "#3b7d99", label: "Ocean" },
];

function Slider({ label, value, onChange, min = 0, max = 100, unit = "" }: {
  label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; unit?: string;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: surface2, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px]" style={{ color: ink }}>{label}</span>
        <span className="text-[11.5px] tabular-nums" style={{ color: muted }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current" style={{ color: primary }}/>
    </div>
  );
}

function Customize() {
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);
  const c = getCustomization();
  const widgets = getWidgets();

  return (
    <Page wide>
      <BackBar />
      <PageTitle
        eyebrow="Customization"
        title="Make it feel yours."
        sub="Adjust accents, roundness, motion, and density. Reset anytime."
        right={
          <GhostBtn onClick={() => updateCustomization({ accent: "sky", fontScale: 100, radius: 22, animation: 60, density: "comfortable", glass: 60, gradient: 40 })}>
            <RefreshCcw className="w-3.5 h-3.5"/> Reset all
          </GhostBtn>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <Card>
          <SectionHead title="Accent color" sub="A soft tint used across buttons and highlights."/>
          <div className="grid grid-cols-3 gap-2">
            {ACCENTS.map((a) => (
              <button key={a.id} onClick={() => updateCustomization({ accent: a.id })}
                className="rounded-2xl p-3 flex items-center gap-3 transition hover:-translate-y-[1px]"
                style={{ background: c.accent === a.id ? soft : surface2, border: `1px solid ${c.accent === a.id ? primary : border}`, color: ink }}>
                <span className="w-6 h-6 rounded-full" style={{ background: a.hue }}/>
                <span className="text-[12px]">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHead title="Feel" sub="How the interface moves and rests."/>
          <div className="grid gap-3">
            <Slider label="Roundness" value={c.radius} onChange={(v) => updateCustomization({ radius: v })} min={4} max={32} unit="px"/>
            <Slider label="Motion" value={c.animation} onChange={(v) => updateCustomization({ animation: v })} unit="%"/>
            <Slider label="Font scale" value={c.fontScale} onChange={(v) => updateCustomization({ fontScale: v })} min={80} max={140} unit="%"/>
            <Slider label="Glass depth" value={c.glass} onChange={(v) => updateCustomization({ glass: v })} unit="%"/>
            <Slider label="Gradient warmth" value={c.gradient} onChange={(v) => updateCustomization({ gradient: v })} unit="%"/>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <SectionHead title="Density" sub="Airier or tighter, whichever your day needs."/>
          <div className="flex flex-wrap gap-2">
            {(["compact", "comfortable", "spacious"] as const).map((d) => (
              <Chip key={d} tone="quiet" active={c.density === d} onClick={() => updateCustomization({ density: d })}>
                {d[0].toUpperCase() + d.slice(1)}
              </Chip>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-serif text-[18px]" style={{ color: ink }}><LayoutGrid className="w-4 h-4 inline mr-1 -mt-0.5" style={{ color: primary }}/> Dashboard widgets</div>
              <div className="text-[12px] mt-1" style={{ color: muted }}>Order, show, hide, and resize what you see on the home page.</div>
            </div>
            <GhostBtn onClick={resetWidgets}><RefreshCcw className="w-3.5 h-3.5"/> Reset order</GhostBtn>
          </div>
          <div className="mt-4 grid gap-2">
            {widgets.map((w, i) => (
              <div key={w.key} className="rounded-2xl p-3 pl-2 flex items-center gap-3"
                   style={{ background: surface2, border: `1px solid ${border}` }}>
                <div className="flex flex-col items-center gap-0.5" style={{ color: muted }}>
                  <button onClick={() => moveWidget(w.key, -1)} disabled={i === 0} className="disabled:opacity-30">▲</button>
                  <button onClick={() => moveWidget(w.key, 1)}  disabled={i === widgets.length - 1} className="disabled:opacity-30">▼</button>
                </div>
                <GripVertical className="w-3.5 h-3.5" style={{ color: muted }}/>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px]" style={{ color: ink }}>{w.label}</div>
                  <div className="text-[11px]" style={{ color: muted }}>Size {w.size.toUpperCase()}{w.pinned ? " · Pinned" : ""}</div>
                </div>
                <div className="flex items-center gap-1">
                  {(["s", "m", "l"] as const).map((sz) => (
                    <button key={sz} onClick={() => updateWidget(w.key, { size: sz })}
                      className="text-[11px] w-8 h-8 rounded-lg"
                      style={{
                        background: w.size === sz ? soft : "transparent",
                        border: `1px solid ${w.size === sz ? primary : border}`,
                        color: w.size === sz ? primary : ink,
                      }}>{sz.toUpperCase()}</button>
                  ))}
                </div>
                <button onClick={() => updateWidget(w.key, { visible: !w.visible })}
                  className="w-9 h-9 rounded-full inline-flex items-center justify-center"
                  style={{ background: "transparent", border: `1px solid ${border}`, color: w.visible ? ink : muted }}
                  aria-label={w.visible ? "Hide" : "Show"}>
                  {w.visible ? <Eye className="w-3.5 h-3.5"/> : <EyeOff className="w-3.5 h-3.5"/>}
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <p className="text-[11.5px] mt-6" style={{ color: muted }}>
        Preferences save automatically. Some settings apply on the next open of a page.
      </p>
    </Page>
  );
}

// silence
void surface; void Wand2;

export const Route = createFileRoute("/hub/customize")({ component: Customize });
