// Batch English → Hindi translation for the Resource Library.
// Uses the Lovable AI gateway. Returns an array 1:1 with input texts.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGateway } from "./ai-gateway.server";

export const translateResourcesBatch = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      texts: z.array(z.string().max(2000)).min(1).max(80),
      target: z.enum(["hi", "en"]).default("hi"),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { texts, target } = data;
    if (target === "en") return { translations: texts };

    const system =
      "You translate short English wellbeing copy into natural, warm, gentle Hindi (Devanagari script) for Indian college students. Keep the tone soft and lowercase where natural. Preserve proper names, brand names, and numbers. Return ONLY a JSON array of strings, same length and order as input. No commentary.";

    const user =
      "Translate each item to Hindi. Input JSON array:\n" +
      JSON.stringify(texts);

    try {
      const raw = await callGateway(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        { temperature: 0.3 },
      );
      // Extract JSON array from response
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return { translations: texts };
      const arr = JSON.parse(match[0]) as unknown;
      if (!Array.isArray(arr) || arr.length !== texts.length) {
        return { translations: texts };
      }
      return {
        translations: arr.map((x, i) =>
          typeof x === "string" && x.trim() ? x.trim() : texts[i],
        ),
      };
    } catch {
      return { translations: texts };
    }
  });

// Translate a single search query (any language) into Hindi for cross-language matching.
export const translateQuery = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      q: z.string().max(200),
      target: z.enum(["hi", "en"]).default("hi"),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    if (!data.q.trim()) return { text: "" };
    if (data.target === "en") return { text: data.q };
    try {
      const out = await callGateway(
        [
          {
            role: "system",
            content:
              "Translate the user's short search phrase to natural Hindi (Devanagari). Return ONLY the translated phrase, no quotes, no punctuation beyond what's natural.",
          },
          { role: "user", content: data.q },
        ],
        { temperature: 0.2 },
      );
      return { text: out.replace(/^["'\s]+|["'\s]+$/g, "") || data.q };
    } catch {
      return { text: data.q };
    }
  });
