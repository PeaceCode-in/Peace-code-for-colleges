import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingNext } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/admin/access")({
  head: () => ({ meta: [{ title: "Access & roles — PeaceCode for Colleges" }] }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Access & roles"
        subtitle="Who at your institution can see what — with role-based scopes for counsellors, deans and executive readers."
      />
      <ComingNext
        promptNumber={12}
        title="Role-based access controls"
        whatItWillShow="Invite, revoke and scope institutional admins with least-privilege roles: read-only, cohort-scoped, and full-executive views."
      />
    </>
  ),
});
