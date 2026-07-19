import { createFileRoute, Outlet } from "@tanstack/react-router";
import { eventById } from "@/lib/events-store";

function Layout() {
  return <Outlet />;
}

export const Route = createFileRoute("/events/$id")({
  head: ({ params }) => {
    const e = eventById(params.id);
    return {
      meta: [
        { title: e ? `${e.title} — PeaceCode Events` : "Event — PeaceCode Events" },
        { name: "description", content: e?.tagline ?? "Event on PeaceCode Community Events." },
        { property: "og:title", content: e ? `${e.title} — PeaceCode` : "Event — PeaceCode" },
        { property: "og:description", content: e?.tagline ?? "Event on PeaceCode." },
      ],
    };
  },
  component: Layout,
});
