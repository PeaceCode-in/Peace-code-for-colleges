// Shared UI primitives for the Community Events module.
import { Link } from "@tanstack/react-router";
import type { ReactNode, CSSProperties } from "react";
import { ChevronLeft, Bookmark, BookmarkCheck, Users, MapPin, Clock, Video, Sparkles, Flame } from "lucide-react";
import { palette } from "@/components/AppShell";
import {
  type EventItem, formatDateParts, isBookmarked, toggleBookmark, organizerById, statusOf,
} from "@/lib/events-store";
import { useState, useEffect } from "react";

const { surface, surface2, border, ink, muted, soft, primary } = palette;

// ─── layout helpers ────────────────────────────────────────────
export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`${wide ? "max-w-[1360px]" : "max-w-[1200px]"} mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12`}>
      {children}
    </div>
  );
}

export function BackBar({ to = "/events", label = "All events" }: { to?: string; label?: string }) {
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
    <div
      className={`rounded-[24px] ${padded ? "p-5 sm:p-6" : ""} ${className}`}
      style={{ background: bg, border: `1px solid ${border}`, color: ink, ...style }}
    >
      {children}
    </div>
  );
}

export function Chip({ children, tone = "quiet", onClick, active }: {
  children: ReactNode; tone?: "quiet" | "warm" | "primary" | "outline";
  onClick?: () => void; active?: boolean;
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

export function Divider() {
  return <div className="h-px w-full my-6" style={{ background: border }} />;
}

// ─── date-block used on cards ─────────────────────────────────
export function DateBlock({ dateISO }: { dateISO: string }) {
  const { day, month } = formatDateParts(dateISO);
  return (
    <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0"
         style={{ background: surface2, border: `1px solid ${border}` }}>
      <div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: muted }}>{month}</div>
      <div className="font-serif text-[20px] leading-none" style={{ color: ink }}>{day}</div>
    </div>
  );
}

// ─── event banner (SVG placeholder, per-event hue) ─────────────
export function EventBanner({ e, className = "" }: { e: EventItem; className?: string }) {
  const c = e.bannerHue;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: c }}>
      <svg viewBox="0 0 400 240" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <radialGradient id={`g1-${e.id}`} cx="20%" cy="30%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id={`g2-${e.id}`} cx="85%" cy="80%" r="55%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.10)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect width="400" height="240" fill={c} />
        <rect width="400" height="240" fill={`url(#g1-${e.id})`} />
        <rect width="400" height="240" fill={`url(#g2-${e.id})`} />
        <circle cx="330" cy="60"  r="42" fill="rgba(255,255,255,0.35)" />
        <circle cx="70"  cy="200" r="80" fill="rgba(255,255,255,0.20)" />
        <path d="M0,180 Q100,140 200,175 T400,155 L400,240 L0,240 Z" fill="rgba(255,255,255,0.28)" />
      </svg>
      <div className="relative p-4 sm:p-5 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between">
          <span className="rounded-full h-7 px-3 text-[10.5px] tracking-wide flex items-center"
                style={{ background: "rgba(255,255,255,0.6)", color: "#333", backdropFilter: "blur(6px)" }}>
            {e.category}
          </span>
          {e.trending && (
            <span className="rounded-full h-7 px-2.5 text-[10px] tracking-wide flex items-center gap-1"
                  style={{ background: "rgba(0,0,0,0.15)", color: "#fff", backdropFilter: "blur(6px)" }}>
              <Flame className="w-3 h-3" /> Trending
            </span>
          )}
        </div>
        <div>
          <div className="font-serif text-[18px] sm:text-[20px] leading-tight" style={{ color: "#22323e" }}>{e.title}</div>
          <div className="text-[11.5px] mt-0.5" style={{ color: "rgba(0,0,0,0.55)" }}>{e.tagline}</div>
        </div>
      </div>
    </div>
  );
}

