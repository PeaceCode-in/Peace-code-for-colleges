// Report model + exporters (xlsx, csv, pdf). Client-side only.
// All numbers are computed once via buildReportModel(); every exporter
// reads that model — no re-derivation.

import * as XLSX from "xlsx";
import {
  SECTIONS,
  orderSections,
  COLUMN_LABELS,
  type SectionId,
  type SectionDef,
} from "./report-schema";
import { narrativeFor } from "./report-narratives";
import { getExecutiveSnapshot, getEarlyWarningSnapshot, type EwWindowKey } from "./dashboard-mock";
import { RISK_RULES, RISK_TIER_LABEL, type RiskTier } from "./clinical-scales";

// Reports enforce k ≥ 10 (stricter than the app-wide floor of 5).
export const K_MIN = 10;

export type WindowKey = "4w" | "12w" | "26w" | "52w" | "term" | "ay";
export const WINDOWS: { key: WindowKey; label: string; weeks: number }[] = [
  { key: "4w",  label: "4 weeks",  weeks: 4 },
  { key: "12w", label: "12 weeks", weeks: 12 },
  { key: "26w", label: "26 weeks", weeks: 26 },
  { key: "52w", label: "52 weeks", weeks: 52 },
  { key: "term", label: "Term",     weeks: 16 },
  { key: "ay",   label: "Academic year", weeks: 40 },
];

export type SegmentKey = "inst" | "school" | "year" | "residency";
export const SEGMENTS: { key: SegmentKey; label: string }[] = [
  { key: "inst",      label: "Institution" },
  { key: "school",    label: "by School" },
  { key: "year",      label: "by Year" },
  { key: "residency", label: "by Residency" },
];

export type TemplateKey = "board" | "term" | "care" | "benchmark" | "custom";
export const TEMPLATES: {
  key: TemplateKey;
  label: string;
  sections: SectionId[];
  bench?: boolean;
}[] = [
  { key: "board",     label: "Board snapshot",         sections: ["cover", "executive", "wellbeing", "care", "methodology"] },
  { key: "term",      label: "Term wellbeing review",  sections: ["cover", "executive", "engagement", "wellbeing", "earlyWarning", "methodology"] },
  { key: "care",      label: "Care-routing performance", sections: ["cover", "executive", "care", "earlyWarning", "methodology"] },
  { key: "benchmark", label: "Cohort benchmark",       sections: ["cover", "executive", "wellbeing", "benchmark", "methodology"], bench: true },
  { key: "custom",    label: "Custom",                 sections: ["cover", "executive", "engagement", "wellbeing", "care", "earlyWarning", "methodology"] },
];

export type FormatKey = "pdf" | "xlsx" | "csv";

export interface ReportConfig {
  template: TemplateKey;
  window: WindowKey;
  segments: SegmentKey[];
  sections: SectionId[];
  format: FormatKey;
  benchmark: boolean;
  institutionName: string;
  institutionId: string;
}

export interface ReportTable {
  columns: string[];       // whitelisted keys
  rows: Array<Record<string, string | number>>;
  suppressedRows: number;  // rows omitted because n < k
}

export interface ReportSection {
  id: SectionId;
  title: string;
  narrative?: string[];
  table?: ReportTable;
  chartSummary?: string;
}

export interface ReportModel {
  id: string;
  generatedAt: string;
  config: ReportConfig;
  headline: {
    activeStudents: number;
    wellnessIndex: number;
    wellnessDelta: number;
    moderatePlusPct: number;
    improvementPct: number;
  };
  sections: ReportSection[];
  totalRows: number;
  suppressedRows: number;
}

// ─── helpers ─────────────────────────────────────────────────────
export function labelForWindow(w: WindowKey): string {
  return WINDOWS.find((x) => x.key === w)?.label ?? w;
}
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }
function fmtDelta(n: number) { return `${n >= 0 ? "+" : ""}${n.toFixed(1)}`; }

function keepIfK<T extends { n: number | string }>(rows: T[]): { kept: T[]; dropped: number } {
  let dropped = 0;
  const kept = rows.filter((r) => {
    if (typeof r.n === "number" && r.n < K_MIN) { dropped++; return false; }
    return true;
  });
  return { kept, dropped };
}

