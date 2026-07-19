// Shared UI primitives for the Notification Center.

import { Link } from "@tanstack/react-router";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { palette } from "@/components/AppShell";
import {
  CATEGORY_META, type Notif, timeAgo,
} from "@/lib/notifications-store";

const { surface, surface2, border, ink, muted, primary, soft } = palette;

export function Icon({ name, className = "w-4 h-4", strokeWidth = 1.6 }: { name?: string; className?: string; strokeWidth?: number }) {
  const key = (name && (LucideIcons as unknown as Record<string, LucideIcon>)[name]) ? name! : "Bell";
  const Cmp = (LucideIcons as unknown as Record<string, LucideIcon>)[key];
  return <Cmp className={className} strokeWidth={strokeWidth} />;
}

const PRIORITY_TONE: Record<Notif["priority"], { label: string; color: string }> = {
  critical: { label: "Critical", color: "#e35d5d" },
  high:     { label: "High",     color: "#d98a3d" },
  medium:   { label: "Medium",   color: "var(--pc-primary)" },
  low:      { label: "Low",      color: "var(--pc-muted)" },
};

export function PriorityDot({ p }: { p: Notif["priority"] }) {
  if (p === "low") return null;
  const c = PRIORITY_TONE[p].color;
  return (
    <span className="inline-flex items-center gap-1 text-[9.5px] tracking-[0.14em] uppercase" style={{ color: c }}>
      <span className={`w-1.5 h-1.5 rounded-full ${p === "critical" ? "animate-pulse" : ""}`} style={{ background: c }} />
      {PRIORITY_TONE[p].label}
    </span>
  );
}

export function CategoryChip({ category }: { category: Notif["category"] }) {
  const meta = CATEGORY_META[category];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]"
          style={{ background: surface2, color: muted, border: `1px solid ${border}` }}>
      <Icon name={meta.icon} className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

export function Avatar({ initials, size = 40 }: { initials?: string; size?: number }) {
  return (
    <span
      className="rounded-full flex items-center justify-center font-serif shrink-0"
      style={{ width: size, height: size, background: soft, color: ink, fontSize: size * 0.36 }}
    >
      {initials || "•"}
    </span>
  );
}

/** Card row for a notification in list contexts. */
export function NotifRow({ n, onOpen }: { n: Notif; onOpen?: () => void }) {
  return (
    <Link
      to="/notifications/$id"
      params={{ id: n.id }}
      onClick={onOpen}
      className="group relative flex gap-3 p-3.5 sm:p-4 rounded-2xl transition hover:-translate-y-[1px] hover:shadow-[0_18px_40px_-32px_rgba(0,0,0,0.4)]"
      style={{ background: n.read ? surface : "var(--pc-surface2)", border: `1px solid ${border}` }}
    >
      {!n.read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primary }} />
      )}
      <div className="pl-2 shrink-0">
        {n.person?.initials ? (
          <Avatar initials={n.person.initials} size={40} />
        ) : (
          <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: soft, color: ink }}>
            <Icon name={n.icon || CATEGORY_META[n.category].icon} className="w-[18px] h-[18px]" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2 justify-between">
          <div className="min-w-0">
            <div className={`text-[13.5px] leading-snug truncate ${n.read ? "" : "font-medium"}`} style={{ color: ink }}>
              {n.pinned && <span aria-hidden className="mr-1">📌</span>}
              {n.title}
            </div>
            <div className="text-[12.5px] mt-0.5 line-clamp-2" style={{ color: muted }}>{n.body}</div>
          </div>
          <div className="text-[10.5px] shrink-0 pt-0.5" style={{ color: muted }}>{timeAgo(n.ts)}</div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <CategoryChip category={n.category} />
          <PriorityDot p={n.priority} />
          {n.bookmarked && <span className="text-[10px]" style={{ color: muted }}>★ bookmarked</span>}
        </div>
      </div>
    </Link>
  );
}

/** Section header (Today / Yesterday / ...) */
export function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-baseline justify-between mt-6 mb-2 px-1">
      <div className="font-serif text-[15px]" style={{ color: ink }}>{children}</div>
      {typeof count === "number" && (
        <div className="text-[10.5px] tracking-[0.18em] uppercase" style={{ color: muted }}>{count} items</div>
      )}
    </div>
  );
}

/** Small pill button used in filter/toolbar rows. */
export function Pill({
  active, onClick, children, to,
}: { active?: boolean; onClick?: () => void; children: React.ReactNode; to?: string }) {
  const style = {
    background: active ? "var(--pc-ink)" : surface,
    color: active ? "var(--pc-bg)" : muted,
    border: `1px solid ${active ? "transparent" : border}`,
  } as const;
  const cls = "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] whitespace-nowrap transition";
  if (to) return <Link to={to} className={cls} style={style}>{children}</Link>;
  return <button onClick={onClick} className={cls} style={style}>{children}</button>;
}

/** Soft section container. */
export function Panel({ children, className = "", padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <section
      className={`rounded-3xl ${padded ? "p-5 sm:p-6" : ""} ${className}`}
      style={{ background: surface, border: `1px solid ${border}` }}
    >
      {children}
    </section>
  );
}

/** Small icon button, used in toolbars. */
export function IconBtn({
  label, icon, onClick, to,
}: { label: string; icon: string; onClick?: () => void; to?: string }) {
  const cls = "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12px] whitespace-nowrap transition hover:opacity-90";
  const style = { background: surface, border: `1px solid ${border}`, color: ink } as const;
  const inner = (<><Icon name={icon} className="w-3.5 h-3.5" /> {label}</>);
  if (to) return <Link to={to} className={cls} style={style}>{inner}</Link>;
  return <button onClick={onClick} className={cls} style={style}>{inner}</button>;
}
