import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Once the authenticated dashboard shell is wired, route authenticated
    // admins to /dashboard here. For now, every visit lands on sign-in.
    throw redirect({ to: "/auth" });
  },
});
