import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { imageProvider } from "@/lib/providers";

export const runtime = "nodejs";
export const maxDuration = 300;

const BodySchema = z.object({
  image: z
    .string()
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/)
    .max(8_000_000),
  instructions: z.string().min(10).max(4000),
});

// Wraps the plan's retouch brief with identity-preservation guardrails that
// apply no matter what the brief says.
function buildEditPrompt(instructions: string) {
  return [
    "Photo-retouch this exact selfie. Output one photorealistic image.",
    "Keep the same person, identity, face shape, bone structure, eye shape, nose, skin tone, ethnicity, age, expression, pose, framing, camera angle, lighting, clothing and background.",
    "Apply only these subtle, realistic grooming/styling changes:",
    instructions,
    "Keep natural skin texture (pores visible, no plastic smoothing). No text, labels or borders. Do not beautify beyond the brief.",
  ].join("\n");
}

export async function POST(req: Request) {
  const provider = imageProvider();
  if (!provider) {
    return Response.json({ error: "No image provider configured.", code: "no_provider" }, { status: 501 });
  }
  const limit = rateLimit(`visualize:${clientKey(req)}`, 10, 60 * 60 * 1000);
  if (!limit.ok) {
    return Response.json({ error: "Too many renders this hour." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  const [, mime, b64] = parsed.data.image.match(/^data:(image\/\w+);base64,(.+)$/)!;
  const prompt = buildEditPrompt(parsed.data.instructions);

  try {
    const out = await provider.edit({ mime, b64, prompt });
    return Response.json({ image: `data:${out.mime};base64,${out.b64}`, provider: provider.name });
  } catch (err) {
    console.error("[visualize]", err);
    return Response.json({ error: "The image model couldn't render your after photo.", code: "provider_error" }, { status: 502 });
  }
}
