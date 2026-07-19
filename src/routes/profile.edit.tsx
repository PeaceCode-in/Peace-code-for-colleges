import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, Undo2, Eye, Trash2, X, Plus } from "lucide-react";
import { loadProfile, updateProfile, THEMES, type Profile } from "@/lib/profile-store";
import { surface, surface2, border, ink, muted, primary, Panel, SectionLabel, Toasts, pushToast } from "@/components/profile/primitives";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({ meta: [{ title: "Edit profile · PeaceCode" }] }),
  component: EditProfile,
});

function EditProfile() {
  const [p, setP] = useState<Profile>(loadProfile());
  const [original] = useState<Profile>(loadProfile());
  const [interestDraft, setInterestDraft] = useState("");
  const nav = useNavigate();

  const dirty = JSON.stringify(p) !== JSON.stringify(original);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((prev) => ({ ...prev, [k]: v }));

  const save = () => { updateProfile(p); pushToast("Profile saved"); nav({ to: "/profile" }); };
  const discard = () => { setP(original); pushToast("Changes discarded"); };
  const upload = (key: "photo" | "cover") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => set(key, r.result as string);
    r.readAsDataURL(f);
  };

  const addInterest = () => {
    const t = interestDraft.trim();
    if (!t) return;
    set("interests", [...p.interests, { id: `i-${Date.now()}`, label: t }]);
    setInterestDraft("");
  };

  return (
    <div className="px-4 lg:pl-32 lg:pr-10 py-8 pb-32 lg:pb-16 max-w-4xl">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link to="/profile" className="inline-flex items-center gap-2 text-[12px]" style={{ color: muted }}>
          <ArrowLeft className="w-3.5 h-3.5"/> Back to profile
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/profile" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11.5px]" style={{ background: surface2, color: ink }}>
            <Eye className="w-3.5 h-3.5"/> Preview
          </Link>
          <button onClick={discard} disabled={!dirty}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11.5px] disabled:opacity-40"
            style={{ background: surface2, color: ink }}>
            <Undo2 className="w-3.5 h-3.5"/> Discard
          </button>
          <button onClick={save}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11.5px]"
            style={{ background: ink, color: "var(--pc-bg)" }}>
            <Save className="w-3.5 h-3.5"/> Save
          </button>
        </div>
      </div>

      <h1 className="font-serif text-[30px] leading-tight mb-6" style={{ color: ink }}>Edit profile</h1>

      {/* Photos */}
      <Panel className="!p-5 mb-4">
        <SectionLabel>Photos</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-5">
          <PhotoBox label="Profile photo" src={p.photo} onFile={upload("photo")} onClear={() => set("photo", undefined)} circle/>
          <PhotoBox label="Cover" src={p.cover} onFile={upload("cover")} onClear={() => set("cover", undefined)}/>
        </div>
      </Panel>

      <Panel className="!p-5 mb-4">
        <SectionLabel>Identity</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Display name" v={p.displayName} onChange={(v) => set("displayName", v)}/>
          <Field label="Preferred name" v={p.preferredName} onChange={(v) => set("preferredName", v)}/>
          <Field label="Username" v={p.username} onChange={(v) => set("username", v)}/>
          <Field label="Pronouns" v={p.pronouns} onChange={(v) => set("pronouns", v)}/>
          <Field label="Birthday" v={p.birthday} type="date" onChange={(v) => set("birthday", v)}/>
          <Field label="Location" v={p.location} onChange={(v) => set("location", v)}/>
          <Field label="Timezone" v={p.timezone} onChange={(v) => set("timezone", v)}/>
          <Field label="Languages (comma separated)" v={p.languages.join(", ")} onChange={(v) => set("languages", v.split(",").map((x) => x.trim()).filter(Boolean))}/>
        </div>
        <div className="mt-4">
          <label className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>Short bio</label>
          <input value={p.bio} maxLength={80} onChange={(e) => set("bio", e.target.value)}
            className="w-full mt-1 px-3 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ background: surface2, color: ink }} />
          <div className="text-[10px] mt-1 text-right" style={{ color: muted }}>{p.bio.length}/80</div>
        </div>
        <div className="mt-3">
          <label className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>About me</label>
          <textarea value={p.about} maxLength={600} onChange={(e) => set("about", e.target.value)} rows={5}
            className="w-full mt-1 px-3 py-2.5 rounded-xl text-[13px] outline-none resize-y"
            style={{ background: surface2, color: ink }} />
          <div className="text-[10px] mt-1 text-right" style={{ color: muted }}>{p.about.length}/600</div>
        </div>
      </Panel>

      <Panel className="!p-5 mb-4">
        <SectionLabel>Academic</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="College" v={p.college} onChange={(v) => set("college", v)}/>
          <Field label="Department" v={p.department} onChange={(v) => set("department", v)}/>
          <Field label="Degree" v={p.degree} onChange={(v) => set("degree", v)}/>
          <Field label="Semester" v={p.semester} onChange={(v) => set("semester", v)}/>
          <Field label="Year" v={p.year} onChange={(v) => set("year", v)}/>
          <Field label="Student ID" v={p.studentId} onChange={(v) => set("studentId", v)}/>
        </div>
      </Panel>

      <Panel className="!p-5 mb-4">
        <SectionLabel>Links</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Website" v={p.website} onChange={(v) => set("website", v)} placeholder="https://"/>
          <Field label="LinkedIn" v={p.linkedin} onChange={(v) => set("linkedin", v)}/>
          <Field label="GitHub" v={p.github} onChange={(v) => set("github", v)}/>
          <Field label="Portfolio" v={p.portfolio} onChange={(v) => set("portfolio", v)}/>
          <Field label="Instagram" v={p.instagram} onChange={(v) => set("instagram", v)}/>
        </div>
      </Panel>

      <Panel className="!p-5 mb-4">
        <SectionLabel>Interests</SectionLabel>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {p.interests.map((i) => (
            <button key={i.id} onClick={() => set("interests", p.interests.filter((x) => x.id !== i.id))}
              className="group px-3 py-1 rounded-full text-[11.5px] flex items-center gap-1.5"
              style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
              {i.label} <X className="w-3 h-3 opacity-50 group-hover:opacity-100"/>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={interestDraft} onChange={(e) => setInterestDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
            placeholder="Add an interest…"
            className="flex-1 px-3 py-2 rounded-xl text-[12.5px] outline-none"
            style={{ background: surface2, color: ink }}/>
          <button onClick={addInterest} className="px-3 py-2 rounded-xl text-[12px] flex items-center gap-1" style={{ background: primary, color: "#fff" }}><Plus className="w-3.5 h-3.5"/> Add</button>
        </div>
      </Panel>

      <Panel className="!p-5 mb-4">
        <SectionLabel>Theme</SectionLabel>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((k) => (
            <button key={k} onClick={() => set("theme", k)}
              className="rounded-2xl overflow-hidden text-left transition hover:-translate-y-0.5"
              style={{ border: `2px solid ${p.theme === k ? primary : border}` }}>
              <div className="h-12" style={{ background: `linear-gradient(135deg, ${THEMES[k].from}, ${THEMES[k].to})` }}/>
              <div className="px-2 py-1.5 text-[10.5px]" style={{ background: surface, color: ink }}>{THEMES[k].label}</div>
            </button>
          ))}
        </div>
        <Link to="/profile/themes" className="mt-3 inline-block text-[11.5px]" style={{ color: primary }}>Explore all themes →</Link>
      </Panel>

      <Panel className="!p-5 mb-8">
        <SectionLabel>Emergency contact</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name" v={p.emergencyName} onChange={(v) => set("emergencyName", v)}/>
          <Field label="Phone" v={p.emergencyPhone} onChange={(v) => set("emergencyPhone", v)}/>
        </div>
        <p className="text-[11px] mt-2" style={{ color: muted }}>Kept private — only shown to you and used for the SOS button on the Emergency page.</p>
      </Panel>

      <Toasts/>
    </div>
  );
}

function Field({ label, v, onChange, type = "text", placeholder }: { label: string; v: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>{label}</span>
      <input type={type} value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full mt-1 px-3 py-2.5 rounded-xl text-[13px] outline-none"
        style={{ background: surface2, color: ink }}/>
    </label>
  );
}

function PhotoBox({ label, src, onFile, onClear, circle }: { label: string; src?: string; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void; onClear: () => void; circle?: boolean }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.28em] uppercase mb-2" style={{ color: muted }}>{label}</div>
      <div className={`relative overflow-hidden ${circle ? "rounded-full w-32 h-32" : "rounded-2xl w-full h-32"}`}
           style={{ background: surface2, border: `1px dashed ${border}` }}>
        {src ? <img src={src} alt="" className="w-full h-full object-cover"/> : (
          <div className="w-full h-full flex items-center justify-center text-[11px]" style={{ color: muted }}>Drag or click to upload</div>
        )}
        <label className="absolute inset-0 cursor-pointer">
          <input type="file" accept="image/*" onChange={onFile} className="hidden"/>
        </label>
        {src && (
          <button onClick={onClear} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}><Trash2 className="w-3 h-3"/></button>
        )}
      </div>
    </div>
  );
}
