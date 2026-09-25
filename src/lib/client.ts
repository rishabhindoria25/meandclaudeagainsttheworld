"use client";

import type { AnalyzeEvent, AnalyzeRequest, Plan } from "./schema";

export class AnalyzeError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

/** POST to /api/analyze and consume the NDJSON event stream. */
export async function requestPlan(
  body: AnalyzeRequest,
  onEvent: (e: AnalyzeEvent) => void,
  signal?: AbortSignal,
): Promise<{ plan: Plan; model: string }> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new AnalyzeError(err.error ?? `Request failed (${res.status})`, String(res.status));
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  let result: { plan: Plan; model: string } | null = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const event = JSON.parse(line) as AnalyzeEvent;
      if (event.type === "error") throw new AnalyzeError(event.message, event.code);
      if (event.type === "result") result = { plan: event.plan, model: event.model };
      onEvent(event);
    }
  }
  if (!result) throw new AnalyzeError("The connection closed before the plan finished. Please try again.");
  return result;
}

export async function requestAfterImage(image: string, instructions: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch("/api/visualize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, instructions }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.image) throw new AnalyzeError(data.error ?? "Render failed", data.code);
  return data.image as string;
}

export type ServerStatus = { analysis: boolean; imageProvider: string | null; model: string };

export async function fetchStatus(): Promise<ServerStatus> {
  try {
    const res = await fetch("/api/status", { cache: "no-store" });
    return await res.json();
  } catch {
    return { analysis: false, imageProvider: null, model: "" };
  }
}
