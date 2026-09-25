import { z } from "zod";

/**
 * The structured plan Claude returns. This schema is sent to the API as a
 * structured-output format, so every field is guaranteed present and typed.
 * Numeric ranges are described (not enforced) because structured outputs do
 * not support min/max constraints; the UI clamps where it matters.
 */

export const FEATURE_AREAS = ["hair", "brows", "eyes", "skin", "lips", "facial_hair"] as const;
export type FeatureArea = (typeof FEATURE_AREAS)[number];

export const TIP_ICONS = ["scissors", "droplet", "sun", "brush", "moon", "water", "sparkle", "leaf"] as const;

const Product = z.object({
  category: z.string().describe("Generic product type, e.g. 'Matte clay' or 'Tinted lip balm'. No brand names."),
  why: z.string().describe("One short sentence on what it does for this person."),
});

const Feature = z.object({
  area: z.enum(FEATURE_AREAS),
  label: z.string().describe("Localized display name for the area, e.g. 'Hair', 'Cejas'."),
  current: z.array(z.string()).describe("2-3 kind, specific observations of what is visible now."),
  changes: z.array(z.string()).describe("2-4 concrete, subtle recommendations."),
  why: z.string().describe("One or two sentences on why these changes work for this face."),
  caption: z.string().describe("Very short caption for a close-up tile, max ~7 words."),
  effort: z.enum(["low", "medium", "high"]).describe("Effort to maintain."),
  how_to: z.array(z.string()).describe("2-4 practical steps the person can follow."),
  products: z.array(Product).describe("1-3 generic product types."),
});

export const PlanSchema = z.object({
  suitability: z
    .enum(["ok", "not_a_face", "multiple_people", "too_low_quality", "likely_minor"])
    .describe("Use 'ok' unless the photo clearly fails one of the other cases."),
  title: z.string().describe("Report title, e.g. 'Personalized Aesthetic Enhancement Plan'."),
  subtitle: z.string().describe("One-line subtitle for the report."),
  tagline: z.string().describe("Closing line, e.g. 'Same you. Just more refined.'"),
  summary: z.string().describe("2-3 sentence overview of the overall direction."),
  overall_effect: z.string().describe("One sentence describing the combined effect."),
  labels: z
    .object({
      before: z.string(),
      after: z.string(),
      what_changed: z.string(),
      key_changes: z.string(),
      daily_tips: z.string(),
      products: z.string(),
      your_tones: z.string(),
      palette: z.string(),
    })
    .describe("Localized UI headings in the requested language."),
  features: z.array(Feature).describe("One entry per relevant area, most impactful first. Omit facial_hair if not applicable."),
  hair: z.object({
    style: z.string().describe("Name of the recommended cut/style."),
    spec: z.string().describe("What to ask a stylist/barber for, with lengths where useful."),
    color: z.string().describe("Color direction, or 'Keep your natural color'."),
    alternatives: z
      .array(z.object({ name: z.string(), description: z.string() }))
      .describe("2-3 alternative styles that would also suit them."),
  }),
  skin: z.object({
    type: z.string().describe("Apparent skin type, hedged (e.g. 'Likely combination')."),
    undertone: z.string().describe("Apparent undertone: warm, cool, neutral or olive."),
    metrics: z
      .array(z.object({ name: z.string(), score: z.number().describe("0-100 visual estimate"), note: z.string() }))
      .describe("4-6 visual estimates, e.g. Hydration, Evenness, Texture, Radiance, Under-eye."),
  }),
  palette: z
    .array(z.object({ name: z.string(), hex: z.string().describe("#RRGGBB"), use: z.string() }))
    .describe("4-6 recommended tones (hair, lip, blush, brow, wardrobe accents) that flatter their coloring."),
  tips: z
    .array(z.object({ icon: z.enum(TIP_ICONS), title: z.string(), detail: z.string() }))
    .describe("3-4 quick daily tips."),
  routine: z.object({
    am: z.array(z.object({ step: z.string(), detail: z.string() })),
    pm: z.array(z.object({ step: z.string(), detail: z.string() })),
    weekly: z.array(z.string()),
  }),
  edit_instructions: z
    .string()
    .describe(
      "In English: a precise brief for a photo retoucher to produce the realistic 'after' of THIS photo — same person, pose, lighting, clothes and background, only the recommended subtle changes.",
    ),
});

export type Plan = z.infer<typeof PlanSchema>;
export type PlanFeature = Plan["features"][number];

export const VIBES = ["natural", "polished", "bold", "low-maintenance"] as const;
export const MAKEUP = ["none", "minimal", "full"] as const;

export const AnalyzeRequestSchema = z.object({
  image: z
    .string()
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "image must be a base64 data URL")
    .max(8_000_000, "image too large"),
  preferences: z.object({
    vibe: z.enum(VIBES).default("natural"),
    makeup: z.enum(MAKEUP).default("minimal"),
    language: z.string().min(2).max(40).default("English"),
    focus: z.array(z.enum(FEATURE_AREAS)).max(FEATURE_AREAS.length).default([]),
    notes: z.string().max(500).default(""),
  }),
  measured: z
    .object({
      skin: z.string().optional(),
      hair: z.string().optional(),
      lips: z.string().optional(),
      eyes: z.string().optional(),
    })
    .optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type Preferences = AnalyzeRequest["preferences"];

/** Events streamed from /api/analyze as newline-delimited JSON. */
export type AnalyzeEvent =
  | { type: "stage"; stage: string }
  | { type: "progress"; chars: number }
  | { type: "result"; plan: Plan; model: string }
  | { type: "error"; message: string; code?: string };
