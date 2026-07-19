// Reusable settings primitives + page shell.
import { Link } from "@tanstack/react-router";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { type ReactNode } from "react";
import { palette } from "@/components/AppShell";

const { surface, surface2, border, ink, muted, primary } = palette;

export function SettingsShell({
  title, description, children,
}: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
      <nav className="text-[11px] tracking-[0.22em] uppercase mb-6 flex items-center gap-2" style={{ color: muted }}>
        <span>Settings</span>
        <ChevronRight className="w-3 h-3" /><span style={{ color: ink }}>{title}</span>
      </nav>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] tracking-tight" style={{ color: ink }}>{title}</h1>
          {description && <p className="text-[13px] mt-2 max-w-lg" style={{ color: muted }}>{description}</p>}
        </div>
        <Link to="/" className="hidden sm:inline-flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-full" style={{ background: surface, border: `1px solid ${border}`, color: muted }}>
          <ArrowLeft className="w-3 h-3" /> back
        </Link>
      </div>
      <div className="space-y-4">{children}</div>
    </main>
  );
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
      <header className="px-5 pt-5 pb-3">
        <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: primary }}>{title}</div>
        {hint && <div className="text-[12px] mt-1" style={{ color: muted }}>{hint}</div>}
      </header>
      <div className="divide-y" style={{ borderColor: border }}>{children}</div>
    </section>
  );
}

export function Row({
  label, hint, action, children,
}: { label: string; hint?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px]" style={{ color: ink }}>{label}</div>
        {hint && <div className="text-[11.5px] mt-0.5" style={{ color: muted }}>{hint}</div>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative w-10 h-6 rounded-full transition"
      style={{ background: checked ? primary : "#DCE3EF" }}
    >
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform" style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }} />
    </button>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex p-1 rounded-full" style={{ background: surface2, border: `1px solid ${border}` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} className="px-3 py-1 rounded-full text-[11.5px] transition" style={{ background: active ? "#fff" : "transparent", color: active ? ink : muted, boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}>{o.label}</button>
        );
      })}
    </div>
  );
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className="text-[12.5px] px-3 py-2 rounded-xl outline-none"
      style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
