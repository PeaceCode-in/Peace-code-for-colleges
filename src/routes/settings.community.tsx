import { createFileRoute, Link } from "@tanstack/react-router";
import { SettingsShell, Section, Row, Toggle, Chip, GhostButton } from "@/components/settings/primitives";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/settings/community")({
  head: () => ({ meta: [{ title: "Community — Settings" }] }),
  component: CommunitySettings,
});

const INTERESTS = ["study-stress","sleep","exam anxiety","relationships","burnout","identity","mindfulness","career","body image","grief"];

function CommunitySettings() {
  const [s, update] = useSettings();
  const c = s.community;
  const set = <K extends keyof typeof c>(k: K, v: (typeof c)[K]) => update((x) => ({ ...x, community: { ...x.community, [k]: v } }), `Community · ${String(k)}`);
  const toggle = (i: string) => update((x) => ({ ...x, community: { ...x.community, interests: x.community.interests.includes(i) ? x.community.interests.filter((v) => v !== i) : [...x.community.interests, i] } }), "Community · interests");

  return (
    <SettingsShell title="Community" description="How you show up in Circles and Rooms.">
      <Section title="Presence">
        <Row label="Anonymous by default" action={<Toggle checked={c.anonymousDefault} onChange={(v) => set("anonymousDefault", v)} />} />
        <Row label="Public profile" action={<Toggle checked={c.publicProfile} onChange={(v) => set("publicProfile", v)} />} />
        <Row label="Show achievements on profile" action={<Toggle checked={c.showAchievements} onChange={(v) => set("showAchievements", v)} />} />
      </Section>

      <Section title="Connections">
        <Row label="Allow direct messages" action={<Toggle checked={c.allowMessages} onChange={(v) => set("allowMessages", v)} />} />
        <Row label="Allow friend requests" action={<Toggle checked={c.allowFriendRequests} onChange={(v) => set("allowFriendRequests", v)} />} />
        <div className="px-5 py-4 flex flex-wrap gap-2">
          <Link to="/community"><GhostButton>Open community</GhostButton></Link>
          <GhostButton onClick={() => alert("No blocked users right now.")}>Blocked users</GhostButton>
          <GhostButton onClick={() => alert("No muted circles.")}>Muted circles</GhostButton>
          <GhostButton onClick={() => alert("You haven't saved any posts yet.")}>Saved posts</GhostButton>
        </div>
      </Section>

      <Section title="Interests" hint="We'll surface Circles that match.">
        <div className="px-5 py-4 flex flex-wrap gap-2">
          {INTERESTS.map((i) => <Chip key={i} label={i} active={c.interests.includes(i)} onClick={() => toggle(i)} />)}
        </div>
      </Section>
    </SettingsShell>
  );
}
