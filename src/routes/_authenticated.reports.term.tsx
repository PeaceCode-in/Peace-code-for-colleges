import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/reports/term")({
  head: () => ({ meta: [{ title: "Term reports — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Institutional reporting"
        title="Term reports"
        subtitle="Auto-generated end-of-term wellbeing reports ready to share with your board or student affairs office."
      />
      <ComingNext
        promptNumber={10}
        title="End-of-term wellbeing report"
        whatItWillShow="A shareable, DPDP-safe PDF summarising the term — trends, highlights, cohort deltas, and evidence-based recommendations."
      />
    </>
  ),
});
