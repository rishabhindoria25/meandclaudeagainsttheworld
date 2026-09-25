import "server-only";

/**
 * Photoreal "after" rendering. Claude plans the edit; an image-editing model
 * executes it. Provider is chosen by whichever key is configured.
 */
export interface ImageProvider {
  name: string;
  edit(input: { mime: string; b64: string; prompt: string }): Promise<{ mime: string; b64: string }>;
}

export function imageProvider(): ImageProvider | null {
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
