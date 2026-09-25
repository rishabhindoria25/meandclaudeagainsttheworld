"use client";

import { useEffect, useState } from "react";
import type { FeatureArea, Plan } from "@/lib/schema";
import { luminance } from "@/lib/face/geometry";
import { Icon } from "./icons";

const EFFORT_LABEL = { low: "Low effort", medium: "Some effort", high: "Higher effort" } as const;

export function FeaturesPanel({ plan, details }: { plan: Plan; details: Partial<Record<FeatureArea, string>> }) {
  const [open, setOpen] = useState<FeatureArea | null>(plan.features[0]?.area ?? null);
  return (
    <div className="space-y-3">
      <p className="text-[15px] leading-relaxed text-muted">{plan.summary}</p>
      {plan.features.map((f, i) => {
        const isOpen = open === f.area;
        return (
          <div key={f.area} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <button
              onClick={() => setOpen(isOpen ? null : f.area)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 p-4 text-left"
            >
              {details[f.area] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={details[f.area]} alt="" className="h-14 w-20 flex-none rounded-lg object-cover" />
              ) : (
                <span className="grid size-10 flex-none place-items-center rounded-full bg-surface-2 font-semibold">{i + 1}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-xl leading-tight">{f.label}</span>
                <span className="block truncate text-sm text-muted">{f.caption}</span>
              </span>
              <span className="hidden rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted sm:block">{EFFORT_LABEL[f.effort]}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`flex-none transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {isOpen && (
              <div className="grid gap-6 border-t border-line p-5 sm:grid-cols-2 animate-rise">
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Now</h4>
                  <ul className="space-y-1.5 text-[15px]">
                    {f.current.map((c, j) => (
                      <li key={j} className="flex gap-2"><span className="mt-2 size-1.5 flex-none rounded-full bg-muted" />{c}</li>
                    ))}
                  </ul>
                  <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Change</h4>
                  <ul className="space-y-1.5 text-[15px]">
                    {f.changes.map((c, j) => (
                      <li key={j} className="flex gap-2"><Icon.check width={18} height={18} className="mt-0.5 flex-none text-accent" />{c}</li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-xl bg-surface-2 p-3 text-sm leading-relaxed"><strong>Why it works: </strong>{f.why}</p>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">How to</h4>
                  <ol className="space-y-2 text-[15px]">
                    {f.how_to.map((s, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="grid size-6 flex-none place-items-center rounded-full border border-line text-xs">{j + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  {f.products.length > 0 && (
                    <>
                      <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Products</h4>
                      <ul className="space-y-2">
                        {f.products.map((p, j) => (
                          <li key={j} className="rounded-xl border border-line p-3 text-sm">
                            <div className="font-medium">{p.category}</div>
                            <div className="text-muted">{p.why}</div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function HairPanel({ plan }: { plan: Plan }) {
  const h = plan.hair;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:col-span-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">Recommended</div>
        <div className="mt-1 font-serif text-3xl">{h.style}</div>
        <p className="mt-3 text-[15px] leading-relaxed">{h.spec}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyButton text={`${h.style}: ${h.spec}`} label="Copy for your stylist" />
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">Color</div>
        <p className="mt-2 text-[15px]">{h.color}</p>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">Also suits you</div>
        <ul className="mt-2 space-y-3">
          {h.alternatives.map((a, i) => (
            <li key={i}>
              <div className="font-medium">{a.name}</div>
              <div className="text-sm text-muted">{a.description}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
      className="rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2"
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

export function SkinPanel({ plan, tones }: { plan: Plan; tones: Record<string, string> }) {
  const s = plan.skin;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Type" value={s.type} />
        <Stat label="Undertone" value={s.undertone} />
        <div className="col-span-2 rounded-2xl border border-line bg-surface p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">Sampled from your photo</div>
          <div className="mt-3 flex gap-3">
            {Object.entries(tones).map(([k, hex]) => (
              <div key={k} className="text-center">
                <div className="size-9 rounded-full border border-line" style={{ background: hex }} title={hex} />
                <div className="mt-1 text-[11px] capitalize text-muted">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {s.metrics.map((m, i) => (
          <Ring key={i} name={m.name} score={m.score} note={m.note} />
        ))}
      </div>
      <p className="flex items-start gap-2 text-xs text-muted">
        <Icon.info width={16} height={16} className="mt-px flex-none" />
        Visual estimates from a single photo, affected by lighting and camera. Not a medical or dermatological assessment.
      </p>
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{plan.labels.palette}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {plan.palette.map((p, i) => {
            const hex = /^#[0-9a-f]{6}$/i.test(p.hex) ? p.hex : "#999999";
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="flex h-20 items-end p-2 text-xs font-mono" style={{ background: hex, color: luminance(hex) > 0.4 ? "#111" : "#fff" }}>{hex}</div>
                <div className="p-3">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted">{p.use}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-serif text-xl leading-tight">{value}</div>
    </div>
  );
}

function Ring({ name, score, note }: { name: string; score: number; note: string }) {
  const v = Math.max(0, Math.min(100, Math.round(score)));
  const C = 2 * Math.PI * 26;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 text-center">
      <svg viewBox="0 0 64 64" className="mx-auto size-20" role="img" aria-label={`${name}: ${v} of 100`}>
        <circle cx="32" cy="32" r="26" fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle cx="32" cy="32" r="26" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(v / 100) * C} ${C}`} transform="rotate(-90 32 32)" />
        <text x="32" y="32" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="600" fill="var(--ink)">{v}</text>
      </svg>
      <div className="mt-2 text-sm font-medium">{name}</div>
      <div className="mt-0.5 text-xs leading-snug text-muted">{note}</div>
    </div>
  );
}

/** AM/PM checklist that remembers today's progress and a daily streak on this device. */
export function RoutinePanel({ plan }: { plan: Plan }) {
  const today = new Date().toISOString().slice(0, 10);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("glow:routine") ?? "{}");
      setDone(s.date === today ? s.done ?? {} : {});
      setStreak(s.streak ?? 0);
    } catch {}
  }, [today]);

  const allSteps = [...plan.routine.am.map((_, i) => `am${i}`), ...plan.routine.pm.map((_, i) => `pm${i}`)];

  const toggle = (id: string) => {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    try {
      const prev = JSON.parse(localStorage.getItem("glow:routine") ?? "{}");
      const complete = allSteps.every((k) => next[k]);
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      let s = prev.streak ?? 0;
      if (complete && prev.lastComplete !== today) s = prev.lastComplete === yesterday ? s + 1 : 1;
      setStreak(s);
      localStorage.setItem("glow:routine", JSON.stringify({ date: today, done: next, streak: s, lastComplete: complete ? today : prev.lastComplete }));
    } catch {}
  };

  const col = (title: string, icon: React.ReactNode, steps: Plan["routine"]["am"], prefix: string) => (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2 font-serif text-2xl">{icon}{title}</div>
      <ul className="space-y-2">
        {steps.map((s, i) => {
          const id = `${prefix}${i}`;
          return (
            <li key={id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2 hover:bg-surface-2">
                <input type="checkbox" checked={!!done[id]} onChange={() => toggle(id)} className="mt-1 size-4 accent-[var(--accent)]" />
                <span className={done[id] ? "text-muted line-through" : ""}>
                  <span className="font-medium">{s.step}</span>
                  <span className="block text-sm text-muted">{s.detail}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-5 py-3 text-sm">
        <span>Check off today&apos;s steps. Progress stays on this device.</span>
        <span className="font-medium">🔥 {streak}-day streak</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {col("Morning", <Icon.sun />, plan.routine.am, "am")}
        {col("Evening", <Icon.moon />, plan.routine.pm, "pm")}
      </div>
      {plan.routine.weekly.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Weekly</div>
          <ul className="list-disc space-y-1 pl-5">
            {plan.routine.weekly.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