// ─── main builder ────────────────────────────────────────────────
export function buildReportModel(config: ReportConfig): ReportModel {
  const snap = getExecutiveSnapshot();
  const ewKey: EwWindowKey =
    config.window === "4w" || config.window === "12w" ? "30d"
    : config.window === "26w" ? "90d"
    : "term";
  const ew = getEarlyWarningSnapshot(ewKey);

  const weeks = WINDOWS.find((x) => x.key === config.window)?.weeks ?? 12;

  // headline numbers used across sections & narrative
  const activeStudents = snap.activeStudents.n;
  const wellnessIndex = snap.wellnessIndex.current;
  const wellnessDelta = snap.wellnessIndex.deltaVsLastWeek;
  const moderatePlusPct = 24.6;
  const improvementPct = 38.2;

  const order = orderSections(config.sections);
  const sections: ReportSection[] = [];
  let totalRows = 0;
  let suppressedRows = 0;

  for (const id of order) {
    const def = SECTIONS.find((s) => s.id === id)!;
    if (id === "benchmark" && !config.benchmark) continue;
    const built = buildSection(def, {
      snap, ew, weeks, config,
      headline: { activeStudents, wellnessIndex, wellnessDelta, moderatePlusPct, improvementPct },
    });
    if (built.table) {
      totalRows += built.table.rows.length;
      suppressedRows += built.table.suppressedRows;
    }
    sections.push(built);
  }

  return {
    id: `rpt_${Date.now().toString(36)}`,
    generatedAt: new Date().toISOString(),
    config,
    headline: { activeStudents, wellnessIndex, wellnessDelta, moderatePlusPct, improvementPct },
    sections,
    totalRows,
    suppressedRows,
  };
}

interface BuildCtx {
  snap: ReturnType<typeof getExecutiveSnapshot>;
  ew: ReturnType<typeof getEarlyWarningSnapshot>;
  weeks: number;
  config: ReportConfig;
  headline: ReportModel["headline"];
}

