import { createFileRoute } from "@tanstack/react-router";
import { PolicyList } from "@/components/admin/PolicyList";
import { EthicsFooter } from "@/components/early-warning/EthicsFooter";

export const Route = createFileRoute("/_authenticated/admin/policies")({
  head: () => ({ meta: [{ title: "Policies — PeaceCode for Colleges" }] }),
  component: () => (
    <div className="space-y-6">
      <PolicyList />
      <EthicsFooter />
    </div>
  ),
});
