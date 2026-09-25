"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { captureVideoFrame, normalizePhoto } from "@/lib/image";
import { Icon } from "./icons";

export function PhotoPicker({ onPhoto }: { onPhoto: (dataUrl: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [camera, setCamera] = useState(false);

  const handleFile = useCallback(
    async (file?: File | null) => {
      if (!file) return;
      setError(null);
      try {
        onPhoto(await normalizePhoto(file));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't read that photo.");
      }
    },
    [onPhoto],
  );

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      if (item) void handleFile(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-10 text-center transition-colors ${
          dragging ? "border-accent bg-accent/5" : "border-line bg-surface"
        }`}
      >
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-surface-2 text-accent">
          <Icon.sparkle width={26} height={26} />
        </div>
        <p className="font-serif text-2xl">Drop a selfie here</p>
        <p className="mt-1 text-sm text-muted">Front-facing, natural light, no filters. JPEG, PNG or WebP.</p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-bg hover:opacity-90"
          >
            <Icon.upload /> Choose photo
          </button>
          <button
            type="button"
            onClick={() => setCamera(true)}
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-medium hover:bg-surface-2"
          >
            <Icon.camera /> Take a selfie
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      </div>
      {camera && (
        <CameraModal
          onClose={() => setCamera(false)}
          onCapture={(d) => {
            setCamera(false);
            onPhoto(d);
          }}
        />
      )}
    </div>
  );
}

function CameraModal({ onClose, onCapture }: { onClose: () => void; onCapture: (d: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1440 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("Camera unavailable. Check permissions, or upload a photo instead.");
      }
    })();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      if (videoRef.current?.videoWidth) onCapture(captureVideoFrame(videoRef.current));
      setCountdown(null);
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onCapture]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Take a selfie" className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-black">
        <video ref={videoRef} playsInline muted className="aspect-[3/4] w-full -scale-x-100 object-cover" />
        {/* Face guide */}
        <svg viewBox="0 0 300 400" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
          <ellipse cx="150" cy="185" rx="92" ry="122" fill="none" stroke="white" strokeOpacity=".6" strokeDasharray="6 8" strokeWidth="2" />
        </svg>
        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 grid place-items-center font-serif text-8xl text-white">{countdown}</div>
        )}
        {error && <p className="absolute inset-x-0 top-1/2 px-6 text-center text-white">{error}</p>}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-5">
          <button onClick={onClose} className="rounded-full bg-white/15 p-3 text-white" aria-label="Close camera">
            <Icon.close />
          </button>
          <button
            onClick={() => setCountdown(3)}
            disabled={!!error || countdown !== null}
            className="size-16 rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
            aria-label="Capture in 3 seconds"
          />
          <span className="w-11 text-center text-xs text-white/70">3s timer</span>
        </div>
      </div>
    </div>
  );
}
