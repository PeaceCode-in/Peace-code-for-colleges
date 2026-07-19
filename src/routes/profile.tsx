import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Your profile · PeaceCode" }] }),
  component: () => <AppShell><Outlet /></AppShell>,
});
