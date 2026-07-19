import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/care/capacity")({
  head: () => ({ meta: [{ title: "Counsellor capacity — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Early warning & care"
        title="Counsellor capacity"
        subtitle="Are your counsellors set up to meet demand? Aggregate workload, utilisation, and wait-time signals."
      />
      <ComingNext
        promptNumber={9}
        title="Cell utilisation and demand"
        whatItWillShow="A rolling view of counsellor utilisation, session backlog and demand forecasts to support staffing decisions ahead of exam weeks."
      />
    </>
  ),
});
