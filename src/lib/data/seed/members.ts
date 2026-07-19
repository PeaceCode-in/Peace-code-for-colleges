export function seedMembers(): Array<{
  id: string;
  maskedEmail: string;
  role: "admin" | "viewer";
  status: "active" | "invited" | "disabled";
  lastActiveISO: string | null;
}> {
  return [
    { id: "mem-1", maskedEmail: "an•••@iitb.ac.in", role: "admin",  status: "active",  lastActiveISO: "2026-07-19T09:12:00Z" },
    { id: "mem-2", maskedEmail: "ka•••@iitb.ac.in", role: "admin",  status: "active",  lastActiveISO: "2026-07-18T16:44:00Z" },
    { id: "mem-3", maskedEmail: "pr•••@iitb.ac.in", role: "viewer", status: "active",  lastActiveISO: "2026-07-17T11:20:00Z" },
    { id: "mem-4", maskedEmail: "sh•••@iitb.ac.in", role: "viewer", status: "invited", lastActiveISO: null },
    { id: "mem-5", maskedEmail: "ra•••@iitb.ac.in", role: "admin",  status: "disabled", lastActiveISO: "2026-06-02T08:00:00Z" },
  ];
}
