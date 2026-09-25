import { test } from "node:test";
import assert from "node:assert/strict";
import { AnalyzeRequestSchema, PlanSchema } from "../src/lib/schema.ts";
import { DEMO_PLAN } from "../src/lib/demo-plan.ts";
import { buildUserPrompt } from "../src/lib/prompt.ts";

test("demo plan satisfies the plan schema", () => {
  assert.doesNotThrow(() => PlanSchema.parse(DEMO_PLAN));
});

test("analyze request applies defaults and validates the image", () => {
  const ok = AnalyzeRequestSchema.parse({ image: "data:image/jpeg;base64,AAAA", preferences: {} });
  assert.equal(ok.preferences.vibe, "natural");
  assert.equal(ok.preferences.makeup, "minimal");
  assert.deepEqual(ok.preferences.focus, []);
  assert.equal(AnalyzeRequestSchema.safeParse({ image: "https://x/y.jpg", preferences: {} }).success, false);
  assert.equal(AnalyzeRequestSchema.safeParse({ image: "data:image/gif;base64,AAAA", preferences: {} }).success, false);
});

test("user prompt carries preferences and quotes notes", () => {
  const req = AnalyzeRequestSchema.parse({
    image: "data:image/jpeg;base64,AAAA",
    preferences: { vibe: "bold", makeup: "none", language: "Español", focus: ["hair"], notes: "keep my length" },
    measured: { skin: "#c89678" },
  });
  const p = buildUserPrompt(req);
  assert.match(p, /Language: Español/);
  assert.match(p, /Makeup preference: none/);
  assert.match(p, /"""keep my length"""/);
  assert.match(p, /skin: #c89678/);
});
