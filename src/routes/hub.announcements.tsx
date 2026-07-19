import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Search as SearchIcon } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, TextInput } from "@/components/hub/primitives";
import { announcements } from "@/lib/product-hub-store";
import type { Announcement } from "@/lib/product-hub-store";

const { border, muted, ink, primary, soft } = palette;

const KIND_HUE: Record<Announcement["kind"], string> = {
  system: "#7fa5d8", maintenance: "#c98a5a", campus: "#6b8a5d", campaign: "#c9a0dc", release: "#8fb0d2",
};

function Announcements() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Announcement["kind"] | "all">("all");
  const filtered = useMemo(() => {
    let list = [...announcements].sort((a, b) => +new Date(b.at) - +new Date(a.at));
    if (kind !== "all") list = list.filter((a) => a.kind === kind);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(t) || a.body.toLowerCase().includes(t));
    }
    return list;
  }, [q, kind]);

  return (
    <Page>
      <BackBar />
      <PageTitle
        eyebrow="Announcements"
        title="Quiet news, when it matters."
        sub="Releases, campaigns, campus updates, and gentle maintenance notes."
        right={<div className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: muted }}><Bell className="w-3.5 h-3.5"/> {announcements.length} posts</div>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "release", "campaign", "campus", "system", "maintenance"] as const).map((k) => (
          <Chip key={k} tone="quiet" active={kind === k} onClick={() => setKind(k)}>{k[0].toUpperCase() + k.slice(1)}</Chip>
        ))}
      </div>

      <div className="mb-6 relative">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }}/>
        <TextInput className="pl-9" placeholder="Search announcements…" value={q} onChange={(e) => setQ(e.target.value)}/>
      </div>

      <div className="grid gap-3">
        {filtered.map((a) => (
          <Card key={a.id} className="relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-40" style={{ background: KIND_HUE[a.kind] }}/>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Chip tone="outline">{a.kind}</Chip>
                <span className="text-[10.5px]" style={{ color: muted }}>{new Date(a.at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="font-serif text-[17px]" style={{ color: ink }}>{a.title}</div>
              <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: muted }}>{a.body}</p>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}

// silence
void primary; void soft; void border;

export const Route = createFileRoute("/hub/announcements")({ component: Announcements });
