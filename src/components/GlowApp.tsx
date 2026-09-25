"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnalyzeError, fetchStatus, requestAfterImage, requestPlan, type ServerStatus } from "@/lib/client";
import { DEMO_PLAN } from "@/lib/demo-plan";
import { cropToDataUrl, detectFace, preloadLandmarker, qualityIssues, reframe, type FaceGeometry } from "@/lib/face/landmarks";
import { retouch } from "@/lib/face/retouch";
import { fitTo } from "@/lib/image";
import type { FeatureArea, Plan, Preferences } from "@/lib/schema";
import { CompareSlider } from "./CompareSlider";
import { Icon } from "./icons";
import { FeaturesPanel, HairPanel, RoutinePanel, SkinPanel } from "./PlanPanels";
import { PhotoPicker } from "./PhotoPicker";
import { PreferencesForm } from "./PreferencesForm";
import { ReportView } from "./report/ReportView";
import type { ReportData } from "./report/ReportCard";
import { ScanView } from "./ScanView";

type Step = "start" | "review" | "working" | "result";
type Result = ReportData & { model: string; afterSource: "ai" | "local" | "none"; demo: boolean };

const DEFAULT_PREFS: Preferences = { vibe: "natural", makeup: "minimal", language: "English", focus: [], notes: "" };

const SUITABILITY_MESSAGE: Record<Exclude<Plan["suitability"], "ok" | "likely_minor">, string> = {
  not_a_face: "We couldn't find a clear face in that photo. Try a front-facing selfie.",
  multiple_people: "There's more than one person in that photo. Try a solo selfie.",
  too_low_quality: "That photo is too dark, blurry or small for a good plan. Try one in natural light.",
};

