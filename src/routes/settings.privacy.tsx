import { createFileRoute, Link } from "@tanstack/react-router";
import { SettingsShell, Section, Row, Toggle, Segmented, GhostButton, DangerButton } from "@/components/settings/primitives";
import { useSettings } from "@/lib/settings-store";
import { palette } from "@/components/AppShell";
import { useState } from "react";
import { KeyRound, LogOut, Smartphone } from "lucide-react";

export const Route = createFileRoute("/settings/privacy")({
  head: () => ({ meta: [{ title: "Privacy & Security — PeaceCode" }] }),
  component: PrivacyPage,
});

const { ink, muted, surface2 } = palette;

const DEVICES = [
  { id: "d1", name: "MacBook Air · Chrome", where: "Delhi, IN", when: "now", current: true },
  { id: "d2", name: "iPhone 14 · PeaceCode iOS", where: "Delhi, IN", when: "yesterday" },
  { id: "d3", name: "Windows · Edge", where: "Mumbai, IN", when: "3 days ago" },
];
const LOGINS = [
  { at: "Today, 09:14", ip: "***.***.42.11", device: "MacBook · Chrome" },
  { at: "Yesterday, 22:03", ip: "***.***.42.11", device: "iPhone" },
  { at: "12 Jul, 08:47", ip: "***.***.19.03", device: "MacBook · Chrome" },
];

