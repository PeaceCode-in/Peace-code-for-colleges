import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import { loadPrefs, savePrefs, type Prefs } from "@/lib/peacebot-store";

export const Route = createFileRoute("/peacebot/avatar")({
  head: () => ({ meta: [{ title: "Peace Bot · avatar & style" }] }),
  component: AvatarPage,
});
const { surface, surface2, border, ink, muted, soft } = palette;

const AVATARS: { id: Prefs["avatar"]; title: string; hint: string }[] = [
  { id: "minimal", title: "minimal", hint: "few words, no fluff" },
  { id: "friendly", title: "friendly", hint: "like a close friend" },
  { id: "professional", title: "professional", hint: "calm, thoughtful mentor" },
  { id: "supportive", title: "supportive", hint: "soft, unhurried, poetic" },
  { id: "motivational", title: "motivational", hint: "grounded, encouraging" },
  { id: "calm", title: "calm", hint: "slow, quiet, spacious" },
];

function AvatarPage() {
  const [p, setP] = useState<Prefs | null>(null);
  useEffect(() => setP(loadPrefs()), []);
  if (!p) return null;
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => { const next = { ...p, [k]: v }; setP(next); savePrefs(next); };

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/peacebot" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><ArrowLeft className="w-4 h-4"/></Link>
          <div>
            <div className="text-[10px] tracking-[0.35em] uppercase opacity-50">peace bot</div>
            <h1 className="font-serif text-[36px] leading-tight">avatar & style</h1>
            <p className="text-[13px] mt-1" style={{ color: muted }}>choose how peace speaks with you.</p>
          </div>
        </div>

        <section>
          <Label>companion style</Label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {AVATARS.map((a) => (
              <button key={a.id} onClick={() => set("avatar", a.id)} className="text-left p-5 rounded-2xl relative transition hover:-translate-y-0.5" style={{ background: p.avatar === a.id ? soft : surface, border: `1px solid ${border}` }}>
                {p.avatar === a.id && <Check className="w-4 h-4 absolute top-3 right-3" style={{ color: ink }}/>}
                <div className="text-[15px]" style={{ color: ink }}>{a.title}</div>
                <div className="mt-1 text-[12px]" style={{ color: muted }}>{a.hint}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <Panel title="response length">
            <Row><Pill active={p.length === "short"} onClick={() => set("length", "short")}>short</Pill><Pill active={p.length === "medium"} onClick={() => set("length", "medium")}>medium</Pill><Pill active={p.length === "long"} onClick={() => set("length", "long")}>long</Pill></Row>
          </Panel>
          <Panel title="response style">
            <Row><Pill active={p.style === "poetic"} onClick={() => set("style", "poetic")}>poetic</Pill><Pill active={p.style === "direct"} onClick={() => set("style", "direct")}>direct</Pill><Pill active={p.style === "friendly"} onClick={() => set("style", "friendly")}>friendly</Pill></Row>
          </Panel>
          <Panel title="voice tone">
            <Row><Pill active={p.voice === "soft"} onClick={() => set("voice", "soft")}>soft</Pill><Pill active={p.voice === "warm"} onClick={() => set("voice", "warm")}>warm</Pill><Pill active={p.voice === "clear"} onClick={() => set("voice", "clear")}>clear</Pill></Row>
          </Panel>
          <Panel title="accent">
            <Row><Pill active={p.accent === "in"} onClick={() => set("accent", "in")}>indian</Pill><Pill active={p.accent === "us"} onClick={() => set("accent", "us")}>us</Pill><Pill active={p.accent === "uk"} onClick={() => set("accent", "uk")}>uk</Pill></Row>
          </Panel>
          <Panel title="chat bubble">
            <Row><Pill active={p.bubble === "round"} onClick={() => set("bubble", "round")}>round</Pill><Pill active={p.bubble === "square"} onClick={() => set("bubble", "square")}>square</Pill><Pill active={p.bubble === "flat"} onClick={() => set("bubble", "flat")}>flat</Pill></Row>
          </Panel>
          <Panel title="font size">
            <Row><Pill active={p.fontSize === "s"} onClick={() => set("fontSize", "s")}>small</Pill><Pill active={p.fontSize === "m"} onClick={() => set("fontSize", "m")}>medium</Pill><Pill active={p.fontSize === "l"} onClick={() => set("fontSize", "l")}>large</Pill></Row>
          </Panel>
          <Panel title="language">
            <Row><Pill active={p.language === "en"} onClick={() => set("language", "en")}>english</Pill><Pill active={p.language === "hi"} onClick={() => set("language", "hi")}>hindi</Pill><Pill active={p.language === "mixed"} onClick={() => set("language", "mixed")}>mixed</Pill></Row>
          </Panel>
        </section>

        <div className="rounded-2xl p-5 text-[12px]" style={{ background: soft, color: ink }}>
          preview: peace will now speak in a <b>{p.avatar}</b> tone, <b>{p.length}</b> replies, <b>{p.style}</b> style.
        </div>
      </main>
    </AppShell>
  );
}
function Label({ children }: { children: React.ReactNode }) { return <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">{children}</div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="p-5 rounded-2xl" style={{ background: surface, border: `1px solid ${border}` }}><Label>{title}</Label><div className="mt-3">{children}</div></div>;
}
function Row({ children }: { children: React.ReactNode }) { return <div className="flex flex-wrap gap-2">{children}</div>; }
function Pill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="px-4 h-9 rounded-full text-[11px]" style={{ background: active ? ink : surface2, color: active ? "var(--pc-bg)" : ink, border: `1px solid ${border}` }}>{children}</button>;
}
