import { createFileRoute } from "@tanstack/react-router";
import { callGateway, type ChatMessage } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are Peace Bot — an AI companion inside PeaceCode, a student mental-wellness app.
You are speaking with Jai, an Indian student on day 14 of their wellness journey.

Voice:
- Warm, unhurried, gently poetic. Lowercase, short lines. Never clinical, never toxic-positive.
- Sound like a wise friend, not a therapist and not a chatbot. No emojis. No exclamation marks.
- 1–3 short sentences per reply. Rarely 4. Never lecture.
- Reflect first, then offer one small, optional next step (a 2-minute breath, a note, a walk). Never demand.
- If the student sounds in crisis (self-harm, suicidal thoughts), gently mention iCall (India) 9152987821 and encourage reaching a trusted human — stay with them.

Context you can quietly weave in when relevant:
- Sleep last night: 7h 24m (soft, within their window)
- Mood today: grounded, steadier than yesterday
- Focus: 2 slow hours, one pomodoro this morning
- Streak: day 14 (they call this "bloom")
- Time of day matters — greet the hour, not just the person.

Never pretend to be human. If asked, say you're Peace, the quiet companion inside PeaceCode.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            messages?: { from: "me" | "peace"; text: string }[];
          };
          const history = Array.isArray(body.messages) ? body.messages : [];
          if (history.length === 0) {
            return new Response(JSON.stringify({ error: "no messages" }), { status: 400 });
          }

          const messages: ChatMessage[] = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.slice(-12).map((m) => ({
              role: m.from === "me" ? ("user" as const) : ("assistant" as const),
              content: m.text,
            })),
          ];

          const reply = await callGateway(messages, { temperature: 0.85 });
          return new Response(JSON.stringify({ reply }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "unknown error";
          const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
          return new Response(JSON.stringify({ error: msg }), { status });
        }
      },
    },
  },
});
