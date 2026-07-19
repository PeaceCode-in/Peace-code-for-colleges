import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { CollegeAppShell } from "@/components/college/AppShell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("pc.college.v1");
    if (!raw) throw redirect({ to: "/auth" });
  },
  component: () => (
    <CollegeAppShell>
      <Outlet />
    </CollegeAppShell>
  ),
});
