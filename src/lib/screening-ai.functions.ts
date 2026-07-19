import { createServerFn } from "@tanstack/react-start";
import { callGateway } from "./ai-gateway.server";

export type InsightsInput = {
  testName: string;
  testCode: string;
  category: string;
  score: number;
  scorePct: number;
  bandLabel: string;
  bandTone: string;
  answers: { question: string; answer: string; value: number }[];
  previous?: { score: number; scorePct: number; bandLabel: string; daysAgo: number } | null;
};

export type InsightsOutput = {
  summary: string;
  snapshot: string;
  strengths: string[];
  concerns: string[];
  suggestions: string[];
  balanceTips: string[];
  selfCare: string[];
  comparison: string;
  nextAction: string;
};

const fallback = (i: InsightsInput): InsightsOutput => ({
  summary: `Your ${i.testName} sits in the "${i.bandLabel}" range. This is a snapshot of the last two weeks, not a fixed truth about you.`,
  snapshot: i.bandTone === "calm"
    ? "Things feel relatively steady right now. Keep tending the small rituals that carry you."
    : i.bandTone === "high"
    ? "The signals are pointing to a heavier season. This is a moment to slow down and reach out."
    : "There is some weight showing up. Small, gentle adjustments can go a long way.",
  strengths: ["You showed up and answered honestly", "You're tracking your inner weather", "You care enough to look"],
  concerns: i.bandTone === "calm" ? ["None urgent — stay curious"] : ["Sleep and energy may need attention", "Social connection could use tending", "Study-life balance is worth a look"],
  suggestions: ["Try a 4-minute box breath tonight", "Journal one honest sentence before bed", "Take a slow walk without your phone tomorrow"],
  balanceTips: ["Cap study blocks at 50 minutes", "Protect one meal without screens", "Keep a soft cutoff time for late-night scrolling"],
  selfCare: ["Water, warmth, and rest — in that order", "One kind sentence to yourself in the mirror", "A message to someone who feels like home"],
  comparison: i.previous
    ? `Compared to ${i.previous.daysAgo} days ago (${i.previous.bandLabel}), things have ${i.score < i.previous.score ? "eased a little" : i.score > i.previous.score ? "grown a little heavier" : "held steady"}.`
    : "This is your first entry for this test — the baseline starts here.",
  nextAction: i.bandTone === "high" ? "Consider talking to a counsellor this week." : "Try a short breathing session, then journal one line.",
});

export const generateInsights = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as InsightsInput)
  .handler(async ({ data }) => {
    try {
      const answersText = data.answers.slice(0, 12).map((a, i) => `${i + 1}. "${a.question}" → ${a.answer}`).join("\n");
      const sys = "You are Peace Bot — a warm, poetic, non-clinical wellness companion for Indian students. You never diagnose. You speak gently, in short lines. You always end with hope.";
      const user = `Test: ${data.testName} (${data.testCode})
Category: ${data.category}
Score: ${data.score} (${data.scorePct}%), band: "${data.bandLabel}" (${data.bandTone})
${data.previous ? `Previous ${data.previous.daysAgo} days ago: ${data.previous.score} — "${data.previous.bandLabel}"` : "No previous session."}

Answers:
${answersText}

Return a compact JSON object with these keys (all strings unless noted):
summary (2 sentences),
snapshot (1 sentence, poetic),
strengths (array of 3 short strings),
concerns (array of 3 short strings),
suggestions (array of 3 actionable, gentle strings),
balanceTips (array of 3 short strings),
selfCare (array of 3 short strings),
comparison (1-2 sentences),
nextAction (1 sentence).

Return ONLY JSON. No prose outside JSON.`;

      const raw = await callGateway([
        { role: "system", content: sys },
        { role: "user", content: user },
      ], { temperature: 0.8 });

      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return fallback(data);
      const parsed = JSON.parse(match[0]) as Partial<InsightsOutput>;
      const fb = fallback(data);
      return {
        summary: parsed.summary || fb.summary,
        snapshot: parsed.snapshot || fb.snapshot,
        strengths: parsed.strengths?.length ? parsed.strengths : fb.strengths,
        concerns: parsed.concerns?.length ? parsed.concerns : fb.concerns,
        suggestions: parsed.suggestions?.length ? parsed.suggestions : fb.suggestions,
        balanceTips: parsed.balanceTips?.length ? parsed.balanceTips : fb.balanceTips,
        selfCare: parsed.selfCare?.length ? parsed.selfCare : fb.selfCare,
        comparison: parsed.comparison || fb.comparison,
        nextAction: parsed.nextAction || fb.nextAction,
      } satisfies InsightsOutput;
    } catch {
      return fallback(data);
    }
  });