// ─── the reusable event card ─────────────────────────────────
export function EventCard({ e, layout = "row" }: { e: EventItem; layout?: "row" | "grid" | "featured" }) {
  const { day, month, time, weekday } = formatDateParts(e.date);
  const org = organizerById(e.organizerId);
  const status = statusOf(e);
  const [bm, setBm] = useState(false);
  useEffect(() => { setBm(isBookmarked(e.id)); }, [e.id]);
  const flip = (ev: React.MouseEvent) => { ev.preventDefault(); ev.stopPropagation(); toggleBookmark(e.id); setBm(isBookmarked(e.id)); };

  if (layout === "featured") {
    return (
      <Link to="/events/$id" params={{ id: e.id }}
        className="group relative block rounded-[26px] overflow-hidden transition hover:-translate-y-[2px]"
        style={{ background: surface, border: `1px solid ${border}` }}>
        <div className="grid sm:grid-cols-[1.15fr,1fr] min-h-[300px]">
          <EventBanner e={e} className="min-h-[220px]" />
          <div className="p-5 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Chip tone="warm"><Sparkles className="w-3 h-3" /> Featured</Chip>
                <Chip tone="outline">{e.category}</Chip>
              </div>
              <h3 className="font-serif text-[22px] sm:text-[26px] leading-tight tracking-tight" style={{ color: ink }}>{e.title}</h3>
              <p className="text-[13px] mt-2 line-clamp-2" style={{ color: muted }}>{e.description}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-y-2 gap-x-4 text-[12px]" style={{ color: muted }}>
              <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{weekday}, {month} {day} · {time}</div>
              <div className="flex items-center gap-1.5">{e.mode === "online" ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}{e.location}</div>
              <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{e.registered}/{e.capacity} joined</div>
              <div>{org?.name}</div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-[12.5px]" style={{ color: primary }}>Open event →</span>
              <span className="text-[10.5px] tracking-wide uppercase" style={{ color: muted }}>{status === "live" ? "Live now" : status}</span>
            </div>
          </div>
        </div>
        <button onClick={flip} aria-label="Bookmark"
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(6px)", color: primary }}>
          {bm ? <BookmarkCheck className="w-4 h-4"/> : <Bookmark className="w-4 h-4"/>}
        </button>
      </Link>
    );
  }

  if (layout === "grid") {
    return (
      <Link to="/events/$id" params={{ id: e.id }}
        className="group relative block rounded-[22px] overflow-hidden transition hover:-translate-y-[2px]"
        style={{ background: surface, border: `1px solid ${border}` }}>
        <EventBanner e={e} className="h-[150px]" />
        <div className="p-4">
          <div className="flex items-center gap-2 text-[11px]" style={{ color: muted }}>
            <span>{weekday}, {month} {day}</span><span>·</span><span>{time}</span>
          </div>
          <h3 className="font-serif text-[16.5px] leading-tight mt-1.5 line-clamp-2" style={{ color: ink }}>{e.title}</h3>
          <div className="mt-3 flex items-center justify-between text-[11.5px]" style={{ color: muted }}>
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              {e.mode === "online" ? <Video className="w-3.5 h-3.5 shrink-0" /> : <MapPin className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{e.location}</span>
            </div>
            <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {e.registered}</div>
          </div>
        </div>
        <button onClick={flip} aria-label="Bookmark"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(6px)", color: primary }}>
          {bm ? <BookmarkCheck className="w-4 h-4"/> : <Bookmark className="w-4 h-4"/>}
        </button>
      </Link>
    );
  }

  // "row"
  return (
    <Link to="/events/$id" params={{ id: e.id }}
      className="group flex items-center gap-4 rounded-[22px] p-3 pr-4 transition hover:-translate-y-[1px]"
      style={{ background: surface, border: `1px solid ${border}` }}>
      <DateBlock dateISO={e.date} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>
          <span>{e.category}</span><span>·</span><span>{time}</span>
        </div>
        <div className="font-serif text-[15.5px] leading-tight mt-0.5 truncate" style={{ color: ink }}>{e.title}</div>
        <div className="text-[11.5px] mt-1 flex items-center gap-3 truncate" style={{ color: muted }}>
          <span className="flex items-center gap-1">{e.mode === "online" ? <Video className="w-3 h-3"/> : <MapPin className="w-3 h-3"/>}<span className="truncate">{e.location}</span></span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{e.registered}/{e.capacity}</span>
        </div>
      </div>
      <button onClick={flip} aria-label="Bookmark"
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: surface2, color: bm ? primary : muted }}>
        {bm ? <BookmarkCheck className="w-4 h-4"/> : <Bookmark className="w-4 h-4"/>}
      </button>
    </Link>
  );
}

// ─── misc ─────────────────────────────────────────────────
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

export function StatPill({ icon, label, value }: { icon?: ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: surface2, border: `1px solid ${border}` }}>
      <div className="text-[10.5px] tracking-[0.22em] uppercase flex items-center gap-1.5" style={{ color: muted }}>
        {icon}{label}
      </div>
      <div className="font-serif text-[22px] mt-1" style={{ color: ink }}>{value}</div>
    </div>
  );
}
