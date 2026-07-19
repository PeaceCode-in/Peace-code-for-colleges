import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/gratitude")({
  component: () => <Outlet />,
});
