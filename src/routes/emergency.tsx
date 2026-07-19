import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency Center — PeaceCode" },
      { name: "description", content: "A calm digital safety companion. Immediate coping tools, trusted contacts, helplines, and human support — one tap away." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "PeaceCode Emergency Center" },
      { property: "og:description", content: "Immediate coping tools, trusted contacts, and helplines — designed to feel calm, not scary." },
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
