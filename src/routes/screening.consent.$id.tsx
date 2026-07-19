import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, palette } from "@/components/AppShell";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { getTest, loadSessions, upsertSession, newSessionId, type Session } from "@/lib/screening-store";

export const Route = createFileRoute("/screening/consent/$id")({
  loader: ({ params }) => {
    const t = getTest(params.id);
    if (!t) throw notFound();
    return { test: t };
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `Consent — ${loaderData.test.name}` : "Consent" }] }),
  notFoundComponent: () => <AppShell><div className="p-10 text-center">Not found. <Link to="/screening/library" className="underline">Library</Link></div></AppShell>,
  component: Consent,
});

const { surface, surface2, border, ink, muted, primary } = palette;

function Consent() {
  const { test } = Route.useLoaderData();
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const nav = useNavigate();
  const ok = c1 && c2 && c3;

  const begin = () => {
    // reuse in-progress or create fresh
    const existing = loadSessions().find((s) => s.testId === test.id && s.status === "in_progress");
    const session: Session = existing ?? {
      id: newSessionId(), testId: test.id, startedAt: Date.now(), updatedAt: Date.now(),
      answers: {}, currentIndex: 0, status: "in_progress",
    };
    upsertSession(session);
    nav({ to: "/screening/assessment/$id", params: { id: test.id }, search: { resume: session.id } });
  };

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
        <nav className="text-[11px] tracking-[0.2em] uppercase mb-6 flex items-center gap-2 flex-wrap" style={{ color: muted }}>
          <Link to="/screening" className="hover:underline">Screening</Link><span>·</span>
          <Link to="/screening/test/$id" params={{ id: test.id }} className="hover:underline">{test.code}</Link><span>·</span>
          <span style={{ color: ink }}>Consent</span>
        </nav>

        <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase px-2.5 py-1 rounded-full mb-4" style={{ background: surface2, color: primary }}>
          <ShieldCheck className="w-3 h-3" /> Consent
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl leading-tight">A short agreement, before we begin.</h1>
        <p className="text-[13px] mt-3" style={{ color: muted }}>Your care matters more than your data. Please read and accept.</p>

        <div className="mt-8 flex flex-col gap-3">
          <Consenter checked={c1} onChange={setC1} text="I understand this is not a medical diagnosis." />
          <Consenter checked={c2} onChange={setC2} text="My responses will remain private on this device unless I choose to share them." />
          <Consenter checked={c3} onChange={setC3} text="I agree to continue with a clear, honest mind." />
        </div>

        <div className="mt-8 flex items-center gap-3 flex-wrap">
          <button
            disabled={!ok}
            onClick={begin}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] text-white transition"
            style={{ background: ink, opacity: ok ? 1 : 0.4, cursor: ok ? "pointer" : "not-allowed" }}
          >
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <Link to="/screening/instructions/$id" params={{ id: test.id }} className="text-[12px]" style={{ color: muted }}>Back</Link>
        </div>
      </main>
    </AppShell>
  );
}

function Consenter({ checked, onChange, text }: { checked: boolean; onChange: (v: boolean) => void; text: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none rounded-2xl p-4" style={{ background: surface, border: `1px solid ${border}` }}>
      <span className="w-5 h-5 rounded-md flex items-center justify-center transition mt-0.5 shrink-0" style={{ background: checked ? primary : surface, border: `1px solid ${checked ? primary : border}` }}>
        {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-[13.5px] leading-relaxed">{text}</span>
    </label>
  );
}
