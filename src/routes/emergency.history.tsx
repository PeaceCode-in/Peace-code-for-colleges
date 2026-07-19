import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page, BackBar, PageTitle, Card, Chip } from "@/components/emergency/primitives";
import { loadHistory, clearHistory, loadContacts, type EmergencyEvent, type Contact } from "@/lib/emergency-store";
import { palette } from "@/components/AppShell";
import { Trash2 } from "lucide-react";

const { border, muted, ink, primary, soft } = palette;

function fmt(ts: number) {
  const d = new Date(ts);
  const day = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { day, time };
}

function History() {
  const [items, setItems] = useState<EmergencyEvent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  useEffect(() => { setItems(loadHistory()); setContacts(loadContacts()); }, []);
  const nameOf = (id: string) => contacts.find((c) => c.id === id)?.name ?? "Someone";

  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Emergency history" title="What helped, and when." sub="A private record of moments you supported yourself. Only you can see this." />

      {items.length > 0 && (
        <div className="flex justify-end mb-4">
          <button onClick={() => { if (confirm("Clear all history? This can't be undone.")) { clearHistory(); setItems([]); } }}
            className="text-[11.5px] inline-flex items-center gap-1.5" style={{ color: "#c14545" }}>
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <Card><div className="text-[13px]" style={{ color: muted }}>Nothing recorded yet. When you use a calm tool or reach out, it'll quietly show up here.</div></Card>
      ) : (
        <ol className="relative pl-6">
          <div className="absolute left-2 top-1 bottom-1 w-px" style={{ background: border }} />
          {items.map((e) => {
            const { day, time } = fmt(e.ts);
            return (
              <li key={e.id} className="relative mb-4">
                <span className="absolute -left-[18px] top-2 w-3 h-3 rounded-full" style={{ background: soft, border: `2px solid ${primary}` }} />
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10.5px] tracking-[0.22em] uppercase" style={{ color: muted }}>{day}</div>
                    <div className="text-[11px]" style={{ color: muted }}>{time}</div>
                  </div>
                  {e.feeling && <div className="font-serif text-[15px]" style={{ color: ink }}>Feeling: {e.feeling}</div>}
                  {e.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {e.actions.map((a, i) => <Chip key={i} tone="warm">{a}</Chip>)}
                    </div>
                  )}
                  {e.contactsCalled.length > 0 && (
                    <div className="text-[12px] mt-2" style={{ color: muted }}>
                      Reached: {e.contactsCalled.map(nameOf).join(", ")}
                    </div>
                  )}
                  {e.outcome && <div className="mt-2"><Chip>{e.outcome}</Chip></div>}
                  {e.note && <p className="text-[12.5px] mt-2" style={{ color: muted }}>{e.note}</p>}
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </Page>
  );
}

export const Route = createFileRoute("/emergency/history")({ component: History });
