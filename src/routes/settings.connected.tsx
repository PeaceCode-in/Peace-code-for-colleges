import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell, Section, Row, GhostButton } from "@/components/settings/primitives";
import { useSettings } from "@/lib/settings-store";
import { palette } from "@/components/AppShell";
import { Check } from "lucide-react";

export const Route = createFileRoute("/settings/connected")({
  head: () => ({ meta: [{ title: "Connected Accounts — Settings" }] }),
  component: ConnectedSettings,
});

const { primary, muted } = palette;

const PROVIDERS: { key: string; name: string; hint: string; group: "account" | "calendar" | "health" }[] = [
  { key: "google", name: "Google", hint: "Sign in and back up", group: "account" },
  { key: "apple", name: "Apple", hint: "Sign in with Apple ID", group: "account" },
  { key: "microsoft", name: "Microsoft", hint: "For campus 365 accounts", group: "account" },
  { key: "collegeSSO", name: "College SSO", hint: "Institutional single sign-on", group: "account" },
  { key: "calendar", name: "Calendar", hint: "Sync sessions and reminders", group: "calendar" },
  { key: "googleFit", name: "Google Fit", hint: "Sleep and heart rate", group: "health" },
  { key: "appleHealth", name: "Apple Health", hint: "Sleep, HRV, and activity", group: "health" },
  { key: "fitbit", name: "Fitbit", hint: "Sleep and resting HR", group: "health" },
  { key: "garmin", name: "Garmin", hint: "Body Battery and sleep", group: "health" },
];

function ConnectedSettings() {
  const [s, update] = useSettings();
  const toggle = (k: string) => update((x) => ({ ...x, connected: { ...x.connected, [k]: !x.connected[k] } }), `Connected · ${k}`);

  const group = (label: string, g: "account" | "calendar" | "health") => (
    <Section title={label}>
      {PROVIDERS.filter((p) => p.group === g).map((p) => {
        const on = !!s.connected[p.key];
        return (
          <Row key={p.key} label={p.name} hint={p.hint} action={
            <GhostButton onClick={() => toggle(p.key)}>
              {on ? <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" style={{ color: primary }} /> Connected</span> : "Connect"}
            </GhostButton>
          } />
        );
      })}
    </Section>
  );

  return (
    <SettingsShell title="Connected accounts" description="PeaceCode reads only what you allow — never posts on your behalf.">
      {group("Sign-in providers", "account")}
      {group("Calendar", "calendar")}
      {group("Health & wearables", "health")}
      <p className="text-[11.5px]" style={{ color: muted }}>Disconnecting revokes access instantly and deletes cached tokens.</p>
    </SettingsShell>
  );
}