function PrivacyPage() {
  const [s, update] = useSettings();
  const p = s.privacy;
  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) => update((x) => ({ ...x, privacy: { ...x.privacy, [k]: v } }), `Privacy · ${String(k)}`);
  const [showPassword, setShowPassword] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const exportAll = () => {
    const dump = Object.keys(localStorage).reduce<Record<string, unknown>>((acc, k) => {
      if (k.startsWith("peacecode.")) { try { acc[k] = JSON.parse(localStorage.getItem(k) || "null"); } catch { acc[k] = localStorage.getItem(k); } }
      return acc;
    }, {});
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "peacecode-data.json"; a.click();
  };

  return (
    <SettingsShell title="Privacy & Security" description="Who sees what, and how safely you sign in.">
      <Section title="Password & sign-in">
        <Row label="Change password" action={<GhostButton onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Close" : "Change"}</GhostButton>} />
        {showPassword && (
          <div className="px-5 pb-5 grid gap-2">
            <input type="password" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="text-[13px] px-3 py-2 rounded-xl outline-none" style={{ background: surface2, color: ink }} />
            <input type="password" placeholder="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="text-[13px] px-3 py-2 rounded-xl outline-none" style={{ background: surface2, color: ink }} />
            <input type="password" placeholder="Confirm" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="text-[13px] px-3 py-2 rounded-xl outline-none" style={{ background: surface2, color: ink }} />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => { if (pw.next && pw.next === pw.confirm) { alert("Password updated."); setPw({ current: "", next: "", confirm: "" }); setShowPassword(false); } else alert("Passwords don't match."); }}
                className="text-[12px] px-3 py-1.5 rounded-full" style={{ background: "var(--pc-primary)", color: "#fff" }}>Save</button>
              <span className="text-[11px]" style={{ color: muted }}>Use at least 8 characters, one number.</span>
            </div>
          </div>
        )}
        <Row label="Two-factor authentication" hint="Adds a one-time code at sign-in." action={<Toggle checked={p.twoFA} onChange={(v) => set("twoFA", v)} />} />
        <Row label="Passkey" hint="Sign in without a password using this device." action={<Toggle checked={p.passkey} onChange={(v) => set("passkey", v)} />} />
        <Row label="Biometric login" action={<Toggle checked={p.biometric} onChange={(v) => set("biometric", v)} />} />
        <Row label="Face ID" action={<Toggle checked={p.faceId} onChange={(v) => set("faceId", v)} />} />
        <Row label="Fingerprint" action={<Toggle checked={p.fingerprint} onChange={(v) => set("fingerprint", v)} />} />
      </Section>

      <Section title="App lock">
        <Row label="Auto-lock after inactivity" action={<Segmented value={String(p.autoLock) as "0"|"1"|"5"|"15"} onChange={(v) => set("autoLock", parseInt(v))} options={[{ value: "0", label: "Off" }, { value: "1", label: "1m" }, { value: "5", label: "5m" }, { value: "15", label: "15m" }]} />} />
        <Row label="PIN lock" action={<Toggle checked={p.pinLock} onChange={(v) => set("pinLock", v)} />} />
        <Row label="Journal lock" hint="Extra PIN before opening the journal." action={<Toggle checked={p.journalLock} onChange={(v) => set("journalLock", v)} />} />
      </Section>

      <Section title="Visibility">
        <Row label="Community visible" hint="Others can find your profile." action={<Toggle checked={p.communityVisible} onChange={(v) => set("communityVisible", v)} />} />
        <Row label="Anonymous posting by default" action={<Toggle checked={p.anonymousDefault} onChange={(v) => set("anonymousDefault", v)} />} />
        <Row label="Gratitude wall public" action={<Toggle checked={p.gratitudePublic} onChange={(v) => set("gratitudePublic", v)} />} />
        <Row label="Hide online status" action={<Toggle checked={p.hideOnline} onChange={(v) => set("hideOnline", v)} />} />
        <Row label="Hide activity" action={<Toggle checked={p.hideActivity} onChange={(v) => set("hideActivity", v)} />} />
        <Row label="Peace Buddy visibility" hint="Let matched buddies see you." action={<Toggle checked={p.buddyVisible} onChange={(v) => set("buddyVisible", v)} />} />
        <Row label="Counselling privacy" hint="Hide sessions from shared views." action={<Toggle checked={p.counsellingPrivate} onChange={(v) => set("counsellingPrivate", v)} />} />
      </Section>

      <Section title="Logged-in devices">
        {DEVICES.map((d) => (
          <Row key={d.id} label={d.name} hint={`${d.where} · ${d.when}${d.current ? " · this device" : ""}`}
            action={!d.current ? <GhostButton onClick={() => alert(`Signed out ${d.name}.`)}><span className="inline-flex items-center gap-1"><LogOut className="w-3 h-3" /> Sign out</span></GhostButton> : <span className="text-[11px]" style={{ color: muted }}>current</span>} />
        ))}
        <div className="px-5 py-3">
          <GhostButton onClick={() => alert("All other devices signed out.")}><span className="inline-flex items-center gap-1"><Smartphone className="w-3 h-3" /> Sign out all others</span></GhostButton>
        </div>
      </Section>

      <Section title="Recent login history">
        {LOGINS.map((l, i) => (
          <div key={i} className="px-5 py-3 flex items-center justify-between text-[12.5px]">
            <div><div style={{ color: ink }}>{l.device}</div><div className="text-[11px]" style={{ color: muted }}>{l.at} · {l.ip}</div></div>
          </div>
        ))}
      </Section>

      <Section title="Your data">
        <Row label="Export all personal data (JSON)" action={<GhostButton onClick={exportAll}>Download</GhostButton>} />
        <Row label="Download journal entries" action={<GhostButton onClick={() => { const j = localStorage.getItem("peacecode.journal.entries.v1"); const b = new Blob([j || "[]"], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "peacecode-journals.json"; a.click(); }}>Download</GhostButton>} />
        <Row label="Download reports & assessments" action={<GhostButton onClick={() => { const j = localStorage.getItem("peacecode.screening.sessions.v1"); const b = new Blob([j || "[]"], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "peacecode-reports.json"; a.click(); }}>Download</GhostButton>} />
        <Row label="Delete account" hint="Permanently erases everything after confirmation." action={<Link to="/settings/delete"><DangerButton>Delete</DangerButton></Link>} />
      </Section>

      <p className="text-[11px] mt-4" style={{ color: muted }}><KeyRound className="inline w-3 h-3 mr-1 opacity-50" />Nothing here leaves your device unless you export it.</p>
    </SettingsShell>
  );
}