export function GlowApp() {
  const [step, setStep] = useState<Step>("start");
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [geo, setGeo] = useState<FaceGeometry | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [stages, setStages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    preloadLandmarker();
    void fetchStatus().then(setStatus);
    try {
      const saved = JSON.parse(localStorage.getItem("glow:prefs") ?? "null");
      if (saved) setPrefs({ ...DEFAULT_PREFS, ...saved, notes: "" });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const { notes: _omit, ...rest } = prefs;
      localStorage.setItem("glow:prefs", JSON.stringify(rest));
    } catch {}
  }, [prefs]);

  const onPhoto = useCallback(async (dataUrl: string) => {
    setPhoto(dataUrl);
    setGeo(null);
    setError(null);
    setStep("review");
    setDetecting(true);
    try {
      setGeo(await detectFace(dataUrl));
    } catch (e) {
      console.error(e);
      setError("Face detection couldn't load. Check your connection and try again.");
    } finally {
      setDetecting(false);
    }
  }, []);

  const addStage = (s: string) => setStages((prev) => (prev[prev.length - 1] === s ? prev : [...prev, s]));

  async function run(demo: boolean) {
    if (!photo || !geo) return;
    setStep("working");
    setStages([]);
    setError(null);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const { src, geo: g0 } = await reframe(photo, geo);
      let plan: Plan, model: string;
      if (demo) {
        addStage("Loading demo plan");
        await new Promise((r) => setTimeout(r, 700));
        plan = DEMO_PLAN;
        model = "demo";
      } else {
        ({ plan, model } = await requestPlan(
          { image: src, preferences: prefs, measured: { skin: g0.tones.skin, hair: g0.tones.hair, lips: g0.tones.lips, eyes: g0.tones.eyes } },
          (e) => e.type === "stage" && addStage(e.stage),
          ac.signal,
        ));
      }

      if (plan.suitability !== "ok" && plan.suitability !== "likely_minor") {
        setError(SUITABILITY_MESSAGE[plan.suitability]);
        setStep("review");
        return;
      }

      const areas = plan.features.map((f) => f.area);
      let after = src;
      let afterGeo: FaceGeometry | null = g0;
      let afterSource: Result["afterSource"] = "none";

      if (plan.suitability === "ok") {
        if (status?.imageProvider && !demo) {
          addStage("Rendering your after photo");
          try {
            const img = await requestAfterImage(src, plan.edit_instructions, ac.signal);
            after = await fitTo(img, g0.width, g0.height);
            afterGeo = (await detectFace(after)) ?? g0;
            afterSource = "ai";
          } catch (e) {
            if (ac.signal.aborted) throw e;
            console.warn("AI render failed, falling back to local retouch", e);
          }
        }
        if (afterSource === "none") {
          addStage("Retouching on your device");
          after = await retouch(src, g0, areas, 0.7);
          afterSource = "local";
        }
      }

      addStage("Designing your report");
      const details: Partial<Record<FeatureArea, string>> = {};
      await Promise.all(
        areas.map(async (a) => {
          const g = afterGeo ?? g0;
          details[a] = await cropToDataUrl(after, g.crops[a]);
        }),
      );

      setResult({ plan, model, before: src, after, beforeGeo: g0, afterGeo, details, afterSource, demo });
      setStep("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (ac.signal.aborted) {
        setStep("review");
        return;
      }
      setError(e instanceof AnalyzeError || e instanceof Error ? e.message : "Something went wrong.");
      setStep("review");
    }
  }

  function reset() {
    abortRef.current?.abort();
    setPhoto(null);
    setGeo(null);
    setResult(null);
    setError(null);
    setStep("start");
  }

  const issues = photo && !detecting ? qualityIssues(geo) : [];
  const analysisReady = status?.analysis ?? false;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <nav className="flex items-center justify-between py-5">
        <button onClick={reset} className="flex items-center gap-2 font-serif text-2xl tracking-tight">
          <span className="grid size-8 place-items-center rounded-full bg-ink text-bg"><Icon.sparkle width={16} height={16} /></span>
          Glow
        </button>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Icon.shield width={16} height={16} /> Photos are processed, not stored
        </span>
      </nav>

      {step === "start" && (
        <section className="grid items-center gap-10 py-6 lg:grid-cols-[1.05fr_1fr] lg:py-14">
          <div className="animate-rise">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Personal aesthetic plan</p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Same you.
              <br />
              <em className="text-accent">Just more refined.</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Upload a selfie and get a personalized plan for your hair, brows, skin, eyes and lips, with a realistic before and after and the reasons each change works for your face.
            </p>
            <ul className="mt-8 grid max-w-lg gap-3 text-sm sm:grid-cols-2">
              {[
                "Feature-by-feature analysis by Claude",
                "Callouts mapped to 478 face landmarks",
                "Realistic, identity-preserving after",
                "Shareable report in 4 editorial styles",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2"><Icon.check width={18} height={18} className="mt-px flex-none text-accent" />{f}</li>
              ))}
            </ul>
          </div>
          <div className="animate-rise" style={{ animationDelay: "120ms" }}>
            <PhotoPicker onPhoto={onPhoto} />
            <p className="mt-4 text-center text-xs text-muted">
              Face mapping runs in your browser. Your photo is sent only to generate your plan and is never saved. For adults (18+).
            </p>
          </div>
        </section>
      )}

      {step === "review" && photo && (
        <section className="grid gap-8 py-4 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div>
            <ScanView src={photo} geo={geo} scanning={detecting} />
            <button onClick={reset} className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
              <Icon.refresh width={16} height={16} /> Use a different photo
            </button>
          </div>
          <div className="animate-rise">
            <h2 className="font-serif text-4xl">Tune your plan</h2>
            <p className="mt-2 text-muted">Tell us the look you&apos;re going for. Everything is optional.</p>

            {detecting && <p className="mt-5 text-sm text-muted">Mapping your features…</p>}
            {!detecting && issues.length > 0 && (
              <ul className="mt-5 space-y-2">
                {issues.map((i) => (
                  <li key={i} className="flex items-start gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm"><Icon.info width={18} height={18} className="mt-px flex-none" />{i}</li>
                ))}
              </ul>
            )}
            {error && <p role="alert" className="mt-5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}

            <div className="mt-6">
              <PreferencesForm value={prefs} onChange={setPrefs} />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => run(false)}
                disabled={!geo || !analysisReady}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 font-medium text-bg hover:opacity-90 disabled:opacity-40"
              >
                <Icon.sparkle width={18} height={18} /> Create my plan
              </button>
              {status && !analysisReady && (
                <button onClick={() => run(true)} disabled={!geo} className="rounded-full border border-line px-6 py-3.5 text-sm hover:bg-surface-2 disabled:opacity-40">
                  Try the demo plan
                </button>
              )}
            </div>
            {status && !analysisReady && (
              <p className="mt-3 text-xs text-muted">
                No <code>ANTHROPIC_API_KEY</code> is set on the server, so personalized plans are off. The demo shows the full experience on your photo.
              </p>
            )}
          </div>
        </section>
      )}

      {step === "working" && photo && (
        <section className="mx-auto grid max-w-4xl items-start gap-10 py-6 md:grid-cols-[minmax(0,360px)_1fr]">
          <ScanView src={photo} geo={geo} scanning />
          <div>
            <h2 className="font-serif text-4xl">Creating your plan…</h2>
            <p className="mt-2 text-muted">Claude is studying your features. This usually takes under a minute.</p>
            <ol className="mt-8 space-y-3" aria-live="polite">
              {stages.map((s, i) => {
                const current = i === stages.length - 1;
                return (
                  <li key={s} className="flex items-center gap-3 animate-rise">
                    <span className={`grid size-6 place-items-center rounded-full ${current ? "border-2 border-accent" : "bg-accent text-accent-ink"}`}>
                      {current ? <span className="size-2 rounded-full bg-accent" style={{ animation: "pulse-dot 1s infinite" }} /> : <Icon.check width={14} height={14} />}
                    </span>
                    <span className={current ? "font-medium" : "text-muted"}>{s}</span>
                  </li>
                );
              })}
            </ol>
            <button onClick={() => abortRef.current?.abort()} className="mt-10 text-sm text-muted underline underline-offset-4 hover:text-ink">
              Cancel
            </button>
          </div>
        </section>
      )}

      {step === "result" && result && <Results result={result} onRestart={reset} onRerender={setResult} />}
    </div>
  );
}

