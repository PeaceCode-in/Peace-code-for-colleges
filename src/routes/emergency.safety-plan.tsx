import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page, BackBar, PageTitle, Card, Field, TextInput, PrimaryBtn } from "@/components/emergency/primitives";
import { loadPlan, savePlan, loadContacts, type SafetyPlan, type Contact } from "@/lib/emergency-store";
import { palette } from "@/components/AppShell";
import { Plus, X, Save } from "lucide-react";

const { border, muted, ink, surface2, primary, soft } = palette;

const SECTIONS: { key: keyof Omit<SafetyPlan, "updatedAt" | "peopleToCall" | "breathingFavourite">; label: string; hint: string }[] = [
  { key: "warningSigns",       label: "Warning signs",         hint: "How does the storm start? Racing heart, silence, staying in bed…" },
  { key: "triggers",           label: "Personal triggers",     hint: "Situations, people, times of day that tend to be harder." },
  { key: "helps",              label: "Things that help",      hint: "A walk, a shower, a call, water, music, journaling." },
  { key: "safePlaces",         label: "Safe places",           hint: "A room, a friend's house, a park, a café." },
  { key: "reasonsToLive",      label: "Reasons to keep going", hint: "Small, honest ones. A pet, a promise, a chai." },
  { key: "favouriteMusic",     label: "Favourite music",       hint: "Songs that hold you." },
  { key: "favouritePhotos",    label: "Favourite photos",      hint: "Add captions or descriptions — you can save real images in the Hope Box." },
  { key: "groundingActivities", label: "Grounding activities", hint: "Cold water on wrists, naming five colours, box breathing." },
];

function useList(section: keyof Omit<SafetyPlan, "updatedAt" | "peopleToCall" | "breathingFavourite">, plan: SafetyPlan, set: (p: SafetyPlan) => void) {
  const [draft, setDraft] = useState("");
  const items = plan[section] as string[];
  const add = () => { if (!draft.trim()) return; set({ ...plan, [section]: [...items, draft.trim()] }); setDraft(""); };
  const del = (i: number) => set({ ...plan, [section]: items.filter((_, idx) => idx !== i) });
  return { draft, setDraft, items, add, del };
}

function Section({ sec, plan, set }: {
  sec: typeof SECTIONS[number]; plan: SafetyPlan; set: (p: SafetyPlan) => void;
}) {
  const { draft, setDraft, items, add, del } = useList(sec.key, plan, set);
  return (
    <Card>
      <div className="text-[10.5px] tracking-[0.22em] uppercase" style={{ color: muted }}>{sec.label}</div>
      <p className="text-[12px] mt-1" style={{ color: muted }}>{sec.hint}</p>
      <div className="mt-3 flex gap-2">
        <TextInput value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add an item…" />
        <button onClick={add} className="rounded-full h-11 w-11 flex items-center justify-center shrink-0" style={{ background: ink, color: "var(--pc-bg)" }}><Plus className="w-4 h-4"/></button>
      </div>
      {items.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <li key={i} className="rounded-full h-9 pl-3 pr-1 flex items-center gap-1.5 text-[12px]" style={{ background: soft, color: primary }}>
              {it}
              <button onClick={() => del(i)} className="w-6 h-6 rounded-full flex items-center justify-center opacity-70 hover:opacity-100" aria-label={`remove ${it}`}><X className="w-3 h-3"/></button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function People({ plan, set, contacts }: { plan: SafetyPlan; set: (p: SafetyPlan) => void; contacts: Contact[] }) {
  const toggle = (id: string) => set({ ...plan, peopleToCall: plan.peopleToCall.includes(id) ? plan.peopleToCall.filter((x) => x !== id) : [...plan.peopleToCall, id] });
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10.5px] tracking-[0.22em] uppercase" style={{ color: muted }}>People I can call</div>
          <p className="text-[12px] mt-1" style={{ color: muted }}>Pick from your trusted contacts. Even one is enough.</p>
        </div>
        <Link to="/emergency/contacts" className="text-[11px]" style={{ color: primary }}>Manage</Link>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {contacts.length === 0 && <span className="text-[12px]" style={{ color: muted }}>No contacts added yet.</span>}
        {contacts.map((c) => {
          const on = plan.peopleToCall.includes(c.id);
          return (
            <button key={c.id} onClick={() => toggle(c.id)}
              className="rounded-full h-9 px-3 text-[11.5px] flex items-center gap-1.5"
              style={{ background: on ? soft : surface2, color: on ? primary : muted, border: `1px solid ${on ? primary : border}` }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "var(--pc-surface)", color: ink }}>{(c.initials || c.name[0] || "?").toUpperCase()}</span>
              {c.name}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Plan() {
  const [plan, setPlan] = useState<SafetyPlan | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setPlan(loadPlan()); setContacts(loadContacts()); }, []);
  if (!plan) return null;

  const save = () => { savePlan(plan); setSaved(true); setTimeout(() => setSaved(false), 1400); };

  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Safety plan" title="A short letter to your future self." sub="Fill only what you want. You can come back and edit anytime." />

      <div className="flex justify-end mb-4">
        <PrimaryBtn onClick={save}><Save className="w-3.5 h-3.5"/> {saved ? "Saved" : "Save plan"}</PrimaryBtn>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {SECTIONS.map((sec) => <Section key={sec.key} sec={sec} plan={plan} set={setPlan} />)}
        <People plan={plan} set={setPlan} contacts={contacts} />
        <Card>
          <div className="text-[10.5px] tracking-[0.22em] uppercase" style={{ color: muted }}>Favourite breathing</div>
          <p className="text-[12px] mt-1" style={{ color: muted }}>Which rhythm helps you most? Try a few in the breathing library.</p>
          <Field label="Preferred technique">
            <TextInput value={plan.breathingFavourite ?? ""} onChange={(e) => setPlan({ ...plan, breathingFavourite: e.target.value })} placeholder="Box breathing, 4-7-8, coherent, etc." />
          </Field>
          <div className="mt-3 flex gap-2">
            <Link to="/breathe" className="rounded-full h-10 px-4 text-[11.5px] flex items-center" style={{ background: surface2, border: `1px solid ${border}` }}>Open breathing</Link>
            <Link to="/peacebot" className="rounded-full h-10 px-4 text-[11.5px] flex items-center" style={{ background: surface2, border: `1px solid ${border}` }}>Talk to PeaceBot</Link>
          </div>
        </Card>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/safety-plan")({ component: Plan });
