import { useEffect } from "react";
import { GlassCard } from "@/components/college/primitives";
import {
  TEMPLATES, WINDOWS, SEGMENTS,
  type TemplateKey, type WindowKey, type SegmentKey, type FormatKey,
  saveTemplate,
} from "@/lib/report-export";
import { SECTIONS, type SectionId } from "@/lib/report-schema";
import { Download, Save, FileText, FileSpreadsheet, FileType2 } from "lucide-react";

export interface BuilderState {
  template: TemplateKey;
  window: WindowKey;
  segments: SegmentKey[];
  sections: SectionId[];
  format: FormatKey;
  benchmark: boolean;
}

export function ReportBuilder({
  state,
  onChange,
  onGenerate,
  disabled,
  disabledReason,
}: {
  state: BuilderState;
  onChange: (next: BuilderState) => void;
  onGenerate: () => void;
  disabled: boolean;
  disabledReason?: string;
}) {
  const update = (patch: Partial<BuilderState>) => onChange({ ...state, ...patch });

  const toggleArr = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const onSaveTemplate = () => {
    const name = window.prompt("Save template as:");
    if (!name) return;
    saveTemplate({ name, config: { ...state, template: state.template, institutionName: "", institutionId: "" } as never });
  };

  // Ctrl/Cmd+Enter → generate, Ctrl/Cmd+S → save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "Enter") { e.preventDefault(); if (!disabled) onGenerate(); }
      else if (e.key.toLowerCase() === "s") { e.preventDefault(); onSaveTemplate(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, disabled, onGenerate]);

  return (
    <GlassCard className="p-5 space-y-5" data-noexport>
      <Field label="Template">
        <Segmented
          options={TEMPLATES.map((t) => ({ value: t.key, label: t.label }))}
          value={state.template}
          onChange={(v) => {
            const tpl = TEMPLATES.find((t) => t.key === v)!;
            update({ template: v as TemplateKey, sections: tpl.sections, benchmark: tpl.bench ?? false });
          }}
        />
      </Field>

      <Field label="Window">
        <Segmented
          options={WINDOWS.map((w) => ({ value: w.key, label: w.label }))}
          value={state.window}
          onChange={(v) => update({ window: v as WindowKey })}
        />
      </Field>

      <Field label="Segments" hint="Any segment producing rows below k=10 is dropped from the export.">
        <div className="flex flex-wrap gap-1.5">
          {SEGMENTS.map((s) => {
            const on = state.segments.includes(s.key);
            return (
              <button
                key={s.key}
                onClick={() => update({ segments: toggleArr(state.segments, s.key) })}
                className="px-2.5 py-1 rounded-full text-[11.5px]"
                style={{
                  background: on ? "color-mix(in oklab, var(--pc-primary) 12%, transparent)" : "var(--pc-surface2)",
                  color: on ? "var(--pc-primary)" : "var(--pc-ink-2)",
                  border: `1px solid ${on ? "var(--pc-primary)" : "var(--pc-border)"}`,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Sections">
        <div className="space-y-1.5">
          {SECTIONS.filter((s) => s.id !== "cover" && s.id !== "methodology" && s.id !== "benchmark").map((s) => {
            const on = state.sections.includes(s.id);
            return (
              <label key={s.id} className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--pc-ink)" }}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => update({ sections: toggleArr(state.sections, s.id) })}
                />
                {s.title}
              </label>
            );
          })}
          <div className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
            Cover and methodology are always included. Order is fixed.
          </div>
        </div>
      </Field>

      <Field label="Format">
        <Segmented
          options={[
            { value: "pdf", label: "PDF", icon: <FileType2 className="h-3 w-3" /> },
            { value: "xlsx", label: "XLSX", icon: <FileSpreadsheet className="h-3 w-3" /> },
            { value: "csv", label: "CSV", icon: <FileText className="h-3 w-3" /> },
          ]}
          value={state.format}
          onChange={(v) => update({ format: v as FormatKey })}
        />
      </Field>

      <Field label="Benchmark comparison">
        <label className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--pc-ink)" }}>
          <input
            type="checkbox"
            checked={state.benchmark}
            onChange={(e) => update({ benchmark: e.target.checked })}
          />
          Include peer + national aggregate columns
        </label>
      </Field>

      <div className="pt-2 space-y-2" style={{ borderTop: "1px solid var(--pc-border)" }}>
        <button
          onClick={onGenerate}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium"
          style={{
            background: disabled ? "var(--pc-surface2)" : "var(--pc-primary)",
            color: disabled ? "var(--pc-muted)" : "var(--pc-on-primary, white)",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <Download className="h-4 w-4" /> Generate report
        </button>
        {disabled && disabledReason && (
          <p className="text-[11px] text-center" style={{ color: "var(--pc-muted)" }}>{disabledReason}</p>
        )}
        <button
          onClick={onSaveTemplate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[12px]"
          style={{
            background: "var(--pc-surface2)",
            color: "var(--pc-ink-2)",
            border: "1px solid var(--pc-border)",
          }}
        >
          <Save className="h-3.5 w-3.5" /> Save as template
        </button>
        <p className="text-[10.5px] text-center" style={{ color: "var(--pc-muted)" }}>
          ⌘/Ctrl + Enter to generate · ⌘/Ctrl + S to save
        </p>
      </div>
    </GlassCard>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[10.5px] uppercase mb-2"
        style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
      >
        {label}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>{hint}</p>}
    </div>
  );
}

function Segmented({
  options, value, onChange,
}: {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-1 p-1 rounded-lg"
      style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px]"
            style={{
              background: on ? "var(--pc-surface)" : "transparent",
              color: on ? "var(--pc-ink)" : "var(--pc-ink-2)",
              boxShadow: on ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              fontFamily: "var(--font-sans)",
            }}
          >
            {o.icon}{o.label}
          </button>
        );
      })}
    </div>
  );
}
