import { createFileRoute } from "@tanstack/react-router";
import { CollegeAppShell } from "@/components/college/AppShell";
import { PageHeader, GlassCard, StatTile } from "@/components/college/primitives";
import { useCollegeContext } from "@/lib/college-context";

export const Route = createFileRoute("/settings/account")({
  head: () => ({
    meta: [
      { title: "Account — PeaceCode for Colleges" },
      { name: "description", content: "Your administrator account and session details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const college = useCollegeContext();
  return (
    <CollegeAppShell>
      <div className="space-y-6">
        <PageHeader title="Account" subtitle="Your administrator identity for this institution." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile label="Institution" value={college?.shortName ?? "—"} />
          <StatTile label="Role" value={college?.role ?? "Administrator"} />
          <StatTile label="Email" value={college?.email ?? "—"} />
        </div>
        <GlassCard>
          <p className="text-[12.5px]" style={{ color: "var(--pc-muted)" }}>
            Session, MFA, and identity settings are managed centrally by your institution. To
            transfer administrator rights, use the Members panel under Admin.
          </p>
        </GlassCard>
      </div>
    </CollegeAppShell>
  );
}
