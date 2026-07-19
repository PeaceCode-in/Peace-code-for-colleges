// Notification settings — channels, categories, quiet hours, DND.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { palette } from "@/components/AppShell";
import {
  loadPrefs, savePrefs, CATEGORY_META, type NotifCategory, type NotifPrefs,
} from "@/lib/notifications-store";
import { Icon, Panel, Pill } from "@/components/notifications/primitives";

const { surface, surface2, border, ink, muted, primary } = palette;

export const Route = createFileRoute("/notifications/settings")({
  component: Settings,
});

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 cursor-pointer">
      <div className="min-w-0">
        <div className="text-[13px]" style={{ color: ink }}>{label}</div>
        {hint && <div className="text-[11.5px]" style={{ color: muted }}>{hint}</div>}
      </div>
      <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
              className="shrink-0 w-10 h-6 rounded-full transition p-0.5"
              style={{ background: on ? primary : "var(--pc-surface2)", border: `1px solid ${border}` }}>
        <span className="block w-5 h-5 rounded-full transition-transform"
              style={{ background: "white", transform: on ? "translateX(16px)" : "translateX(0px)" }} />
      </button>
    </label>
  );
}

function Settings() {
  const [p, setP] = useState<NotifPrefs>(() => loadPrefs());
  const save = (n: NotifPrefs) => { setP(n); savePrefs(n); };
  const set = <K extends keyof NotifPrefs>(k: K, v: NotifPrefs[K]) => save({ ...p, [k]: v });

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="text-[10.5px] tracking-[0.32em] uppercase" style={{ color: muted }}>
        <Link to="/notifications" className="hover:underline underline-offset-4">Inbox</Link> · Settings
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap mt-1">
        <h1 className="font-serif text-[26px] sm:text-[32px] leading-tight">Notification preferences</h1>
        <div className="flex gap-2">
          <Pill to="/notifications"><Icon name="ArrowLeft" className="w-3.5 h-3.5" /> Back to inbox</Pill>
        </div>
      </div>

      {/* DND & Quiet hours */}
      <Panel className="mt-5">
        <div className="text-[10.5px] tracking-[0.28em] uppercase" style={{ color: muted }}>Focus</div>
        <div className="mt-2 divide-y" style={{ borderColor: border }}>
          <Toggle label="Do not disturb"
                  hint="Silence all notifications until you turn this off."
                  on={p.dnd} onChange={(v) => set("dnd", v)} />
          <Toggle label="Quiet hours"
                  hint={`No sound or badges between ${p.quiet.start} and ${p.quiet.end}.`}
                  on={p.quiet.enabled} onChange={(v) => save({ ...p, quiet: { ...p.quiet, enabled: v } })} />
        </div>
        {p.quiet.enabled && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <TimeField label="Start" value={p.quiet.start} onChange={(v) => save({ ...p, quiet: { ...p.quiet, start: v } })} />
            <TimeField label="End" value={p.quiet.end} onChange={(v) => save({ ...p, quiet: { ...p.quiet, end: v } })} />
            <div className="col-span-2 mt-1 rounded-xl p-3" style={{ background: surface2, border: `1px solid ${border}` }}>
              <div className="text-[11.5px] tracking-[0.22em] uppercase mb-1.5" style={{ color: muted }}>Exceptions during quiet hours</div>
              <Toggle label="Emergency alerts" on={p.quiet.allowEmergency}
                      onChange={(v) => save({ ...p, quiet: { ...p.quiet, allowEmergency: v } })} />
              <Toggle label="Counselling sessions" on={p.quiet.allowCounselling}
                      onChange={(v) => save({ ...p, quiet: { ...p.quiet, allowCounselling: v } })} />
              <Toggle label="Peace Buddy sessions" on={p.quiet.allowBuddy}
                      onChange={(v) => save({ ...p, quiet: { ...p.quiet, allowBuddy: v } })} />
            </div>
          </div>
        )}
      </Panel>

      {/* Delivery channels */}
      <Panel className="mt-4">
        <div className="text-[10.5px] tracking-[0.28em] uppercase" style={{ color: muted }}>Delivery</div>
        <div className="mt-2 divide-y" style={{ borderColor: border }}>
          <Toggle label="Push notifications" hint="On your phone."
                  on={p.channels.push} onChange={(v) => save({ ...p, channels: { ...p.channels, push: v } })} />
          <Toggle label="Desktop notifications" hint="Only when this browser is open."
                  on={p.channels.desktop} onChange={(v) => save({ ...p, channels: { ...p.channels, desktop: v } })} />
          <Toggle label="Email"
                  on={p.channels.email} onChange={(v) => save({ ...p, channels: { ...p.channels, email: v } })} />
          <Toggle label="SMS" hint="Emergency only — coming soon."
                  on={p.channels.sms} onChange={(v) => save({ ...p, channels: { ...p.channels, sms: v } })} />
          <Toggle label="Weekly digest" hint="Sunday morning summary."
                  on={p.channels.weeklyDigest} onChange={(v) => save({ ...p, channels: { ...p.channels, weeklyDigest: v } })} />
          <Toggle label="Monthly wellness report"
                  on={p.channels.monthlyReport} onChange={(v) => save({ ...p, channels: { ...p.channels, monthlyReport: v } })} />
        </div>
      </Panel>

      {/* Category toggles */}
      <Panel className="mt-4">
        <div className="text-[10.5px] tracking-[0.28em] uppercase" style={{ color: muted }}>Categories</div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {(Object.keys(CATEGORY_META) as NotifCategory[]).map((c) => (
            <div key={c} className="border-b" style={{ borderColor: border }}>
              <Toggle label={CATEGORY_META[c].label}
                      hint={c === "emergency" ? "Cannot be fully disabled." : undefined}
                      on={p.categories[c]}
                      onChange={(v) => save({ ...p, categories: { ...p.categories, [c]: c === "emergency" ? true : v } })} />
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-6 text-[11.5px] text-center" style={{ color: muted }}>
        Changes save automatically to this device.
      </div>
    </div>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] tracking-[0.22em] uppercase" style={{ color: muted }}>{label}</span>
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)}
             className="h-10 px-3 rounded-xl outline-none text-[13px]"
             style={{ background: surface, border: `1px solid ${border}`, color: ink }} />
    </label>
  );
}