function buildSection(def: SectionDef, ctx: BuildCtx): ReportSection {
  switch (def.id) {
    case "cover":
      return { id: def.id, title: def.title };
    case "executive": {
      const rows = [
        { metric: "Active students", value: ctx.headline.activeStudents, delta: fmtDelta(ctx.snap.activeStudents.trendDeltaPct) + "%" },
        { metric: "Wellbeing index", value: ctx.headline.wellnessIndex, delta: fmtDelta(ctx.headline.wellnessDelta) },
        { metric: "% Moderate+",     value: fmtPct(ctx.headline.moderatePlusPct), delta: "—" },
        { metric: "% Improved",      value: fmtPct(ctx.headline.improvementPct),  delta: "—" },
      ];
      return {
        id: def.id, title: def.title,
        narrative: narrativeFor({
          activeStudents: ctx.headline.activeStudents,
          wellnessIndex: ctx.headline.wellnessIndex,
          wellnessDelta: ctx.headline.wellnessDelta,
          moderatePlusPct: ctx.headline.moderatePlusPct,
          improvementPct: ctx.headline.improvementPct,
          windowLabel: labelForWindow(ctx.config.window),
        }),
        table: { columns: def.columns, rows, suppressedRows: 0 },
      };
    }
    case "engagement": {
      const raw = ctx.snap.wellnessTrend.slice(-Math.min(ctx.weeks, 12)).map((p, i) => {
        const active = Math.round(ctx.headline.activeStudents * (0.9 + i * 0.005));
        return {
          week: p.week,
          activeStudents: active,
          sustainedUsePct: Math.round((52 + i * 0.6) * 10) / 10,
          avgSessionsPerActive: Math.round((1.6 + i * 0.02) * 100) / 100,
          n: active,
        };
      });
      const { kept, dropped } = keepIfK(raw);
      return {
        id: def.id, title: def.title,
        table: { columns: def.columns, rows: kept.map(({ n: _n, ...r }) => r), suppressedRows: dropped },
        chartSummary: `Weekly active students rose from ${raw[0]?.activeStudents.toLocaleString() ?? "—"} to ${raw[raw.length-1]?.activeStudents.toLocaleString() ?? "—"} across ${raw.length} weeks.`,
      };
    }
    case "wellbeing": {
      const raw = ctx.snap.wellnessTrend.slice(-Math.min(ctx.weeks, 12)).map((p, i) => ({
        week: p.week,
        meanPhq9: Math.round((9.2 - i * 0.04) * 10) / 10,
        meanGad7: Math.round((8.6 - i * 0.03) * 10) / 10,
        moderatePlusPct: Math.round((26 - i * 0.12) * 10) / 10,
        n: Math.round(ctx.headline.activeStudents * 0.42),
      }));
      const { kept, dropped } = keepIfK(raw);
      return {
        id: def.id, title: def.title,
        table: { columns: def.columns, rows: kept.map(({ n: _n, ...r }) => r), suppressedRows: dropped },
        chartSummary: `Mean PHQ-9 trended from ${raw[0]?.meanPhq9} to ${raw[raw.length-1]?.meanPhq9}; mean GAD-7 from ${raw[0]?.meanGad7} to ${raw[raw.length-1]?.meanGad7}.`,
      };
    }
    case "care": {
      const stages = [
        { key: "detected", label: "Detected",     n: 1620 },
        { key: "nudged",   label: "Nudged",       n: 1410 },
        { key: "opened",   label: "Opened",       n: 980  },
        { key: "offered",  label: "Slot offered", n: 720  },
        { key: "accepted", label: "Accepted",     n: 540  },
        { key: "completed",label: "Completed",    n: 402  },
      ];
      const rows = stages.map((s, i) => ({
        stage: s.label,
        n: s.n,
        conversionPct: i === 0 ? 100 : Math.round((s.n / stages[0].n) * 1000) / 10,
      }));
      const { kept, dropped } = keepIfK(rows.map((r) => ({ ...r })));
      return {
        id: def.id, title: def.title,
        table: { columns: def.columns, rows: kept, suppressedRows: dropped },
        chartSummary: `End-to-end conversion Detected → Completed: ${rows[rows.length-1].conversionPct}%.`,
      };
    }
    case "earlyWarning": {
      const tiers = Object.keys(RISK_RULES) as RiskTier[];
      const latest = ctx.ew.riskTierSeries.inst[ctx.ew.riskTierSeries.inst.length - 1];
      const raw = tiers.map((t) => ({
        tier: RISK_TIER_LABEL[t],
        n: (latest?.[t] as number | undefined) ?? 0,
        medianHoursToContact: Math.round(ctx.ew.timeToContact.medianHours * (t === "high" ? 0.7 : t === "item9" ? 0.5 : 1)),
        reassessmentPct: Math.round(ctx.ew.reassessmentAdherence.within28d * (t === "overdue" ? 0.6 : 1) * 10) / 10,
      }));
      const { kept, dropped } = keepIfK(raw);
      return {
        id: def.id, title: def.title,
        table: { columns: def.columns, rows: kept as Array<Record<string, string | number>>, suppressedRows: dropped },
        chartSummary: `Median time-to-first-contact across tiers: ${Math.round(kept.reduce((a, r) => a + r.medianHoursToContact, 0) / Math.max(1, kept.length))} h.`,
      };
    }
    case "benchmark": {
      const rows = [
        { metric: "Wellbeing index", institution: ctx.headline.wellnessIndex, peer: 67.4, national: 65.1, n: ctx.headline.activeStudents },
        { metric: "% Moderate+",     institution: ctx.headline.moderatePlusPct, peer: 27.1, national: 29.3, n: ctx.headline.activeStudents },
        { metric: "% Improved",      institution: ctx.headline.improvementPct,  peer: 34.8, national: 32.6, n: ctx.headline.activeStudents },
        { metric: "Sustained use %", institution: 58.4, peer: 51.2, national: 47.9, n: ctx.headline.activeStudents },
      ];
      const { kept, dropped } = keepIfK(rows);
      return {
        id: def.id, title: def.title,
        table: { columns: def.columns, rows: kept.map(({ n: _n, ...r }) => r), suppressedRows: dropped },
      };
    }
    case "methodology": {
      const items = [
        { item: "Anonymity threshold", value: `k = ${K_MIN} (rows below suppressed)` },
        { item: "Window",              value: labelForWindow(ctx.config.window) },
        { item: "Segments",            value: ctx.config.segments.length ? ctx.config.segments.join(", ") : "Institution-wide" },
        { item: "Format",              value: ctx.config.format.toUpperCase() },
        { item: "Benchmark included",  value: ctx.config.benchmark ? "Yes" : "No" },
        { item: "PHQ-9 cutoffs",       value: "0–4 min · 5–9 mild · 10–14 mod · 15–19 mod-severe · 20+ severe" },
        { item: "GAD-7 cutoffs",       value: "0–4 min · 5–9 mild · 10–14 mod · 15+ severe" },
        ...RISK_RULES.map((r) => ({ item: `Rule · ${r.label}`, value: r.description })),
        { item: "Institution ID",      value: ctx.config.institutionId },
        { item: "Generated at",        value: new Date().toISOString() },
      ];
      return {
        id: def.id, title: def.title,
        table: { columns: def.columns, rows: items, suppressedRows: 0 },
      };
    }
  }
}

