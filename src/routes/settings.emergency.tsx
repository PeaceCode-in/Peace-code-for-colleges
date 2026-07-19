import { createFileRoute, Link } from "@tanstack/react-router";
import { SettingsShell, Section, Row, Toggle, TextField, TextArea, PrimaryButton, GhostButton } from "@/components/settings/primitives";
import { useSettings } from "@/lib/settings-store";
import { palette } from "@/components/AppShell";
import { PhoneCall, MapPin } from "lucide-react";

export const Route = createFileRoute("/settings/emergency")({
  head: () => ({ meta: [{ title: "Emergency & Safety — Settings" }] }),
  component: EmergencySettings,
});

const { ink, muted } = palette;

function EmergencySettings() {
  const [s, update] = useSettings();
  const e = s.emergency;
  const set = <K extends keyof typeof e>(k: K, v: (typeof e)[K]) => update((x) => ({ ...x, emergency: { ...x.emergency, [k]: v } }), `Emergency · ${String(k)}`);

  return (
    <SettingsShell title="Emergency & Safety" description="Kept ready — hopefully never needed.">
      <Section title="Trusted contact">
        <Row label="Name"><TextField value={e.contactName} onChange={(v) => set("contactName", v)} /></Row>
        <Row label="Phone"><TextField value={e.contactPhone} onChange={(v) => set("contactPhone", v)} /></Row>
        <div className="px-5 py-3">
          <a href={`tel:${e.contactPhone}`}><PrimaryButton><span className="inline-flex items-center gap-1"><PhoneCall className="w-3 h-3" /> Call now</span></PrimaryButton></a>
        </div>
      </Section>

      <Section title="Helplines">
        {e.sosNumbers.map((num) => (
          <Row key={num} label={num} action={<GhostButton onClick={() => { const digits = num.replace(/[^\d+]/g, ""); if (digits) location.href = `tel:${digits}`; }}>Call</GhostButton>} />
        ))}
        <div className="px-5 py-3">
          <GhostButton onClick={() => { const v = prompt("Add a helpline (name + number)"); if (v) set("sosNumbers", [...e.sosNumbers, v]); }}>Add helpline</GhostButton>
        </div>
      </Section>

      <Section title="Quick emergency message">
        <div className="px-5 py-4">
          <TextArea value={e.quickMessage} onChange={(v) => set("quickMessage", v)} placeholder="A short message we can share with your trusted contact." />
        </div>
        <Row label="Share live location during SOS" hint="Only when you tap the SOS button." action={<Toggle checked={e.shareLocation} onChange={(v) => set("shareLocation", v)} />}>
          {e.shareLocation && <div className="text-[11px] mt-1 inline-flex items-center gap-1" style={{ color: muted }}><MapPin className="w-3 h-3" /> Location approximate, encrypted.</div>}
        </Row>
        <Row label="Safe check-in reminders" hint="A daily 'you okay?' from PeaceBot when you want it." action={<Toggle checked={e.safeCheckIn} onChange={(v) => set("safeCheckIn", v)} />} />
      </Section>

      <Section title="Crisis resources">
        <Row label="See counselling emergency page" action={<Link to="/counselling/emergency"><GhostButton>Open</GhostButton></Link>} />
        <Row label="See buddies emergency" action={<Link to="/buddies/emergency"><GhostButton>Open</GhostButton></Link>} />
      </Section>

      <p className="text-[11.5px]" style={{ color: ink, opacity: 0.55 }}>If you're in immediate danger, please call your local emergency number. PeaceCode is a companion, not a replacement for urgent care.</p>
    </SettingsShell>
  );
}
