import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — PeaceCode" },
      { name: "description", content: "Find anything in PeaceCode: journal, resources, buddies, counsellors, exercises, and more." },
      { property: "og:title", content: "Search — PeaceCode" },
      { property: "og:description", content: "The command center of PeaceCode. Search, discover, and continue anywhere." },
    ],
  }),
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
