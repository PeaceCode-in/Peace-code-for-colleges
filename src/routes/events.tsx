import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

function Layout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Community Events — PeaceCode" },
      { name: "description", content: "Discover meditation circles, study groups, career workshops, and wellness meetups across your campus." },
      { property: "og:title", content: "Community Events — PeaceCode" },
      { property: "og:description", content: "The social and wellness hub of every campus." },
    ],
  }),
  component: Layout,
});
