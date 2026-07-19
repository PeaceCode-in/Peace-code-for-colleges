import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronUp, Bookmark } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, SectionHead } from "@/components/hub/primitives";
import {
  requestById, hasVotedRequest, voteRequest, hasBookmarkedRequest, bookmarkRequest, subscribe,
} from "@/lib/product-hub-store";
import type { FeatureRequest } from "@/lib/product-hub-store";

const { border, muted, ink, surface2, primary, soft } = palette;
const LABEL: Record<FeatureRequest["status"], string> = { open: "Open", planned: "Planned", in_dev: "In development", shipped: "Shipped" };

function RequestDetail() {
  const { id } = Route.useParams();
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((n) => n + 1)), []);
  const r = requestById(id);
  if (!r) throw notFound();
  const voted = hasVotedRequest(r.id);
  const marked = hasBookmarkedRequest(r.id);

  return (
    <Page>
      <BackBar to="/hub/feature-requests" label="Feature requests"/>
      <PageTitle
        eyebrow={`Request · by ${r.by}`}
        title={r.title}
        sub={new Date(r.at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
        right={
          <div className="flex items-center gap-2">
            <button onClick={() => bookmarkRequest(r.id)}
              className="rounded-full h-11 px-4 text-[12px] inline-flex items-center gap-1.5"
              style={{ background: surface2, border: `1px solid ${border}`, color: marked ? primary : ink }}>
              <Bookmark className="w-3.5 h-3.5" fill={marked ? "currentColor" : "none"}/> {marked ? "Bookmarked" : "Bookmark"}
            </button>
            <button onClick={() => voteRequest(r.id)}
              className="rounded-full h-11 px-4 text-[12px] inline-flex items-center gap-1.5"
              style={{ background: voted ? soft : surface2, border: `1px solid ${voted ? primary : border}`, color: voted ? primary : ink }}>
              <ChevronUp className="w-3.5 h-3.5"/> {r.votes + (voted ? 1 : 0)} votes
            </button>
          </div>
        }
      />

      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Chip tone="outline">{LABEL[r.status]}</Chip>
        </div>
        <p className="text-[14px] leading-relaxed" style={{ color: ink }}>{r.body}</p>
      </Card>

      <Card>
        <SectionHead title="Discussion" sub={`${r.comments} comments`}/>
        <div className="text-[12.5px]" style={{ color: muted }}>
          Comments are coming soon. Vote and bookmark to save this for later.
        </div>
      </Card>
    </Page>
  );
}

export const Route = createFileRoute("/hub/feature-requests/$id")({ component: RequestDetail });
