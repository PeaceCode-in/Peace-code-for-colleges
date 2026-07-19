import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight, Check, FileText, Inbox, Settings2, Users } from "lucide-react";
import { GlassCard, PageHeader } from "@/components/college/primitives";
import { EmptyState } from "@/components/primitives/EmptyState";
import { markAllRead, markRead, timeAgo, useNotifications, type NotifKind } from "@/lib/notifications-store";
import { FilterChipGroup } from "@/components/primitives/FilterChipGroup";

const search = z.object({
  filter: fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/notifications")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Notifications — PeaceCode for Colleges" },
      { name: "description", content: "Aggregate institutional signals across risk, referrals, screening, and reporting." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

const KIND_ICON: Record<NotifKind, React.ComponentType<{ className?: string }>> = {
  risk: AlertTriangle, referral: Users, screening: Inbox, report: FileText, system: Settings2,
};
const KIND_TONE: Record<NotifKind, string> = {
  risk: "var(--pc-warn, var(--pc-accent-2))",
  referral: "var(--pc-accent, var(--pc-primary))",
  screening: "var(--pc-good, var(--pc-primary))",
  report: "var(--pc-primary)",
  system: "var(--pc-muted)",
};
const KIND_LABEL: Record<NotifKind, string> = {
  risk: "Risk", referral: "Referral", screening: "Screening", report: "Report", system: "System",
};

function NotificationsPage() {
  const { filter } = Route.useSearch();
  const nav = useNavigate({ from: "/notifications" });
  const items = useNotifications();

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((n) => !n.read);
    return items.filter((n) => n.kind === filter);
  }, [items, filter]);

  const unread = items.reduce((n, x) => n + (x.read ? 0 : 1), 0);

  return (
    <>
      <PageHeader
        eyebrow="Signals"
        title="Notifications"
        subtitle="Aggregate institutional alerts across risk, referrals, screening, and reporting. Never references an individual student."
        actions={
          <button
            type="button"
            onClick={() => markAllRead()}
            disabled={unread === 0}
            className="text-[12px] px-3 py-1.5 rounded-md disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2"
            style={{ border: "1px solid var(--pc-border)", background: "var(--pc-surface)", color: "var(--pc-ink-2)" }}
          >
            Mark all read
          </button>
        }
      />

      <div className="mb-5">
        <FilterChipGroup
          label="Filter"
          value={filter}
          onChange={(v) => nav({ search: { filter: v } })}
          options={[
            { value: "all",       label: `All (${items.length})` },
            { value: "unread",    label: `Unread (${unread})` },
            { value: "risk",      label: "Risk" },
            { value: "referral",  label: "Referral" },
            { value: "screening", label: "Screening" },
            { value: "report",    label: "Report" },
            { value: "system",    label: "System" },
          ]}
        />
      </div>

      <GlassCard>
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              kind={filter === "unread" ? "no-data" : "filtered"}
              title={filter === "unread" ? "All caught up" : "Nothing to show"}
              subtitle={filter === "unread"
                ? "No unread alerts under this filter."
                : "No notifications match this filter yet."}
            />
          </div>
        ) : (
          <ul>
            {filtered.map((n, i) => {
              const Icon = KIND_ICON[n.kind];
              return (
                <li
                  key={n.id}
                  className="flex items-start gap-3 px-5 py-4 hover:bg-[color:var(--pc-surface2)] transition-colors"
                  style={i === 0 ? undefined : { borderTop: "1px solid var(--pc-border)" }}
                >
                  <span
                    aria-hidden
                    className="mt-0.5 h-8 w-8 rounded-full grid place-items-center shrink-0"
                    style={{ background: "var(--pc-surface2)", color: KIND_TONE[n.kind], border: "1px solid var(--pc-border)" }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-[10px] uppercase px-1.5 py-0.5 rounded"
                          style={{
                            letterSpacing: "0.1em",
                            color: KIND_TONE[n.kind],
                            background: "color-mix(in oklab, currentColor 10%, transparent)",
                            border: "1px solid color-mix(in oklab, currentColor 25%, transparent)",
                          }}
                        >
                          {KIND_LABEL[n.kind]}
                        </span>
                        <div className="text-[13.5px] truncate" style={{ color: n.read ? "var(--pc-ink-2)" : "var(--pc-ink)", fontWeight: n.read ? 400 : 500 }}>
                          {n.title}
                        </div>
                      </div>
                      <div className="text-[11px] shrink-0" style={{ color: "var(--pc-muted)" }}>{timeAgo(n.createdAtISO)}</div>
                    </div>
                    <div className="text-[12.5px] mt-1" style={{ color: "var(--pc-muted)" }}>{n.sub}</div>
                    <div className="mt-2 flex items-center gap-3">
                      <Link
                        to={n.deepLink}
                        onClick={() => markRead(n.id)}
                        className="text-[11.5px] inline-flex items-center gap-1 hover:underline"
                        style={{ color: "var(--pc-accent, var(--pc-primary))" }}
                      >
                        Open <ArrowRight className="h-3 w-3" />
                      </Link>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markRead(n.id)}
                          className="text-[11.5px] inline-flex items-center gap-1"
                          style={{ color: "var(--pc-muted)" }}
                        >
                          <Check className="h-3 w-3" /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </>
  );
}
