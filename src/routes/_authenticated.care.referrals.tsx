import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/care/referrals")({
  head: () => ({ meta: [{ title: "Referral pipeline — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Early warning & care"
        title="Referral pipeline"
        subtitle="The volume and status of self-referrals into your counselling cell — never named, always counted."
      />
      <ComingNext
        promptNumber={8}
        title="Anonymous referral pipeline"
        whatItWillShow="A funnel from self-referral through triage to first appointment, with median wait times and aggregate outcomes by term."
      />
    </>
  ),
});
