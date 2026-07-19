// Top-6 departments by participation. Each row is a link — the eventual
// /departments route can read ?dept=<slug> to filter, and this stays a
// deep-link contract even before that page ships. Bar fill uses accent
// at decreasing opacity so the eye reads rank.
import { BentoTile } from "./BentoTile";
import type { ExecutiveSnapshot } from "@/lib/dashboard-mock";

export function DepartmentBreakdown({ snap, className = "" }: { snap: ExecutiveSnapshot; className?: string }) {
  const rows = snap.departments.slice(0, 6);
  return (
    <BentoTile title="Departments" eyebrow="Participation, top 6" className={className}>
      <ul className="flex flex-col gap-2" role="list">
        {rows.map((r, i) => {
          const opacity = 1 - i * 0.12;
          return (
            <li key={r.slug}>
              <a
                href={`/departments?dept=${r.slug}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 outline-none focus-visible:ring-2"
                style={{
                  color: "var(--pc-ink-2)",
                  // @ts-expect-error -- CSS custom prop for focus ring
                  "--tw-ring-color": "var(--pc-accent)",
                }}
              >
                <span className="min-w-0 truncate text-[12.5px]">{r.name}</span>
                <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>
                  {r.participationPct}%
                </span>
                <div
                  className="col-span-2 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--pc-surface2)" }}
                >
                  <div
                    style={{
                      width: `${r.participationPct}%`,
                      height: "100%",
                      background: "var(--pc-accent)",
                      opacity,
                      transition: "width 240ms ease",
                    }}
                  />
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </BentoTile>
  );
}
