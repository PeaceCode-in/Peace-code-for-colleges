// Departments deep-dive mock. Extends the executive snapshot with a rich
// per-department shape used by /departments. Kept in a sibling file so the
// executive dashboard stays untouched. Same seam contract: swap the body
// of `getDepartmentInsights()` for a fetch call when the backend lands.
//
// No student names, no IDs — only rolled-up counts.
import { CONCERN_TAGS, type ConcernTag } from "./dashboard-mock";

export type YearBand = "All" | "Y1" | "Y2" | "Y3" | "Y4" | "PG";

export type FunnelKey = "invited" | "signed_up" | "active_7d" | "active_30d" | "sustained";
export type RiskBand = "minimal" | "mild" | "moderate" | "severe";
export type RadarAxis =
  | "engagement"
  | "sustainedUse"
  | "phq9Improvement"
  | "gad7Improvement"
  | "sessionCompletion";

export type DepartmentInsight = {
  id: string;
  name: string;
  school: string;
  n: number;                          // active this term
  invited: number;                    // total invited students
  riskPct: number;                    // fraction in moderate+severe
  phq9Series: number[];               // 26 weeks, 0–27 scale
  gad7Series: number[];               // 26 weeks, 0–21 scale
  funnel: Record<FunnelKey, number>;
  riskDist: Record<RiskBand, number>; // student counts summing to n
  themes: { tag: ConcernTag; n: number }[];
  heatmap: number[][];                // [day 0..6][hour 0..23]
  radar: {
    department: Record<RadarAxis, number>; // 0–100
    institution: Record<RadarAxis, number>;
    national: Record<RadarAxis, number>;
  };
};

