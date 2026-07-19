import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CollegeAppShell } from "@/components/college/AppShell";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — PeaceCode for Colleges" }] }),
  component: () => (
    <CollegeAppShell>
      <Outlet />
    </CollegeAppShell>
  ),
});
