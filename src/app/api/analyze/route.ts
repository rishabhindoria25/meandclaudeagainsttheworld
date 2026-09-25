import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AnalyzeRequestSchema, PlanSchema, type AnalyzeEvent } from "@/lib/schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompt";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = process.env.GLOW_MODEL || "claude-opus-5";
const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
type Effort = (typeof EFFORTS)[number];
const EFFORT: Effort = (EFFORTS as readonly string[]).includes(process.env.GLOW_EFFORT ?? "")
  ? (process.env.GLOW_EFFORT as Effort)
  : "high";

// Keys in the plan JSON, in the order the model writes them, mapped to the
// human-readable stage we show while the plan streams in.
const STAGE_MARKERS: [string, string][] = [
  ['"suitability"', "Reading your photo"],
  ['"features"', "Mapping your features"],
  ['"area":"hair"', "Hair"],
  ['"area":"brows"', "Brows"],
  ['"area":"eyes"', "Eyes"],
  ['"area":"skin"', "Skin"],
  ['"area":"lips"', "Lips"],
  ['"area":"facial_hair"', "Facial hair"],
  ['"hair":', "Choosing your cut"],
  ['"palette"', "Building your palette"],
  ['"routine"', "Writing your routine"],
  ['"edit_instructions"', "Briefing the retoucher"],
];

export async function POST(req: Request) {
  const limit = rateLimit(`analyze:${clientKey(req)}`, 8, 60 * 60 * 1000);
  if (!limit.ok) {
    return Response.json(
      { error: "You've made a lot of plans this hour — give it a little while and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const input = parsed.data;

  const client = new Anthropic();
  const [, mediaType, data] = input.image.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/)!;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (e: AnalyzeEvent) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      const seen = new Set<string>();
      let lastProgress = 0;

      send({ type: "stage", stage: "Sending to Claude" });
      try {
        const run = client.beta.messages.stream(
          {
            model: MODEL,
            max_tokens: 32000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            thinking: { type: "adaptive" },
            output_config: { effort: EFFORT, format: betaZodOutputFormat(PlanSchema) },
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: [
                  { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg", data } },
                  { type: "text", text: buildUserPrompt(input) },
                ],
              },
            ],
          },
          { signal: req.signal },
        );

        run.on("text", (_delta, snapshot) => {
          const compact = snapshot.replace(/\s+/g, "");
          for (const [marker, stage] of STAGE_MARKERS) {
            if (!seen.has(marker) && compact.includes(marker)) {
              seen.add(marker);
              send({ type: "stage", stage });
            }
          }
          if (snapshot.length - lastProgress > 400) {
            lastProgress = snapshot.length;
            send({ type: "progress", chars: snapshot.length });
          }
        });

        const message = await run.finalMessage();
        if (message.stop_reason === "refusal") {
          send({ type: "error", code: "refusal", message: "Claude couldn't create a plan for this photo. Try a different selfie." });
        } else if (message.stop_reason === "max_tokens") {
          send({ type: "error", code: "truncated", message: "The plan came back incomplete. Please try again." });
        } else if (!message.parsed_output) {
          send({ type: "error", code: "parse", message: "The plan came back in an unexpected format. Please try again." });
        } else {
          send({ type: "result", plan: message.parsed_output, model: message.model });
        }
      } catch (err) {
        send(toErrorEvent(err));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function toErrorEvent(err: unknown): AnalyzeEvent {
  if (err instanceof Anthropic.AuthenticationError) {
    return { type: "error", code: "auth", message: "The server's Anthropic API key is missing or invalid." };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { type: "error", code: "rate_limit", message: "Claude is busy right now. Try again in a minute." };
  }
  if (err instanceof Anthropic.BadRequestError) {
    return { type: "error", code: "bad_request", message: `Request rejected: ${err.message}` };
  }
  if (err instanceof Anthropic.APIUserAbortError) {
    return { type: "error", code: "aborted", message: "Cancelled." };
  }
  if (err instanceof Anthropic.APIError) {
    return { type: "error", code: "api", message: `Claude API error${err.status ? ` (${err.status})` : ""}. Please try again.` };
  }
  if (err instanceof Error && /api key|apiKey|authentication/i.test(err.message)) {
    return { type: "error", code: "auth", message: "No Anthropic API key is configured on the server." };
  }
  console.error("[analyze]", err);
  return { type: "error", code: "unknown", message: "Something went wrong while analyzing. Please try again." };
}
