import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/college/primitives";
import { useCurrentRole, switchRoleForDemo } from "@/lib/admin-mock";
import { ShieldCheck, Eye } from "lucide-react";

const TABS = [
  { to: "/admin",          label: "Overview",  adminOnly: true  },
  { to: "/admin/members",  label: "Members",   adminOnly: true  },
  { to: "/admin/policies", label: "Policies",  adminOnly: true  },
  { to: "/admin/audit",    label: "Audit log", adminOnly: false },
] as const;

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — PeaceCode for Colleges" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const role = useCurrentRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Viewers can only see the audit log; anything else routes them there.
  if (role === "viewer" && pathname !== "/admin/audit") {
    return <Navigate to="/admin/audit" replace />;
  }

  const currentTab = TABS.find((t) => pathname === t.to)?.label ?? "Overview";

  return (
    <div>
      <PageHeader
        eyebrow={`Administration · ${currentTab}`}
        title="Institutional control panel"
        subtitle="Manage admins, institution-wide policies, and the tamper-evident audit log. All admin actions are logged; the audit records actions, not students."
        actions={<RoleSwitcher role={role} />}
      />

      <nav className="flex flex-wrap gap-1 mb-6" aria-label="Admin sections">
        {TABS.filter((t) => role === "admin" || !t.adminOnly).map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="px-3.5 py-1.5 rounded-full text-[12.5px]"
              style={{
                background: active ? "color-mix(in oklab, var(--pc-primary) 14%, var(--pc-surface2))" : "var(--pc-surface2)",
                color: active ? "var(--pc-primary)" : "var(--pc-ink-2)",
                border: "1px solid " + (active ? "var(--pc-primary)" : "var(--pc-border)"),
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}

// A small in-page role switcher so reviewers can inspect the viewer flow
// without wiring real auth. Purely a UI-only affordance for this build.
function RoleSwitcher({ role }: { role: "admin" | "viewer" }) {
  const Icon = role === "admin" ? ShieldCheck : Eye;
  return (
    <div className="inline-flex items-center gap-2 text-[11.5px]"
         style={{ color: "var(--pc-muted)" }}>
      <span className="hidden sm:inline">Preview as</span>
      <div className="inline-flex rounded-full overflow-hidden" style={{ border: "1px solid var(--pc-border)" }}>
        {(["admin", "viewer"] as const).map((r) => (
          <button key={r} onClick={() => switchRoleForDemo(r)}
            className="px-2.5 py-1 inline-flex items-center gap-1 capitalize"
            style={{
              background: role === r ? "color-mix(in oklab, var(--pc-primary) 12%, var(--pc-surface2))" : "transparent",
              color: role === r ? "var(--pc-primary)" : "var(--pc-ink-2)",
            }}
          >
            {role === r ? <Icon className="w-3 h-3" /> : null}
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
