"use client";

import { FEATURE_AREAS, MAKEUP, VIBES, type FeatureArea, type Preferences } from "@/lib/schema";

export const LANGUAGES = ["English", "Español", "Français", "Deutsch", "Português", "Italiano", "हिन्दी", "日本語", "한국어", "中文", "العربية"];

const VIBE_LABEL: Record<(typeof VIBES)[number], string> = {
  natural: "Natural",
  polished: "Polished",
  bold: "Bold",
  "low-maintenance": "Low-maintenance",
};
const MAKEUP_LABEL: Record<(typeof MAKEUP)[number], string> = { none: "No makeup", minimal: "Minimal", full: "Full glam OK" };
const AREA_LABEL: Record<FeatureArea, string> = {
  hair: "Hair",
  brows: "Brows",
  eyes: "Eyes",
  skin: "Skin",
  lips: "Lips",
  facial_hair: "Facial hair",
};

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active ? "border-ink bg-ink text-bg" : "border-line hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

export function PreferencesForm({ value, onChange }: { value: Preferences; onChange: (p: Preferences) => void }) {
  const set = <K extends keyof Preferences>(k: K, v: Preferences[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Vibe</legend>
        <div className="flex flex-wrap gap-2">
          {VIBES.map((v) => (
            <Chip key={v} active={value.vibe === v} onClick={() => set("vibe", v)}>{VIBE_LABEL[v]}</Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Makeup</legend>
        <div className="flex flex-wrap gap-2">
          {MAKEUP.map((m) => (
            <Chip key={m} active={value.makeup === m} onClick={() => set("makeup", m)}>{MAKEUP_LABEL[m]}</Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Focus on (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {FEATURE_AREAS.map((a) => {
            const on = value.focus.includes(a);
            return (
              <Chip key={a} active={on} onClick={() => set("focus", on ? value.focus.filter((x) => x !== a) : [...value.focus, a])}>
                {AREA_LABEL[a]}
              </Chip>
            );
          })}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Language</span>
          <select
            value={value.language}
            onChange={(e) => set("language", e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted">Anything else? (optional)</span>
          <input
            value={value.notes}
            maxLength={500}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="e.g. I want to keep my length, I wear glasses, job interview next week"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm placeholder:text-muted/70"
          />
        </label>
      </div>
    </div>
  );
}
