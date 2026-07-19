// Shared UI atoms for the Resource Library ecosystem.
import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, Clock, Heart, PlayCircle, CheckCircle2, BadgeCheck } from "lucide-react";
import {
  type Resource, FORMAT_LABELS, heroBg, store, useResourceStore, authorById,
} from "@/lib/resources-store";
import { useLang, tCached, FORMAT_HI } from "@/lib/resources-i18n";

export function FormatBadge({ format }: { format: Resource["format"] }) {
  const [lang] = useLang();
  const label = lang === "hi" ? FORMAT_HI[format] : FORMAT_LABELS[format];
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-medium"
      style={{ background: "var(--pc-surface2)", color: "var(--pc-muted)" }}>
      {label}
    </span>
  );
}

export function ResourceCard({ r, size = "md" }: { r: Resource; size?: "sm" | "md" | "lg" }) {
  const snap = useResourceStore();
  const [lang] = useLang();
  const saved = snap.bookmarks.includes(r.id);
  const done = snap.completed.includes(r.id);
  const author = authorById(r.authorId);
  const progress = snap.progress[r.id] || 0;

  const heroH = size === "sm" ? "h-32" : size === "lg" ? "h-56" : "h-40";
  const titleCls = size === "sm" ? "text-[14px]" : size === "lg" ? "text-[18px]" : "text-[15.5px]";

  const title = tCached(r.title, lang);
  const desc = tCached(r.description, lang);
  const authorName = tCached(author?.name || "PeaceCode", lang);

  return (
    <div className="group relative flex flex-col rounded-3xl overflow-hidden transition hover:-translate-y-0.5"
      style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
      <Link to="/resources/r/$id" params={{ id: r.id }} className="block">
        <div className={`relative ${heroH} w-full overflow-hidden`} style={{ background: heroBg(r.hero) }}>
          <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-90">{r.emoji}</div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <FormatBadge format={r.format} />
            {r.trending && <span className="px-2 py-0.5 rounded-full text-[9px] tracking-[0.18em] uppercase font-medium bg-black/25 text-white">{lang === "hi" ? "ट्रेंडिंग" : "Trending"}</span>}
          </div>
          {progress > 0 && progress < 1 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/15">
              <div className="h-full" style={{ width: `${progress * 100}%`, background: "var(--pc-primary)" }} />
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col gap-2">
        <Link to="/resources/r/$id" params={{ id: r.id }} className={`font-serif ${titleCls} leading-[1.25]`} style={{ color: "var(--pc-ink)" }}>
          {title}
        </Link>
        <p className="text-[12px] leading-[1.5] line-clamp-2" style={{ color: "var(--pc-muted)" }}>{desc}</p>
        <div className="flex items-center justify-between mt-1 text-[11px]" style={{ color: "var(--pc-muted)" }}>
          <Link to="/resources/author/$id" params={{ id: r.authorId }} className="flex items-center gap-1 min-w-0 hover:underline">
            <span className="truncate">{authorName}</span>
            {author?.verified && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: "var(--pc-primary)" }} />}
          </Link>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.minutes}{lang === "hi" ? "मि" : "m"}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--pc-muted)" }}>
            <span className="flex items-center gap-0.5"><Heart className="w-3 h-3"/> {r.likes}</span>
            <span>·</span>
            <span>{r.rating.toFixed(1)}★</span>
          </div>
          <div className="flex items-center gap-1">
            {done && <CheckCircle2 className="w-4 h-4" style={{ color: "var(--pc-primary)" }} />}
            <button
              onClick={(e) => { e.preventDefault(); store.toggleBookmark(r.id); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-105"
              style={{ background: saved ? "var(--pc-soft)" : "var(--pc-surface2)", color: saved ? "var(--pc-primary)" : "var(--pc-muted)" }}
              aria-label={saved ? "Remove bookmark" : "Save"}
            >
              {saved ? <BookmarkCheck className="w-4 h-4"/> : <Bookmark className="w-4 h-4"/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResourceRow({ title, items, seeAll }: { title: string; items: Resource[]; seeAll?: string }) {
  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-serif text-[22px] sm:text-[26px]" style={{ color: "var(--pc-ink)" }}>{title}</h2>
        {seeAll && (
          <Link to={seeAll} className="text-[12px] tracking-[0.18em] uppercase hover:opacity-70" style={{ color: "var(--pc-muted)" }}>See all →</Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none" }}>
        {items.map(r => (
          <div key={r.id} className="w-[260px] sm:w-[280px] shrink-0">
            <ResourceCard r={r} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function TinyPlay() {
  return <PlayCircle className="w-4 h-4"/>;
}
