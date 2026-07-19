import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGateway, type ChatMessage } from "./ai-gateway.server";

const MsgSchema = z.object({ from: z.enum(["me", "peace"]), text: z.string() });

const AVATAR_TONE: Record<string, string> = {
  minimal: "Reply in 1-2 lines. No fluff. Zero adjectives you don't need.",
  friendly: "Warm, casual, like a close college friend. Light humor is fine.",
  professional: "Calm, measured, respectful. Sound like a thoughtful mentor.",
  supportive: "Warm, unhurried, gently poetic. Lowercase, short lines.",
  motivational: "Encouraging and specific. Never toxic-positive. Focus on the next small move.",
  calm: "Slow, quiet, spacious. Short sentences. Long exhales in the writing.",
};
const LENGTH: Record<string, string> = {
  short: "Reply in at most 2 short sentences.",
  medium: "Reply in 2-4 short sentences.",
  long: "Reply in a small paragraph, still human, never lecturing.",
};

export const peacebotReply = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      messages: z.array(MsgSchema).min(1),
      convType: z.string().optional().default("free"),
      avatar: z.string().optional().default("supportive"),
      length: z.enum(["short", "medium", "long"]).optional().default("medium"),
      style: z.enum(["poetic", "direct", "friendly"]).optional().default("poetic"),
      memories: z.array(z.string()).optional().default([]),
      context: z.object({
        name: z.string(),
        streak: z.number(),
        sleepHours: z.number(),
        mood: z.string(),
        focusMinutes: z.number(),
        journalEntries: z.number(),
        lastScreening: z.string(),
        exams: z.string(),
      }).optional(),
      task: z.string().optional(), // used by tool hub prompts
    }).parse(raw)
  )
  .handler(async ({ data }) => {
    const tone = AVATAR_TONE[data.avatar] ?? AVATAR_TONE.supportive;
    const len = LENGTH[data.length];
    const styleLine = data.style === "direct"
      ? "Be direct and specific. Skip metaphors."
      : data.style === "friendly"
      ? "Sound like a warm friend, casual."
      : "Softly poetic. A little rhythm. No purple prose.";

    const ctx = data.context;
    const mems = data.memories.slice(0, 8).map((m) => `• ${m}`).join("\n");

    const system = `You are Peace Bot, the AI companion inside PeaceCode — a student mental-wellness app.
${tone}
${styleLine}
${len}

Rules:
- Never diagnose. Never mention medications.
- Reflect first, then optionally offer one small next step (a 2-minute breath, a note, a walk, a screening).
- If severe distress or self-harm surfaces, gently mention iCall India 9152987821 and encourage a trusted human — stay with them.
- If a PeaceCode feature is genuinely relevant, mention it in plain words: breathing, journal, focus timer, gratitude, screening, community, sleep story. Never spam features.
- Never invent facts about the user beyond the context below.
- Do not use emojis. Do not use exclamation marks unless celebrating something the user shared.

Conversation intent: ${data.convType}
${data.task ? `Special task: ${data.task}` : ""}

What you quietly know about them:
${ctx ? `- name: ${ctx.name}
- wellness streak: day ${ctx.streak}
- last night sleep: ${ctx.sleepHours}h
- mood today: ${ctx.mood}
- focus today: ${ctx.focusMinutes} minutes
- journal entries this week: ${ctx.journalEntries}
- last screening: ${ctx.lastScreening}
- exams: ${ctx.exams}` : "- (no ambient context yet)"}

Long-term memories they've asked you to remember:
${mems || "- (none yet)"}
`;

    const messages: ChatMessage[] = [
      { role: "system", content: system },
      ...data.messages.slice(-14).map((m) => ({
        role: m.from === "me" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      })),
    ];

    try {
      const reply = await callGateway(messages, { temperature: 0.8 });
      return { reply };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      // graceful fallback — never break the UI
      return { reply: "i'm here — but my voice is quiet for a moment. try again in a bit? " + (msg.includes("429") ? "(a lot of people are talking to me right now)" : "") };
    }
  });

// One-shot task runner for the tools hub — same gateway, different framing.
export const peacebotTask = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      tool: z.string(),
      input: z.string().max(6000),
    }).parse(raw)
  )
  .handler(async ({ data }) => {
    const system = `You are Peace Bot, a student-focused AI. Task: "${data.tool}".
Return a practical, well-structured answer for a college student. Use short paragraphs and lists only when they help. No emojis. Never diagnose.`;
    try {
      const reply = await callGateway(
        [{ role: "system", content: system }, { role: "user", content: data.input }],
        { temperature: 0.6 },
      );
      return { reply };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      return { reply: `couldn't reach the model — ${msg}. try again in a moment.` };
    }
  });
