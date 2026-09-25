import { imageProvider } from "@/lib/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    analysis: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    imageProvider: imageProvider()?.name ?? null,
    model: process.env.GLOW_MODEL || "claude-opus-5",
  });
}
