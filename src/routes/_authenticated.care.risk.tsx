import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/care/risk")({
  head: () => ({ meta: [{ title: "Risk signals — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Early warning & care"
        title="Risk signals"
        subtitle="Cohort-level signals that suggest a group needs proactive outreach — never individual student flags."
      />
      <ComingNext
        promptNumber={8}
        title="Early-warning cohort signals"
        whatItWillShow="Cohorts (never individuals) whose composite risk index crossed a threshold this week, with the contributing metrics broken out."
      />
    </>
  ),
});
