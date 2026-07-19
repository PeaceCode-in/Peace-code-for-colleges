import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Inbox — PeaceCode" },
      { name: "description", content: "Your calm wellness activity inbox — every update across PeaceCode in one gentle timeline." },
      { property: "og:title", content: "PeaceCode Inbox" },
      { property: "og:description", content: "A calm activity hub for your wellness updates." },
    ],
  }),
  component: () => (
    <AppShell>
      <div className="min-h-screen">
        <Outlet />
      </div>
    </AppShell>
  ),
});