// ─── Deterministic PRNG per department ─────────────────────────
function prng(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(id: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}
function around(r: () => number, base: number, spread: number) {
  return base + (r() - 0.5) * spread;
}
function nRound(v: number) { return Math.max(0, Math.round(v)); }

// ─── Seed 12 departments across 4 schools ──────────────────────
const DEPT_DEFS: { id: string; name: string; school: string }[] = [
  { id: "cs",     name: "Computer Science",          school: "Engineering" },
  { id: "ee",     name: "Electrical Engineering",     school: "Engineering" },
  { id: "me",     name: "Mechanical Engineering",     school: "Engineering" },
  { id: "civ",    name: "Civil Engineering",          school: "Engineering" },
  { id: "psych",  name: "Psychology",                 school: "Humanities & Social Sciences" },
  { id: "hist",   name: "History",                    school: "Humanities & Social Sciences" },
  { id: "eng",    name: "English & Literature",       school: "Humanities & Social Sciences" },
  { id: "mgmt",   name: "Management Studies",         school: "Management" },
  { id: "fin",    name: "Finance",                    school: "Management" },
  { id: "phys",   name: "Physics",                    school: "Natural Sciences" },
  { id: "chem",   name: "Chemistry",                  school: "Natural Sciences" },
  { id: "bio",    name: "Life Sciences",              school: "Natural Sciences" },
];

export function getDepartmentInsights(): DepartmentInsight[] {
  return DEPT_DEFS.map((d, idx) => {
    const r = prng(hash(d.id) ^ 0x50436c67);

    // Cohort size varies by school. A single small cohort proves suppression.
    const baseN = d.school === "Engineering" ? 900 : d.school === "Management" ? 620 : d.school === "Natural Sciences" ? 380 : 540;
    let n = nRound(around(r, baseN, baseN * 0.35));
    // Force one deliberately-small cohort so the k<10 path is demoable.
    if (d.id === "civ") n = 6;
    const invited = nRound(n * (1 / (0.55 + r() * 0.3)));

    // 26-week PHQ-9 (0–27) and GAD-7 (0–21) averages, drifting gently.
    const phq9Base = around(r, 8.2, 3.4);
    const gad7Base = around(r, 6.8, 2.6);
    const phq9Series = Array.from({ length: 26 }, (_, i) => {
      const drift = -i * 0.05 + Math.sin(i / 3) * 0.6;
      return Math.max(0, Math.round((phq9Base + drift + (r() - 0.5) * 1.2) * 10) / 10);
    });
    const gad7Series = Array.from({ length: 26 }, (_, i) => {
      const drift = -i * 0.04 + Math.cos(i / 4) * 0.5;
      return Math.max(0, Math.round((gad7Base + drift + (r() - 0.5) * 1.0) * 10) / 10);
    });

    // Engagement funnel — monotonically decreasing.
    const invitedN = invited;
    const signed = nRound(invitedN * (0.62 + r() * 0.18));
    const a7 = nRound(signed * (0.55 + r() * 0.2));
    const a30 = nRound(a7 * (0.7 + r() * 0.15));
    const sustained = nRound(a30 * (0.4 + r() * 0.2));
    const funnel: Record<FunnelKey, number> = {
      invited: invitedN,
      signed_up: signed,
      active_7d: a7,
      active_30d: a30,
      sustained,
    };

    // Risk distribution — most students in minimal/mild.
    const minimal = nRound(n * (0.48 + r() * 0.08));
    const mild = nRound(n * (0.24 + r() * 0.08));
    const moderate = nRound(n * (0.14 + r() * 0.06));
    const severe = Math.max(0, n - minimal - mild - moderate);
    const riskDist: Record<RiskBand, number> = { minimal, mild, moderate, severe };

    // Themes — a few chosen tags with realistic bumps. One or two may fall
    // below k=10 for smaller cohorts, exercising the suppression path.
    const themes = CONCERN_TAGS.map((tag) => {
      const share = 0.02 + r() * 0.18;
      return { tag, n: nRound(n * share) };
    })
      .sort((a, b) => b.n - a.n)
      .slice(0, 8);

    // 7×24 session-start heatmap. Peak around evenings and Sunday nights.
    const heatmap: number[][] = [];
    for (let day = 0; day < 7; day++) {
      const row: number[] = [];
      for (let hour = 0; hour < 24; hour++) {
        const evening = Math.exp(-((hour - 21) ** 2) / 18);
        const lunch = Math.exp(-((hour - 13) ** 2) / 6) * 0.35;
        const weekendBoost = day === 0 || day === 6 ? 1.2 : 1;
        const dead = hour >= 2 && hour <= 6 ? 0.08 : 1;
        const val = (evening + lunch) * weekendBoost * dead * (n / 40);
        row.push(nRound(around(r, val, val * 0.4)));
      }
      heatmap.push(row);
    }

    // Radar — this dept vs institution vs national.
    const dept: Record<RadarAxis, number> = {
      engagement: nRound(around(r, 62, 26)),
      sustainedUse: nRound(around(r, 48, 24)),
      phq9Improvement: nRound(around(r, 54, 22)),
      gad7Improvement: nRound(around(r, 50, 22)),
      sessionCompletion: nRound(around(r, 68, 18)),
    };
    const institution: Record<RadarAxis, number> = {
      engagement: 58, sustainedUse: 46, phq9Improvement: 52, gad7Improvement: 48, sessionCompletion: 64,
    };
    const national: Record<RadarAxis, number> = {
      engagement: 52, sustainedUse: 42, phq9Improvement: 48, gad7Improvement: 44, sessionCompletion: 60,
    };

    const riskPct = n > 0 ? (moderate + severe) / n : 0;
    // Nudge one dept upward so "top movers" quick action has variety.
    if (idx === 0) phq9Series[phq9Series.length - 1] += 1.4;

    return {
      id: d.id, name: d.name, school: d.school, n,
      invited: invitedN, riskPct,
      phq9Series, gad7Series, funnel, riskDist, themes, heatmap,
      radar: { department: dept, institution, national },
    };
  });
}
