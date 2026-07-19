import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/signals/mood")({
  head: () => ({ meta: [{ title: "Mood trends — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Wellbeing signals"
        title="Mood trends"
        subtitle="How your institution's aggregate mood has moved across the term — with markers for exam weeks, festivals, and known stressors."
      />
      <ComingNext
        promptNumber={6}
        title="Daily mood index over time"
        whatItWillShow="A term-long mood line with confidence bands, annotated with academic-calendar events. Filter by department, year, or hostel; always aggregate."
      />
    </>
  ),
});
