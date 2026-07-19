import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGateway } from "./ai-gateway.server";

const KINDS = ["prompt", "reflect_week", "reflect_month", "reframe", "topics", "tree_summary"] as const;

const FALLBACK: Record<(typeof KINDS)[number], string> = {
  prompt: "what small thing softened your day today, even a little?",
  reflect_week: "this week you leaned toward the tender. keep noticing.",
  reflect_month: "a month of small mercies. the tree is growing quietly.",
  reframe: "there is a version of this where you were doing your best.",
  topics: "morning light\nthe last message someone sent you\na sound you love\na person who waited for you\nsomething your body did for you",
  tree_summary: "your tree remembers each entry. it is steadier than you think.",
};

export const gratitudeAI = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      kind: z.enum(KINDS),
      text: z.string().max(8000).optional().default(""),
      context: z.string().max(2000).optional().default(""),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { kind, text, context } = data;
    const system = "You are Peace, a warm gratitude companion for an Indian college student. Reply softly, briefly, lowercase where natural. No emojis. No lists unless asked. Never diagnose.";
    let user = "";
    switch (kind) {
      case "prompt":
        user = `Offer ONE short reflective gratitude prompt (max 22 words) a student can answer in a sentence. Context: ${context}. Return only the prompt.`;
        break;
      case "reflect_week":
        user = `Given these gratitude entries from the past week, reply with THREE short lines separated by "\\n": 1) one-sentence emotional summary, 2) one gentle pattern you notice, 3) one soft suggestion. Entries:\n\n${text}`;
        break;
      case "reflect_month":
        user = `A month of gratitude entries follows. Reply with a 3-4 sentence tender reflection about what shifted. No headings.\n\n${text}`;
        break;
      case "reframe":
        user = `Turn this heavy moment into a possible gratitude reframe, in 1-2 sentences. Do not deny the difficulty.\n\n${text}`;
        break;
      case "topics":
        user = `Suggest 5 short gratitude topics (2-6 words each), one per line, for a student today. No numbering.`;
        break;
      case "tree_summary":
        user = `Given this gratitude tree status, write 2 tender sentences about the student's growth. No headings.\n\n${text}`;
        break;
    }
    try {
      const out = await callGateway(
        [{ role: "system", content: system }, { role: "user", content: user }],
        { temperature: kind === "reframe" ? 0.7 : 0.9 },
      );
      return { text: out || FALLBACK[kind] };
    } catch {
      return { text: FALLBACK[kind] };
    }
  });
