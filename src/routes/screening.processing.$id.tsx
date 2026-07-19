import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, palette } from "@/components/AppShell";
import { loadSessions } from "@/lib/screening-store";

export const Route = createFileRoute("/screening/processing/$id")({
  loader: ({ params }) => ({ id: params.id }),
  head: () => ({ meta: [{ title: "Reading your responses… — PeaceCode" }] }),
  component: Processing,
});

const { surface, border, ink, muted, primary } = palette;

const STEPS = [
  "Reading your responses",
  "Feeling for patterns",
  "Calculating scores",
  "Composing insights",
  "Preparing gentle recommendations",
];

function Processing() {
  const { id } = Route.useLoaderData();
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    // ensure session exists
    const found = loadSessions().find((s) => s.id === id);
    if (!found) { nav({ to: "/screening" }); return; }
    const t = setInterval(() => setStep((s) => s + 1), 700);
    return () => clearInterval(t);
  }, [id, nav]);

  useEffect(() => {
    if (step >= STEPS.length) {
      const to = setTimeout(() => nav({ to: "/screening/results/$id", params: { id } }), 400);
      return () => clearTimeout(to);
    }
  }, [step, id, nav]);

  return (
    <AppShell>
      <main className="min-h-[70vh] flex items-center justify-center px-5">
        <div className="max-w-md w-full text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: primary }} />
            <div className="absolute inset-2 rounded-full" style={{ background: primary, opacity: 0.15 }} />
            <div className="absolute inset-5 rounded-full" style={{ background: primary, opacity: 0.35 }} />
            <div className="absolute inset-9 rounded-full" style={{ background: primary }} />
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: primary }}>Please stay</div>
          <h1 className="font-serif text-3xl mt-2">One quiet moment.</h1>
          <ul className="mt-8 flex flex-col gap-2 text-left">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-[13px] transition-opacity" style={{ opacity: i <= step ? 1 : 0.35, color: i < step ? ink : muted }}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: i < step ? primary : surface, border: `1px solid ${border}`, color: "white" }}>
                  {i < step ? "✓" : ""}
                </span>
                {s}{i === step ? "…" : ""}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </AppShell>
  );
}
