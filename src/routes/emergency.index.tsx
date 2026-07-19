import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page, Card, BigAction, Chip, Divider } from "@/components/emergency/primitives";
import { loadContacts, loadPlan, HELPLINES, type Contact } from "@/lib/emergency-store";
import { palette } from "@/components/AppShell";
import { Phone, MessageCircle, HeartHandshake, Wind, ShieldCheck, Users, Bot, Sparkles, Compass, History, Box, MapPin, LifeBuoy, Siren, Clock } from "lucide-react";

const { surface, surface2, border, muted, ink, primary, soft } = palette;

// Emergency red — used ONLY on this page to signal urgency without shouting.
const RED = "#B93A2E";
const RED_SOFT = "#F6E3DE";
const RED_INK  = "#4A140C";

function HomeInner() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [planUpdated, setPlanUpdated] = useState<number>(0);

  useEffect(() => {
    setContacts(loadContacts());
    setPlanUpdated(loadPlan().updatedAt);
  }, []);

  const defaultContact = contacts.find((c) => c.isDefault) ?? contacts[0];
  const kiran = HELPLINES.find(h => h.id === "kiran")!;
  const featured = HELPLINES.slice(0, 3);

  return (
    <Page>
      {/* Urgency band */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="inline-flex items-center gap-2 rounded-full h-7 px-3 text-[10.5px] tracking-[0.28em] uppercase"
          style={{ background: RED_SOFT, color: RED_INK, border: `1px solid ${RED}33` }}>
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full animate-pulse-soft" style={{ background: RED }} />
            <span className="relative rounded-full w-1.5 h-1.5" style={{ background: RED }} />
          </span>
          Emergency · Live 24×7
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full h-7 px-3 text-[11px]" style={{ background: surface2, border: `1px solid ${border}`, color: muted }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#3BA55C" }} />
          3 counsellors online now
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full h-7 px-3 text-[11px]" style={{ background: surface2, border: `1px solid ${border}`, color: muted }}>
          <Clock className="w-3 h-3" strokeWidth={1.6} /> Median pickup · 12s
        </span>
      </div>

      <header className="mb-6 lg:mb-8">
        <h1 className="font-serif tracking-tight text-[34px] sm:text-[48px] leading-[1.02]" style={{ color: ink }}>
          You are not alone.<br className="hidden sm:block"/> Help is one tap away.
        </h1>
        <p className="mt-3 text-[13.5px] max-w-2xl" style={{ color: muted }}>
          You're safe here. Nothing you tap will hurt or expose you. Pick the first step that feels possible right now.
        </p>
      </header>

      {/* SOS priority panel — the emergency signal */}
      <div className="relative rounded-[28px] overflow-hidden mb-6"
        style={{ border: `1px solid ${RED}33`, background: `linear-gradient(135deg, ${RED} 0%, #8E2A22 100%)` }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.18] mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}/>
        <div className="relative p-6 sm:p-8 grid gap-6 lg:grid-cols-[1.35fr_1fr] items-center">
          <div>
            <div className="flex items-center gap-2 text-[10.5px] tracking-[0.28em] uppercase text-white/85 mb-3">
              <Siren className="w-3.5 h-3.5" strokeWidth={1.8}/> In crisis right now?
            </div>
            <div className="font-serif text-white text-[26px] sm:text-[30px] leading-[1.1]">
              One call. A calm voice on the other end.
            </div>
            <div className="text-white/80 text-[12.5px] mt-2 max-w-md">
              KIRAN is the Government of India's free 24×7 mental-health helpline. 13 languages. Nothing is recorded against you.
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a href={`tel:${kiran.number.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center gap-2.5 rounded-full h-12 px-5 text-[13.5px] font-medium transition hover:-translate-y-[1px]"
                style={{ background: "#fff", color: RED_INK, boxShadow: "0 8px 24px -12px rgba(0,0,0,0.35)" }}>
                <Phone className="w-4 h-4" strokeWidth={2}/> Call KIRAN · {kiran.number}
              </a>
              <a href="tel:112"
                className="inline-flex items-center gap-2 rounded-full h-12 px-4 text-[12.5px] transition hover:-translate-y-[1px]"
                style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "#fff", backdropFilter: "blur(8px)" }}>
                <Siren className="w-3.5 h-3.5" strokeWidth={1.8}/> Dial 112 · All emergencies
              </a>
              {defaultContact?.phone && (
                <Link to="/emergency/sos"
                  className="inline-flex items-center gap-2 rounded-full h-12 px-4 text-[12.5px] transition hover:-translate-y-[1px]"
                  style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "#fff", backdropFilter: "blur(8px)" }}>
                  <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.8}/> Text SOS to {defaultContact.name.split(" ")[0]}
                </Link>
              )}
            </div>
            <div className="mt-4 text-[11px] text-white/70">
              Free · Confidential · Won't affect your record
            </div>
          </div>

          <div className="rounded-2xl p-5 text-white/95"
            style={{ background: "rgba(0,0,0,0.20)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(10px)" }}>
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/70 mb-3">Right now</div>
            <ul className="space-y-3 text-[12.5px]">
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#5CE38A" }}/> Peace Buddies online</span>
                <Link to="/buddies" className="underline underline-offset-2 text-white/90">3 available</Link>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#5CE38A" }}/> Counsellor chat</span>
                <Link to="/counselling" className="underline underline-offset-2 text-white/90">Open chat</Link>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FBD24C" }}/> PeaceBot crisis mode</span>
                <Link to="/peacebot" className="underline underline-offset-2 text-white/90">Start</Link>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#5CE38A" }}/> 60-second breathing</span>
                <Link to="/emergency/breathe" className="underline underline-offset-2 text-white/90">Begin</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick paths */}
      <div className="grid gap-3 sm:grid-cols-3">
        <BigAction to="/emergency/helplines" icon={<LifeBuoy className="w-4.5 h-4.5" strokeWidth={1.6} />} title="Every helpline, one screen" sub="KIRAN, iCall, Vandrevala, 112, women, child." />
        <BigAction to="/emergency/human"     icon={<HeartHandshake className="w-4.5 h-4.5" strokeWidth={1.6} />} title="I need someone to talk to" sub="Peace Buddy, counsellor, or a trusted person." />
        <BigAction to="/emergency/calm"      icon={<Wind className="w-4.5 h-4.5" strokeWidth={1.6} />} title="Bring me down gently" sub="Breathing, grounding, and quiet audio." />
      </div>

      {/* Check-in tile */}
      <Card className="mt-6" tone="soft">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10.5px] tracking-[0.22em] uppercase mb-1" style={{ color: muted }}>Quick check-in</div>
            <div className="font-serif text-[19px] leading-tight">Name what you're feeling</div>
            <div className="text-[12.5px] mt-1" style={{ color: muted }}>We'll suggest the calmest next step.</div>
          </div>
          <Link to="/emergency/checkin" className="rounded-full h-10 px-4 text-[12px] flex items-center gap-1.5 shrink-0" style={{ background: ink, color: "var(--pc-bg)" }}>
            <Sparkles className="w-3.5 h-3.5" /> Open check-in
          </Link>
        </div>
      </Card>


      <Divider />

      {/* Grid: safety plan + trusted contacts + helplines */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Safety plan */}
        <Card>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-[10.5px] tracking-[0.22em] uppercase" style={{ color: muted }}>Safety plan</div>
              <div className="font-serif text-[19px] mt-1">Your personal plan</div>
            </div>
            <Compass className="w-4 h-4 opacity-60" strokeWidth={1.5} />
          </div>
          <p className="text-[12.5px]" style={{ color: muted }}>
            {planUpdated
              ? `Last edited ${new Date(planUpdated).toLocaleDateString()}. A short list of warning signs, people, and places that help.`
              : "Not written yet. A short plan can help a future difficult moment feel less alone."}
          </p>
          <div className="flex gap-2 mt-4">
            <Link to="/emergency/safety-plan" className="rounded-full h-9 px-4 text-[11.5px] flex items-center" style={{ background: surface2, border: `1px solid ${border}` }}>
              {planUpdated ? "Open plan" : "Start plan"}
            </Link>
            <Link to="/emergency/hope-box" className="rounded-full h-9 px-4 text-[11.5px] flex items-center gap-1.5" style={{ background: surface2, border: `1px solid ${border}` }}>
              <Box className="w-3.5 h-3.5" /> Hope Box
            </Link>
          </div>
        </Card>

        {/* Trusted contacts */}
        <Card>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-[10.5px] tracking-[0.22em] uppercase" style={{ color: muted }}>Trusted contacts</div>
              <div className="font-serif text-[19px] mt-1">People who love you</div>
            </div>
            <Users className="w-4 h-4 opacity-60" strokeWidth={1.5} />
          </div>
          {contacts.length === 0 ? (
            <p className="text-[12.5px]" style={{ color: muted }}>Add a parent, sibling, friend, or mentor. Even one name helps.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {contacts.slice(0, 3).map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium" style={{ background: soft, color: primary }}>
                    {(c.initials || c.name.slice(0, 1)).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] truncate">{c.name} {c.isDefault && <Chip>default</Chip>}</div>
                    <div className="text-[11px] truncate" style={{ color: muted }}>{c.relationship}</div>
                  </div>
                  {c.phone && (
                    <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: surface2, border: `1px solid ${border}` }} aria-label={`Call ${c.name}`}>
                      <Phone className="w-3.5 h-3.5" strokeWidth={1.6} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 mt-4">
            <Link to="/emergency/contacts" className="rounded-full h-9 px-4 text-[11.5px] flex items-center" style={{ background: surface2, border: `1px solid ${border}` }}>Manage contacts</Link>
            {defaultContact && (
              <Link to="/emergency/sos" className="rounded-full h-9 px-4 text-[11.5px] flex items-center gap-1.5" style={{ background: ink, color: "var(--pc-bg)" }}>
                <MessageCircle className="w-3.5 h-3.5" /> Send SOS
              </Link>
            )}
          </div>
        </Card>

        {/* Helplines */}
        <Card>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-[10.5px] tracking-[0.22em] uppercase" style={{ color: muted }}>Emergency numbers</div>
              <div className="font-serif text-[19px] mt-1">Someone kind is on call</div>
            </div>
            <ShieldCheck className="w-4 h-4 opacity-60" strokeWidth={1.5} />
          </div>
          <ul className="flex flex-col gap-2">
            {featured.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] truncate">{h.name}</div>
                  <div className="text-[11px]" style={{ color: muted }}>{h.hours}</div>
                </div>
                <a href={`tel:${h.number.replace(/[^0-9+]/g, "")}`} className="rounded-full h-9 px-3 text-[11px] flex items-center gap-1.5 shrink-0" style={{ background: surface2, border: `1px solid ${border}` }}>
                  <Phone className="w-3 h-3" strokeWidth={1.6}/> {h.number}
                </a>
              </li>
            ))}
          </ul>
          <Link to="/emergency/helplines" className="mt-4 inline-flex rounded-full h-9 px-4 text-[11.5px] items-center" style={{ background: surface2, border: `1px solid ${border}` }}>
            All helplines
          </Link>
        </Card>
      </div>

      <Divider />

      {/* Sub-navigation directory */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <BigAction to="/peacebot" icon={<Bot className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="PeaceBot crisis mode" sub="Calm, grounded AI. Not a replacement for a human." />
        <BigAction to="/emergency/toolkit" icon={<Sparkles className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Calm toolkit" sub="Breathing, meditation, sleep story, gratitude." />
        <BigAction to="/emergency/location" icon={<MapPin className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Share live location" sub="With a trusted person. Time-limited." />
        <BigAction to="/emergency/recovery" icon={<HeartHandshake className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Recovery plan" sub="After the storm — kind next steps." />
        <BigAction to="/emergency/history" icon={<History className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Emergency history" sub="What helped, and when." />
        <BigAction to="/emergency/settings" icon={<ShieldCheck className="w-4.5 h-4.5" strokeWidth={1.6}/>} title="Emergency settings" sub="Default contact, SOS message, accessibility." />
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/")({
  component: HomeInner,
});
