import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/cohorts/compare")({
  head: () => ({ meta: [{ title: "Compare cohorts — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Cohort insights"
        title="Compare cohorts"
        subtitle="Side-by-side comparison of any two cohorts across every wellbeing metric — an evidence workbench for your counselling cell."
      />
      <ComingNext
        promptNumber={5}
        title="A/B cohort comparator"
        whatItWillShow="Pick two cohorts (department × year × demographic) and see a side-by-side diff of mood, screening, engagement and referral metrics with statistical-significance callouts."
      />
    </>
  ),
});
