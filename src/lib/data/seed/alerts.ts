import { mulberry32, rPick, SEED_ROOT, SEED_TODAY } from "./rng";

const TODAY = new Date(SEED_TODAY + "T00:00:00Z");

const TITLES = [
  "PHQ-9 spike in Computer Science, Y2",
  "Session no-show rate above threshold — Business",
  "GAD-7 severe band up 14% week-over-week",
  "Overdue reassessments cleared — Health Sciences",
  "First-gen cohort engagement dipped",
  "Item-9 endorsements: 3 new this week",
  "Peer-bridge channel outperformed baseline",
  "Counsellor capacity below 60% utilisation",
  "Wellness heatmap: Fri evenings hot",
  "Screening completion rate at 82%",
  "Term-end pulse holding at 71.4",
  "Referral acceptance rate improved",
] as const;

export function seedAlerts(): Array<{
  id: string;
  severity: "info" | "warn" | "critical";
  title: string;
  detail: string;
  firedAtISO: string;
}> {
  const rand = mulberry32(SEED_ROOT ^ 0xA1);
  const out: Array<{
    id: string;
    severity: "info" | "warn" | "critical";
    title: string;
    detail: string;
    firedAtISO: string;
  }> = [];
  for (let i = 0; i < TITLES.length; i++) {
    const daysAgo = Math.floor(rand() * 180);
    const d = new Date(TODAY);
    d.setUTCDate(d.getUTCDate() - daysAgo);
    const sev = rPick(rand, ["info", "warn", "critical"] as const);
    out.push({
      id: `sa-${i + 1}`,
      severity: sev,
      title: TITLES[i]!,
      detail: sev === "critical"
        ? "Aggregate signal exceeded institutional threshold. Review the cohort view."
        : sev === "warn"
        ? "Trending toward threshold — monitor over the next reporting cycle."
        : "Positive signal or informational trend; no action required.",
      firedAtISO: d.toISOString(),
    });
  }
  return out.sort((a, b) => b.firedAtISO.localeCompare(a.firedAtISO));
}
