import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, AlertTriangle, ArrowRight, Check, FileText, Inbox, Settings2, Users, X } from "lucide-react";
import {
  listNotifications, markAllRead, markRead, startLivePolling,
  timeAgo, useNotifications, useUnreadCount, type NotifKind,
} from "@/lib/notifications-store";

const KIND_ICON: Record<NotifKind, React.ComponentType<{ className?: string }>> = {
  risk: AlertTriangle,
  referral: Users,
  screening: Inbox,
  report: FileText,
  system: Settings2,
};
const KIND_TONE: Record<NotifKind, string> = {
  risk: "var(--pc-warn, var(--pc-accent-2))",
  referral: "var(--pc-accent, var(--pc-primary))",
  screening: "var(--pc-good, var(--pc-primary))",
  report: "var(--pc-primary)",
  system: "var(--pc-muted)",
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const unread = useUnreadCount();
  const items = useNotifications();
  const navigate = useNavigate();

  useEffect(() => { startLivePolling(); }, []);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const recent = items.slice(0, 6);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative p-2 rounded-full focus-visible:outline-none focus-visible:ring-2"
        style={{ color: "var(--pc-ink-2)", background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
      >
        <Bell className="h-4 w-4" style={unread > 0 ? { animation: "pulse 2.4s ease-in-out infinite" } : undefined} />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full grid place-items-center text-[9.5px] font-medium px-1"
            style={{ background: "var(--pc-warn, var(--pc-accent-2))", color: "white", border: "1.5px solid var(--pc-header)" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-[360px] rounded-xl z-40 overflow-hidden"
          style={{
            background: "var(--pc-surface)",
            border: "1px solid var(--pc-border)",
            boxShadow: "0 20px 48px -18px color-mix(in oklab, var(--pc-ink) 40%, transparent)",
          }}
        >
          <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: "1px solid var(--pc-border)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[12px] font-serif" style={{ color: "var(--pc-ink)" }}>Notifications</span>
              <span className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>{unread} unread</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => markAllRead()}
                disabled={unread === 0}
                className="text-[11px] px-1.5 py-0.5 rounded disabled:opacity-40"
                style={{ color: "var(--pc-ink-2)" }}
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1 rounded-md"
                style={{ color: "var(--pc-muted)" }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <ul className="max-h-[380px] overflow-auto">
            {recent.length === 0 && (
              <li className="p-6 text-center text-[12px]" style={{ color: "var(--pc-muted)" }}>
                No notifications yet.
              </li>
            )}
            {recent.map((n) => {
              const Icon = KIND_ICON[n.kind];
              return (
                <li
                  key={n.id}
                  className="group px-3.5 py-2.5 flex items-start gap-2.5 hover:bg-[color:var(--pc-surface2)] cursor-pointer transition-colors"
                  onClick={() => { markRead(n.id); setOpen(false); navigate({ to: n.deepLink }); }}
                  style={{ borderTop: "1px solid var(--pc-border)" }}
                >
                  <span
                    aria-hidden
                    className="mt-0.5 h-6 w-6 rounded-full grid place-items-center shrink-0"
                    style={{ background: "var(--pc-surface2)", color: KIND_TONE[n.kind], border: "1px solid var(--pc-border)" }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-[12.5px] truncate" style={{ color: n.read ? "var(--pc-ink-2)" : "var(--pc-ink)", fontWeight: n.read ? 400 : 500 }}>
                        {n.title}
                      </div>
                      <div className="text-[10px] shrink-0" style={{ color: "var(--pc-muted)" }}>{timeAgo(n.createdAtISO)}</div>
                    </div>
                    <div className="text-[11.5px] mt-0.5 line-clamp-2" style={{ color: "var(--pc-muted)" }}>{n.sub}</div>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                      aria-label="Mark as read"
                      title="Mark as read"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                      style={{ color: "var(--pc-muted)" }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="px-3.5 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid var(--pc-border)", background: "var(--pc-surface2)" }}>
            <span className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
              Aggregate signals only — no student PII.
            </span>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-[11.5px] inline-flex items-center gap-1 hover:underline"
              style={{ color: "var(--pc-accent, var(--pc-primary))" }}
            >
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// keep unused-import safe
void listNotifications;
