import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/reports/benchmarks")({
  head: () => ({ meta: [{ title: "Peer benchmarks — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Institutional reporting"
        title="Peer benchmarks"
        subtitle="How your institution compares to peer colleges of similar size and discipline mix — anonymised on both sides."
      />
      <ComingNext
        promptNumber={11}
        title="Anonymised peer comparisons"
        whatItWillShow="Your institution's key metrics against a peer group — with confidence intervals and peer selection controls that never reveal individual colleges."
      />
    </>
  ),
});
