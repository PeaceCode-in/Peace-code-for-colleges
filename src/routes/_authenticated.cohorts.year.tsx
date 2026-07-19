import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/cohorts/year")({
  head: () => ({ meta: [{ title: "Year & program — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Cohort insights"
        title="Year & program"
        subtitle="Wellbeing patterns sliced by year of study and program, so you can see how first-years compare to seniors."
      />
      <ComingNext
        promptNumber={4}
        title="Year-of-study and program breakdown"
        whatItWillShow="Anonymised distributions across every year × program combination, with a small-multiples chart of mood and engagement over the current term."
      />
    </>
  ),
});
