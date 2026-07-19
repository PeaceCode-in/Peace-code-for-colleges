import { useState } from "react";

interface Node {
  id: string;
  label: string;
}
interface Link {
  from: string;
  to: string;
  weight: number;
}
interface Props {
  nodes: Node[];
  links: Link[];
  size?: number;
  ariaLabel?: string;
}

/** ChordMini — arc diagram: nodes on a ring, weighted arcs between them. */
export function ChordMini({ nodes, links, size = 220, ariaLabel }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const r = size / 2 - 24;
  const cx = size / 2;
  const cy = size / 2;
  const angleOf = (i: number) => (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
  const pos = nodes.map((n, i) => ({ id: n.id, label: n.label, x: cx + r * Math.cos(angleOf(i)), y: cy + r * Math.sin(angleOf(i)) }));
  const map = new Map(pos.map((p) => [p.id, p]));
  const maxW = Math.max(...links.map((l) => l.weight), 1);

  return (
    <svg width={size} height={size} role="img" aria-label={ariaLabel ?? "Referral flow chord"} className="overflow-visible">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--pc-border)" strokeDasharray="2 4" />
      {links.map((l, i) => {
        const a = map.get(l.from);
        const b = map.get(l.to);
        if (!a || !b) return null;
        const active = hover === null || hover === l.from || hover === l.to;
        const w = 0.6 + (l.weight / maxW) * 2.6;
        return (
          <path
            key={i}
            d={`M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`}
            stroke="var(--pc-primary)"
            strokeWidth={w}
            fill="none"
            opacity={active ? 0.55 : 0.08}
            style={{ transition: "opacity 200ms ease-out" }}
          />
        );
      })}
      {pos.map((p) => {
        const active = hover === null || hover === p.id;
        return (
          <g
            key={p.id}
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer" }}
          >
            <circle cx={p.x} cy={p.y} r={5} fill="var(--pc-primary)" opacity={active ? 1 : 0.35} />
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
  );
}
