import { useState } from "react";
import { ChartTooltip, TooltipHint, TooltipRow, TooltipTitle, useChartTooltip } from "./ChartTooltip";

interface Node { id: string; label: string; }
interface Link { from: string; to: string; weight: number; }
interface Props {
  nodes: Node[];
  links: Link[];
  size?: number;
  ariaLabel?: string;
  weightLabel?: string; // e.g. "referrals"
}

/** ChordMini — arc diagram, nodes hoverable, links hoverable. */
export function ChordMini({ nodes, links, size = 220, ariaLabel, weightLabel = "flows" }: Props) {
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [hoverLink, setHoverLink] = useState<number | null>(null);
  const tip = useChartTooltip();
  const r = size / 2 - 24;
  const cx = size / 2;
  const cy = size / 2;
  const angleOf = (i: number) => (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
  const pos = nodes.map((n, i) => ({ id: n.id, label: n.label, x: cx + r * Math.cos(angleOf(i)), y: cy + r * Math.sin(angleOf(i)) }));
  const map = new Map(pos.map((p) => [p.id, p]));
  const maxW = Math.max(...links.map((l) => l.weight), 1);
  const totalOf = (id: string) =>
    links.filter((l) => l.from === id || l.to === id).reduce((s, l) => s + l.weight, 0);

  return (
    <div
      ref={tip.wrapperRef}
      className="relative block w-full mx-auto"
      style={{ maxWidth: size }}
      onMouseMove={tip.onMove}
      onMouseLeave={() => { tip.hide(); setHoverNode(null); setHoverLink(null); }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="auto" role="img" aria-label={ariaLabel ?? "Referral flow chord"} className="block overflow-visible" style={{ aspectRatio: "1 / 1" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--pc-border)" strokeDasharray="2 4" />
        {links.map((l, i) => {
          const a = map.get(l.from);
          const b = map.get(l.to);
          if (!a || !b) return null;
          const activeNode = hoverNode === null || hoverNode === l.from || hoverNode === l.to;
          const activeLink = hoverLink === i;
          const w = 0.6 + (l.weight / maxW) * 2.6;
          const opacity = activeLink ? 0.95 : activeNode ? 0.55 : 0.08;
          return (
            <path
              key={i}
              d={`M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`}
              stroke="var(--pc-primary)"
              strokeWidth={activeLink ? w + 1 : w}
              fill="none"
              opacity={opacity}
              style={{ transition: "opacity 200ms ease-out, stroke-width 160ms ease-out", cursor: "pointer" }}
              onMouseEnter={(e) => {
                setHoverLink(i);
                tip.show(
                  <>
                    <TooltipTitle sub={`${a.label} → ${b.label}`}>Flow</TooltipTitle>
                    <TooltipRow label={weightLabel} value={l.weight.toLocaleString()} />
                    <TooltipRow label="Share of total" value={`${((l.weight / links.reduce((s, x) => s + x.weight, 0)) * 100).toFixed(1)}%`} />
                  </>,
                  e,
                );
              }}
              onMouseLeave={() => setHoverLink(null)}
            />
          );
        })}
        {pos.map((p) => {
          const active = hoverNode === null || hoverNode === p.id;
          return (
            <g
              key={p.id}
              onMouseEnter={(e) => {
                setHoverNode(p.id);
                const inbound = links.filter((l) => l.to === p.id).reduce((s, l) => s + l.weight, 0);
                const outbound = links.filter((l) => l.from === p.id).reduce((s, l) => s + l.weight, 0);
                tip.show(
                  <>
                    <TooltipTitle sub={p.label}>Node</TooltipTitle>
                    <TooltipRow label={`Total ${weightLabel}`} value={totalOf(p.id).toLocaleString()} />
                    <TooltipRow label="Inbound" value={inbound.toLocaleString()} />
                    <TooltipRow label="Outbound" value={outbound.toLocaleString()} />
                    <TooltipHint>Arcs to/from this node are highlighted.</TooltipHint>
                  </>,
                  e,
                );
              }}
              onMouseLeave={() => setHoverNode(null)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={p.x} cy={p.y} r={hoverNode === p.id ? 7 : 5} fill="var(--pc-primary)" opacity={active ? 1 : 0.35}
                style={{ transition: "r 140ms ease-out, opacity 140ms ease-out" }} />
              <text
                x={p.x}
                y={p.y + (p.y < cy ? -8 : 14)}
                textAnchor="middle"
                className="text-[9px]"
                fill="var(--pc-muted)"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartTooltip state={tip.state} />
    </div>
  );
}
