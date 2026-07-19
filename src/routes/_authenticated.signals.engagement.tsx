import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/signals/engagement")({
  head: () => ({ meta: [{ title: "Engagement rhythm — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Wellbeing signals"
        title="Engagement rhythm"
        subtitle="How students are engaging with the PeaceCode Companion — session frequency, streaks, and drop-off patterns."
      />
      <ComingNext
        promptNumber={7}
        title="Companion engagement over the week"
        whatItWillShow="A weekly rhythm chart of active students, journal entries, breathing sessions and PeaceBot conversations — filterable by department, always aggregate."
      />
    </>
  ),
});
