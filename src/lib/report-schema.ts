// Whitelist of exportable columns per report section. Anything not listed
// here is dropped at build time — no PII, no free text, no student IDs.

export type SectionId =
  | "cover"
  | "executive"
  | "engagement"
  | "wellbeing"
  | "care"
  | "earlyWarning"
  | "benchmark"
  | "methodology";

export interface SectionDef {
  id: SectionId;
  title: string;
  columns: string[]; // aggregate-only column keys
  optional?: boolean;
}

export const SECTIONS: SectionDef[] = [
  { id: "cover",        title: "Cover",                 columns: [] },
  { id: "executive",    title: "Executive summary",     columns: ["metric", "value", "delta"] },
  { id: "engagement",   title: "Engagement",            columns: ["week", "activeStudents", "sustainedUsePct", "avgSessionsPerActive"] },
  { id: "wellbeing",    title: "Wellbeing signals",     columns: ["week", "meanPhq9", "meanGad7", "moderatePlusPct"] },
  { id: "care",         title: "Care routing",          columns: ["stage", "n", "conversionPct"] },
  { id: "earlyWarning", title: "Early warning",         columns: ["tier", "n", "medianHoursToContact", "reassessmentPct"] },
  { id: "benchmark",    title: "Benchmark",             columns: ["metric", "institution", "peer", "national"], optional: true },
  { id: "methodology",  title: "Methodology & glossary", columns: ["item", "value"] },
];

export const FIXED_ORDER: SectionId[] = SECTIONS.map((s) => s.id);

export function orderSections(selected: SectionId[]): SectionId[] {
  const s = new Set(selected);
  // Cover + methodology are always present.
  s.add("cover");
  s.add("methodology");
  return FIXED_ORDER.filter((id) => s.has(id));
}

// Human labels for column headers in exports & preview tables.
export const COLUMN_LABELS: Record<string, string> = {
  metric: "Metric",
  value: "Value",
  delta: "Δ vs prior",
  week: "Week",
  activeStudents: "Active students",
  sustainedUsePct: "Sustained use %",
  avgSessionsPerActive: "Sessions / active",
  meanPhq9: "Mean PHQ-9",
  meanGad7: "Mean GAD-7",
  moderatePlusPct: "% Moderate+",
  stage: "Stage",
  n: "n",
  conversionPct: "Conversion %",
  tier: "Risk tier",
  medianHoursToContact: "Median hrs to contact",
  reassessmentPct: "Reassessment %",
  institution: "This institution",
  peer: "Peer aggregate",
  national: "National aggregate",
  item: "Item",
  k_suppressed: "k<10 suppressed",
};
