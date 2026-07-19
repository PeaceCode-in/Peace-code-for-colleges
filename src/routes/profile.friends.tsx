import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Plus, Check, Clock } from "lucide-react";
import { loadProfile, saveProfile, MOOD_META, type Friend } from "@/lib/profile-store";
import { surface, surface2, border, ink, muted, primary, soft, Panel, Toasts, pushToast } from "@/components/profile/primitives";

export const Route = createFileRoute("/profile/friends")({
  head: () => ({ meta: [{ title: "Friends · PeaceCode" }] }),
  component: FriendsPage,
});

function FriendsPage() {
  const [p, setP] = useState(loadProfile());
  const [tab, setTab] = useState<"friends" | "requests" | "suggested">("friends");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const map: Record<typeof tab, Friend["status"][]> = { friends: ["friend"], requests: ["request-in", "request-out"], suggested: ["suggested"] };
    return p.friends.filter((f) => map[tab].includes(f.status) && (q === "" || f.name.toLowerCase().includes(q.toLowerCase()) || f.handle.includes(q)));
  }, [p, tab, q]);

  const update = (id: string, status: Friend["status"]) => {
    const next = { ...p, friends: p.friends.map((f) => (f.id === id ? { ...f, status } : f)) };
    setP(next); saveProfile(next); pushToast("Updated");
  };
  const remove = (id: string) => {
    const next = { ...p, friends: p.friends.filter((f) => f.id !== id) };
    setP(next); saveProfile(next); pushToast("Removed");
  };

  return (
    <div className="px-4 lg:pl-32 lg:pr-10 py-8 pb-32 lg:pb-16 max-w-4xl">
      <Link to="/profile" className="inline-flex items-center gap-2 text-[12px] mb-4" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5"/> Back to profile
      </Link>
      <h1 className="font-serif text-[32px] leading-tight" style={{ color: ink }}>Friends</h1>
      <p className="text-[13px] mb-6" style={{ color: muted }}>Peace grows in quiet company.</p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full flex-1" style={{ background: surface2, border: `1px solid ${border}` }}>
          <Search className="w-3.5 h-3.5 opacity-50"/>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search friends…"
            className="bg-transparent outline-none text-[12.5px] flex-1"/>
        </div>
        <div className="flex gap-1.5">
          {(["friends", "requests", "suggested"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-3.5 py-2 rounded-full text-[11.5px] capitalize"
              style={{ background: tab === t ? ink : surface2, color: tab === t ? "var(--pc-bg)" : ink }}>{t}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl p-10 text-center" style={{ background: surface, border: `1px dashed ${border}` }}>
          <div className="font-serif text-[18px]" style={{ color: ink }}>Nothing here yet.</div>
          <div className="text-[12px] mt-1" style={{ color: muted }}>Try another tab, or search a name.</div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((f) => {
            const mood = MOOD_META[f.mood];
            return (
              <Panel key={f.id} className="!p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full grid place-items-center font-serif text-[18px] shrink-0"
                       style={{ background: soft, color: ink }}>{f.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-[15px] truncate" style={{ color: ink }}>{f.name}</div>
                    <div className="text-[11px] truncate" style={{ color: muted }}>{f.handle} · {f.college}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10.5px]">
                      <span className="px-2 py-0.5 rounded-full" style={{ background: surface2, color: ink }}>{mood.emoji} {mood.label}</span>
                      <span className="px-2 py-0.5 rounded-full" style={{ background: surface2, color: muted }}>{f.streak}d</span>
                      {f.mutual > 0 && <span className="px-2 py-0.5 rounded-full" style={{ background: surface2, color: muted }}>{f.mutual} mutual</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {f.status === "friend" && (
                    <>
                      <button className="flex-1 py-1.5 rounded-full text-[11px]" style={{ background: surface2, color: ink }}>Message</button>
                      <button onClick={() => remove(f.id)} className="px-3 py-1.5 rounded-full text-[11px]" style={{ background: surface2, color: muted }}>Remove</button>
                    </>
                  )}
                  {f.status === "request-in" && (
                    <>
                      <button onClick={() => update(f.id, "friend")} className="flex-1 py-1.5 rounded-full text-[11px] flex items-center justify-center gap-1" style={{ background: primary, color: "#fff" }}><Check className="w-3 h-3"/>Accept</button>
                      <button onClick={() => remove(f.id)} className="px-3 py-1.5 rounded-full text-[11px]" style={{ background: surface2, color: muted }}>Decline</button>
                    </>
                  )}
                  {f.status === "request-out" && (
                    <div className="flex-1 py-1.5 rounded-full text-[11px] text-center flex items-center justify-center gap-1" style={{ background: surface2, color: muted }}><Clock className="w-3 h-3"/>Requested</div>
                  )}
                  {f.status === "suggested" && (
                    <button onClick={() => update(f.id, "request-out")} className="flex-1 py-1.5 rounded-full text-[11px] flex items-center justify-center gap-1" style={{ background: ink, color: "var(--pc-bg)" }}><Plus className="w-3 h-3"/>Add friend</button>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <Toasts/>
    </div>
  );
}
