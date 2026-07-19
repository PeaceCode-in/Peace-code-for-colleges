import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard, StatTile } from "@/components/college/primitives";
import { useCollegeContext } from "@/lib/college-context";
import { SEED_DEPARTMENTS, SEED_INSTITUTION } from "@/lib/data/seed/institution";

export const Route = createFileRoute("/_authenticated/admin/institution")({
  head: () => ({
    meta: [
      { title: "Institution — PeaceCode for Colleges" },
      { name: "description", content: "Institutional profile, departments, and configuration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InstitutionPage,
});

function InstitutionPage() {
  const college = useCollegeContext();
  return (
    <div className="space-y-6">
      <PageHeader title="Institution" subtitle="Profile, departments, and configuration for this campus." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="Institution" value={college?.shortName ?? SEED_INSTITUTION.shortName} />
        <StatTile label="Departments" value={String(SEED_DEPARTMENTS.length)} />
        <StatTile label="Student population" value={SEED_INSTITUTION.studentPopulation.toLocaleString()} />
      </div>
      <GlassCard>
        <h3 className="text-[13px] mb-3" style={{ color: "var(--pc-ink)" }}>Departments</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {SEED_DEPARTMENTS.map((d) => (
            <li key={d.id} className="flex justify-between py-1.5" style={{ borderTop: "1px solid var(--pc-border)" }}>
              <span style={{ color: "var(--pc-ink)" }}>{d.name}</span>
              <span className="text-[12px]" style={{ color: "var(--pc-muted)" }}>{d.school}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
