import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/college/primitives";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { title: "Help — PeaceCode for Colleges" },
      { name: "description", content: "How to read the dashboard, k-anonymity policy, and support." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HelpPage,
});

const TOPICS = [
  { q: "What does k-anonymity ≥ 10 mean?",
    a: "Every tile, row, cell, and export is drawn from a cohort of at least 10 students. Slices below that threshold are hidden — never estimated, never partial." },
  { q: "Where does the seed dataset come from?",
    a: "When your institution's aggregate views are empty, the dashboard renders a deterministic demo dataset so pages don't appear broken. A ‘Seed mode’ pill appears in the topbar whenever seed data is in use." },
  { q: "Who can see this dashboard?",
    a: "Only administrators granted access through your institution's verified email domain. Roles are admin (full) or viewer (read-only). Every action is captured in the audit log." },
  { q: "Can I export raw student data?",
    a: "No. Only pre-approved aggregate columns are exportable, and every export enforces k ≥ 10." },
  { q: "How do I invite another administrator?",
    a: "Admin → Members → Invite. Only emails on the verified institutional domain are accepted." },
];

function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Help & policy" subtitle="How to read the dashboard, and what it does not show." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {TOPICS.map((t) => (
          <GlassCard key={t.q}>
            <div className="text-[13px] mb-2" style={{ color: "var(--pc-ink)" }}>{t.q}</div>
            <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--pc-muted)" }}>{t.a}</p>
          </GlassCard>
        ))}
      </div>
      <GlassCard>
        <div className="text-[13px] mb-2" style={{ color: "var(--pc-ink)" }}>Contact</div>
        <p className="text-[12.5px]" style={{ color: "var(--pc-muted)" }}>
          Institutional support: <span style={{ color: "var(--pc-ink)" }}>hello@peacecode.in</span> — or open the{" "}
          <Link to="/qa" className="underline">QA self-check</Link> if something looks off.
        </p>
      </GlassCard>
    </div>
  );
}
