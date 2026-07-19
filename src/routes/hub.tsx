import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/hub")({
  head: () => ({
    meta: [
      { title: "Product Hub — PeaceCode" },
      { name: "description", content: "What's new, themes, and integrations — one calm place." },
      { property: "og:title", content: "Product Hub — PeaceCode" },
      { property: "og:description", content: "Release notes, themes, and integrations for PeaceCode." },
    ],
  }),
  component: () => <AppShell><Outlet /></AppShell>,
});
