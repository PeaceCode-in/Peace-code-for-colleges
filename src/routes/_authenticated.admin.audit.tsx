import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({ meta: [{ title: "Audit log — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        subtitle="A tamper-evident record of every administrator action — who viewed which cohort, when, and from where."
      />
      <ComingNext
        promptNumber={12}
        title="Institutional audit trail"
        whatItWillShow="A searchable, exportable audit log of every dashboard view, export and access change. Supports DPDP and internal compliance reviews."
      />
    </>
  ),
});
