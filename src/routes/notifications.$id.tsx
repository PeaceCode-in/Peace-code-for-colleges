// Detail page for a single notification.

import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { palette } from "@/components/AppShell";
import { get1, patch, archive, remove, CATEGORY_META, timeAgo, loadAll } from "@/lib/notifications-store";
import { Icon, Panel, Avatar, CategoryChip, PriorityDot, NotifRow } from "@/components/notifications/primitives";

const { surface, surface2, border, ink, muted, primary, soft } = palette;

export const Route = createFileRoute("/notifications/$id")({
  component: Detail,
  notFoundComponent: NotFound,
});

function Detail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const navigate = useNavigate();
  const n = useMemo(() => get1(id), [id, router.state.location.pathname]);
  const others = useMemo(() =>
    loadAll().filter((x) => !x.archived && x.id !== id && x.category === n?.category).slice(0, 4),
    [id, n?.category, router.state.location.pathname],
  );

  useEffect(() => {
    if (n && !n.read) patch(n.id, { read: true });
  }, [n]);

  if (!n) return <NotFound />;
  const meta = CATEGORY_META[n.category];

  const act = (fn: () => void) => { fn(); navigate({ to: "/notifications/inbox" }); };

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* breadcrumbs */}
      <div className="text-[10.5px] tracking-[0.32em] uppercase" style={{ color: muted }}>
        <Link to="/notifications" className="hover:underline underline-offset-4">Inbox</Link>
        <span className="mx-2 opacity-40">/</span>
        <Link to="/notifications/inbox" className="hover:underline underline-offset-4">All</Link>
        <span className="mx-2 opacity-40">/</span>
        <span>{meta.label}</span>
      </div>

      <Panel className="mt-4">
        <div className="flex items-start gap-4">
          {n.person?.initials ? (
            <Avatar initials={n.person.initials} size={52} />
          ) : (
            <span className="w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: soft }}>
              <Icon name={n.icon || meta.icon} className="w-6 h-6" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryChip category={n.category} />
              <PriorityDot p={n.priority} />
              <span className="text-[10.5px]" style={{ color: muted }}>{timeAgo(n.ts)} · {new Date(n.ts).toLocaleString()}</span>
            </div>
            <h1 className="font-serif text-[22px] sm:text-[26px] leading-tight mt-2" style={{ color: ink }}>{n.title}</h1>
            <p className="text-[14px] mt-2" style={{ color: muted }}>{n.body}</p>
            {n.context && (
              <p className="text-[13.5px] mt-3 pt-3 border-t" style={{ color: ink, borderColor: border }}>{n.context}</p>
            )}
            {n.person && (
              <div className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: muted }}>
                <Icon name="User" className="w-3.5 h-3.5" />
                From <span style={{ color: ink }}>{n.person.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          {n.to && (
            <Link to={n.to} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[12.5px]"
                  style={{ background: ink, color: "var(--pc-bg)" }}>
              <Icon name="ExternalLink" className="w-3.5 h-3.5" /> Open in {meta.label}
            </Link>
          )}
          {(n.actions || []).map((a) => (
            <Link key={a.label} to={a.to} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[12.5px]"
                  style={a.primary
                    ? { background: primary, color: "white" }
                    : { background: surface2, color: ink, border: `1px solid ${border}` }}>
              {a.label}
            </Link>
          ))}
        </div>

        {/* quick actions */}
        <div className="mt-4 pt-4 flex flex-wrap gap-2 border-t" style={{ borderColor: border }}>
          <QA icon="Reply" label="Reply" onClick={() => n.to && navigate({ to: n.to })} />
          <QA icon={n.read ? "Mail" : "MailOpen"} label={n.read ? "Mark unread" : "Mark read"}
              onClick={() => { patch(n.id, { read: !n.read }); navigate({ to: "/notifications/inbox" }); }} />
          <QA icon="Pin" label={n.pinned ? "Unpin" : "Pin"} onClick={() => act(() => patch(n.id, { pinned: !n.pinned }))} />
          <QA icon="Bookmark" label={n.bookmarked ? "Unbookmark" : "Bookmark"}
              onClick={() => act(() => patch(n.id, { bookmarked: !n.bookmarked }))} />
          <QA icon="BellOff" label="Mute similar" onClick={() => act(() => patch(n.id, { muted: true }))} />
          <QA icon="Share2" label="Share" onClick={() => {
            try { navigator.clipboard?.writeText(`${n.title} — ${window.location.href}`); } catch {}
          }} />
          <QA icon="Archive" label="Archive" onClick={() => act(() => archive(n.id))} />
          <QA icon="Trash2" label="Delete" tone="danger" onClick={() => act(() => remove(n.id))} />
        </div>
      </Panel>

      {others.length > 0 && (
        <div className="mt-6">
          <div className="font-serif text-[15px] mb-2 px-1" style={{ color: ink }}>More from {meta.label}</div>
          <div className="flex flex-col gap-2">
            {others.map((x) => <NotifRow key={x.id} n={x} />)}
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link to="/notifications/inbox" className="text-[12.5px]" style={{ color: primary }}>
          ← Back to inbox
        </Link>
      </div>
    </div>
  );
}

function QA({ icon, label, onClick, tone }: { icon: string; label: string; onClick: () => void; tone?: "danger" }) {
  const isDanger = tone === "danger";
  return (
    <button onClick={onClick}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12px] transition hover:-translate-y-[1px]"
            style={{ background: surface, color: isDanger ? "#e35d5d" : ink, border: `1px solid ${border}` }}>
      <Icon name={icon} className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

function NotFound() {
  return (
    <div className="max-w-[860px] mx-auto px-6 py-16 text-center">
      <div className="font-serif text-[22px]" style={{ color: ink }}>Notification not found</div>
      <p className="text-[13px] mt-2" style={{ color: muted }}>It may have been deleted or archived.</p>
      <Link to="/notifications/inbox" className="inline-block mt-4 text-[12.5px]" style={{ color: primary }}>Back to inbox →</Link>
    </div>
  );
}
