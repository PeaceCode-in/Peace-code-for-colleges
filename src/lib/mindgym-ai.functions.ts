// PeaceCode Mind Gym — AI coach server functions.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGateway } from "./ai-gateway.server";

const MODEL = "google/gemini-2.5-flash";

const PreInput = z.object({
  exerciseName: z.string(),
  path: z.string(),
  weakestSkill: z.string(),
  streak: z.number(),
});
export const coachPre = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => PreInput.parse(raw))
  .handler(async ({ data }) => {
    try {
      const text = await callGateway([
        { role: "system", content: "You are Peace, a warm, cinematic mental-fitness coach for Indian students. Speak in one or two short sentences. No emojis. No coaching cliches. Feel human, quiet, encouraging." },
        { role: "user", content: `Exercise: ${data.exerciseName}. Path: ${data.path}. Weakest skill: ${data.weakestSkill}. Streak: ${data.streak} days. Give a short pre-workout nudge — grounded, not hype.` },
      ], { model: MODEL, temperature: 0.75 });
      return { text };
    } catch {
      return { text: `A short rep for your ${data.path}. Bring your attention here — that's already the first win.` };
    }
  });

const PostInput = z.object({
  exerciseName: z.string(),
  score: z.number(),
  accuracy: z.number(),
  seconds: z.number(),
  weakestSkill: z.string(),
});
export const coachPost = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => PostInput.parse(raw))
  .handler(async ({ data }) => {
    try {
      const text = await callGateway([
        { role: "system", content: "You are Peace, a warm mental-fitness coach. Two or three short sentences. Describe what the numbers actually say. Suggest one specific next rep. No emojis, no hype." },
        { role: "user", content: `Exercise: ${data.exerciseName}. Score: ${data.score}/100. Accuracy: ${data.accuracy}%. Time: ${Math.round(data.seconds)}s. Weakest skill: ${data.weakestSkill}.` },
      ], { model: MODEL, temperature: 0.7 });
      return { text };
    } catch {
      return { text: `Score ${data.score}. Accuracy ${data.accuracy}%. Steady rep. Next: pair this with one calm breath cycle to lock it in.` };
    }
  });

const WeeklyInput = z.object({
  sessionCount: z.number(),
  minutes: z.number(),
  xp: z.number(),
  topSkill: z.string(),
  streak: z.number(),
  brain: z.record(z.string(), z.number()),
});
export const coachWeekly = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => WeeklyInput.parse(raw))
  .handler(async ({ data }) => {
    try {
      const text = await callGateway([
        { role: "system", content: "You are Peace, writing a short weekly recap. Four short paragraphs. No bullets, no emojis, no marketing tone. A thoughtful friend who noticed." },
        { role: "user", content: `${data.sessionCount} sessions, ${data.minutes} minutes, ${data.xp} XP, ${data.streak}-day streak, grew mostly in ${data.topSkill}. Brain: ${JSON.stringify(data.brain)}. 1) headline, 2) what stood out, 3) what to protect, 4) one gentle stretch goal.` },
      ], { model: MODEL, temperature: 0.8 });
      return { text };
    } catch {
      return { text: `${data.sessionCount} reps, ${data.minutes} minutes, mostly in ${data.topSkill}. Streak is ${data.streak}. Protect the mornings — that's where your best sessions landed. Next week, add one calm rep on your busiest day.` };
    }
  });

const DnaInput = z.object({ brain: z.record(z.string(), z.number()) });
export const coachDna = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => DnaInput.parse(raw))
  .handler(async ({ data }) => {
    try {
      const text = await callGateway([
        { role: "system", content: "You are Peace, writing a 'Brain DNA' identity paragraph. Two short paragraphs. Editorial, poetic but grounded. No emojis, no lists." },
        { role: "user", content: `Skill map (0-100): ${JSON.stringify(data.brain)}. Describe the user's unique mind-shape — top two strengths, one growth edge, and the vibe of how they think.` },
      ], { model: MODEL, temperature: 0.85 });
      return { text };
    } catch {
      const top = Object.entries(data.brain).sort((a,b)=>b[1]-a[1])[0]?.[0];
      const low = Object.entries(data.brain).sort((a,b)=>a[1]-b[1])[0]?.[0];
      return { text: `Your mind runs on ${top}, with a quieter thread of care underneath. Growth edge: ${low}. Small daily reps will lift it without forcing.` };
    }
  });
