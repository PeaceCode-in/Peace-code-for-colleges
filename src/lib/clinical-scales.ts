// Validated PHQ-9 / GAD-7 severity bands. Single source of truth — no other
// file may hardcode a cutoff. Colours reference --pc-* tokens so every band
// re-themes with Appearance settings.
//
// PHQ-9: Kroenke, Spitzer, Williams (2001). 0-4 Minimal, 5-9 Mild,
//        10-14 Moderate, 15-19 Moderately Severe, 20-27 Severe.
// GAD-7: Spitzer et al. (2006). 0-4 Minimal, 5-9 Mild, 10-14 Moderate,
//        15-21 Severe.
export type ScaleId = "phq9" | "gad7";

export type BandKey =
  | "minimal"
  | "mild"
  | "moderate"
  | "modsevere"
  | "severe";

export interface Band {
  key: BandKey;
  label: string;
  min: number;
  max: number;
  /** CSS var for the band swatch. Never used as text color alone — always
   *  paired with a label for accessibility (never colour-only). */
  color: string;
  description: string;
}

export const PHQ9_MAX = 27;
export const GAD7_MAX = 21;

export const PHQ9_BANDS: readonly Band[] = [
  { key: "minimal",   label: "Minimal",           min: 0,  max: 4,  color: "var(--pc-good)",       description: "0–4 · minimal depressive symptoms" },
  { key: "mild",      label: "Mild",              min: 5,  max: 9,  color: "var(--pc-accent)",     description: "5–9 · mild depressive symptoms" },
  { key: "moderate",  label: "Moderate",          min: 10, max: 14, color: "var(--pc-accent-2)",   description: "10–14 · moderate — clinical follow-up advised" },
  { key: "modsevere", label: "Moderately severe", min: 15, max: 19, color: "color-mix(in oklab, var(--pc-warn) 78%, var(--pc-accent-2))", description: "15–19 · moderately severe" },
  { key: "severe",    label: "Severe",            min: 20, max: 27, color: "var(--pc-warn)",       description: "20–27 · severe · active treatment recommended" },
] as const;

export const GAD7_BANDS: readonly Band[] = [
  { key: "minimal",  label: "Minimal",  min: 0,  max: 4,  color: "var(--pc-good)",     description: "0–4 · minimal anxiety symptoms" },
  { key: "mild",     label: "Mild",     min: 5,  max: 9,  color: "var(--pc-accent)",   description: "5–9 · mild anxiety" },
  { key: "moderate", label: "Moderate", min: 10, max: 14, color: "var(--pc-accent-2)", description: "10–14 · moderate anxiety" },
  { key: "severe",   label: "Severe",   min: 15, max: 21, color: "var(--pc-warn)",     description: "15–21 · severe · active treatment recommended" },
] as const;

export function bandsFor(scale: ScaleId): readonly Band[] {
  return scale === "phq9" ? PHQ9_BANDS : GAD7_BANDS;
}

export function bandForScore(scale: ScaleId, score: number): Band {
  const bs = bandsFor(scale);
  for (const b of bs) if (score >= b.min && score <= b.max) return b;
  return bs[bs.length - 1];
}

/** The clinically elevated threshold for triage triggers. */
export const ELEVATED_MIN: Record<ScaleId, number> = { phq9: 10, gad7: 10 };

/** Minimum score drop to count as an improvement (reliable change proxy). */
export const IMPROVEMENT_DROP = 5;

export const SCALE_LABEL: Record<ScaleId, string> = {
  phq9: "PHQ-9 (depression)",
  gad7: "GAD-7 (anxiety)",
};

export const SCALE_MAX: Record<ScaleId, number> = { phq9: PHQ9_MAX, gad7: GAD7_MAX };
