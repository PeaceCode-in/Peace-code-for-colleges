import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Download, Share2, Sparkles } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, EmptyState, PrimaryBtn, GhostBtn, Chip } from "@/components/events/primitives";
import { eventById, formatDateParts, organizerById, attendanceFor } from "@/lib/events-store";

const { border, muted, ink, soft, primary, surface2, surface } = palette;

function Certificate() {
  const { id } = Route.useParams();
  const e = eventById(id);
  if (!e) return <Page><BackBar/><EmptyState title="Event not found" /></Page>;

  const org = organizerById(e.organizerId)!;
  const att = attendanceFor(id);
  const { day, month } = formatDateParts(e.date);
  const year = new Date(e.date).getFullYear();
  const eligible = att?.status === "completed";

  return (
    <Page>
      <BackBar to={`/events/${id}`} label={`Back to ${e.title}`} />
      <PageTitle
        eyebrow="Certificate"
        title="A small keepsake for showing up."
        sub="Placeholder for now — real certificates ship in a future release."
      />

      <Card padded={false} className="overflow-hidden max-w-3xl mx-auto">
        <div className="relative p-8 sm:p-12 text-center" style={{
          background: `linear-gradient(135deg, ${soft} 0%, ${surface2} 100%)`,
          border: `1px dashed ${primary}`,
        }}>
          {/* corners */}
          <div className="absolute top-4 left-4 w-8 h-8 rounded-tl-xl" style={{ borderTop: `2px solid ${primary}`, borderLeft: `2px solid ${primary}` }}/>
          <div className="absolute top-4 right-4 w-8 h-8 rounded-tr-xl" style={{ borderTop: `2px solid ${primary}`, borderRight: `2px solid ${primary}` }}/>
          <div className="absolute bottom-4 left-4 w-8 h-8 rounded-bl-xl" style={{ borderBottom: `2px solid ${primary}`, borderLeft: `2px solid ${primary}` }}/>
          <div className="absolute bottom-4 right-4 w-8 h-8 rounded-br-xl" style={{ borderBottom: `2px solid ${primary}`, borderRight: `2px solid ${primary}` }}/>

          <div className="inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-[10.5px] tracking-[0.22em] uppercase"
               style={{ background: "rgba(255,255,255,0.55)", color: primary }}>
            <Award className="w-3 h-3"/> Certificate of Participation
          </div>

          <p className="mt-8 text-[12.5px] tracking-widest uppercase" style={{ color: muted }}>Awarded to</p>
          <h2 className="font-serif text-[36px] sm:text-[42px] mt-2" style={{ color: ink }}>PeaceCode Student</h2>

          <p className="mt-6 text-[13px] max-w-lg mx-auto leading-relaxed" style={{ color: ink }}>
            For meaningful participation in
            <span className="font-serif text-[18px] block mt-1">{e.title}</span>
            hosted by {org.name} · {org.org}, {month} {day}, {year}.
          </p>

          {!eligible && (
            <div className="mt-6 inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-[11px]"
                 style={{ background: "rgba(255,255,255,0.55)", color: muted, border: `1px solid ${border}` }}>
              <Sparkles className="w-3 h-3"/> Available after you're checked in as completed.
            </div>
          )}

          <div className="mt-8 flex items-center justify-between text-[11px]" style={{ color: muted }}>
            <div>
              <div className="tracking-wide uppercase text-[9.5px]">Signature</div>
              <div className="font-serif italic text-[15px] mt-1" style={{ color: ink }}>{org.name}</div>
            </div>
            <div className="text-right">
              <div className="tracking-wide uppercase text-[9.5px]">Issued</div>
              <div className="font-serif text-[15px] mt-1" style={{ color: ink }}>{month} {day}, {year}</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="max-w-3xl mx-auto mt-6 flex flex-wrap justify-center gap-2">
        <PrimaryBtn onClick={() => alert("Certificate download is a placeholder in this build.")}>
          <Download className="w-3.5 h-3.5"/> Download PDF
        </PrimaryBtn>
        <GhostBtn onClick={async () => {
          try { await navigator.clipboard.writeText(`I attended ${e.title} on PeaceCode.`); } catch {}
        }}>
          <Share2 className="w-3.5 h-3.5"/> Share achievement
        </GhostBtn>
        <Link to="/events/achievements" className="text-[12px] rounded-full h-11 px-4 inline-flex items-center gap-1.5"
              style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
          See all achievements →
        </Link>
      </div>

      <div className="max-w-3xl mx-auto mt-3 text-center">
        <Chip tone="outline">Certificates are placeholders in this build</Chip>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/$id/certificate")({ component: Certificate });
