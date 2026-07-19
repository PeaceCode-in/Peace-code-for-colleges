import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/cohorts/demographics")({
  head: () => ({ meta: [{ title: "Demographics — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Cohort insights"
        title="Demographics"
        subtitle="Aggregate demographic splits — always k-anonymised, never identifying — for equity-aware planning."
      />
      <ComingNext
        promptNumber={4}
        title="Demographic wellbeing splits"
        whatItWillShow="Aggregate breakdowns by gender, hostel/day-scholar status, scholarship category and first-generation status. Any cell below k=10 is hidden."
      />
    </>
  ),
});
