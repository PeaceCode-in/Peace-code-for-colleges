import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/signals/screenings")({
  head: () => ({ meta: [{ title: "Screening outcomes — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Wellbeing signals"
        title="Screening outcomes"
        subtitle="Aggregate PHQ-9, GAD-7 and PSS distributions from the students who opted into screening this term."
      />
      <ComingNext
        promptNumber={6}
        title="Validated screening distributions"
        whatItWillShow="Population-level distributions for each screener with severity bands, participation rates, and term-over-term deltas. No student-level data is ever shown."
      />
    </>
  ),
});