// ─── exporters ───────────────────────────────────────────────────
function tableToAoa(t: ReportTable): (string | number)[][] {
  const header = t.columns.map((c) => COLUMN_LABELS[c] ?? c);
  const body = t.rows.map((r) => t.columns.map((c) => r[c] ?? ""));
  return [header, ...body];
}

export function exportXlsx(model: ReportModel) {
  const wb = XLSX.utils.book_new();
  // cover
  const cover = [
    ["PeaceCode for Colleges — Institutional Report"],
    ["Institution", model.config.institutionName],
    ["Institution ID", model.config.institutionId],
    ["Template", TEMPLATES.find((t) => t.key === model.config.template)?.label ?? model.config.template],
    ["Window", labelForWindow(model.config.window)],
    ["Segments", model.config.segments.join(", ") || "Institution-wide"],
    ["Generated at", model.generatedAt],
    ["k-threshold", String(K_MIN)],
    ["Rows suppressed (k<10)", model.suppressedRows],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cover), "Cover");
  for (const s of model.sections) {
    if (!s.table || s.id === "cover") continue;
    const ws = XLSX.utils.aoa_to_sheet(tableToAoa(s.table));
    XLSX.utils.book_append_sheet(wb, ws, s.title.slice(0, 31));
  }
  XLSX.writeFile(wb, filenameFor(model, "xlsx"));
}

export function exportCsv(model: ReportModel) {
  const lines: string[] = [];
  const push = (r: (string | number)[]) => lines.push(r.map((v) => csvCell(v)).join(","));
  lines.push(`# PeaceCode for Colleges — Institutional Report`);
  lines.push(`# Institution: ${model.config.institutionName}`);
  lines.push(`# Institution ID: ${model.config.institutionId}`);
  lines.push(`# Window: ${labelForWindow(model.config.window)}`);
  lines.push(`# Generated: ${model.generatedAt}`);
  lines.push(`# k-threshold: ${K_MIN}   Rows suppressed: ${model.suppressedRows}`);
  lines.push("");
  for (const s of model.sections) {
    if (!s.table || s.id === "cover") continue;
    lines.push(`# ${s.title}`);
    for (const row of tableToAoa(s.table)) push(row);
    if (s.table.suppressedRows > 0) {
      push([`# ${s.table.suppressedRows} row(s) omitted (k<${K_MIN})`]);
    }
    lines.push("");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filenameFor(model, "csv"));
}

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function filenameFor(m: ReportModel, ext: string): string {
  const d = new Date(m.generatedAt).toISOString().slice(0, 10);
  return `peacecode-${m.config.template}-${d}.${ext}`;
}

export function exportPdf(model: ReportModel) {
  try {
    sessionStorage.setItem("pc.reports.pending.v1", JSON.stringify(model));
  } catch { /* ignore */ }
  const w = window.open(`/reports/print?token=${model.id}`, "_blank");
  if (!w) alert("Popup blocked — please allow popups for this site to print reports.");
}

// ─── audit trail ─────────────────────────────────────────────────
export interface AuditRecord {
  id: string;
  timestamp: string;
  template: TemplateKey;
  window: WindowKey;
  segments: SegmentKey[];
  sections: SectionId[];
  format: FormatKey;
  rowCount: number;
  suppressedRows: number;
  adminInstitutionId: string;
}
const AUDIT_KEY = "pc.reports.audit.v1";
export function appendAudit(model: ReportModel): AuditRecord {
  const rec: AuditRecord = {
    id: model.id,
    timestamp: model.generatedAt,
    template: model.config.template,
    window: model.config.window,
    segments: model.config.segments,
    sections: model.sections.map((s) => s.id),
    format: model.config.format,
    rowCount: model.totalRows,
    suppressedRows: model.suppressedRows,
    adminInstitutionId: model.config.institutionId,
  };
  try {
    const arr: AuditRecord[] = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
    arr.unshift(rec);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(arr.slice(0, 50)));
  } catch { /* ignore */ }
  return rec;
}
export function readAudit(): AuditRecord[] {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); }
  catch { return []; }
}

// ─── templates persistence ───────────────────────────────────────
const TEMPLATE_KEY = "pc.reports.templates.v1";
export interface SavedTemplate { name: string; config: ReportConfig }
export function readTemplates(): SavedTemplate[] {
  try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); }
  catch { return []; }
}
export function saveTemplate(t: SavedTemplate) {
  const arr = readTemplates().filter((x) => x.name !== t.name);
  arr.unshift(t);
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(arr.slice(0, 20)));
}
