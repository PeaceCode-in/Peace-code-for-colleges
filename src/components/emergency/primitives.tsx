// Shared UI primitives for the Emergency Center — kept small and calm.
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronLeft, LifeBuoy } from "lucide-react";
import { palette } from "@/components/AppShell";

const { surface, surface2, border, ink, muted, soft, primary } = palette;

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
      {children}
    </div>
  );
}

export function BackBar({ to = "/emergency", label = "Back to Emergency" }: { to?: string; label?: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Link to={to} className="inline-flex items-center gap-1.5 text-[12px] tracking-wide" style={{ color: muted }}>
        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.6} /> {label}
      </Link>
      <Link
        to="/emergency/helplines"
        className="inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-[11px]"
        style={{ background: surface2, border: `1px solid ${border}`, color: ink }}
        aria-label="Emergency helplines"
      >
        <LifeBuoy className="w-3.5 h-3.5" strokeWidth={1.6} /> Helplines
      </Link>
    </div>
  );
}

export function PageTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <header className="mb-8 lg:mb-10">
      {eyebrow && <div className="text-[10px] tracking-[0.32em] uppercase mb-3" style={{ color: muted }}>{eyebrow}</div>}
      <h1 className="font-serif tracking-tight text-[30px] sm:text-[38px] leading-[1.05]" style={{ color: ink }}>{title}</h1>
      {sub && <p className="mt-3 text-[13.5px] max-w-2xl" style={{ color: muted }}>{sub}</p>}
    </header>
  );
}

export function Card({ children, className = "", padded = true, tone = "surface" }: {
  children: ReactNode; className?: string; padded?: boolean; tone?: "surface" | "surface2" | "soft";
}) {
  const bg = tone === "surface" ? surface : tone === "surface2" ? surface2 : soft;
  return (
    <div
      className={`rounded-[24px] ${padded ? "p-5 sm:p-6" : ""} ${className}`}
      style={{ background: bg, border: `1px solid ${border}`, color: ink }}
    >
      {children}
    </div>
  );
}

export function Row({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center gap-3 ${className}`}>{children}</div>;
}

export function BigAction({
  to, onClick, title, sub, icon, tone = "calm",
}: {
  to?: string; onClick?: () => void; title: string; sub?: string;
  icon?: ReactNode;
  tone?: "calm" | "warm" | "quiet";
}) {
  const bg = tone === "warm" ? soft : tone === "quiet" ? surface2 : surface;
  const inner = (
    <>
      {icon && <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: surface2, color: primary }}>{icon}</span>}
      <div className="min-w-0">
        <div className="font-serif text-[17px] leading-tight">{title}</div>
        {sub && <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: muted }}>{sub}</div>}
      </div>
    </>
  );
  const cls = "flex items-start gap-4 rounded-[22px] p-5 text-left w-full transition hover:-translate-y-[1px] active:translate-y-0";
  const style = { background: bg, border: `1px solid ${border}`, color: ink };
  return to ? <Link to={to} className={cls} style={style}>{inner}</Link> : <button className={cls} style={style} onClick={onClick}>{inner}</button>;
}

export function Chip({ children, tone = "quiet" }: { children: ReactNode; tone?: "quiet" | "warm" | "critical" }) {
  const c =
    tone === "critical" ? { background: "rgba(217,72,72,0.10)", color: "#c14545" } :
    tone === "warm" ? { background: soft, color: primary } :
    { background: surface2, color: muted };
  return <span className="inline-flex items-center gap-1 rounded-full px-2.5 h-6 text-[10.5px] tracking-wide" style={c}>{children}</span>;
}

export function Divider() {
  return <div className="h-px w-full my-6" style={{ background: border }} />;
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
    <input
      {...rest}
      className={`w-full h-11 rounded-2xl px-4 text-[13.5px] outline-none focus:ring-2 ${className}`}
      style={{ background: surface2, border: `1px solid ${border}`, color: ink }}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`w-full rounded-2xl p-4 text-[13.5px] outline-none focus:ring-2 ${className}`}
      style={{ background: surface2, border: `1px solid ${border}`, color: ink }}
    />
  );
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
