import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronUp, Bookmark, MessageCircle, Plus, Search as SearchIcon } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, SectionHead, TextInput, TextArea, PrimaryBtn, EmptyState } from "@/components/hub/primitives";
import {
  allRequests, hasVotedRequest, voteRequest, hasBookmarkedRequest, bookmarkRequest,
  submitRequest, subscribe,
} from "@/lib/product-hub-store";
import type { FeatureRequest } from "@/lib/product-hub-store";

const { border, muted, ink, surface2, primary, surface, soft } = palette;

const STATUSES: FeatureRequest["status"][] = ["open", "planned", "in_dev", "shipped"];
const LABEL: Record<FeatureRequest["status"], string> = { open: "Open", planned: "Planned", in_dev: "In dev", shipped: "Shipped" };

function Requests() {
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);
  const [tab, setTab] = useState<"trending" | "recent" | "mine" | "bookmarked">("trending");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<FeatureRequest["status"] | "all">("all");
  const [drafting, setDrafting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const filtered = useMemo(() => {
    let list = allRequests();
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(t) || r.body.toLowerCase().includes(t));
    }
    if (tab === "recent") list = [...list].sort((a, b) => b.at - a.at);
    if (tab === "mine") list = list.filter((r) => r.by === "you");
    if (tab === "bookmarked") list = list.filter((r) => hasBookmarkedRequest(r.id));
    return list;
  }, [q, status, tab]);

  return (
    <Page wide>
      <BackBar />
      <PageTitle
        eyebrow="Community"
        title="Feature requests"
        sub="Small ideas, big ones — anything welcome. Vote for what matters to you."
        right={
          <button onClick={() => setDrafting((d) => !d)}
            className="rounded-full h-11 px-5 text-[12.5px] inline-flex items-center gap-2"
            style={{ background: ink, color: "var(--pc-bg)" }}>
            <Plus className="w-3.5 h-3.5"/> New request
          </button>
        }
      />

      {drafting && (
        <Card className="mb-6">
          <SectionHead title="New request"/>
          <div className="grid gap-3">
            <TextInput placeholder="Short, clear title" value={title} onChange={(e) => setTitle(e.target.value)}/>
            <TextArea placeholder="Why is this useful? What problem does it solve?" rows={4} value={body} onChange={(e) => setBody(e.target.value)}/>
            <div className="flex items-center gap-2">
              <PrimaryBtn onClick={() => {
                if (!title.trim()) return;
                submitRequest(title, body);
                setTitle(""); setBody(""); setDrafting(false);
              }}>Post</PrimaryBtn>
              <button onClick={() => setDrafting(false)} className="text-[12px]" style={{ color: muted }}>Cancel</button>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["trending", "recent", "mine", "bookmarked"] as const).map((t) => (
          <Chip key={t} tone="quiet" active={tab === t} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</Chip>
        ))}
        <span className="mx-2 h-4 w-px" style={{ background: border }}/>
        <Chip tone="quiet" active={status === "all"} onClick={() => setStatus("all")}>All</Chip>
        {STATUSES.map((s) => (
          <Chip key={s} tone="quiet" active={status === s} onClick={() => setStatus(s)}>{LABEL[s]}</Chip>
        ))}
      </div>

      <div className="mb-4 relative">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }}/>
        <TextInput className="pl-9" placeholder="Search requests…" value={q} onChange={(e) => setQ(e.target.value)}/>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing here yet" sub="Try another filter or start a new request." />
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => {
            const voted = hasVotedRequest(r.id);
            const marked = hasBookmarkedRequest(r.id);
            return (
              <Card key={r.id}>
                <div className="flex items-start gap-4">
                  <button onClick={() => voteRequest(r.id)}
                    className="shrink-0 rounded-2xl flex flex-col items-center justify-center w-14 h-16 transition"
                    style={{ background: voted ? soft : surface2, border: `1px solid ${voted ? primary : border}`, color: voted ? primary : ink }}>
                    <ChevronUp className="w-4 h-4"/>
                    <span className="text-[12px] font-medium tabular-nums">{r.votes + (voted ? 1 : 0)}</span>
                  </button>
                  <Link to="/hub/feature-requests/$id" params={{ id: r.id }} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Chip tone="outline">{LABEL[r.status]}</Chip>
                      <span className="text-[10.5px]" style={{ color: muted }}>by {r.by}</span>
                    </div>
                    <div className="font-serif text-[16.5px]" style={{ color: ink }}>{r.title}</div>
                    <div className="text-[12.5px] mt-1 line-clamp-2" style={{ color: muted }}>{r.body}</div>
                    <div className="mt-2 flex items-center gap-3 text-[11px]" style={{ color: muted }}>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3"/> {r.comments}</span>
                    </div>
                  </Link>
                  <button onClick={() => bookmarkRequest(r.id)} className="shrink-0"
                    style={{ color: marked ? primary : muted }} aria-label="Bookmark">
                    <Bookmark className="w-4 h-4" fill={marked ? "currentColor" : "none"}/>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}

// silence unused
void surface;

export const Route = createFileRoute("/hub/feature-requests")({ component: Requests });
