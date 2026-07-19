import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell, Section, Row, TextField, TextArea, Chip, PrimaryButton, GhostButton, DangerButton } from "@/components/settings/primitives";
import { useSettings } from "@/lib/settings-store";
import { palette } from "@/components/AppShell";
import { Camera, Trash2, Upload } from "lucide-react";
import { useRef } from "react";

export const Route = createFileRoute("/settings/profile")({
  head: () => ({ meta: [{ title: "Profile — PeaceCode Settings" }] }),
  component: ProfilePage,
});

const { primary, muted, ink } = palette;

const INTERESTS = ["mindfulness","reading","music","sport","art","coding","photography","cooking","travel","writing","gaming","volunteering"];

function ProfilePage() {
  const [s, update] = useSettings();
  const p = s.profile;
  const fileInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) => update((x) => ({ ...x, profile: { ...x.profile, [k]: v } }), `Profile · ${String(k)} updated`);
  const toggleInterest = (i: string) => update((x) => ({ ...x, profile: { ...x.profile, interests: x.profile.interests.includes(i) ? x.profile.interests.filter((v) => v !== i) : [...x.profile.interests, i] } }), `Profile · interests updated`);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => set("photo", String(r.result)); r.readAsDataURL(f);
  };

  const exportProfile = () => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "peacecode-profile.json"; a.click();
  };

  return (
    <SettingsShell title="Profile" description="How PeaceCode addresses you across the app.">
      <Section title="Photo">
        <div className="px-5 py-5 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center font-serif text-[26px] overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, var(--pc-lavender))`, color: "#fff" }}>
            {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : (p.preferredName || "K").slice(0, 1)}
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={onUpload} />
            <PrimaryButton onClick={() => fileInput.current?.click()}><span className="inline-flex items-center gap-1"><Upload className="w-3 h-3" /> Upload new</span></PrimaryButton>
            {p.photo && <DangerButton onClick={() => set("photo", undefined)}><span className="inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</span></DangerButton>}
          </div>
        </div>
      </Section>

      <Section title="Identity">
        <Row label="Full name"><TextField value={p.fullName} onChange={(v) => set("fullName", v)} /></Row>
        <Row label="Preferred name" hint="What PeaceBot calls you."><TextField value={p.preferredName} onChange={(v) => set("preferredName", v)} /></Row>
        <Row label="Pronouns" hint="Shown only to you and buddies you connect with."><TextField value={p.pronouns} onChange={(v) => set("pronouns", v)} placeholder="she/her, they/them…" /></Row>
        <Row label="Birthday"><TextField type="date" value={p.birthday} onChange={(v) => set("birthday", v)} /></Row>
      </Section>

      <Section title="Academic">
        <Row label="Student ID"><TextField value={p.studentId} onChange={(v) => set("studentId", v)} /></Row>
        <Row label="College"><TextField value={p.college} onChange={(v) => set("college", v)} /></Row>
        <Row label="Degree"><TextField value={p.degree} onChange={(v) => set("degree", v)} /></Row>
        <Row label="Semester"><TextField value={p.semester} onChange={(v) => set("semester", v)} /></Row>
      </Section>

      <Section title="Locale">
        <Row label="Timezone"><TextField value={p.timezone} onChange={(v) => set("timezone", v)} /></Row>
        <Row label="Language"><TextField value={p.language} onChange={(v) => set("language", v)} /></Row>
      </Section>

      <Section title="About you">
        <Row label="Bio"><div className="mt-2"><TextArea value={p.bio} onChange={(v) => set("bio", v)} placeholder="a sentence about you — no pressure." /></div></Row>
        <Row label="Mental wellness goal"><div className="mt-2"><TextArea value={p.wellnessGoal} onChange={(v) => set("wellnessGoal", v)} placeholder="one small thing you're working toward." /></div></Row>
        <Row label="Interests" hint="Helps buddy matching and resource suggestions.">
          <div className="mt-3 flex flex-wrap gap-2">
            {INTERESTS.map((i) => <Chip key={i} label={i} active={p.interests.includes(i)} onClick={() => toggleInterest(i)} />)}
          </div>
        </Row>
      </Section>

      <Section title="Emergency contact" hint="Only used if you press the SOS button.">
        <Row label="Name"><TextField value={p.emergencyName} onChange={(v) => set("emergencyName", v)} /></Row>
        <Row label="Phone"><TextField value={p.emergencyPhone} onChange={(v) => set("emergencyPhone", v)} /></Row>
      </Section>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <GhostButton onClick={exportProfile}>Export profile</GhostButton>
        <span className="text-[11px]" style={{ color: muted }}>Saved automatically as you type.</span>
      </div>
      <p className="text-[11px] mt-4" style={{ color: ink, opacity: 0.4 }}>Camera icon reserved for future in-app capture.<Camera className="inline w-3 h-3 ml-1 opacity-0" /></p>
    </SettingsShell>
  );
}
