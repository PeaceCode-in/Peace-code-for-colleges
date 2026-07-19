// Shared UI primitives for the Product Hub.
import { Link } from "@tanstack/react-router";
import type { ReactNode, CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { palette } from "@/components/AppShell";

const { surface, surface2, border, ink, muted, soft, primary } = palette;

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`${wide ? "max-w-[1360px]" : "max-w-[1180px]"} mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12`}>
      {children}
    </div>
  );
}

export function BackBar({ to = "/hub", label = "Product hub" }: { to?: string; label?: string }) {
  return (
    <div className="mb-6">
      <Link to={to} className="inline-flex items-center gap-1.5 text-[12px] tracking-wide" style={{ color: muted }}>
        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.6} /> {label}
      </Link>
    </div>
  );
}

export function PageTitle({ eyebrow, title, sub, right }: {
  eyebrow?: string; title: string; sub?: string; right?: ReactNode;
}) {
  return (
    <header className="mb-8 lg:mb-10 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="text-[10px] tracking-[0.32em] uppercase mb-3" style={{ color: muted }}>{eyebrow}</div>}
        <h1 className="font-serif tracking-tight text-[30px] sm:text-[38px] leading-[1.05]" style={{ color: ink }}>{title}</h1>
        {sub && <p className="mt-3 text-[13.5px] max-w-2xl" style={{ color: muted }}>{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function Card({ children, className = "", padded = true, tone = "surface", style }: {
  children: ReactNode; className?: string; padded?: boolean;
  tone?: "surface" | "surface2" | "soft"; style?: CSSProperties;
}) {
  const bg = tone === "surface" ? surface : tone === "surface2" ? surface2 : soft;
  return (
    <div className={`rounded-[24px] ${padded ? "p-5 sm:p-6" : ""} ${className}`}
         style={{ background: bg, border: `1px solid ${border}`, color: ink, ...style }}>
      {children}
    </div>
  );
}

export function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="font-serif text-[20px] sm:text-[22px] tracking-tight" style={{ color: ink }}>{title}</h2>
        {sub && <div className="text-[12px] mt-1" style={{ color: muted }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export function Chip({ children, tone = "quiet", active, onClick }: {
  children: ReactNode; tone?: "quiet" | "warm" | "primary" | "outline";
  active?: boolean; onClick?: () => void;
}) {
  const s: CSSProperties =
    active                   ? { background: primary, color: "#fff", border: `1px solid ${primary}` } :
    tone === "warm"          ? { background: soft, color: primary, border: `1px solid ${soft}` } :
    tone === "primary"       ? { background: primary, color: "#fff", border: `1px solid ${primary}` } :
    tone === "outline"       ? { background: "transparent", color: muted, border: `1px solid ${border}` } :
                               { background: surface2, color: muted, border: `1px solid ${border}` };
  const cls = "inline-flex items-center gap-1 rounded-full px-3 h-7 text-[11px] tracking-wide transition";
  return onClick ? <button onClick={onClick} className={cls} style={s}>{children}</button>
                 : <span className={cls} style={s}>{children}</span>;
}

export function PrimaryBtn({ children, onClick, type, disabled, className = "" }: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  return (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full h-11 px-5 text-[12.5px] tracking-wide transition disabled:opacity-50 hover:opacity-90 ${className}`}
      style={{ background: ink, color: "var(--pc-bg)" }}>
      {children}
    </button>
  );
}
export function GhostBtn({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full h-11 px-5 text-[12.5px] tracking-wide transition ${className}`}
      style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10.5px] tracking-[0.22em] uppercase mb-1.5" style={{ color: muted }}>{label}</div>
      {children}
    </label>
  );
}
export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input {...rest}
      className={`w-full h-11 rounded-2xl px-4 text-[13.5px] outline-none focus:ring-2 ${className}`}
      style={{ background: surface2, border: `1px solid ${border}`, color: ink }}/>
  );
}
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea {...rest}
      className={`w-full rounded-2xl p-4 text-[13.5px] outline-none focus:ring-2 ${className}`}
      style={{ background: surface2, border: `1px solid ${border}`, color: ink }}/>
  );
}

export function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (b: boolean) => void; label: string; hint?: string }) {
  return (
    <button onClick={() => onChange(!on)}
      className="w-full flex items-start gap-3 rounded-2xl p-4 text-left transition"
      style={{ background: surface2, border: `1px solid ${border}` }}>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px]" style={{ color: ink }}>{label}</div>
        {hint && <div className="text-[11.5px] mt-0.5" style={{ color: muted }}>{hint}</div>}
      </div>
      <span className="w-9 h-5 rounded-full relative shrink-0" style={{ background: on ? primary : border }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
              style={{ background: "var(--pc-bg)", transform: `translateX(${on ? 18 : 2}px)` }}/>
      </span>
    </button>
  );
}

export function EmptyState({ title, sub, cta }: { title: string; sub?: string; cta?: ReactNode }) {
  return (
    <Card className="text-center py-12">
      <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: soft, color: primary }}>
        <Sparkles className="w-6 h-6" strokeWidth={1.4}/>
      </div>
      <div className="font-serif text-[19px] mt-4" style={{ color: ink }}>{title}</div>
      {sub && <p className="text-[12.5px] mt-1.5" style={{ color: muted }}>{sub}</p>}
      {cta && <div className="mt-5 flex justify-center">{cta}</div>}
    </Card>
  );
}

export function Row({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center gap-3 ${className}`}>{children}</div>;
}

export function LinkRow({ to, label, hint, right }: { to: string; label: string; hint?: string; right?: ReactNode }) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Link to={to as any} className="flex items-center gap-3 px-4 py-3 border-t transition hover:translate-x-[2px]"
      style={{ borderColor: border, color: ink }}>
      <div className="flex-1 min-w-0">
        <div className="text-[13px]">{label}</div>
        {hint && <div className="text-[11.5px]" style={{ color: muted }}>{hint}</div>}
      </div>
      {right ?? <ChevronRight className="w-3.5 h-3.5" style={{ color: muted }}/>}
    </Link>
  );
}

// Theme preview tile — used across pages
export function ThemePreview({ colors, radius = 22, className = "" }: {
  colors: [string, string, string, string]; radius?: number; className?: string;
}) {
  const [bg, srf, accent, txt] = colors;
  return (
    <div className={`relative overflow-hidden ${className}`}
         style={{ background: bg, borderRadius: radius, border: `1px solid ${border}` }}>
      {/* aurora blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full blur-2xl opacity-70" style={{ background: accent }}/>
        <div className="absolute -bottom-8 -right-6 w-28 h-28 rounded-full blur-2xl opacity-40" style={{ background: srf }}/>
      </div>
      {/* mini dashboard */}
      <div className="relative p-3 flex flex-col gap-2 h-full">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: accent }}/>
          <div className="h-2 w-14 rounded-full opacity-90" style={{ background: srf }}/>
        </div>
        <div className="rounded-lg p-2" style={{ background: srf }}>
          <div className="h-1.5 w-10 rounded-full mb-1.5" style={{ background: accent, opacity: 0.7 }}/>
          <div className="h-1 w-16 rounded-full opacity-30" style={{ background: txt }}/>
          <div className="h-1 w-12 rounded-full opacity-20 mt-1" style={{ background: txt }}/>
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1 rounded-md h-6" style={{ background: srf }}/>
          <div className="w-6 rounded-md h-6" style={{ background: accent, opacity: 0.85 }}/>
        </div>
      </div>
    </div>
  );
}
