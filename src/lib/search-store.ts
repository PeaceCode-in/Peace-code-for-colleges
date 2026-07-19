// Persistent state for the Search Center: recents, pinned, saved queries,
// collections, and privacy prefs. Kept dependency-free.

const K = {
  recents: "peacecode.search.recents.v1",
  pinned:  "peacecode.search.pinned.v1",
  saved:   "peacecode.search.saved.v1",
  cols:    "peacecode.search.collections.v1",
  prefs:   "peacecode.search.prefs.v1",
  freq:    "peacecode.search.freq.v1",
};

function get<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; }
}
function set<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

export type SavedSearch = { id: string; query: string; label?: string; ts: number };
export type SearchCollection = { id: string; name: string; itemIds: string[]; ts: number };
export type SearchPrefs = {
  pauseHistory: boolean;
  excludeJournal: boolean;
  excludeGratitude: boolean;
  excludeCounselling: boolean;
  excludePeaceBot: boolean;
  aiMode: boolean;
};

export const DEFAULT_PREFS: SearchPrefs = {
  pauseHistory: false,
  excludeJournal: false,
  excludeGratitude: false,
  excludeCounselling: false,
  excludePeaceBot: false,
  aiMode: false,
};

export function loadRecents(): string[] { return get<string[]>(K.recents, []); }
export function pushRecent(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return;
  const p = loadPrefs();
  if (p.pauseHistory) return;
  const list = [trimmed, ...loadRecents().filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, 20);
  set(K.recents, list);
  const freq = loadFreq();
  freq[trimmed.toLowerCase()] = (freq[trimmed.toLowerCase()] ?? 0) + 1;
  set(K.freq, freq);
}
export function clearRecents() { set(K.recents, []); }
export function removeRecent(q: string) {
  set(K.recents, loadRecents().filter((r) => r !== q));
}

export function loadPinned(): string[] { return get<string[]>(K.pinned, []); }
export function togglePinned(q: string) {
  const list = loadPinned();
  if (list.includes(q)) set(K.pinned, list.filter((x) => x !== q));
  else set(K.pinned, [q, ...list].slice(0, 12));
}

export function loadSaved(): SavedSearch[] { return get<SavedSearch[]>(K.saved, []); }
export function saveSearch(query: string, label?: string) {
  const s: SavedSearch = { id: `s_${Date.now().toString(36)}`, query, label, ts: Date.now() };
  set(K.saved, [s, ...loadSaved()]);
  return s;
}
export function deleteSaved(id: string) {
  set(K.saved, loadSaved().filter((s) => s.id !== id));
}

export function loadCollections(): SearchCollection[] { return get<SearchCollection[]>(K.cols, []); }
export function createCollection(name: string): SearchCollection {
  const c: SearchCollection = { id: `c_${Date.now().toString(36)}`, name, itemIds: [], ts: Date.now() };
  set(K.cols, [c, ...loadCollections()]);
  return c;
}
export function addToCollection(colId: string, itemId: string) {
  const list = loadCollections().map((c) =>
    c.id === colId ? { ...c, itemIds: Array.from(new Set([itemId, ...c.itemIds])) } : c
  );
  set(K.cols, list);
}
export function removeFromCollection(colId: string, itemId: string) {
  set(K.cols, loadCollections().map((c) => c.id === colId ? { ...c, itemIds: c.itemIds.filter((i) => i !== itemId) } : c));
}
export function deleteCollection(id: string) {
  set(K.cols, loadCollections().filter((c) => c.id !== id));
}

export function loadPrefs(): SearchPrefs { return { ...DEFAULT_PREFS, ...get<Partial<SearchPrefs>>(K.prefs, {}) }; }
export function savePrefs(p: SearchPrefs) { set(K.prefs, p); }

export function loadFreq(): Record<string, number> { return get<Record<string, number>>(K.freq, {}); }
