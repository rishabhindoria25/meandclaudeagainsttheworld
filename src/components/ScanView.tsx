"use client";

import type { FaceGeometry } from "@/lib/face/landmarks";

/** Photo with the detected face mesh drawn as a light dot field. */
export function ScanView({ src, geo, scanning }: { src: string; geo: FaceGeometry | null; scanning?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-surface-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Your photo" className="block w-full" />
      {geo && (
        <svg viewBox={`0 0 ${geo.width} ${geo.height}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden>
          {geo.points.map((p, i) =>
            i % 3 === 0 ? (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={geo.width / 380}
                fill="white"
                style={scanning ? { animation: `pulse-dot 1.6s ${(i % 40) * 0.04}s infinite` } : { opacity: 0.55 }}
              />
            ) : null,
          )}
        </svg>
      )}
      {scanning && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-white/25 to-transparent" style={{ animation: "scan 2.4s ease-in-out infinite" }} />
      )}
    </div>
  );
}
