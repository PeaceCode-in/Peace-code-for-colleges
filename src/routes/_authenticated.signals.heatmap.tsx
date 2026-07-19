import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/signals/heatmap")({
  head: () => ({ meta: [{ title: "Wellness heatmap — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Wellbeing signals"
        title="Wellness heatmap"
        subtitle="A calendar heatmap of your institution's wellbeing index — spot the weeks that need proactive care."
      />
      <ComingNext
        promptNumber={7}
        title="Institution-wide wellbeing heatmap"
        whatItWillShow="A day-by-day heatmap of the composite wellbeing score across the term, with hover breakdowns and event annotations."
      />
    </>
  ),
});
