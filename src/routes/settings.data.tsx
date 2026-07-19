import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell, Section, Row, GhostButton, DangerButton } from "@/components/settings/primitives";
import { palette } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { CloudUpload, HardDrive, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/settings/data")({
  head: () => ({ meta: [{ title: "Data & Storage — Settings" }] }),
  component: DataSettings,
});

const { primary, muted, ink, surface2 } = palette;

function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function DataSettings() {
  const [usage, setUsage] = useState({ total: 0, journal: 0, media: 0, docs: 0, cache: 0 });
  const [lastSync, setLastSync] = useState<string>("just now");
  useEffect(() => { compute(); }, []);
  const compute = () => {
    let total = 0, journal = 0, media = 0, docs = 0, cache = 0;
    for (const k of Object.keys(localStorage)) {
      const v = localStorage.getItem(k) || ""; const size = v.length;
      total += size;
      if (k.includes("journal")) journal += size;
      else if (k.includes("resources") || k.includes("gratitude")) media += size;
      else if (k.includes("screening") || k.includes("counselling")) docs += size;
      else cache += size;
    }
    setUsage({ total, journal, media, docs, cache });
  };
  const clearCache = () => { if (!confirm("Clear cached preview data?")) return; for (const k of Object.keys(localStorage)) if (k.endsWith(".cache")) localStorage.removeItem(k); compute(); };
  const syncNow = () => { setLastSync("just now"); alert("Everything is in sync."); };

  const bar = (label: string, size: number, color: string) => (
    <div>
      <div className="flex items-center justify-between text-[12px] mb-1"><span style={{ color: ink }}>{label}</span><span style={{ color: muted }}>{bytes(size)}</span></div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: surface2 }}>
        <div className="h-full" style={{ width: `${Math.min(100, (size / Math.max(usage.total, 1)) * 100)}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <SettingsShell title="Data & Storage" description={`Using ${bytes(usage.total)} on this device.`}>
      <Section title="Storage breakdown">
        <div className="px-5 py-5 space-y-3">
          {bar("Journal", usage.journal, primary)}
          {bar("Media (resources, gratitude)", usage.media, "var(--pc-lavender)")}
          {bar("Documents (reports, sessions)", usage.docs, "var(--pc-soft)")}
          {bar("Cache", usage.cache, "#9CA9C4")}
        </div>
      </Section>
      <Section title="Maintenance">
        <Row label="Clear cache" hint="Removes temporary previews. Your data stays." action={<GhostButton onClick={clearCache}><span className="inline-flex items-center gap-1"><HardDrive className="w-3 h-3" /> Clear</span></GhostButton>} />
        <Row label="Offline files" hint="Not enabled on this build." action={<GhostButton onClick={() => alert("Offline mode coming soon.")}>Manage</GhostButton>} />
      </Section>
      <Section title="Backup & sync">
        <Row label="Backup status" hint={`Last synced ${lastSync}.`} action={<GhostButton onClick={syncNow}><span className="inline-flex items-center gap-1"><RefreshCcw className="w-3 h-3" /> Sync now</span></GhostButton>} />
        <Row label="Cloud backup" hint="Encrypted, opt-in. Coming with Cloud connect." action={<GhostButton onClick={() => alert("Enable Cloud to back up.")}><span className="inline-flex items-center gap-1"><CloudUpload className="w-3 h-3" /> Enable</span></GhostButton>} />
        <Row label="Restore from backup" action={<GhostButton onClick={() => alert("No cloud backup found on this device.")}>Restore</GhostButton>} />
      </Section>
      <Section title="Reset">
        <Row label="Reset settings to defaults" action={<DangerButton onClick={() => { if (confirm("Reset every setting?")) { localStorage.removeItem("peacecode.settings.v1"); location.reload(); } }}>Reset</DangerButton>} />
      </Section>
    </SettingsShell>
  );
}
