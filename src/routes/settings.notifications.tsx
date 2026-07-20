import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, GlassCard } from "@/components/college/primitives";

export const Route = createFileRoute("/settings/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — PeaceCode for Colleges" },
      { name: "description", content: "Choose which institutional signals notify you." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

const PREFS = [
  { id: "risk_tier_change", label: "Risk-tier trend changes",       help: "Weekly summary if any tier moves >15%." },
  { id: "phq9_spike",       label: "PHQ-9 severity band spikes",    help: "When any band jumps week-over-week." },
  { id: "overdue",          label: "Overdue reassessments",         help: "When the cohort exceeds threshold." },
  { id: "report_ready",     label: "Report generation complete",    help: "When a scheduled report is ready to download." },
  { id: "member_invited",   label: "Admin member invited",          help: "When another admin is added or removed." },
];

function NotificationsPage() {
  const [on, setOn] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFS.map((p) => [p.id, true])),
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Institutional signals never contain individual student data." />
      <GlassCard>
        <ul>
          {PREFS.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-4 py-3"
                style={{ borderTop: "1px solid var(--pc-border)" }}>
              <div>
                <div className="text-[13px]" style={{ color: "var(--pc-ink)" }}>{p.label}</div>
                <div className="text-[11.5px]" style={{ color: "var(--pc-muted)" }}>{p.help}</div>
              </div>
              <label className="inline-flex items-center gap-2 text-[12px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={on[p.id] ?? false}
                  onChange={(e) => setOn((s) => ({ ...s, [p.id]: e.target.checked }))}
                />
                <span style={{ color: "var(--pc-muted)" }}>{on[p.id] ? "On" : "Off"}</span>
              </label>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
