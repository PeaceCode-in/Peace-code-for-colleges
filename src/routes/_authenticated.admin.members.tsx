import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MembersTable } from "@/components/admin/MembersTable";
import { InvitePanel } from "@/components/admin/InvitePanel";
import { EthicsFooter } from "@/components/early-warning/EthicsFooter";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/members")({
  head: () => ({ meta: [{ title: "Members — PeaceCode for Colleges" }] }),
  component: MembersPage,
});

function MembersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px]"
          style={{ background: "var(--pc-primary)", color: "white" }}
        >
          <UserPlus className="w-3.5 h-3.5" /> Invite admin
        </button>
      </div>
      <MembersTable />
      <EthicsFooter />
      <InvitePanel open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
