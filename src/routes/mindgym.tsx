// Mind Gym layout — wraps every /mindgym/* page in the shared AppShell.
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/mindgym")({
  head: () => ({
    meta: [
      { title: "Mind Gym — PeaceCode" },
      { name: "description", content: "Gym for your mind. Train focus, calm, memory, resilience and confidence — in short reps, every day." },
      { property: "og:title", content: "Mind Gym — PeaceCode" },
      { property: "og:description", content: "Gym for your mind. Train the skills school never taught." },
    ],
  }),
  component: () => <AppShell><Outlet /></AppShell>,
});

