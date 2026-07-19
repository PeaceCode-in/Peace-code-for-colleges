import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page, BackBar, PageTitle, Card, Chip } from "@/components/emergency/primitives";
import { loadContacts, loadSettings, saveSettings, logEvent, type Contact } from "@/lib/emergency-store";
import { palette } from "@/components/AppShell";
import { MapPin, StopCircle, Timer } from "lucide-react";

const { border, muted, ink, surface2, primary, soft } = palette;

const DURATIONS = [15, 30, 60, 120];

function LocationPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [share, setShare] = useState<{ to: string; ends: number } | null>(null);
  const [dur, setDur] = useState(30);

  useEffect(() => setContacts(loadContacts()), []);

  const start = (to: Contact) => {
    setShare({ to: to.name, ends: Date.now() + dur * 60_000 });
    try {
      const s = loadSettings();
      saveSettings({ ...s, locationSharing: true });
      logEvent({ actions: [`Shared live location with ${to.name} for ${dur}m (placeholder)`], contactsCalled: [to.id] });
    } catch {}
  };

  const stop = () => {
    setShare(null);
    try {
      const s = loadSettings();
      saveSettings({ ...s, locationSharing: false });
      logEvent({ actions: ["Stopped location sharing"], contactsCalled: [] });
    } catch {}
  };

  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Live location" title="Share where you are — softly." sub="This is a placeholder in-app share. Nothing is actually transmitted; use your device's map app for a real share." />

      <Card>
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: soft, color: primary }}>
            <MapPin className="w-4.5 h-4.5" strokeWidth={1.6}/>
          </span>
          <div className="min-w-0">
            <div className="font-serif text-[18px]">Choose someone you trust</div>
            <div className="text-[12px]" style={{ color: muted }}>They'll know you're okay, or ask how they can help.</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-[10.5px] tracking-[0.22em] uppercase mb-2" style={{ color: muted }}>Time limit</div>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button key={d} onClick={() => setDur(d)} className="rounded-full h-9 px-3.5 text-[11.5px]"
                style={{ background: dur === d ? ink : surface2, color: dur === d ? "var(--pc-bg)" : muted, border: `1px solid ${dur === d ? ink : border}` }}>
                {d < 60 ? `${d} min` : `${d/60} hr`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-[10.5px] tracking-[0.22em] uppercase mb-2" style={{ color: muted }}>Share with</div>
          {contacts.length === 0 ? (
            <div className="text-[13px]" style={{ color: muted }}>
              No contacts yet. <Link to="/emergency/contacts" style={{ color: primary }}>Add one first</Link>.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {contacts.map((c) => (
                <button key={c.id} onClick={() => start(c)} className="rounded-2xl p-3 flex items-center gap-3 text-left" style={{ background: surface2, border: `1px solid ${border}` }}>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-medium" style={{ background: soft, color: primary }}>
                    {(c.initials || c.name[0] || "?").toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] truncate">{c.name}</div>
                    <div className="text-[11px]" style={{ color: muted }}>{c.relationship}</div>
                  </div>
                  <Chip>Share</Chip>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {share && (
        <Card className="mt-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: soft, color: primary }}>
              <Timer className="w-4 h-4" strokeWidth={1.6}/>
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-serif text-[16px]">Sharing with {share.to}</div>
              <div className="text-[11.5px]" style={{ color: muted }}>Ends {new Date(share.ends).toLocaleTimeString()}</div>
            </div>
            <button onClick={stop} className="rounded-full h-10 px-4 text-[12px] flex items-center gap-1.5" style={{ background: surface2, border: `1px solid ${border}` }}>
              <StopCircle className="w-3.5 h-3.5"/> Stop
            </button>
          </div>
        </Card>
      )}
    </Page>
  );
}

export const Route = createFileRoute("/emergency/location")({ component: LocationPage });
