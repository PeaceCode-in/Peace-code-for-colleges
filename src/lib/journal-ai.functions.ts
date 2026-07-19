import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGateway } from "./ai-gateway.server";

const KINDS = ["prompt", "reflect", "rewrite", "continue", "analyze"] as const;

export const journalAI = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      kind: z.enum(KINDS),
      text: z.string().max(8000).optional().default(""),
      mood: z.string().optional().default(""),
    }).parse(raw)
  )
  .handler(async ({ data }) => {
    const { kind, text, mood } = data;
    const system =
      "You are Peace, a warm, gentle journaling companion for a student. Reply softly, briefly, in lowercase where natural, no emojis, no bullet lists unless asked. Never diagnose.";

    let user = "";
    switch (kind) {
      case "prompt":
        user = `Offer one short reflective journaling prompt (max 22 words) for a student today. Mood hint: ${mood || "unknown"}. Return only the prompt sentence.`;
        break;
      case "reflect":
        user = `Read this journal entry and reply with THREE short lines separated by "\\n": 1) a one-sentence emotional summary, 2) one gentle insight, 3) one tiny self-care suggestion. Entry:\n\n${text}`;
        break;
      case "rewrite":
        user = `Rewrite the following journal entry more beautifully — keep the writer's voice, first-person, and length within +30% of original. No headings.\n\n${text}`;
        break;
      case "continue":
        user = `Continue the following journal entry in the same voice for 2-4 sentences. Do not repeat what is already written.\n\n${text}`;
        break;
      case "analyze":
        user = `Analyze this entry. Return exactly four lines separated by "\\n" with these prefixes: "stress:", "burnout:", "positive:", "improve:". Each value is one short phrase (max 12 words).\n\n${text}`;
        break;
    }

    const out = await callGateway(
      [{ role: "system", content: system }, { role: "user", content: user }],
      { temperature: kind === "analyze" ? 0.4 : 0.8 },
    );
    return { text: out };
  });
