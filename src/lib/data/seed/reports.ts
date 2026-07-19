import { mulberry32, rPick, SEED_ROOT, SEED_TODAY } from "./rng";

const TODAY = new Date(SEED_TODAY + "T00:00:00Z");
const TEMPLATES = ["board-quarterly", "wellbeing-monthly", "risk-weekly", "benchmark-annual", "custom"] as const;

export function seedReportHistory() {
  const rand = mulberry32(SEED_ROOT ^ 0xE1);
  const out = [];
  for (let i = 0; i < 6; i++) {
    const daysAgo = i * 12 + Math.floor(rand() * 4);
    const d = new Date(TODAY);
    d.setUTCDate(d.getUTCDate() - daysAgo);
    const rowCount = 40 + Math.floor(rand() * 60);
    const suppressedRows = Math.floor(rand() * 6);
    out.push({
      id: `rep-${i + 1}`,
      template: rPick(rand, TEMPLATES),
      generatedAtISO: d.toISOString(),
      windowFrom: (() => {
        const f = new Date(d); f.setUTCDate(f.getUTCDate() - 30); return f.toISOString().slice(0, 10);
      })(),
      windowTo: d.toISOString().slice(0, 10),
      rowCount,
      suppressedRows,
      author: "ka•••@iitb.ac.in",
      format: rPick(rand, ["pdf", "xlsx", "csv"] as const),
    });
  }
  return out;
}
