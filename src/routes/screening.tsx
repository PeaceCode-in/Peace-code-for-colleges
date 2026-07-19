import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ScreeningFX } from "@/components/screening/ScreeningFX";

export const Route = createFileRoute("/screening")({
  component: ScreeningLayout,
});

function ScreeningLayout() {
  return (
    <>
      <ScreeningFX />
      <Outlet />
    </>
  );
}
