import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell, Section, Row, Toggle, Segmented, TextField } from "@/components/settings/primitives";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/settings/notifications")({
  head: () => ({ meta: [{ title: "Notifications — PeaceCode Settings" }] }),
  component: NotificationsPage,
});

const TYPES: { key: string; label: string; hint: string }[] = [
  { key: "dailyReminders", label: "Daily reminders", hint: "Gentle nudges to check in each morning." },
  { key: "journalReminders", label: "Journal reminders", hint: "Suggests a moment to write, usually evening." },
  { key: "breathingReminders", label: "Breathing reminders", hint: "One breath session a day." },
  { key: "meditationReminders", label: "Meditation reminders", hint: "Guided sessions when it feels helpful." },
  { key: "counsellingReminders", label: "Counselling reminders", hint: "For scheduled sessions with an expert." },
  { key: "appointmentReminders", label: "Appointment reminders", hint: "24h and 1h before each booking." },
  { key: "homeworkReminders", label: "Homework reminders", hint: "For therapy homework and reflections." },
  { key: "peaceBuddy", label: "Peace Buddy messages", hint: "New messages from your buddy circle." },
  { key: "communityReplies", label: "Community replies", hint: "Replies and mentions in Circles." },
  { key: "peacebotUpdates", label: "PeaceBot updates", hint: "Long-form insights and check-ins." },
  { key: "achievements", label: "Achievements", hint: "Small wins and streak milestones." },
  { key: "weeklyReport", label: "Weekly report", hint: "Your Sunday wellness recap." },
  { key: "monthlyReport", label: "Monthly report", hint: "A deeper look at the last four weeks." },
];

function NotificationsPage() {
  const [s, update] = useSettings();
  const n = s.notifications;
  const setType = (k: string, v: boolean) => update((x) => ({ ...x, notifications: { ...x.notifications, types: { ...x.notifications.types, [k]: v } } }), `Notifications · ${k}`);
  const setChannel = (k: "push" | "email" | "desktop", v: boolean) => update((x) => ({ ...x, notifications: { ...x.notifications, channels: { ...x.notifications.channels, [k]: v } } }), `Notifications · ${k}`);
  const setQuiet = (patch: Partial<typeof n.quietHours>) => update((x) => ({ ...x, notifications: { ...x.notifications, quietHours: { ...x.notifications.quietHours, ...patch } } }), `Notifications · quiet hours`);

  return (
    <SettingsShell title="Notifications" description="Only the pings you actually want. Everything else stays quiet.">
      <Section title="Channels">
        <Row label="Push" hint="Alerts on this device." action={<Toggle checked={n.channels.push} onChange={(v) => setChannel("push", v)} />} />
        <Row label="Email" hint="Weekly digests and important account activity." action={<Toggle checked={n.channels.email} onChange={(v) => setChannel("email", v)} />} />
        <Row label="Desktop" hint="Browser notifications on this laptop." action={<Toggle checked={n.channels.desktop} onChange={(v) => setChannel("desktop", v)} />} />
      </Section>

      <Section title="Timing">
        <Row label="Do not disturb" hint="Silence everything until you turn it back on." action={<Toggle checked={n.dnd} onChange={(v) => update((x) => ({ ...x, notifications: { ...x.notifications, dnd: v } }), "Notifications · DND")} />} />
        <Row label="Quiet hours" hint="No pings during sleep hours." action={<Toggle checked={n.quietHours.enabled} onChange={(v) => setQuiet({ enabled: v })} />} />
        {n.quietHours.enabled && (
          <div className="px-5 pb-4 -mt-1 flex items-center gap-3">
            <TextField type="time" value={n.quietHours.from} onChange={(v) => setQuiet({ from: v })} />
            <span className="text-[11px] opacity-60">to</span>
            <TextField type="time" value={n.quietHours.to} onChange={(v) => setQuiet({ to: v })} />
          </div>
        )}
        <Row label="Reminder frequency" action={<Segmented value={n.frequency} onChange={(v) => update((x) => ({ ...x, notifications: { ...x.notifications, frequency: v } }), "Notifications · frequency")} options={[{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "Often" }]} />} />
      </Section>

      <Section title="What to notify about">
        {TYPES.map((t) => (
          <Row key={t.key} label={t.label} hint={t.hint} action={<Toggle checked={!!n.types[t.key]} onChange={(v) => setType(t.key, v)} />} />
        ))}
      </Section>
    </SettingsShell>
  );
}
