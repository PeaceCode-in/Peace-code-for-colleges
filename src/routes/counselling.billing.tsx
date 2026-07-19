import { createFileRoute } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip, rupee, fmtDay } from "./counselling";
import { listInvoices, getExpert, upcomingAppointments } from "@/lib/counselling-store";
import { Download, Receipt } from "lucide-react";

export const Route = createFileRoute("/counselling/billing")({
  component: Billing,
});

function Billing() {
  const { ink, muted, primary, surface, surface2, border, soft } = palette;
  const invoices = listInvoices();
  const upcoming = upcomingAppointments().filter(a => !a.paid);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <div className="mb-4">
        <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Billing</div>
        <h1 className="font-serif text-[26px]" style={{ color: ink }}>Payments & receipts</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <Card><div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Paid this year</div><div className="font-serif text-[26px] mt-1" style={{ color: ink }}>{rupee(totalPaid)}</div></Card>
        <Card><div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Invoices</div><div className="font-serif text-[26px] mt-1" style={{ color: ink }}>{invoices.length}</div></Card>
        <Card><div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Upcoming payments</div><div className="font-serif text-[26px] mt-1" style={{ color: ink }}>{upcoming.length}</div></Card>
      </div>

      {upcoming.length > 0 && (
        <Card className="mb-4" style={{ background: soft }}>
          <div className="font-serif text-[17px] mb-2" style={{ color: ink }}>Upcoming payments</div>
          <div className="space-y-1.5">
            {upcoming.map(a => {
              const e = getExpert(a.expertId);
              return (
                <div key={a.id} className="flex items-center justify-between text-[13.5px]" style={{ color: ink }}>
                  <span>{e?.name} · {fmtDay(a.scheduledFor)}</span>
                  <span>{rupee(a.fee)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="font-serif text-[17px]" style={{ color: ink }}>Payment history</div>
          <button
            onClick={() => {
              const header = "Date,Counsellor,Method,Amount (INR),Status,Invoice ID";
              const rows = invoices.map(i => {
                const e = i.expertId ? getExpert(i.expertId) : null;
                return [new Date(i.when).toISOString(), e?.name ?? "Session", i.method, i.amount, i.status, i.id].join(",");
              });
              const csv = [header, ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `peacecode-invoices-${new Date().toISOString().slice(0,10)}.csv`;
              document.body.appendChild(a); a.click(); a.remove();
              URL.revokeObjectURL(url);
            }}
            className="text-[12.5px] inline-flex items-center gap-1" style={{ color: muted }}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
        {invoices.length === 0 ? (
          <p className="text-[13px]" style={{ color: muted }}>No invoices yet.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map(i => {
              const e = i.expertId ? getExpert(i.expertId) : null;
              return (
                <div key={i.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: surface2, border: `1px solid ${border}` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none" style={{ background: surface, color: primary }}><Receipt className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] truncate" style={{ color: ink }}>{e?.name ?? "Session"}</div>
                    <div className="text-[11.5px]" style={{ color: muted }}>{new Date(i.when).toLocaleString()} · {i.method}</div>
                  </div>
                  <Chip tone={i.status === "paid" ? "success" : i.status === "refunded" ? "info" : "warn"}>{i.status}</Chip>
                  <div className="font-serif text-[15px]" style={{ color: ink }}>{rupee(i.amount)}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
