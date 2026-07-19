import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/college/primitives";
import { FilterBar } from "@/components/college/dashboard/FilterBar";
import {
  InstitutionalWellbeingIndex,
  ActiveEngagementTile,
  SafetyPulseTile,
  MoodTrendChart,
  TopConcernsCloud,
  DepartmentHeatmap,
  SessionsDeliveredTile,
  AverageWaitTile,
  ProgramImpactStrip,
} from "@/components/college/dashboard/tiles";

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
        subtitle="A single-glance read of your institution's wellbeing state — mood momentum, safety pulse, and where counsellor attention is landing this week. Every tile enforces k-anonymity ≥ 10."
      />
      <FilterBar />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <InstitutionalWellbeingIndex />
        <ActiveEngagementTile />
        <SafetyPulseTile />
        <MoodTrendChart />
        <TopConcernsCloud />
        <DepartmentHeatmap />
        <SessionsDeliveredTile />
        <AverageWaitTile />
        <ProgramImpactStrip />
      </div>
    </>
  );
}
