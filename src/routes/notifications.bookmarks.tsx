// Bookmarked notifications.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { palette } from "@/components/AppShell";
import { loadAll } from "@/lib/notifications-store";
import { Icon, NotifRow, Panel, Pill } from "@/components/notifications/primitives";

const { muted, ink, primary } = palette;

export const Route = createFileRoute("/notifications/bookmarks")({
  component: Bookmarks,
});

function Bookmarks() {
  const [tick] = useState(0);
  const list = useMemo(() => loadAll().filter((n) => n.bookmarked).sort((a, b) => b.ts - a.ts), [tick]);

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="text-[10.5px] tracking-[0.32em] uppercase" style={{ color: muted }}>
        <Link to="/notifications" className="hover:underline underline-offset-4">Inbox</Link> · Bookmarks
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap mt-1">
        <h1 className="font-serif text-[26px] sm:text-[32px] leading-tight">Saved for later</h1>
        <div className="flex gap-2">
          <Pill to="/notifications/archive"><Icon name="Archive" className="w-3.5 h-3.5" /> Archive</Pill>
          <Pill to="/notifications/inbox"><Icon name="Inbox" className="w-3.5 h-3.5" /> Inbox</Pill>
        </div>
      </div>

      <div className="mt-6">
        {list.length === 0 ? (
          <Panel>
            <div className="text-center py-6">
              <Icon name="Bookmark" className="w-6 h-6 mx-auto opacity-40" />
              <div className="font-serif text-[16px] mt-2">No bookmarks yet</div>
              <div className="text-[12.5px] mt-1" style={{ color: muted }}>
                Open any notification and tap Bookmark to save it here.
              </div>
              <Link to="/notifications/inbox" className="inline-block mt-3 text-[12px]" style={{ color: primary }}>Go to inbox →</Link>
            </div>
          </Panel>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((n) => <NotifRow key={n.id} n={n} />)}
          </div>
        )}
      </div>
    </div>
  );
}
