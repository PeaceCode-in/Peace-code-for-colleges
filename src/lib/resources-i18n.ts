// Client-side i18n for the Resource Library.
// - Persists selected language in localStorage.
// - Hand-authored Hindi UI strings (categories, formats, difficulties, sort, page copy).
// - Cached auto-translation for dynamic content (resource titles/descriptions/author names).
import { useEffect, useState, useCallback } from "react";
import {
  RESOURCES, CATEGORIES, AUTHORS, FORMAT_LABELS, DIFFICULTIES,
  type Resource, type ResourceFormat, type CategorySlug, type Difficulty,
} from "./resources-store";
import { translateResourcesBatch, translateQuery } from "./resources-translate.functions";

export type Lang = "en" | "hi";

const LANG_KEY = "peacecode.resources.lang";
const CACHE_KEY = "peacecode.resources.i18n.v1";

// ─── Hand-authored Hindi UI strings ────────────────────────
export const UI: Record<Lang, {
  library: string;
  heroTitle: string;
  heroSub: (n: number) => string;
  searchPh: string;
  filters: string;
  allCategories: string; collections: string; myLibrary: string;
  history: string; playlists: string; downloads: string; achievements: string;
  continueLearning: string;
  aiPicksKicker: string;
  aiPicksTitle: string;
  aiPicksSub: string;
  recommended: string;
  trendingToday: string;
  recentlyViewed: string;
  browseTopic: string;
  featuredCollection: string;
  voicesTrust: string;
  seeAll: string;
  results: (n: number, q: string) => string;
  noResults: string;
  softerWord: string;
  browseCategories: string;
  recent: string;
  trending: string;
  saved: string; completed: string;
  category: string; format: string; difficulty: string; language: string; sort: string;
  all: string; any: string;
  languageLabel: string;
  langEn: string; langHi: string;
  translating: string;
}> = {
  en: {
    library: "Library · Keya's shelf",
    heroTitle: "A quiet place to read, breathe, listen and learn.",
    heroSub: (n) => `${n}+ articles, meditations, podcasts and worksheets — curated by clinicians, teachers and students.`,
    searchPh: "Search articles, sleep stories, worksheets…",
    filters: "filters",
    allCategories: "All categories", collections: "Collections", myLibrary: "My library",
    history: "History", playlists: "Playlists", downloads: "Downloads", achievements: "Achievements",
    continueLearning: "Continue where you left off",
    aiPicksKicker: "AI picks for you",
    aiPicksTitle: "Based on your sleep, your journal and the mood you logged this morning.",
    aiPicksSub: "These four pieces feel closest to where you are today.",
    recommended: "Recommended for you",
    trendingToday: "Trending today",
    recentlyViewed: "Recently viewed",
    browseTopic: "Browse by topic",
    featuredCollection: "Featured collection",
    voicesTrust: "Voices we trust",
    seeAll: "See all →",
    results: (n, q) => `${n} result${n === 1 ? "" : "s"}${q ? ` for "${q}"` : ""}`,
    noResults: "Nothing quite matches yet.",
    softerWord: "Try a softer word, or browse",
    browseCategories: "categories",
    recent: "Recent", trending: "Trending",
    saved: "Saved", completed: "Completed",
    category: "Category", format: "Format", difficulty: "Difficulty", language: "Language", sort: "Sort",
    all: "All", any: "Any",
    languageLabel: "Language",
    langEn: "English", langHi: "हिन्दी",
    translating: "translating…",
  },
  hi: {
    library: "लाइब्रेरी · केया की शेल्फ",
    heroTitle: "पढ़ने, साँस लेने, सुनने और सीखने की एक शांत जगह।",
    heroSub: (n) => `${n}+ लेख, ध्यान, पॉडकास्ट और वर्कशीट — चिकित्सकों, शिक्षकों और छात्रों द्वारा चुनी हुई।`,
    searchPh: "लेख, स्लीप स्टोरी, वर्कशीट खोजें…",
    filters: "फ़िल्टर",
    allCategories: "सभी श्रेणियाँ", collections: "संग्रह", myLibrary: "मेरी लाइब्रेरी",
    history: "इतिहास", playlists: "प्लेलिस्ट", downloads: "डाउनलोड", achievements: "उपलब्धियाँ",
    continueLearning: "जहाँ छोड़ा था, वहीं से जारी रखें",
    aiPicksKicker: "आपके लिए AI चुनाव",
    aiPicksTitle: "आपकी नींद, जर्नल और आज सुबह के मूड के आधार पर।",
    aiPicksSub: "ये चार टुकड़े आज आपकी जगह के सबसे क़रीब लगते हैं।",
    recommended: "आपके लिए सुझाव",
    trendingToday: "आज ट्रेंडिंग",
    recentlyViewed: "हाल में देखा",
    browseTopic: "विषय से खोजें",
    featuredCollection: "विशेष संग्रह",
    voicesTrust: "जिन आवाज़ों पर भरोसा है",
    seeAll: "सब देखें →",
    results: (n, q) => `${n} परिणाम${q ? ` "${q}" के लिए` : ""}`,
    noResults: "अभी कुछ मेल नहीं खा रहा।",
    softerWord: "कोई कोमल शब्द आज़माएँ, या देखें",
    browseCategories: "श्रेणियाँ",
    recent: "हाल की", trending: "ट्रेंडिंग",
    saved: "सहेजे", completed: "पूर्ण",
    category: "श्रेणी", format: "प्रारूप", difficulty: "स्तर", language: "भाषा", sort: "क्रम",
    all: "सभी", any: "कोई भी",
    languageLabel: "भाषा",
    langEn: "English", langHi: "हिन्दी",
    translating: "अनुवाद हो रहा है…",
  },
};

