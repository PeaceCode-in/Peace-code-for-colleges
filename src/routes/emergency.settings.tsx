import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page, BackBar, PageTitle, Card, Field, TextArea, PrimaryBtn, Chip } from "@/components/emergency/primitives";
import { loadSettings, saveSettings, loadContacts, DEFAULT_SOS, type EmergencySettings, type Contact } from "@/lib/emergency-store";
import { palette } from "@/components/AppShell";
import { Save } from "lucide-react";

const { border, muted, ink, surface2, primary, soft } = palette;

function Toggle({ label, hint, on, set }: { label: string; hint?: string; on: boolean; set: (b: boolean) => void }) {
  return (
    <button onClick={() => set(!on)} className="w-full flex items-start gap-3 rounded-2xl p-4 text-left" style={{ background: surface2, border: `1px solid ${border}` }}>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px]" style={{ color: ink }}>{label}</div>
        {hint && <div className="text-[11.5px] mt-0.5" style={{ color: muted }}>{hint}</div>}
      </div>
      <span className="w-9 h-5 rounded-full relative shrink-0" style={{ background: on ? primary : border }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full transition-transform" style={{ background: "var(--pc-bg)", transform: `translateX(${on ? 18 : 2}px)` }} />
      </span>
    </button>
  );
}

function SettingsPage() {
  const [s, setS] = useState<EmergencySettings | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setS(loadSettings()); setContacts(loadContacts()); }, []);
  if (!s) return null;

  const save = () => { saveSettings(s); setSaved(true); setTimeout(() => setSaved(false), 1400); };

  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Emergency settings" title="Small controls, kept simple." sub="These stay on your device. You can change them anytime." />

      <div className="flex justify-end mb-4">
        <PrimaryBtn onClick={save}><Save className="w-3.5 h-3.5"/> {saved ? "Saved" : "Save settings"}</PrimaryBtn>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <div className="text-[10.5px] tracking-[0.22em] uppercase mb-3" style={{ color: muted }}>Default emergency contact</div>
          {contacts.length === 0 ? (
            <div className="text-[13px]" style={{ color: muted }}>
              None yet. <Link to="/emergency/contacts" style={{ color: primary }}>Add contacts</Link>.
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {contacts.map((c) => {
                const on = s.defaultContactId === c.id;
                return (
                  <button key={c.id} onClick={() => setS({ ...s, defaultContactId: c.id })} className="rounded-full h-9 px-3 text-[11.5px] flex items-center gap-1.5"
                    style={{ background: on ? soft : surface2, color: on ? primary : muted, border: `1px solid ${on ? primary : border}` }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "var(--pc-surface)", color: ink }}>{(c.initials || c.name[0] || "?").toUpperCase()}</span>
                    {c.name}
                    {on && <Chip tone="warm">default</Chip>}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="text-[10.5px] tracking-[0.22em] uppercase mb-2" style={{ color: muted }}>SOS message</div>
          <Field label="What we send when you tap send">
            <TextArea rows={4} value={s.sosMessage} onChange={(e) => setS({ ...s, sosMessage: e.target.value })} />
          </Field>
          <button onClick={() => setS({ ...s, sosMessage: DEFAULT_SOS })} className="text-[11px] mt-2" style={{ color: muted }}>Use suggested message</button>
        </Card>

        <Card>
          <div className="text-[10.5px] tracking-[0.22em] uppercase mb-3" style={{ color: muted }}>Behaviour</div>
          <div className="flex flex-col gap-2">
            <Toggle label="Enable live location sharing" hint="Placeholder — in-app share only, not a real GPS feed." on={s.locationSharing} set={(v) => setS({ ...s, locationSharing: v })} />
            <Toggle label="Quick launch button" hint="Show the floating Emergency button everywhere in PeaceCode." on={s.quickLaunch} set={(v) => setS({ ...s, quickLaunch: v })} />
            <Toggle label="Follow-up reminders" hint="A gentle check-in after difficult moments." on={s.followUpReminders} set={(v) => setS({ ...s, followUpReminders: v })} />
          </div>
          <div className="text-[11.5px] mt-3" style={{ color: muted }}>
            Power / lock-screen shortcuts are placeholders — on-device shortcuts depend on your phone.
          </div>
        </Card>

        <Card>
          <div className="text-[10.5px] tracking-[0.22em] uppercase mb-3" style={{ color: muted }}>Accessibility</div>
          <div className="flex flex-col gap-2">
            <Toggle label="Large buttons" hint="Bigger tap targets, less precision needed." on={s.largeButtons} set={(v) => setS({ ...s, largeButtons: v })} />
            <Toggle label="High contrast" hint="Darker text on lighter backgrounds." on={s.highContrast} set={(v) => setS({ ...s, highContrast: v })} />
            <Toggle label="Simple mode" hint="Hide non-essential UI in emergency pages." on={s.simpleMode} set={(v) => setS({ ...s, simpleMode: v })} />
            <Toggle label="Voice commands" hint="Placeholder — call, breathe, and grounding by voice." on={s.voiceCommands} set={(v) => setS({ ...s, voiceCommands: v })} />
          </div>
        </Card>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/settings")({ component: SettingsPage });
