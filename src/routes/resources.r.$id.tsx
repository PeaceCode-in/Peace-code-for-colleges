import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import {
  byId, authorById, categoryBySlug, related, heroBg, FORMAT_LABELS, store, useResourceStore, RESOURCES,
} from "@/lib/resources-store";
import {
  Bookmark, BookmarkCheck, Heart, Share2, Download, Play, Pause, CheckCircle2, Clock, BadgeCheck,
  Highlighter, StickyNote, Type as TypeIcon, Sun, Moon, Rewind, FastForward, SkipBack, SkipForward,
  Volume2, Link as LinkIcon, MessageCircle, ChevronLeft,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/resources/r/$id")({
  loader: ({ params }) => {
    const r = byId(params.id) || RESOURCES.find(x => x.slug === params.id);
    if (!r) throw notFound();
    return { r };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.r.title ?? "Resource"} — PeaceCode` },
      { name: "description", content: loaderData?.r.description ?? "" },
      { property: "og:title", content: loaderData?.r.title ?? "" },
      { property: "og:description", content: loaderData?.r.description ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <AppShell><main className="p-10 text-center"><div className="font-serif text-2xl">Not found</div><Link to="/resources" className="underline text-sm">Back to library</Link></main></AppShell>
  ),
  errorComponent: ({ error }) => <AppShell><main className="p-10">{error.message}</main></AppShell>,
  component: ResourcePage,
});

function ResourcePage() {
  const { r } = Route.useLoaderData();
  const snap = useResourceStore();
  const author = authorById(r.authorId);
  const cat = categoryBySlug(r.category);
  const rel = useMemo(() => related(r, 6), [r.id]);
  const saved = snap.bookmarks.includes(r.id);
  const liked = snap.likes.includes(r.id);
  const done = snap.completed.includes(r.id);
  const downloaded = snap.downloads.includes(r.id);
  const notes = snap.notes[r.id] || [];
  const highlights = snap.highlights[r.id] || [];
  const progress = snap.progress[r.id] || 0;

  const [reading, setReading] = useState<"light" | "dark">("light");
  const [font, setFont] = useState<"serif" | "sans">(snap.prefs.readingFont);
  const [size, setSize] = useState<number>(snap.prefs.textSize);
  const [noteBody, setNoteBody] = useState("");
  const [scrollPct, setScrollPct] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const nextResource = rel[0];

  useEffect(() => { store.recordView(r.id); }, [r.id]);

  useEffect(() => {
    const onScroll = () => {
      const el = contentRef.current; if (!el) return;
      const total = el.scrollHeight - window.innerHeight;
      const pct = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      setScrollPct(pct);
      if (pct > 0.02 && pct < 0.99) store.setProgress(r.id, pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [r.id]);

  function addNote() {
    if (!noteBody.trim()) return;
    const sel = typeof window !== "undefined" ? window.getSelection()?.toString().trim() : "";
    store.addNote(r.id, noteBody.trim(), sel || undefined);
    setNoteBody("");
  }
  function highlightSelection() {
    const sel = window.getSelection()?.toString().trim();
    if (!sel) { alert("Select some text first to highlight."); return; }
    store.addHighlight(r.id, sel);
  }
  function shareLink() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) navigator.share({ title: r.title, text: r.description, url }).catch(() => {});
    else { navigator.clipboard?.writeText(url); alert("Link copied."); }
  }

  const isAudio = r.format === "podcast" || r.format === "meditation" || r.format === "sleep-story" || r.format === "audiobook" || r.format === "breathing";
  const isVideo = r.format === "video" || r.format === "short-video" || r.format === "webinar";

  return (
    <AppShell>
      {/* reading progress */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-30">
        <div className="h-full transition-[width]" style={{ width: `${scrollPct*100}%`, background: "var(--pc-primary)" }}/>
      </div>

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-10" ref={contentRef}>
        <Link to="/resources" className="inline-flex items-center gap-1 text-[12px] mb-6" style={{ color: "var(--pc-muted)" }}>
          <ChevronLeft className="w-3.5 h-3.5"/> Library
        </Link>

        {/* Hero */}
        <div className="rounded-3xl overflow-hidden mb-8 relative min-h-[280px]" style={{ background: heroBg(r.hero) }}>
          <div className="absolute inset-0 p-8 sm:p-10 flex flex-col justify-end" style={{ background: "linear-gradient(180deg,transparent 30%,rgba(0,0,0,0.5) 100%)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-[10px] tracking-[0.16em] uppercase bg-white/25 text-white">{FORMAT_LABELS[r.format as keyof typeof FORMAT_LABELS]}</span>
              {cat && (
                <Link to="/resources/c/$slug" params={{ slug: cat.slug }} className="px-2.5 py-1 rounded-full text-[10px] tracking-[0.16em] uppercase bg-white/25 text-white hover:bg-white/35">
                  {cat.emoji} {cat.name}
                </Link>
              )}
            </div>
            <div className="text-6xl mb-4">{r.emoji}</div>
            <h1 className="font-serif text-white text-[32px] sm:text-[44px] leading-[1.05] max-w-[720px]">{r.title}</h1>
            <div className="mt-4 flex items-center gap-4 text-white/85 text-[12px]">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {r.minutes} min</span>
              <span>·</span>
              <span>{r.difficulty}</span>
              <span>·</span>
              <span>{r.language}</span>
              <span>·</span>
              <span>{r.rating.toFixed(1)}★ · {r.views.toLocaleString()} views</span>
            </div>
          </div>
        </div>

        {/* Author */}
        {author && (
          <Link to="/resources/author/$id" params={{ id: author.id }}
            className="flex items-center gap-3 rounded-2xl p-4 mb-6 transition hover:bg-[var(--pc-surface2)]"
            style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-serif text-[18px]"
              style={{ background: "var(--pc-soft)", color: "var(--pc-primary)" }}>{author.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>{author.name}</div>
                {author.verified && <BadgeCheck className="w-3.5 h-3.5" style={{ color: "var(--pc-primary)" }}/>}
              </div>
              <div className="text-[11px]" style={{ color: "var(--pc-muted)" }}>{author.title}</div>
            </div>
            <div className="text-[11px]" style={{ color: "var(--pc-muted)" }}>View profile →</div>
          </Link>
        )}

        {/* Description */}
        <p className="text-[16px] leading-[1.6] mb-6" style={{ color: "var(--pc-muted)" }}>{r.description}</p>

        {/* Action bar */}
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2 mb-8 backdrop-blur-xl"
          style={{ background: "var(--pc-header)", border: "1px solid var(--pc-border)" }}>
          <ActionBtn onClick={() => store.toggleBookmark(r.id)} active={saved} icon={saved ? BookmarkCheck : Bookmark} label={saved ? "Saved" : "Save"}/>
          <ActionBtn onClick={() => store.toggleLike(r.id)} active={liked} icon={Heart} label={liked ? "Liked" : "Like"}/>
          <ActionBtn onClick={() => store.markComplete(r.id)} active={done} icon={CheckCircle2} label={done ? "Completed" : "Mark complete"}/>
          <ActionBtn onClick={() => store.toggleDownload(r.id)} active={downloaded} icon={Download} label={downloaded ? "Downloaded" : "Download"}/>
          <ActionBtn onClick={highlightSelection} icon={Highlighter} label="Highlight"/>
          <ActionBtn onClick={() => setShowNotes(v => !v)} icon={StickyNote} label={`Notes${notes.length ? ` · ${notes.length}` : ""}`}/>
          <ActionBtn onClick={shareLink} icon={Share2} label="Share"/>
          <div className="w-px h-6 mx-1" style={{ background: "var(--pc-border)" }}/>
          <button onClick={() => setSize(Math.max(14, size - 1))} className="px-2 py-1 rounded-lg text-[11px]" style={{ color: "var(--pc-muted)" }}>A-</button>
          <button onClick={() => setSize(Math.min(22, size + 1))} className="px-2 py-1 rounded-lg text-[11px]" style={{ color: "var(--pc-muted)" }}>A+</button>
          <button onClick={() => setFont(font === "serif" ? "sans" : "serif")} className="p-1.5 rounded-lg" style={{ color: "var(--pc-muted)" }} aria-label="Font"><TypeIcon className="w-3.5 h-3.5"/></button>
          <button onClick={() => setReading(reading === "light" ? "dark" : "light")} className="p-1.5 rounded-lg" style={{ color: "var(--pc-muted)" }} aria-label="Reading mode">
            {reading === "light" ? <Moon className="w-3.5 h-3.5"/> : <Sun className="w-3.5 h-3.5"/>}
          </button>
        </div>

        {/* Media player */}
        {(isAudio || isVideo) && <MediaPlayer type={isVideo ? "video" : "audio"} resource={r}/>}

        {/* TOC */}
        {r.tableOfContents && r.tableOfContents.length > 0 && (
          <div className="rounded-2xl p-5 mb-8" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: "var(--pc-muted)" }}>In this piece</div>
            <ol className="space-y-2 list-decimal list-inside">
              {r.tableOfContents.map((t: string, i: number) => (
                <li key={i} className="text-[13px]" style={{ color: "var(--pc-ink)" }}>{t}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Body */}
        {r.body && (
          <article
            className={`rounded-3xl p-6 sm:p-10 mb-10 leading-[1.75] whitespace-pre-wrap ${font === "serif" ? "font-serif" : "font-sans"}`}
            style={{
              background: reading === "dark" ? "#1F2530" : "var(--pc-surface)",
              color: reading === "dark" ? "#E5E9F0" : "var(--pc-ink)",
              border: "1px solid var(--pc-border)",
              fontSize: `${size}px`,
            }}
            onMouseUp={() => {}}
          >
            {r.body.split("\n").map((line: string, i: number) => (
              <p key={i} className="mb-4">{line}</p>
            ))}
          </article>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <section className="mb-10">
            <h3 className="font-serif text-[18px] mb-3" style={{ color: "var(--pc-ink)" }}>Your highlights</h3>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="rounded-xl p-3 text-[13px]" style={{ background: "var(--pc-soft)", color: "var(--pc-ink)", borderLeft: "3px solid var(--pc-primary)" }}>
                  "{h}"
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notes */}
        {showNotes && (
          <section className="mb-10 rounded-3xl p-6" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <StickyNote className="w-4 h-4" style={{ color: "var(--pc-primary)" }}/>
              <div className="font-serif text-[17px]" style={{ color: "var(--pc-ink)" }}>Your notes</div>
            </div>
            <textarea value={noteBody} onChange={e => setNoteBody(e.target.value)}
              placeholder="Write a note. Select text first to attach a quote."
              className="w-full min-h-[100px] rounded-xl p-3 text-[13px] outline-none resize-none"
              style={{ background: "var(--pc-surface2)", color: "var(--pc-ink)", border: "1px solid var(--pc-border)" }}/>
            <div className="mt-2 flex justify-end">
              <button onClick={addNote} className="px-4 py-2 rounded-full text-[12px]"
                style={{ background: "var(--pc-primary)", color: "#fff" }}>Save note</button>
            </div>
            <div className="mt-4 space-y-3">
              {notes.map(n => (
                <div key={n.id} className="rounded-xl p-3" style={{ background: "var(--pc-surface2)" }}>
                  {n.quote && <div className="text-[12px] italic mb-1" style={{ color: "var(--pc-muted)" }}>"{n.quote}"</div>}
                  <div className="text-[13px]" style={{ color: "var(--pc-ink)" }}>{n.body}</div>
                  <div className="flex items-center justify-between mt-2 text-[10px]" style={{ color: "var(--pc-muted)" }}>
                    <span>{new Date(n.at).toLocaleString()}</span>
                    <button onClick={() => store.deleteNote(r.id, n.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-10">
          {r.tags.map((t: string) => (
            <Link key={t} to="/resources/search" search={{ q: t } as any}
              className="text-[11px] px-3 py-1.5 rounded-full"
              style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-muted)" }}>
              #{t}
            </Link>
          ))}
        </div>

        {/* Cross-links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <Link to="/peacebot" className="rounded-2xl p-4" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="text-[10px] tracking-[0.24em] uppercase mb-1" style={{ color: "var(--pc-primary)" }}>Talk it through</div>
            <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>Ask Peace Bot →</div>
          </Link>
          <Link to="/journal" className="rounded-2xl p-4" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="text-[10px] tracking-[0.24em] uppercase mb-1" style={{ color: "var(--pc-primary)" }}>Sit with it</div>
            <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>Write in journal →</div>
          </Link>
          <Link to="/counselling" className="rounded-2xl p-4" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="text-[10px] tracking-[0.24em] uppercase mb-1" style={{ color: "var(--pc-primary)" }}>Speak to someone</div>
            <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>Find a counsellor →</div>
          </Link>
        </div>

        {/* Related */}
        <section className="mb-10">
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-serif text-[22px]" style={{ color: "var(--pc-ink)" }}>Students also viewed</h2>
            {cat && <Link to="/resources/c/$slug" params={{ slug: cat.slug }} className="text-[11px] tracking-[0.18em] uppercase" style={{ color: "var(--pc-muted)" }}>More in {cat.name} →</Link>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rel.map(x => <ResourceCard key={x.id} r={x}/>)}
          </div>
        </section>

        {/* Next up */}
        {nextResource && (
          <Link to="/resources/r/$id" params={{ id: nextResource.id }}
            className="block rounded-3xl p-6 sm:p-8 mb-10 relative overflow-hidden"
            style={{ background: heroBg(nextResource.hero) }}>
            <div className="text-white/80 text-[10px] tracking-[0.3em] uppercase mb-2">Next up</div>
            <div className="font-serif text-white text-[24px] leading-tight">{nextResource.title}</div>
            <div className="text-white/85 text-[12px] mt-2">{nextResource.minutes} min · {FORMAT_LABELS[nextResource.format as keyof typeof FORMAT_LABELS]} →</div>
          </Link>
        )}
      </main>
    </AppShell>
  );
}

function ActionBtn({ onClick, active, icon: Icon, label }: { onClick: () => void; active?: boolean; icon: any; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition"
      style={{ background: active ? "var(--pc-soft)" : "transparent", color: active ? "var(--pc-primary)" : "var(--pc-muted)" }}>
      <Icon className="w-3.5 h-3.5"/> {label}
    </button>
  );
}

function MediaPlayer({ type, resource }: { type: "video" | "audio"; resource: any }) {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [sleepMin, setSleepMin] = useState<number | null>(null);
  const total = resource.minutes * 60;
  const rafRef = useRef<number | null>(null);
  const stopAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      setT(prev => {
        const nxt = prev + dt * speed;
        if (stopAtRef.current !== null && Date.now() >= stopAtRef.current) { setPlaying(false); return prev; }
        if (nxt >= total) { setPlaying(false); store.markComplete(resource.id); return total; }
        store.setProgress(resource.id, nxt / total);
        return nxt;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, speed, total, resource.id]);

  function fmt(s: number) {
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return `${m}:${ss.toString().padStart(2, "0")}`;
  }

  const pct = total > 0 ? (t / total) * 100 : 0;

  return (
    <div className="rounded-3xl p-6 mb-8 relative overflow-hidden"
      style={{ background: type === "video" ? "#111827" : heroBg(resource.hero), color: "#fff" }}>
      <div className="min-h-[180px] flex items-center justify-center text-6xl mb-4 opacity-90">{resource.emoji}</div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] opacity-80 w-10">{fmt(t)}</span>
        <div className="flex-1 h-1 rounded-full bg-white/20 cursor-pointer"
          onClick={e => { const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); setT(((e.clientX - rect.left) / rect.width) * total); }}>
          <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }}/>
        </div>
        <span className="text-[11px] opacity-80 w-10 text-right">{fmt(total)}</span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setT(Math.max(0, t - 15))} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center" aria-label="Back 15s"><Rewind className="w-4 h-4"/></button>
        <button onClick={() => setPlaying(p => !p)} className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center" aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause className="w-6 h-6"/> : <Play className="w-6 h-6 ml-0.5"/>}
        </button>
        <button onClick={() => setT(Math.min(total, t + 30))} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center" aria-label="Forward 30s"><FastForward className="w-4 h-4"/></button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 flex-wrap text-[11px] opacity-90">
        <button onClick={() => setSpeed(s => s === 2 ? 0.75 : s + 0.25)} className="px-2.5 py-1 rounded-full bg-white/15">{speed}x</button>
        <button onClick={() => { const min = sleepMin === 30 ? null : 30; setSleepMin(min); stopAtRef.current = min ? Date.now() + min * 60000 : null; }}
          className="px-2.5 py-1 rounded-full bg-white/15">{sleepMin ? `Sleep in ${sleepMin}m` : "Sleep timer"}</button>
        {type === "audio" && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15"><Volume2 className="w-3 h-3"/> ambient</span>}
        {type === "video" && <span className="px-2.5 py-1 rounded-full bg-white/15">Captions on</span>}
      </div>
    </div>
  );
}
