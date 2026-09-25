"use client";

import { forwardRef, type CSSProperties } from "react";
import type { FaceGeometry } from "@/lib/face/landmarks";
import { layoutBadges, luminance } from "@/lib/face/geometry";
import type { FeatureArea, Plan } from "@/lib/schema";
import { TipGlyph } from "../icons";
import type { ReportTheme } from "./themes";

export const REPORT_WIDTH = 1600;

export interface ReportData {
  plan: Plan;
  before: string;
  after: string;
  beforeGeo: FaceGeometry;
  afterGeo: FaceGeometry | null;
  details: Partial<Record<FeatureArea, string>>;
}

/**
 * The shareable report card, laid out at a fixed 1600px width so exports look
 * identical on every device. The on-screen preview scales it to fit.
 */
export const ReportCard = forwardRef<HTMLDivElement, { data: ReportData; theme: ReportTheme }>(function ReportCard(
  { data, theme: t },
  ref,
) {
  const { plan } = data;
  const features = plan.features.filter((f) => data.beforeGeo.anchors[f.area]);
  const head: CSSProperties = {
    fontFamily: t.headFont,
    textTransform: t.headCase,
    letterSpacing: t.headTracking,
    fontSize: t.id === "clinical" ? 22 : 15,
    fontWeight: t.id === "clinical" ? 600 : 600,
    color: t.ink,
  };
  const photoW = 520;

  return (
    <div
      ref={ref}
      style={{ width: REPORT_WIDTH, background: t.bg, color: t.ink, fontFamily: t.bodyFont, padding: 40 }}
      className="antialiased"
    >
      {/* Title */}
      <header style={{ textAlign: "center", marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: t.titleFont,
            textTransform: t.titleCase,
            fontWeight: t.titleWeight,
            fontSize: t.titleSize,
            letterSpacing: t.titleCase === "uppercase" ? (t.id === "noir" ? "0.28em" : "0.02em") : "-0.01em",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          {plan.title}
        </h1>
        <p style={{ marginTop: 10, fontSize: 19, color: t.muted, fontFamily: t.id === "editorial" || t.id === "sage" ? "var(--font-cormorant), serif" : t.bodyFont, fontStyle: t.id === "editorial" ? "italic" : "normal" }}>
          {plan.subtitle}
        </p>
      </header>

      {/* Photos + sidebar */}
      <section style={{ display: "grid", gridTemplateColumns: `${photoW}px ${photoW}px 1fr`, gap: 14 }}>
        <Photo src={data.before} geo={data.beforeGeo} features={features.map((f) => f.area)} label={plan.labels.before} theme={t} />
        <Photo src={data.after} geo={data.afterGeo ?? data.beforeGeo} features={features.map((f) => f.area)} label={plan.labels.after} theme={t} />
        <aside style={{ border: `1px solid ${t.line}`, background: t.id === "noir" ? "#1c1c1c" : t.panel, padding: "20px 22px" }}>
          <h2 style={{ ...head, margin: "0 0 14px" }}>{plan.labels.what_changed}</h2>
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {features.map((f, i) => (
              <li key={f.area} style={{ padding: "12px 0", borderTop: i ? `1px solid ${t.line}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <Badge n={i + 1} theme={t} size={26} />
                  <strong style={{ fontFamily: t.headFont, textTransform: t.headCase, letterSpacing: t.id === "clinical" ? "0.02em" : "0.12em", fontSize: t.id === "clinical" ? 19 : 13 }}>
                    {f.label}
                  </strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: 36, fontSize: 14.5, lineHeight: 1.45, color: t.muted }}>
                  {f.changes.slice(0, 3).map((c, j) => (
                    <li key={j} style={{ listStyle: "disc" }}>{c}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      {/* Key changes: detail crops */}
      <section style={{ marginTop: 26 }}>
        <SectionBar theme={t}>{plan.labels.key_changes}</SectionBar>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, features.length)}, 1fr)`, gap: 12, marginTop: 14 }}>
          {features.map((f, i) => (
            <figure key={f.area} style={{ margin: 0 }}>
              <div style={{ position: "relative", aspectRatio: "3 / 2", overflow: "hidden", background: t.line }}>
                {data.details[f.area] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.details[f.area]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                )}
                <span style={{ position: "absolute", left: 8, top: 8, background: "rgba(0,0,0,.62)", color: "#fff", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 8px" }}>
                  {f.label}
                </span>
              </div>
              <figcaption style={{ marginTop: 10 }}>
                <div style={{ fontFamily: t.id === "editorial" || t.id === "sage" ? "var(--font-cormorant), serif" : t.bodyFont, fontSize: t.id === "editorial" || t.id === "sage" ? 21 : 16, fontWeight: 600, lineHeight: 1.2 }}>
                  {i + 1}. {f.caption}
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.45, color: t.muted }}>{f.why}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Tones, tips, products */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1.2fr", gap: 14, marginTop: 26 }}>
        <Box theme={t} title={plan.labels.palette}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { name: "Skin", hex: data.beforeGeo.tones.skin },
              { name: "Hair", hex: data.beforeGeo.tones.hair },
            ]
              .concat(plan.palette.slice(0, 5).map((p) => ({ name: p.use || p.name, hex: p.hex })))
              .map((s, i) => (
                <div key={i} style={{ width: 62, textAlign: "center" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 999, margin: "0 auto", background: safeHex(s.hex), border: `1px solid ${t.line}`, outline: i < 2 ? `2px dashed ${t.muted}` : "none", outlineOffset: 2 }} />
                  <div style={{ marginTop: 6, fontSize: 10.5, lineHeight: 1.2, color: t.muted }}>{s.name}</div>
                </div>
              ))}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 11, color: t.muted }}>Dashed = sampled from your photo</p>
        </Box>
        <Box theme={t} title={plan.labels.daily_tips}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(4, plan.tips.length)}, 1fr)`, gap: 10 }}>
            {plan.tips.slice(0, 4).map((tip, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ width: 42, height: 42, borderRadius: 999, margin: "0 auto 6px", display: "grid", placeItems: "center", background: t.badgeBg, color: t.badgeInk, border: `1px solid ${t.line}` }}>
                  <TipGlyph name={tip.icon} width={20} height={20} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tip.title}</div>
                <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.3 }}>{tip.detail}</div>
              </div>
            ))}
          </div>
        </Box>
        <Box theme={t} title={plan.labels.products}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 13.5, lineHeight: 1.5 }}>
            {features.slice(0, 5).map((f) =>
              f.products[0] ? (
                <li key={f.area}>
                  <strong>{f.label}:</strong> <span style={{ color: t.muted }}>{f.products.map((p) => p.category).join(", ")}</span>
                </li>
              ) : null,
            )}
            <li style={{ marginTop: 4 }}>
              <strong>{features.find((f) => f.area === "hair")?.label ?? "Hair"} ✂</strong>{" "}
              <span style={{ color: t.muted }}>{plan.hair.style}</span>
            </li>
          </ul>
        </Box>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 26, background: t.band, color: t.bandInk, padding: "22px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <div style={{ fontFamily: t.id === "clinical" ? condensedFont : "var(--font-cormorant), serif", fontSize: t.id === "clinical" ? 24 : 30, letterSpacing: t.id === "noir" ? "0.2em" : "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
          {plan.tagline}
        </div>
        <div style={{ maxWidth: 620, fontSize: 15, lineHeight: 1.5, opacity: 0.85, fontStyle: t.id === "editorial" ? "italic" : "normal" }}>{plan.overall_effect}</div>
      </footer>
      <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: t.muted }}>
        Made with Glow · AI styling visualization
      </div>
    </div>
  );
});

const condensedFont = "var(--font-oswald), 'Arial Narrow', sans-serif";

function safeHex(hex: string) {
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#999999";
}

function Badge({ n, theme: t, size }: { n: number; theme: ReportTheme; size: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        display: "inline-grid",
        placeItems: "center",
        background: t.badgeBg,
        color: t.badgeInk,
        border: `1.5px solid ${t.id === "clinical" ? t.badgeBg : t.ink}`,
        fontSize: size * 0.52,
        fontWeight: 700,
        flex: "none",
      }}
    >
      {n}
    </span>
  );
}

function SectionBar({ theme: t, children }: { theme: ReportTheme; children: React.ReactNode }) {
  const dark = t.id === "noir" || t.id === "clinical";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: t.headFont,
        textTransform: t.headCase,
        letterSpacing: t.id === "clinical" ? "0.04em" : "0.26em",
        fontSize: t.id === "clinical" ? 24 : 15,
        fontWeight: 600,
        ...(dark ? { background: t.id === "noir" ? "#0c0c0c" : "#111", color: "#fff", padding: "10px 16px", justifyContent: "center" } : {}),
      }}
    >
      {!dark && <span style={{ flex: 1, height: 1, background: t.line }} />}
      <span>{children}</span>
      {!dark && <span style={{ flex: 1, height: 1, background: t.line }} />}
    </div>
  );
}

function Box({ theme: t, title, children }: { theme: ReportTheme; title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${t.line}`, background: t.id === "noir" ? "#1c1c1c" : t.panel, padding: "16px 18px" }}>
      <h3 style={{ margin: "0 0 12px", fontFamily: t.headFont, textTransform: t.headCase, letterSpacing: t.id === "clinical" ? "0.03em" : "0.18em", fontSize: t.id === "clinical" ? 18 : 12.5, fontWeight: 600 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

/** A photo with numbered callouts that point to real facial landmarks. */
export function Photo({
  src,
  geo,
  features,
  label,
  theme: t,
}: {
  src: string;
  geo: FaceGeometry;
  features: FeatureArea[];
  label: string;
  theme: ReportTheme;
}) {
  const W = geo.width, H = geo.height;
  const r = W * 0.028;
  const gutterX = W * 0.07;
  const anchors = features.map((a) => geo.anchors[a]);
  const ys = layoutBadges(anchors.map((p) => p.y), r * 2.6, r * 1.6, H - r * 3.5);
  const isLight = luminance(t.badgeBg) > 0.5;

  return (
    <div style={{ position: "relative", overflow: "hidden", background: "#000" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} style={{ display: "block", width: "100%" }} />
      <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>
        {anchors.map((p, i) => (
          <g key={i}>
            <line x1={gutterX + r} y1={ys[i]} x2={p.x} y2={p.y} stroke="#fff" strokeWidth={W * 0.0025} opacity={0.9} />
            <circle cx={p.x} cy={p.y} r={W * 0.006} fill="#fff" />
            <circle cx={gutterX} cy={ys[i]} r={r} fill={isLight ? "#fff" : t.badgeBg} stroke={isLight ? "#111" : "#fff"} strokeWidth={W * 0.003} />
            <text x={gutterX} y={ys[i]} textAnchor="middle" dominantBaseline="central" fontSize={r * 1.1} fontWeight={700} fill={isLight ? "#111" : t.badgeInk} fontFamily="var(--font-inter), sans-serif">
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <span
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          background: t.id === "editorial" || t.id === "sage" ? "rgba(246,241,234,.92)" : "rgba(10,10,10,.82)",
          color: t.id === "editorial" || t.id === "sage" ? "#221e1a" : "#fff",
          fontFamily: t.id === "editorial" || t.id === "sage" ? "var(--font-cormorant), serif" : t.headFont,
          fontSize: t.id === "editorial" || t.id === "sage" ? 24 : 16,
          textTransform: t.id === "editorial" ? "none" : "uppercase",
          letterSpacing: t.id === "editorial" ? "0" : "0.14em",
          padding: "4px 14px",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </div>
  );
}
