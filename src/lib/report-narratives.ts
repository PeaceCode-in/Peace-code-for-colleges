// Deterministic templated sentences for the executive summary. No LLM —
// numeric slot-fills only. Keep the tone plain and board-room appropriate.

export interface NarrativeInput {
  activeStudents: number;
  wellnessIndex: number;
  wellnessDelta: number; // vs prior period, points
  moderatePlusPct: number;
  improvementPct: number;
  windowLabel: string;
}

export function narrativeFor(x: NarrativeInput): string[] {
  const dir = x.wellnessDelta === 0 ? "held steady" : x.wellnessDelta > 0 ? "rose" : "declined";
  const mag = Math.abs(x.wellnessDelta).toFixed(1);
  const l1 =
    `Across ${x.windowLabel.toLowerCase()}, ${x.activeStudents.toLocaleString()} students engaged with PeaceCode. ` +
    `The institutional wellbeing index ${dir} by ${mag} point${mag === "1.0" ? "" : "s"} to ${x.wellnessIndex.toFixed(1)}.`;
  const l2 =
    `${x.moderatePlusPct.toFixed(1)}% of respondents scored in the moderate-or-higher range on PHQ-9 or GAD-7, ` +
    `and ${x.improvementPct.toFixed(1)}% showed measurable improvement from their prior screening.`;
  const l3 =
    `Every figure in this report is aggregate-only. Rows below the k=10 anonymity threshold have been suppressed.`;
  return [l1, l2, l3];
}