export const CATEGORY_HI: Record<CategorySlug, string> = {
  stress: "तनाव", anxiety: "चिंता", depression: "अवसाद", burnout: "थकावट",
  friendship: "दोस्ती", relationships: "रिश्ते", "college-life": "कॉलेज जीवन",
  "hostel-life": "हॉस्टल जीवन", homesickness: "घर की याद", exams: "परीक्षाएँ",
  placements: "प्लेसमेंट", internships: "इंटर्नशिप", career: "करियर",
  confidence: "आत्मविश्वास", productivity: "उत्पादकता", focus: "एकाग्रता",
  mindfulness: "सजगता", meditation: "ध्यान", sleep: "नींद", nutrition: "पोषण",
  fitness: "फिटनेस", "self-care": "आत्म-देखभाल", motivation: "प्रेरणा",
  communication: "संवाद", time: "समय प्रबंधन", money: "आर्थिक स्वास्थ्य",
  digital: "डिजिटल कल्याण", gratitude: "कृतज्ञता", journaling: "जर्नलिंग",
  adhd: "ADHD", ocd: "OCD", ptsd: "PTSD", lgbtq: "LGBTQ+",
};

export const FORMAT_HI: Record<ResourceFormat, string> = {
  article: "लेख", "short-read": "लघु पाठ", "long-read": "दीर्घ पाठ", research: "शोध",
  video: "वीडियो", "short-video": "छोटा वीडियो", podcast: "पॉडकास्ट", audiobook: "ऑडियोबुक",
  meditation: "ध्यान", "sleep-story": "स्लीप स्टोरी", worksheet: "वर्कशीट",
  infographic: "इन्फ़ोग्राफ़िक", interactive: "इंटरेक्टिव", checklist: "चेकलिस्ट",
  template: "टेम्पलेट", course: "कोर्स", challenge: "चुनौती", webinar: "वेबिनार",
  pdf: "PDF गाइड", flashcards: "फ़्लैशकार्ड", quiz: "क्विज़",
  breathing: "श्वास अभ्यास", "journal-prompt": "जर्नल प्रॉम्प्ट",
  "case-study": "केस स्टडी", story: "छात्र कहानी", interview: "साक्षात्कार",
};

export const DIFFICULTY_HI: Record<Difficulty, string> = {
  Gentle: "कोमल", Balanced: "संतुलित", Deep: "गहन",
};

export const SORT_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    recommended: "Recommended", trending: "Trending", newest: "Newest",
    views: "Most viewed", likes: "Most liked", rating: "Highest rated",
    shortest: "Shortest", longest: "Longest", az: "A → Z",
  },
  hi: {
    recommended: "सुझाए हुए", trending: "ट्रेंडिंग", newest: "नवीनतम",
    views: "सर्वाधिक देखे", likes: "सर्वाधिक पसंद", rating: "उच्चतम रेटिंग",
    shortest: "सबसे छोटे", longest: "सबसे लंबे", az: "अ → ज्ञ",
  },
};

export const TRENDING_HI: Record<string, string> = {
  "exam anxiety": "परीक्षा की चिंता",
  "sleep story": "स्लीप स्टोरी",
  "burnout": "थकावट",
  "adhd focus": "ADHD एकाग्रता",
  "placement prep": "प्लेसमेंट तैयारी",
  "grounding exercise": "ग्राउंडिंग अभ्यास",
  "homesickness": "घर की याद",
  "confidence": "आत्मविश्वास",
};

