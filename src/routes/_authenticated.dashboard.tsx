import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Executive overview — PeaceCode for Colleges" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Executive overview"
        subtitle="A single-glance read of your institution's wellbeing state — attendance of care, mood momentum, and where your counsellors' attention is most needed today."
      />
      <ComingNext
        promptNumber={2}
        title="Your institution at a glance"
        whatItWillShow="Live KPI tiles, mood-trend sparkline, top three risk cohorts (all k-anonymised), and the day's referral inflow. Every tile respects the aggregate-only guardrail."
      />
    </>
  );
}
