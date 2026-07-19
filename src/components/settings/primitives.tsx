// Reusable settings primitives + page shell.
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Search, ArrowLeft } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { palette } from "@/components/AppShell";
import { SETTINGS_INDEX } from "@/lib/settings-store";

const { surface, surface2, border, ink, muted, primary } = palette;

export function SettingsShell({
  title, description, children, back = "/settings",
}: { title: string; description?: string; children: ReactNode; back?: string }) {
  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
      <nav className="text-[11px] tracking-[0.22em] uppercase mb-6 flex items-center gap-2" style={{ color: muted }}>
        <Link to="/settings" className="hover:underline">Settings</Link>
        {back !== "/settings" && <><ChevronRight className="w-3 h-3" /><Link to={back}>Back</Link></>}
        <ChevronRight className="w-3 h-3" /><span style={{ color: ink }}>{title}</span>
      </nav>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] tracking-tight" style={{ color: ink }}>{title}</h1>
          {description && <p className="text-[13px] mt-2 max-w-lg" style={{ color: muted }}>{description}</p>}
        </div>
        <Link to={back} className="hidden sm:inline-flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-full" style={{ background: surface, border: `1px solid ${border}`, color: muted }}>
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

export function TextField({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      className="w-full text-[13px] px-3 py-2 rounded-xl outline-none transition"
      style={{ background: surface2, border: `1px solid ${border}`, color: ink }} />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} placeholder={placeholder} rows={rows} onChange={(e) => onChange(e.target.value)}
      className="w-full text-[13px] px-3 py-2 rounded-xl outline-none resize-none"
      style={{ background: surface2, border: `1px solid ${border}`, color: ink }} />
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

export function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1 rounded-full text-[11.5px] transition"
      style={{ background: active ? primary : surface2, color: active ? "#fff" : ink, border: `1px solid ${border}` }}>{label}</button>
  );
}

export function DangerButton({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="text-[12px] px-3 py-1.5 rounded-full transition" style={{ background: "#FCE8EC", color: "#B54848", border: "1px solid #F1C7D0" }}>{children}</button>
  );
}

export function PrimaryButton({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="text-[12.5px] px-4 py-2 rounded-full transition hover:-translate-y-[1px]" style={{ background: primary, color: "#fff" }}>{children}</button>
  );
}

export function GhostButton({ onClick, to, children }: { onClick?: () => void; to?: string; children: ReactNode }) {
  const cls = "text-[12px] px-3 py-1.5 rounded-full transition inline-flex items-center gap-1";
  const style = { background: surface, border: `1px solid ${border}`, color: ink } as const;
  if (to) return <Link to={to} className={cls} style={style}>{children}</Link>;
  return <button onClick={onClick} className={cls} style={style}>{children}</button>;
}

// ─── Search field with instant results ────────────────────────
export function SettingsSearch() {
  const [q, setQ] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [] as typeof SETTINGS_INDEX;
    return SETTINGS_INDEX.filter((i) => i.label.toLowerCase().includes(query) || i.hint.toLowerCase().includes(query) || i.keywords.some((k) => k.includes(query))).slice(0, 6);
  }, [q]);
  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-full px-4 py-3" style={{ background: surface, border: `1px solid ${border}` }}>
        <Search className="w-3.5 h-3.5 opacity-50 shrink-0" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search settings…" className="w-full bg-transparent outline-none text-[13px] placeholder:opacity-50" />
        {q && <button onClick={() => setQ("")} className="text-[11px]" style={{ color: muted }}>clear</button>}
      </div>
      {q && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-20" style={{ background: surface, border: `1px solid ${border}`, boxShadow: "0 20px 60px -20px rgba(0,0,0,0.2)" }}>
          {results.length === 0 && <div className="p-4 text-[12px]" style={{ color: muted }}>Nothing matches “{q}”.</div>}
          {results.map((r) => (
            <Link key={r.to} to={r.to} onClick={() => setQ("")} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--pc-surface2)]" style={{ borderTop: r.to === results[0].to ? "none" : `1px solid ${border}`, color: pathname === r.to ? primary : ink }}>
              <div>
                <div className="text-[13px]">{r.label}</div>
                <div className="text-[11px] opacity-60">{r.hint}</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