// ─── Language store ────────────────────────────────────────
export function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = localStorage.getItem(LANG_KEY);
  return v === "hi" ? "hi" : "en";
}
export function setLang(l: Lang) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANG_KEY, l);
  window.dispatchEvent(new CustomEvent("peacecode-lang"));
}
export function useLang(): [Lang, (l: Lang) => void] {
  const [l, setL] = useState<Lang>(() => getLang());
  useEffect(() => {
    const sync = () => setL(getLang());
    window.addEventListener("peacecode-lang", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("peacecode-lang", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [l, (nx: Lang) => setLang(nx)];
}

// ─── Translation cache ─────────────────────────────────────
type Cache = { hi: Record<string, string> };
function readCache(): Cache {
  if (typeof window === "undefined") return { hi: {} };
  try {
    const s = localStorage.getItem(CACHE_KEY);
    return s ? (JSON.parse(s) as Cache) : { hi: {} };
  } catch { return { hi: {} }; }
}
function writeCache(c: Cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

// Bulk-translate any missing strings, then return a lookup.
async function ensureTranslated(strings: string[]): Promise<Record<string, string>> {
  const cache = readCache();
  const missing = Array.from(new Set(strings.filter(s => s && !cache.hi[s])));
  if (missing.length === 0) return cache.hi;

  // batch to keep gateway calls small
  const CHUNK = 40;
  for (let i = 0; i < missing.length; i += CHUNK) {
    const batch = missing.slice(i, i + CHUNK);
    try {
      const res = await translateResourcesBatch({ data: { texts: batch, target: "hi" } });
      res.translations.forEach((t, idx) => { cache.hi[batch[idx]] = t; });
      writeCache(cache);
    } catch {
      batch.forEach(s => { cache.hi[s] = s; });
    }
  }
  return cache.hi;
}

// Hook: translate resource content on demand.
export function useResourceI18n(resources: Resource[]) {
  const [lang] = useLang();
  const [map, setMap] = useState<Record<string, string>>(() => readCache().hi);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lang !== "hi") return;
    const strings: string[] = [];
    resources.forEach(r => { strings.push(r.title, r.description); });
    AUTHORS.forEach(a => { strings.push(a.name, a.title); });
    const cache = readCache().hi;
    const missing = strings.filter(s => s && !cache[s]);
    if (missing.length === 0) { setMap(cache); return; }
    setLoading(true);
    ensureTranslated(strings).then(m => { setMap(m); setLoading(false); });
  }, [lang, resources]);

  const t = useCallback((s: string): string => {
    if (lang === "en" || !s) return s;
    return map[s] || s;
  }, [lang, map]);

  return { lang, t, loading };
}

// Translate a single string using cache; returns original if missing.
export function tCached(s: string, lang: Lang): string {
  if (lang === "en" || !s) return s;
  return readCache().hi[s] || s;
}

// Localized selectors used by search:
export function localizedResourceText(r: Resource, lang: Lang): string {
  const authorName = AUTHORS.find(a => a.id === r.authorId)?.name || "";
  if (lang === "en") {
    return [r.title, r.description, r.tags.join(" "), FORMAT_LABELS[r.format], r.category, authorName].join(" ");
  }
  const c = readCache().hi;
  return [
    c[r.title] || r.title,
    c[r.description] || r.description,
    r.tags.join(" "),
    FORMAT_HI[r.format],
    CATEGORY_HI[r.category],
    c[authorName] || authorName,
  ].join(" ");
}

// Language-aware search — mirrors resources-store.search but scopes the text
// index to the active language ("match only active language" per spec).
export function searchLocalized(
  q: string,
  lang: Lang,
  filters: {
    category?: CategorySlug | "all";
    format?: ResourceFormat | "all";
    difficulty?: Difficulty | "all";
    saved?: boolean;
    completed?: boolean;
    sort?: string;
  } = {},
  storeSnap?: { bookmarks: string[]; completed: string[] },
): Resource[] {
  const query = q.trim().toLowerCase();
  let list = RESOURCES.filter(r => {
    if (filters.category && filters.category !== "all" && r.category !== filters.category) return false;
    if (filters.format && filters.format !== "all" && r.format !== filters.format) return false;
    if (filters.difficulty && filters.difficulty !== "all" && r.difficulty !== filters.difficulty) return false;
    if (filters.saved && !storeSnap?.bookmarks.includes(r.id)) return false;
    if (filters.completed && !storeSnap?.completed.includes(r.id)) return false;
    if (!query) return true;
    return localizedResourceText(r, lang).toLowerCase().includes(query);
  });

  const cmp: Record<string, (a: Resource, b: Resource) => number> = {
    trending:  (a, b) => Number(b.trending) - Number(a.trending) || b.views - a.views,
    newest:    (a, b) => b.publishedAt.localeCompare(a.publishedAt),
    views:     (a, b) => b.views - a.views,
    likes:     (a, b) => b.likes - a.likes,
    rating:    (a, b) => b.rating - a.rating,
    shortest:  (a, b) => a.minutes - b.minutes,
    longest:   (a, b) => b.minutes - a.minutes,
    az:        (a, b) => {
      const c = readCache().hi;
      const at = lang === "hi" ? (c[a.title] || a.title) : a.title;
      const bt = lang === "hi" ? (c[b.title] || b.title) : b.title;
      return at.localeCompare(bt, lang === "hi" ? "hi" : "en");
    },
    recommended: () => 0,
  };
  const key = filters.sort || "recommended";
  return list.sort(cmp[key] || cmp.recommended);
}

// Translate a query typed in any language to the active language for matching.
export async function normalizeQuery(q: string, lang: Lang): Promise<string> {
  if (lang === "en" || !q.trim()) return q;
  // If already contains Devanagari, keep it
  if (/[\u0900-\u097F]/.test(q)) return q;
  try {
    const res = await translateQuery({ data: { q, target: "hi" } });
    return res.text || q;
  } catch { return q; }
}

export { DIFFICULTIES };
