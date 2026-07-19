import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/departments")({
  head: () => ({ meta: [{ title: "Departments — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Cohort insights"
        title="Departments"
        subtitle="How each faculty and department is doing — engagement, screening participation, and average wellbeing index."
      />
      <ComingNext
        promptNumber={3}
        title="Department-by-department wellbeing"
        whatItWillShow="A sortable table of every department with anonymised participation, mood index, and referral rate. Drill into any department to see term-over-term shifts."
      />
    </>
  ),
});
