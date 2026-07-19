import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page, BackBar, PageTitle, Card, Chip, Field, TextInput, PrimaryBtn, GhostBtn } from "@/components/emergency/primitives";
import { loadContacts, upsertContact, removeContact, setDefaultContact, RELATIONSHIPS, type Contact } from "@/lib/emergency-store";
import { palette } from "@/components/AppShell";
import { Phone, MessageSquare, MapPin, Star, Pencil, Trash2, Plus, X } from "lucide-react";

const { border, muted, ink, primary, soft, surface2 } = palette;

function ContactsPage() {
  const [list, setList] = useState<Contact[]>([]);
  const [editing, setEditing] = useState<Contact | null>(null);
  const refresh = () => setList(loadContacts());
  useEffect(refresh, []);

  const openNew = () => setEditing({ id: "c_" + Date.now(), name: "", relationship: RELATIONSHIPS[0], initials: "" });

  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Trusted contacts" title="The people you can lean on." sub="Add anyone — a parent, sibling, roommate, mentor. One tap will call or message them." />

      <div className="flex justify-end mb-4">
        <PrimaryBtn onClick={openNew}><Plus className="w-3.5 h-3.5"/> Add contact</PrimaryBtn>
      </div>

      {list.length === 0 ? (
        <Card><div className="text-[13px]" style={{ color: muted }}>No contacts yet. Add one above to keep them close.</div></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-medium" style={{ background: soft, color: primary }}>
                  {(c.initials || c.name.slice(0, 1)).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-serif text-[17px] truncate">{c.name || "Unnamed"}</div>
                    {c.isDefault && <Chip tone="warm">default</Chip>}
                  </div>
                  <div className="text-[11.5px]" style={{ color: muted }}>{c.relationship}</div>
                  {c.phone && <div className="text-[11.5px] mt-0.5" style={{ color: muted }}>{c.phone}</div>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 mt-4">
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="rounded-xl h-10 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ background: surface2, border: `1px solid ${border}` }}>
                    <Phone className="w-3.5 h-3.5" strokeWidth={1.6}/> Call
                  </a>
                )}
                {c.phone && (
                  <a href={`sms:${c.phone.replace(/\s/g, "")}`} className="rounded-xl h-10 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ background: surface2, border: `1px solid ${border}` }}>
                    <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.6}/> SMS
                  </a>
                )}
                <button className="rounded-xl h-10 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ background: surface2, border: `1px solid ${border}` }} title="Share live location (placeholder)">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.6}/> Share
                </button>
              </div>

              <div className="flex items-center justify-between mt-3">
                <button onClick={() => { setDefaultContact(c.id); refresh(); }} className="text-[11px] inline-flex items-center gap-1" style={{ color: c.isDefault ? primary : muted }}>
                  <Star className="w-3 h-3" fill={c.isDefault ? "currentColor" : "none"} /> {c.isDefault ? "Default" : "Make default"}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(c)} className="text-[11px] inline-flex items-center gap-1" style={{ color: muted }}><Pencil className="w-3 h-3"/> Edit</button>
                  <button onClick={() => { if (confirm(`Remove ${c.name}?`)) { removeContact(c.id); refresh(); } }} className="text-[11px] inline-flex items-center gap-1" style={{ color: "#c14545" }}><Trash2 className="w-3 h-3"/> Remove</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0" style={{ background: "var(--pc-scrim)" }} onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-lg rounded-3xl p-5 sm:p-6" style={{ background: "var(--pc-surface)", border: `1px solid ${border}`, color: ink }}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-serif text-[18px]">{list.find((c) => c.id === editing.id) ? "Edit contact" : "New contact"}</div>
              <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: surface2 }} aria-label="close"><X className="w-4 h-4"/></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name"><TextInput value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, initials: (e.target.value.trim()[0] || "").toUpperCase() })} /></Field>
              <Field label="Relationship">
                <select value={editing.relationship} onChange={(e) => setEditing({ ...editing, relationship: e.target.value })}
                  className="w-full h-11 rounded-2xl px-4 text-[13px] outline-none"
                  style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
                  {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Phone"><TextInput type="tel" value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="+91 ••••• •••••" /></Field>
              <Field label="Email"><TextInput type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="name@example.com" /></Field>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <GhostBtn onClick={() => setEditing(null)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={() => { if (!editing.name.trim()) return; upsertContact(editing); setEditing(null); refresh(); }}>Save</PrimaryBtn>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export const Route = createFileRoute("/emergency/contacts")({ component: ContactsPage });
