import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ResourcesFX } from "@/components/resources/ResourcesFX";

export const Route = createFileRoute("/resources")({
  component: ResourcesLayout,
});

function ResourcesLayout() {
  return (
    <>
      <ResourcesFX />
      <Outlet />
    </>
  );
}
