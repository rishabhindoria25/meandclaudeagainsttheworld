import "server-only";

/**
 * Photoreal "after" rendering. Claude plans the edit; an image-editing model
 * executes it. Provider is chosen by whichever is configured, open-source
 * first: a self-hosted Glow image server, then Qwen-Image-Edit on fal or
 * Replicate, then the proprietary Gemini / OpenAI models.
 */
export interface ImageProvider {
  name: string;
  edit(input: { mime: string; b64: string; prompt: string }): Promise<{ mime: string; b64: string }>;
}

export function imageProvider(): ImageProvider | null {
  if (process.env.GLOW_OSS_URL) return selfHosted();
  if (process.env.FAL_KEY) return fal();
  if (process.env.REPLICATE_API_TOKEN) return replicate();
  if (process.env.GEMINI_API_KEY) return gemini();
  if (process.env.OPENAI_API_KEY) return openai();
  return null;
}

function gemini(): ImageProvider {
  const model = process.env.GLOW_GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  return {
    name: `gemini:${model}`,
    async edit({ mime, b64, prompt }) {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: mime, data: b64 } }, { text: prompt }] }],
      });
      for (const part of res.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) return { mime: part.inlineData.mimeType ?? "image/png", b64: part.inlineData.data };
      }
      throw new Error("Gemini returned no image");
    },
  };
}

function openai(): ImageProvider {
  const model = process.env.GLOW_OPENAI_IMAGE_MODEL || "gpt-image-1";
  return {
    name: `openai:${model}`,
    async edit({ mime, b64, prompt }) {
      const { default: OpenAI, toFile } = await import("openai");
      const client = new OpenAI();
      const ext = mime.split("/")[1] ?? "jpeg";
      const res = await client.images.edit({
        model,
        image: await toFile(Buffer.from(b64, "base64"), `selfie.${ext}`, { type: mime }),
        prompt,
        input_fidelity: "high",
        quality: "high",
        size: "auto",
      });
      const out = res.data?.[0]?.b64_json;
      if (!out) throw new Error("OpenAI returned no image");
      return { mime: "image/png", b64: out };
    },
  };
}

const dataUrl = (mime: string, b64: string) => `data:${mime};base64,${b64}`;

async function fetchJson(url: string, init: RequestInit, timeoutMs = 280_000): Promise<any> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${new URL(url).host} ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

/** Download a result URL (or unwrap a data URL) into base64. */
async function toBase64(src: string): Promise<{ mime: string; b64: string }> {
  const m = /^data:([^;]+);base64,(.+)$/.exec(src);
  if (m) return { mime: m[1], b64: m[2] };
  const res = await fetch(src, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`result download failed: ${res.status}`);
  return { mime: res.headers.get("content-type")?.split(";")[0] || "image/png", b64: Buffer.from(await res.arrayBuffer()).toString("base64") };
}

/** Your own GPU running inference/server.py (Qwen-Image-Edit-2511 by default). */
function selfHosted(): ImageProvider {
  const base = process.env.GLOW_OSS_URL!.replace(/\/$/, "");
  return {
    name: "oss:self-hosted",
    async edit({ mime, b64, prompt }) {
      const json = await fetchJson(`${base}/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.GLOW_OSS_TOKEN ? { Authorization: `Bearer ${process.env.GLOW_OSS_TOKEN}` } : {}),
        },
        body: JSON.stringify({ image: dataUrl(mime, b64), prompt }),
      });
      if (typeof json.image !== "string") throw new Error("image server returned no image");
      return toBase64(json.image);
    },
  };
}

/** Qwen-Image-Edit-2511 hosted on fal (synchronous endpoint). */
function fal(): ImageProvider {
  const model = process.env.GLOW_FAL_MODEL || "fal-ai/qwen-image-edit-2511";
  return {
    name: `fal:${model}`,
    async edit({ mime, b64, prompt }) {
      const json = await fetchJson(`https://fal.run/${model}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Key ${process.env.FAL_KEY}` },
        body: JSON.stringify({ prompt, image_urls: [dataUrl(mime, b64)], output_format: "png", num_images: 1 }),
      });
      const url = json.images?.[0]?.url;
      if (!url) throw new Error("fal returned no image");
      return toBase64(url);
    },
  };
}

/** Qwen-Image-Edit (Plus) hosted on Replicate; waits for the prediction. */
function replicate(): ImageProvider {
  const model = process.env.GLOW_REPLICATE_MODEL || "qwen/qwen-image-edit-plus";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` };
  return {
    name: `replicate:${model}`,
    async edit({ mime, b64, prompt }) {
      let pred = await fetchJson(`https://api.replicate.com/v1/models/${model}/predictions`, {
        method: "POST",
        headers: { ...headers, Prefer: "wait=60" },
        body: JSON.stringify({ input: { prompt, image: [dataUrl(mime, b64)], aspect_ratio: "match_input_image", output_format: "png" } }),
      });
      const deadline = Date.now() + 240_000;
      while (["starting", "processing"].includes(pred.status) && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000));
        pred = await fetchJson(pred.urls.get, { headers });
      }
      if (pred.status !== "succeeded") throw new Error(`replicate prediction ${pred.status}: ${pred.error ?? ""}`);
      const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      if (typeof url !== "string") throw new Error("replicate returned no image");
      return toBase64(url);
    },
  };
}
