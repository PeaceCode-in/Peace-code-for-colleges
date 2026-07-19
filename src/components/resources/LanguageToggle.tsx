import { Languages } from "lucide-react";
import { useLang, UI } from "@/lib/resources-i18n";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const [lang, setLang] = useLang();
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full p-1"
      style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}
      role="group"
      aria-label={UI[lang].languageLabel}
    >
      {!compact && (
        <Languages className="w-3.5 h-3.5 ml-2 mr-0.5 opacity-60" />
      )}
      <button
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className="px-3 py-1 rounded-full text-[11px] tracking-wide transition"
        style={{
          background: lang === "en" ? "var(--pc-soft)" : "transparent",
          color: lang === "en" ? "var(--pc-primary)" : "var(--pc-muted)",
        }}
      >
        {UI.en.langEn}
      </button>
      <button
        onClick={() => setLang("hi")}
        aria-pressed={lang === "hi"}
        className="px-3 py-1 rounded-full text-[11px] transition"
        style={{
          background: lang === "hi" ? "var(--pc-soft)" : "transparent",
          color: lang === "hi" ? "var(--pc-primary)" : "var(--pc-muted)",
          fontFamily: '"Noto Sans Devanagari", "Inter", sans-serif',
        }}
      >
        {UI.hi.langHi}
      </button>
    </div>
  );
}
