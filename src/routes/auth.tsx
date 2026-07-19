import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Peace Code" },
      { name: "description", content: "A calm doorway into Peace Code. Sign in with your college email to continue your journey towards peace of mind." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign in — Peace Code" },
      { property: "og:description", content: "A sanctuary for students. Pause. Breathe. Reconnect." },
    ],
  }),
  component: () => <Outlet />,
});
