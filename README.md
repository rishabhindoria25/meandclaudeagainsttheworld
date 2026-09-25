# Glow — your personal enhancement plan

**Same you. Just more refined.** Upload a selfie and get a personalized, subtle "glow‑up" plan: a feature‑by‑feature analysis (hair, brows, eyes, skin, lips, facial hair), a realistic before/after, and a shareable report card in the editorial styles popularized by the "ChatGPT glow‑up" trend — built properly, as an app instead of a copy‑paste prompt.

## What it does

| | |
|---|---|
| **Claude vision analysis** | Claude reads your photo and returns a strictly‑typed plan (structured outputs): observations, recommended changes, *why* each works for your face, how‑to steps, generic product types, haircut spec for your stylist, skin estimates, a flattering color palette and an AM/PM routine. Streams live progress as each section is written. |
| **On‑device face mapping** | MediaPipe Face Landmarker (478 points) runs in the browser (self‑hosted WASM). It checks photo quality, reframes wide shots to a 4:5 portrait, anchors numbered callouts to real landmarks, cuts the detail close‑ups (brows, eyes, skin, lips…) and samples your actual skin/hair/lip tones. |
| **Realistic "after"** | With a Gemini or OpenAI image key, Claude writes a precise retouch brief and an image‑editing model renders it, wrapped in identity‑preserving guardrails. Without one, Glow does a landmark‑masked retouch on your device (skin evening with texture kept, under‑eye lift, brow and lip definition) with a strength slider. |
| **Report cards** | Four templates — Editorial, Clinical, Noir, Sage — rendered at a fixed 1600px and exported as PNG or shared via the native share sheet. |
| **Also** | Before/after slider, "copy for your stylist", routine checklist with a streak, 11 output languages, camera capture with a 3s timer, paste‑from‑clipboard, light/dark UI. |

## Responsible by design

- No attractiveness scores. Skin metrics are labeled as visual estimates, not medical advice.
- Never suggests surgery, injectables, fillers or skin lightening, or changing ethnic features; no body/weight comments. Makeup preference is respected exactly.
- If the subject appears under 18, advice is limited to gentle skincare/sun/hair care and no edited image is produced.
- Photos are re‑encoded client‑side (strips EXIF/GPS), sent only to generate the plan, and never stored. Fonts and the face model are self‑hosted — no third‑party requests from the browser.

## Run it

```bash
npm install            # also copies the MediaPipe WASM into public/
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev            # http://localhost:3000
```

Without `ANTHROPIC_API_KEY` the app runs in **demo mode**: the whole experience works on your own photo with a sample plan.

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Required for personalized plans. |
| `GLOW_MODEL` | Default `claude-opus-5` (with server‑side refusal fallbacks enabled). |
| `GLOW_EFFORT` | `low` · `medium` · `high` (default) · `xhigh` · `max`. |
| `GEMINI_API_KEY` / `GLOW_GEMINI_IMAGE_MODEL` | Optional photoreal after (default `gemini-2.5-flash-image`). |
| `OPENAI_API_KEY` / `GLOW_OPENAI_IMAGE_MODEL` | Optional alternative (default `gpt-image-1`). |

```bash
npm test          # unit tests (geometry, schema, prompt)
npm run typecheck
npm run build
```

## Architecture

```
src/
  app/api/analyze     POST → Claude (vision + structured output), NDJSON progress stream
  app/api/visualize   POST → image‑edit provider (Gemini / OpenAI), guardrailed prompt
  app/api/status      which capabilities are configured
  lib/schema.ts       Zod plan schema = API output format = TS types
  lib/prompt.ts       system prompt + user prompt builder
  lib/face/           landmarks (MediaPipe), geometry (pure, tested), retouch (canvas)
  components/         flow (GlowApp), picker/camera, report templates, plan panels
```

Rate limiting is in‑memory per IP (swap for Redis when running multiple instances).
