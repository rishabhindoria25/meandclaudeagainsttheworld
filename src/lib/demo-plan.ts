import type { Plan } from "./schema";

/**
 * A representative plan used in demo mode (no API key configured) so the full
 * experience — callouts, crops, templates, export — can be tried on your own
 * photo. The copy is intentionally general since it wasn't written for you.
 */
export const DEMO_PLAN: Plan = {
  suitability: "ok",
  title: "Personalized Aesthetic Enhancement Plan",
  subtitle: "Subtle, high-impact changes that bring out your natural features.",
  tagline: "Same you. Just more refined.",
  summary:
    "Demo plan — connect an Anthropic API key for a plan written for your photo. The direction: add shape and movement to the hair, tidy and define the brows, even out the complexion and add a little hydration so everything reads fresher and more intentional.",
  overall_effect: "More polished, balanced and camera-ready while staying recognizably you.",
  labels: {
    before: "Before",
    after: "After",
    what_changed: "What changed & why it works",
    key_changes: "Key changes",
    daily_tips: "Quick daily tips",
    products: "Product & style recommendations",
    your_tones: "Your tones",
    palette: "Your palette",
  },
  features: [
    {
      area: "hair",
      label: "Hair",
      current: ["A little flat at the crown", "Shape is growing out evenly all over"],
      changes: ["Tidier, tapered sides", "Keep length and texture on top", "Matte product for natural volume"],
      why: "Taking weight from the sides and building height on top adds structure and frames the face without looking styled.",
      caption: "Textured top, cleaner sides",
      effort: "medium",
      how_to: ["Ask for a low taper with 2–3 inches left on top", "Towel-dry, then work a pea-size amount of clay from roots up", "Trim every 4–5 weeks to keep the shape"],
      products: [
        { category: "Matte clay or paste", why: "Hold and texture without shine." },
        { category: "Sea-salt spray", why: "Adds grip and volume before styling." },
      ],
    },
    {
      area: "brows",
      label: "Brows",
      current: ["Good natural shape", "A few stray hairs underneath"],
      changes: ["Clean up strays only", "Brush up and set with clear gel"],
      why: "A tidier brow line opens the eye area and looks more awake while keeping the natural thickness.",
      caption: "Tidied, natural arch",
      effort: "low",
      how_to: ["Tweeze only below the brow, never the top", "Brush hairs upward", "Set with clear gel"],
      products: [{ category: "Clear brow gel", why: "Keeps hairs in place all day." }],
    },
    {
      area: "skin",
      label: "Skin",
      current: ["Some redness around the nose and cheeks", "Slight unevenness in texture"],
      changes: ["Even tone with a light moisturizer + SPF", "Gentle exfoliation twice a week", "Brighten under-eyes"],
      why: "An even, hydrated base reflects light more evenly and reads healthier in every photo.",
      caption: "Even tone, healthy glow",
      effort: "low",
      how_to: ["Cleanse AM and PM", "Moisturizer with SPF 30+ every morning", "Niacinamide serum at night"],
      products: [
        { category: "Lightweight moisturizer with SPF 30+", why: "Hydration and daily protection in one." },
        { category: "Niacinamide serum", why: "Helps calm redness and even tone." },
      ],
    },
    {
      area: "eyes",
      label: "Eyes",
      current: ["Slight shadowing under the eyes"],
      changes: ["Hydrating eye cream", "Optional touch of concealer"],
      why: "Brightening the under-eye area makes the whole face look more rested.",
      caption: "Brighter, more rested",
      effort: "low",
      how_to: ["Tap eye cream on with ring finger", "Prioritize 7–8 hours of sleep"],
      products: [{ category: "Caffeine eye cream", why: "Reduces puffiness and shadows." }],
    },
    {
      area: "lips",
      label: "Lips",
      current: ["A little dry"],
      changes: ["Daily hydrating balm", "Tinted balm for subtle definition"],
      why: "Hydrated lips look healthier and add natural color to the face.",
      caption: "Hydrated, naturally defined",
      effort: "low",
      how_to: ["Apply balm morning and night", "Exfoliate gently once a week"],
      products: [{ category: "Tinted lip balm", why: "Hydration with a hint of color." }],
    },
  ],
  hair: {
    style: "Textured crop with low taper",
    spec: "Low taper on the sides, 2–3 inches on top left textured; soft, natural neckline.",
    color: "Keep your natural color.",
    alternatives: [
      { name: "Classic side part", description: "Slightly longer top, combed to the side for a polished look." },
      { name: "Soft buzz", description: "Even, low-maintenance and sharp." },
    ],
  },
  skin: {
    type: "Likely combination",
    undertone: "Warm-neutral",
    metrics: [
      { name: "Hydration", score: 64, note: "Some dryness around lips and cheeks." },
      { name: "Evenness", score: 70, note: "Mild redness around the nose." },
      { name: "Texture", score: 72, note: "Mostly smooth." },
      { name: "Radiance", score: 68, note: "Would benefit from exfoliation." },
      { name: "Under-eye", score: 66, note: "Light shadowing." },
    ],
  },
  palette: [
    { name: "Warm espresso", hex: "#4a3226", use: "Brow gel tint" },
    { name: "Rosy nude", hex: "#c98a7d", use: "Lip tint" },
    { name: "Soft terracotta", hex: "#c47a5a", use: "Blush / bronzer" },
    { name: "Deep olive", hex: "#4f5a3c", use: "Wardrobe accent" },
    { name: "Navy", hex: "#23304a", use: "Wardrobe accent" },
  ],
  tips: [
    { icon: "scissors", title: "Trim & style", detail: "Every 4–5 weeks" },
    { icon: "sun", title: "SPF daily", detail: "Rain or shine" },
    { icon: "brush", title: "Brush brows up", detail: "For a natural lift" },
    { icon: "water", title: "Hydrate", detail: "Skin and lips show it" },
  ],
  routine: {
    am: [
      { step: "Cleanse", detail: "Gentle gel cleanser" },
      { step: "Moisturize + SPF", detail: "SPF 30+ lightweight lotion" },
      { step: "Style", detail: "Matte clay, brow gel, lip balm" },
    ],
    pm: [
      { step: "Cleanse", detail: "Remove SPF and the day" },
      { step: "Treat", detail: "Niacinamide serum" },
      { step: "Moisturize", detail: "Plus eye cream" },
    ],
    weekly: ["Gentle exfoliation twice a week", "Lip scrub once a week"],
  },
  edit_instructions:
    "Tidy the haircut: tapered sides and more texture on top. Remove stray brow hairs. Even out redness and brighten under-eyes slightly while keeping skin texture. Add subtle hydration to the lips.",
};