const TABS = ["Report", "Compare", "Plan", "Hair", "Skin", "Routine"] as const;
type Tab = (typeof TABS)[number];

function Results({ result, onRestart, onRerender }: { result: Result; onRestart: () => void; onRerender: (r: Result) => void }) {
  const minor = result.plan.suitability === "likely_minor";
  const tabs: readonly Tab[] = minor ? ["Plan", "Skin", "Routine"] : TABS;
  const [tab, setTab] = useState<Tab>(tabs[0]);
  const [intensity, setIntensity] = useState(0.7);
  const { plan } = result;

  // Re-run the on-device retouch when the intensity slider moves.
  useEffect(() => {
    if (result.afterSource !== "local") return;
    const t = setTimeout(async () => {
      const after = await retouch(result.before, result.beforeGeo, plan.features.map((f) => f.area), intensity);
      const details: Partial<Record<FeatureArea, string>> = {};
      for (const f of plan.features) details[f.area] = await cropToDataUrl(after, result.beforeGeo.crops[f.area]);
      onRerender({ ...result, after, details });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity]);

  return (
    <section className="py-2 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{result.demo ? "Demo plan" : "Your plan"}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">{plan.tagline}</h1>
        </div>
        <button onClick={onRestart} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2">
          <Icon.refresh width={16} height={16} /> New photo
        </button>
      </div>

      {minor && (
        <p className="mt-5 rounded-xl bg-surface-2 px-4 py-3 text-sm">
          Glow is designed for adults, so this plan sticks to gentle skincare, sun protection and hair care.
        </p>
      )}
      {result.afterSource === "local" && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm">
          <Icon.info width={18} height={18} className="mt-px flex-none" />
          Your “after” is an on-device retouch preview (skin, eyes, brows, lips). Hair changes are described in the plan. Add an image model key on the server for a fully rendered after.
        </p>
      )}

      <div role="tablist" className="sticky top-0 z-10 -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-line bg-bg/90 px-4 backdrop-blur sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${tab === t ? "border-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Report" && <ReportView data={result} />}
        {tab === "Compare" && (
          <div className="mx-auto max-w-xl">
            <CompareSlider before={result.before} after={result.after} beforeLabel={plan.labels.before} afterLabel={plan.labels.after} />
            {result.afterSource === "local" && (
              <label className="mt-5 block">
                <span className="flex justify-between text-sm"><span>Retouch strength</span><span className="text-muted">{Math.round(intensity * 100)}%</span></span>
                <input type="range" min={0} max={1} step={0.05} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" />
              </label>
            )}
            <p className="mt-4 text-center font-serif text-xl italic text-muted">{plan.overall_effect}</p>
          </div>
        )}
        {tab === "Plan" && <FeaturesPanel plan={plan} details={result.details} />}
        {tab === "Hair" && <HairPanel plan={plan} />}
        {tab === "Skin" && <SkinPanel plan={plan} tones={{ skin: result.beforeGeo.tones.skin, hair: result.beforeGeo.tones.hair, lips: result.beforeGeo.tones.lips, brows: result.beforeGeo.tones.brows }} />}
        {tab === "Routine" && <RoutinePanel plan={plan} />}
      </div>

      <p className="mt-12 text-center text-xs text-muted">
        {result.model !== "demo" && <>Plan by {result.model}. </>}
        AI suggestions for grooming and styling, not medical advice. You are already enough.
      </p>
    </section>
  );
}
