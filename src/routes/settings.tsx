import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — PeaceCode" }, { name: "description", content: "Manage your PeaceCode profile, appearance, privacy, and preferences." }] }),
  component: () => <AppShell><Outlet /></AppShell>,
});
