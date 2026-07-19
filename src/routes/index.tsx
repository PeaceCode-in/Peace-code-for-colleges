import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") throw redirect({ to: "/auth" });
    const c = window.localStorage.getItem("pc.college.v1");
    throw redirect({ to: c ? "/dashboard" : "/auth" });
  },
});
