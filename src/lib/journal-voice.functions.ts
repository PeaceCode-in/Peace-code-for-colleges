import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGateway } from "./ai-gateway.server";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export const transcribeVoice = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      base64: z.string().min(20),
      mime: z.string().default("audio/webm"),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const bytes = b64ToBytes(data.base64);
    const mime = data.mime.split(";")[0];
    const ext =
      mime === "audio/mp4" ? "mp4" :
      mime === "audio/mpeg" ? "mp3" :
      mime === "audio/wav" || mime === "audio/wave" ? "wav" :
      "webm";
    const fd = new FormData();
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    fd.append("file", new Blob([ab], { type: mime }), `voice.${ext}`);
    fd.append("model", "openai/gpt-4o-mini-transcribe");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Transcription ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as { text?: string };
    return { text: (json.text ?? "").trim() };
  });

export const summarizeVoice = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ text: z.string().min(1).max(20000) }).parse(raw),
  )
  .handler(async ({ data }) => {
    const out = await callGateway(
      [
        {
          role: "system",
          content:
            "You are Peace, a soft journaling companion for a student. Reply gently, in lowercase where natural. No emojis.",
        },
        {
          role: "user",
          content:
            `Turn this spoken voice note into a tidy journal entry. Return EXACTLY four lines, each prefixed:\n` +
            `TITLE: <5-7 words>\n` +
            `MOOD: <one of: radiant, calm, okay, low, heavy>\n` +
            `SUMMARY: <one short sentence>\n` +
            `BODY: <a natural first-person paragraph, keep the writer's voice, 3-6 sentences>\n\n` +
            `Voice note transcript:\n${data.text}`,
        },
      ],
      { temperature: 0.55 },
    );
    return { text: out };
  });

export const monthlyReflection = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ text: z.string().min(1).max(20000) }).parse(raw),
  )
  .handler(async ({ data }) => {
    const out = await callGateway(
      [
        {
          role: "system",
          content:
            "You are Peace, a warm, thoughtful journaling companion. Lowercase where natural. No bullet lists. No emojis.",
        },
        {
          role: "user",
          content:
            `Read these journal excerpts from the past month and write a short monthly reflection (4-6 sentences). ` +
            `Notice one gentle pattern, name one strength, and offer one tiny suggestion. Speak to the writer directly.\n\n${data.text}`,
        },
      ],
      { temperature: 0.7 },
    );
    return { text: out };
  });
