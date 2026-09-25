"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import { REPORT_WIDTH, ReportCard, type ReportData } from "./ReportCard";
import { THEMES, type TemplateId } from "./themes";

export function ReportView({ data }: { data: ReportData }) {
  const [template, setTemplate] = useState<TemplateId>("editorial");
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(0);
  const [busy, setBusy] = useState<null | "download" | "share">(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Scale the fixed-width card to the available width.
  useLayoutEffect(() => {
    const el = wrapRef.current, card = cardRef.current;
    if (!el || !card) return;
    const ro = new ResizeObserver(() => {
      const s = el.clientWidth / REPORT_WIDTH;
      setScale(s);
      setHeight(card.offsetHeight * s);
    });
    ro.observe(el);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("glow:template") as TemplateId | null;
      if (saved && saved in THEMES) setTemplate(saved);
    } catch {}
  }, []);

  const pick = (id: TemplateId) => {
    setTemplate(id);
    try {
      localStorage.setItem("glow:template", id);
    } catch {}
  };

  async function render(): Promise<Blob> {
    const { toBlob } = await import("html-to-image");
    const node = cardRef.current!;
    const blob = await toBlob(node, {
      pixelRatio: 1.5,
      cacheBust: false,
      style: { transform: "none" },
      width: REPORT_WIDTH,
      height: node.offsetHeight,
    });
    if (!blob) throw new Error("Export failed");
    return blob;
  }

  async function download() {
    setBusy("download");
    try {
      const blob = await render();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `glow-plan-${template}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setBusy("share");
    try {
      const blob = await render();
      const file = new File([blob], "glow-plan.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: data.plan.title, text: data.plan.tagline });
      } else {
        await download();
      }
    } catch {
      /* user cancelled */
    } finally {
      setBusy(null);
    }
  }

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Report style" className="flex flex-wrap gap-2">
          {Object.values(THEMES).map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={template === t.id}
              onClick={() => pick(t.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${template === t.id ? "border-ink" : "border-line hover:bg-surface-2"}`}
            >
              <span className="size-3.5 rounded-full border border-black/20" style={{ background: t.id === "sage" ? t.band : t.bg }} />
              {t.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {canShare && (
            <button onClick={share} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2 disabled:opacity-50">
              <Icon.share width={18} height={18} /> {busy === "share" ? "Preparing…" : "Share"}
            </button>
          )}
          <button onClick={download} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50">
            <Icon.download width={18} height={18} /> {busy === "download" ? "Rendering…" : "Download PNG"}
          </button>
        </div>
      </div>
      <div ref={wrapRef} className="w-full overflow-hidden rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,.35)]" style={{ height: height || undefined }}>
        <div style={{ width: REPORT_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <ReportCard ref={cardRef} data={data} theme={THEMES[template]} />
        </div>
      </div>
    </div>
  );
}
