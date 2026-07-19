# Gratitude — plan

Follows the existing Journal / Focus / Breathe pattern: local-first persistence, `AppShell` layout, Sky/Lavender palette, server functions via Lovable AI Gateway.

## Files

New:
- `src/lib/gratitude-store.ts` — entries, streaks, tree stages, achievements, community seed feed, categories, prefs (privacy + notifications).
- `src/lib/gratitude-ai.functions.ts` — `dailyPrompt`, `reflectWeek`, `reflectMonth`, `reframe`, `suggestTopics`, `treeSummary` (Lovable AI Gateway, `google/gemini-3-flash-preview`).
- `src/routes/gratitude.tsx` — minimal home.
- `src/routes/gratitude.wall.tsx` — public wall.
- `src/routes/gratitude.history.tsx` — history + analytics (tabbed).
- `src/routes/gratitude.tree.tsx` — tree dashboard + garden + forest (tabbed).

Edit:
- `src/components/AppShell.tsx` — wire the existing Gratitude nav item to `/gratitude`.

## Main page (minimal)

Hero with today's AI prompt + streak ring + tree-stage badge. One primary "plant a seed" composer (title, description, mood, emoji, tags, category, photo, voice, privacy: private/public/anonymous). Below it: Today's count · Streak · Community counter (compact strip). Last 3 recent entries preview. Two peeks: "public wall" (3 cards) and "your tree" (tree SVG + stage label). Everything else lives behind cards that link to sub-pages: History, Analytics, Tree, Garden, Forest, Challenges, Achievements, Privacy, More.

## Growing tree

Stages by score (entries + streak × 3 + public-share bonus): Seed 0 · Sprout 3 · Small Plant 10 · Young Tree 25 · Mature 60 · Blooming 120 · Golden 250 · Peace Forest 500. Rendered as a layered SVG that gains trunk rings, leaves, flowers, fruit, birds, fireflies as it grows. Bloom % = progress toward next stage.

## Wall page

Feed of public + anonymous entries (user's public entries merged with seeded community entries). Actions: like, heart, support, bookmark, share (copy link), report (local hide). Filters: recent · trending · anonymous · category · college. Search box. Users never see private entries.

## History page

Tabs: Calendar (month heatmap, click a day = day's entries), Timeline (grouped by month), Analytics (totals, weekly avg, longest streak, top categories, active time, heatmap, mood trend, positive-growth line — all real from local data). Search + filters + edit + delete + export JSON.

## Tree page

Tabs: Dashboard (stage, leaves/flowers/fruits/birds counters, growth timeline, next milestone, AI growth summary button), Garden (interactive SVG with wind/fireflies/rain/night toggle, bloom %), Forest (community: totals, health bar, top contributors, recently bloomed, kindness ticker, milestones — seeded + user).

## Achievements & challenges

Achievements panel on Tree page: 10 badges (first, 7/30-day streaks, 100/500 entries, first public, supporter, blooming/golden/peace-forest). Challenges panel on main page card → drawer with 7/21/30-day + college/friends.

## Privacy & more

Privacy modal on main page (default privacy, anonymous mode, hide identity, export JSON, delete all — confirm). "More" drawer: themes (reuse journal themes), backup (JSON), export PDF (window.print stylesheet), share tree (copy link), invite, help/FAQ.

## Tech notes

- Store: `peacecode.gratitude.entries.v1`, `peacecode.gratitude.prefs.v1`, `peacecode.gratitude.reactions.v1`, `peacecode.gratitude.bookmarks.v1`, `peacecode.gratitude.community.v1` (seed).
- Photos: base64 data URLs (same as journal). Voice notes: `MediaRecorder` → base64, transcribe via existing `transcribeVoice` server fn.
- Palette from `AppShell.palette`, `Fraunces` + `DM Sans`.
- All AI calls degrade gracefully to a cached poetic fallback on 429/402/500.
- Every route uses `AppShell` so sidebar + backdrop stay constant.
