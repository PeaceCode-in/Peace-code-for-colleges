import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/reports/exports")({
  head: () => ({ meta: [{ title: "Data exports — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Institutional reporting"
        title="Data exports"
        subtitle="Download the aggregate datasets behind every dashboard tile for your own analysis."
      />
      <ComingNext
        promptNumber={10}
        title="CSV and JSON exports"
        whatItWillShow="Signed, aggregate-only exports of every metric shown in the dashboard — with a manifest describing the k-anonymity threshold applied to each column."
      />
    </>
  ),
});
