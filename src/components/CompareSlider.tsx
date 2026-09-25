"use client";

import { useRef, useState } from "react";

export function CompareSlider({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);

  const moveTo = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div
      ref={ref}
      className="relative cursor-ew-resize select-none overflow-hidden rounded-3xl bg-surface-2 touch-none focus-within:ring-2 focus-within:ring-accent"
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        moveTo(e.clientX);
      }}
      onPointerMove={(e) => e.buttons && moveTo(e.clientX)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={afterLabel} className="block w-full" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={beforeLabel} className="block w-full" draggable={false} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,.4)]" style={{ left: `${pos}%` }}>
        <div className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6-6 6 6 6M15 6l6 6-6 6" /></svg>
        </div>
      </div>
      <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-white">{beforeLabel}</span>
      <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-white">{afterLabel}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Reveal before and after"
        className="sr-only"
      />
    </div>
  );
}
