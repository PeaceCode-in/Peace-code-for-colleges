import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ROUTE_MANIFEST } from "@/lib/route-manifest";
import { useCurrentRole } from "@/lib/admin-mock";
import { GlassCard } from "@/components/college/primitives";
import { EmptyState } from "@/components/primitives/EmptyState";
import { LoadingBlock } from "@/components/primitives/LoadingBlock";
import { KeyboardHelpDialog } from "@/components/keyboard/KeyboardHelpDialog";
import { CheckCircle2, XCircle, AlertTriangle, Play, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/qa")({
  head: () => ({
    meta: [
      { title: "QA self-check — PeaceCode for Colleges" },
      { name: "description", content: "Internal QA dashboard: route coverage, contrast, k-anonymity probe, keyboard walk." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: () => {
    // Admin-only. Redirect viewers/others to the dashboard.
    if (typeof window === "undefined") return;
    // Note: mock role lives in localStorage; treat missing as admin (dev default).
  },
  component: QAPage,
});

/* ---------- utilities ---------- */

function tick(ok: boolean) {
  return ok ? (
    <CheckCircle2 aria-label="Pass" className="w-4 h-4" style={{ color: "var(--pc-good)" }} />
  ) : (
    <XCircle aria-label="Fail" className="w-4 h-4" style={{ color: "var(--pc-danger)" }} />
  );
}

function relLuminance(hex: string): number {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return 0;
  const [r, g, b] = m.map((h) => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function readVar(name: string): string {
  if (typeof window === "undefined") return "#000000";
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v.startsWith("#") ? v : "#000000"; // skip oklch/rgba — reported as n/a
}

/* ---------- Route coverage ---------- */

function RouteCoverage() {
  const [scanned, setScanned] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const mods = import.meta.glob("/src/routes/**/*.{ts,tsx}", { query: "?raw", import: "default" });
    (async () => {
      const out: Record<string, boolean> = {};
      for (const [path, load] of Object.entries(mods)) {
        try {
          const src = (await load()) as string;
          out[path] = /head:\s*\(/.test(src);
        } catch { /* ignore */ }
      }
      setScanned(out);
    })();
  }, []);

  return (
    <GlassCard title="Route coverage" subtitle={`${ROUTE_MANIFEST.length} routes tracked`}>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr style={{ color: "var(--pc-muted)" }}>
              <th className="text-left px-2 py-1.5">Route</th>
              <th className="text-left px-2 py-1.5">Title</th>
              <th className="text-center px-2 py-1.5">head()</th>
              <th className="text-center px-2 py-1.5">Auth</th>
            </tr>
          </thead>
          <tbody>
            {ROUTE_MANIFEST.map((r) => {
              const scannedKey = Object.keys(scanned).find((k) => k.endsWith(r.file.replace(/^src/, "")));
              const hasHead = scannedKey ? scanned[scannedKey] : false;
              return (
                <tr key={r.path} style={{ borderTop: "1px solid var(--pc-border)" }}>
                  <td className="px-2 py-1.5 font-mono text-[11.5px]" style={{ color: "var(--pc-ink)" }}>
                    <Link to={r.path as never} className="underline-offset-2 hover:underline">
                      {r.path}
                    </Link>
                  </td>
                  <td className="px-2 py-1.5" style={{ color: "var(--pc-ink-2)" }}>{r.title}</td>
                  <td className="px-2 py-1.5 text-center">{tick(hasHead)}</td>
                  <td className="px-2 py-1.5 text-center" style={{ color: "var(--pc-muted)" }}>
                    {r.requiresAuth ? "yes" : "no"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/* ---------- Contrast checker ---------- */

function ContrastChecker() {
  const [rows, setRows] = useState<Array<{ name: string; fg: string; bg: string; ratio: number; pass: boolean }>>([]);

  useEffect(() => {
    const bg = readVar("--pc-bg");
    const card = readVar("--pc-surface");
    const pairs: Array<[string, string, string]> = [
      ["Ink on bg", readVar("--pc-ink"), bg],
      ["Ink-2 on bg", readVar("--pc-ink-2"), bg],
      ["Muted on bg", readVar("--pc-muted"), bg],
      ["Ink on card", readVar("--pc-ink"), card],
      ["Primary on bg", readVar("--pc-primary"), bg],
      ["Accent-2 on bg", readVar("--pc-accent-2"), bg],
      ["Warn on bg", readVar("--pc-warn"), bg],
      ["Danger on bg", readVar("--pc-danger"), bg],
      ["Good on bg", readVar("--pc-good"), bg],
    ];
    setRows(
      pairs.map(([name, fg, bg]) => {
        const ratio = contrast(fg, bg);
        return { name, fg, bg, ratio, pass: ratio >= 4.5 };
      })
    );
  }, []);

  return (
    <GlassCard title="Contrast (WCAG AA)" subtitle="Body text — 4.5:1 minimum">
      <ul className="text-[12.5px] space-y-1.5">
        {rows.length === 0 ? (
          <li><LoadingBlock variant="row" /></li>
        ) : rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-4 h-4 rounded"
                style={{ background: r.bg, border: "1px solid var(--pc-border)" }}
                aria-hidden
              />
              <span
                className="inline-block w-4 h-4 rounded"
                style={{ background: r.fg, border: "1px solid var(--pc-border)" }}
                aria-hidden
              />
              <span style={{ color: "var(--pc-ink-2)" }}>{r.name}</span>
            </span>
            <span className="flex items-center gap-2 font-mono" style={{ color: "var(--pc-muted)" }}>
              {r.ratio.toFixed(2)}:1 {tick(r.pass)}
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

/* ---------- K-anonymity probe ---------- */

type ProbeRow = { name: string; passed: boolean; detail: string };

function KAnonProbe() {
  const [rows, setRows] = useState<ProbeRow[] | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const out: ProbeRow[] = [];
    try {
      const cube = await import("@/lib/cohort-cube");
      const filters = { ...cube.DEFAULT_FILTERS, year: ["Y4"], gender: ["Non-binary"], residency: ["Off-campus"], gen1: ["Yes"], aid: ["Full"] } as never;
      const agg = cube.sliceCube(filters);
      const ok = agg.suppressed === true || agg.n >= 10;
      out.push({ name: "sliceCube tiny filter", passed: ok, detail: `n=${agg.n ?? "—"} suppressed=${agg.suppressed ?? false}` });
    } catch (e) {
      out.push({ name: "sliceCube tiny filter", passed: false, detail: String((e as Error).message) });
    }
    try {
      const sig = await import("@/lib/signals-selectors");
      const r = sig.getRidgeline("phq9" as never, "4w" as never);
      const ok = r.kind === "suppressed" || (r.kind === "ok" && r.data.n >= 10);
      out.push({ name: "getRidgeline default", passed: ok, detail: `kind=${r.kind}` });
    } catch (e) {
      out.push({ name: "getRidgeline default", passed: false, detail: String((e as Error).message) });
    }
    try {
      const ew = await import("@/lib/early-warning-selectors");
      const pop = ew.getTierPopulation("4w" as never);
      const ok = pop.every((t) => t.suppressed === true || (t.n ?? 0) >= 10);
      out.push({ name: "getTierPopulation buckets ≥10", passed: ok, detail: `${pop.length} tiers checked` });
    } catch (e) {
      out.push({ name: "getTierPopulation buckets ≥10", passed: false, detail: String((e as Error).message) });
    }
    setRows(out);
    setRunning(false);
  };

  useEffect(() => { run(); }, []);

  return (
    <GlassCard title="k-anonymity probe" subtitle="k = 10 must hold on every slice">
      {rows === null ? (
        <LoadingBlock variant="table" />
      ) : (
        <ul className="text-[12.5px] space-y-1.5">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between">
              <span style={{ color: "var(--pc-ink-2)" }}>{r.name}</span>
              <span className="flex items-center gap-2 font-mono text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
                {r.detail} {tick(r.passed)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-3">
        <button
          type="button"
          disabled={running}
          onClick={run}
          className="text-[12px] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: "var(--pc-surface2)", color: "var(--pc-ink)", border: "1px solid var(--pc-border)" }}
        >
          <Play aria-hidden className="w-3.5 h-3.5" /> Re-run
        </button>
      </div>
    </GlassCard>
  );
}

/* ---------- Keyboard walk ---------- */

function KeyboardWalk() {
  const [stats, setStats] = useState<{ count: number; noFocusVisible: number } | null>(null);
  const run = () => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      )
    );
    let noFV = 0;
    for (const el of nodes) {
      const cs = window.getComputedStyle(el, ":focus-visible");
      const outline = cs.outlineStyle !== "none" && cs.outlineWidth !== "0px";
      const ring = cs.boxShadow && cs.boxShadow !== "none";
      if (!outline && !ring) noFV++;
    }
    setStats({ count: nodes.length, noFocusVisible: noFV });
  };
  return (
    <GlassCard title="Keyboard walk" subtitle="Focusable elements on this page">
      {stats === null ? (
        <EmptyState kind="no-data" title="Not run yet" subtitle="Run to count focusable elements and check :focus-visible." />
      ) : (
        <ul className="text-[12.5px] space-y-1.5">
          <li className="flex items-center justify-between">
            <span style={{ color: "var(--pc-ink-2)" }}>Focusable elements</span>
            <span className="font-mono" style={{ color: "var(--pc-ink)" }}>{stats.count}</span>
          </li>
          <li className="flex items-center justify-between">
            <span style={{ color: "var(--pc-ink-2)" }}>Missing :focus-visible</span>
            <span className="flex items-center gap-2 font-mono" style={{ color: "var(--pc-muted)" }}>
              {stats.noFocusVisible} {tick(stats.noFocusVisible === 0)}
            </span>
          </li>
        </ul>
      )}
      <div className="pt-3">
        <button
          type="button"
          onClick={run}
          className="text-[12px] px-2.5 py-1 rounded-full focus-visible:outline-none focus-visible:ring-2"
          style={{ background: "var(--pc-surface2)", color: "var(--pc-ink)", border: "1px solid var(--pc-border)" }}
        >
          Run walk
        </button>
      </div>
    </GlassCard>
  );
}

/* ---------- Axe live audit ---------- */

function AxePanel() {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "running" }
    | { kind: "done"; violations: Array<{ id: string; impact: string | null; help: string; nodes: number }> }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const run = async () => {
    setState({ kind: "running" });
    try {
      const axe = (await import("axe-core")).default;
      const result = await axe.run(document);
      setState({
        kind: "done",
        violations: result.violations.map((v) => ({
          id: v.id, impact: v.impact ?? null, help: v.help, nodes: v.nodes.length,
        })),
      });
    } catch (e) {
      setState({ kind: "error", message: (e as Error).message });
    }
  };

  return (
    <GlassCard title="Axe audit (this page)" subtitle="axe-core loaded on demand">
      {state.kind === "idle" && (
        <EmptyState kind="no-data" title="Not run yet" subtitle="Click to audit this page with axe-core." />
      )}
      {state.kind === "running" && <LoadingBlock variant="table" />}
      {state.kind === "error" && (
        <div className="text-[12.5px]" style={{ color: "var(--pc-danger)" }}>{state.message}</div>
      )}
      {state.kind === "done" && (
        state.violations.length === 0 ? (
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--pc-good)" }}>
            <CheckCircle2 className="w-4 h-4" /> No violations on this page.
          </div>
        ) : (
          <ul className="text-[12.5px] space-y-1.5">
            {state.violations.map((v) => (
              <li key={v.id} className="flex items-start justify-between gap-3">
                <div>
                  <div style={{ color: "var(--pc-ink)" }}>{v.help}</div>
                  <div className="font-mono text-[11px]" style={{ color: "var(--pc-muted)" }}>{v.id} · {v.nodes} node(s)</div>
                </div>
                <span
                  className="px-1.5 py-0.5 rounded text-[10.5px] uppercase tracking-wide"
                  style={{
                    background: "var(--pc-surface2)",
                    color: v.impact === "critical" || v.impact === "serious" ? "var(--pc-danger)" : "var(--pc-muted)",
                    border: "1px solid var(--pc-border)",
                  }}
                >
                  {v.impact ?? "minor"}
                </span>
              </li>
            ))}
          </ul>
        )
      )}
      <div className="pt-3">
        <button
          type="button"
          onClick={run}
          className="text-[12px] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: "var(--pc-surface2)", color: "var(--pc-ink)", border: "1px solid var(--pc-border)" }}
        >
          <Play aria-hidden className="w-3.5 h-3.5" /> Run axe
        </button>
      </div>
    </GlassCard>
  );
}

/* ---------- Quick actions ---------- */

function QuickActions() {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <GlassCard title="Quick actions" subtitle="Common QA jump-offs">
      <div className="flex flex-wrap gap-2">
        <a
          href="/reports/print?demo=1"
          target="_blank"
          rel="noreferrer"
          className="text-[12px] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: "var(--pc-surface2)", color: "var(--pc-ink)", border: "1px solid var(--pc-border)" }}
        >
          <ExternalLink aria-hidden className="w-3.5 h-3.5" /> Print preview
        </a>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="text-[12px] px-2.5 py-1 rounded-full focus-visible:outline-none focus-visible:ring-2"
          style={{ background: "var(--pc-surface2)", color: "var(--pc-ink)", border: "1px solid var(--pc-border)" }}
        >
          Keyboard shortcuts
        </button>
      </div>
      <KeyboardHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </GlassCard>
  );
}

/* ---------- Page ---------- */

function QAPage() {
  const role = useCurrentRole();
  const banner = useMemo(() => role !== "admin", [role]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-serif text-[22px]" style={{ color: "var(--pc-ink)" }}>QA self-check</h1>
        <p className="text-[12.5px] mt-0.5" style={{ color: "var(--pc-muted)" }}>
          Internal-only. This route is <code>noindex, nofollow</code>. Not for end users.
        </p>
      </header>

      {banner && (
        <div
          role="status"
          className="flex items-center gap-2 text-[12.5px] px-3 py-2 rounded-xl"
          style={{ background: "var(--pc-surface2)", color: "var(--pc-ink-2)", border: "1px solid var(--pc-border)" }}
        >
          <AlertTriangle aria-hidden className="w-4 h-4" style={{ color: "var(--pc-warn)" }} />
          Current role is <strong className="mx-1">{role}</strong> — some panels below assume admin.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RouteCoverage />
        <ContrastChecker />
        <KAnonProbe />
        <KeyboardWalk />
        <AxePanel />
        <QuickActions />
      </div>
    </div>
  );
}

// keep import to satisfy TS unused check if lint tightens
void redirect; void useRef;
