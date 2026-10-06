"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { captureRenderToStore, isFormatSupported } from "@/lib/capture";
import { useStudio } from "@/lib/store";
import { cn, downloadBlob, formatBytes } from "@/lib/utils";

/**
 * Export panel — the trigger for Deliverable 2.
 *
 * Owns three pieces of state the store does not: the abort controller, the
 * last-produced blob (for the download button), and whether the chosen format is
 * actually encodable in this browser. Everything the user *sees* during a render
 * comes from `capture` in the store, so the progress bar and the 3D viewport
 * stay in sync.
 */
export function ExportPanel() {
  const capture = useStudio((s) => s.capture);
  const config = useStudio((s) => s.config);
  const abortRef = useRef<AbortController | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [supported, setSupported] = useState(true);

  // WebCodecs is not universal; probe once on mount rather than failing mid-render.
  useEffect(() => {
    setSupported(isFormatSupported(config.format));
  }, [config.format]);

  // Cancel an in-flight capture if the component goes away.
  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = capture.phase === "rendering" || capture.phase === "encoding" || capture.phase === "preparing";

  const start = useCallback(async () => {
    if (busy) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBlob(null);
    try {
      const result = await captureRenderToStore({ signal: controller.signal });
      if (result) setBlob(result.blob);
    } catch {
      // The store already carries the error message; nothing to do here.
    }
  }, [busy]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const filename = `logo-${config.resolution}px-${config.frames}f.${config.format}`;

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-void-400">
            Render engine
          </p>
          <p className="mt-0.5 text-[13px] font-semibold tracking-tight text-void-50">
            {config.format === "gif" ? "GIF loop" : `${config.format.toUpperCase()} video`}
          </p>
        </div>
        <span className="stat-chip">
          <span className="text-void-400">LOOP</span>
          <span className="stat-value">
            {((config.frames * config.frameDelay) / 1000).toFixed(1)}s
          </span>
        </span>
      </div>

      <div className="space-y-4 px-5 py-4">
        {/* Progress. The bar is always mounted so its height does not jump. */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-void-400">
              {capture.phase}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-void-200">
              {Math.round(capture.progress * 100)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-200 ease-out",
                capture.phase === "error" ? "bg-red-500" : "bg-gradient-to-r from-neon-violet to-neon-cyan",
              )}
              style={{ width: `${Math.max(2, capture.progress * 100)}%` }}
            />
          </div>
          <p
            className={cn(
              "mt-2 truncate font-mono text-[10px]",
              capture.phase === "error" ? "text-red-300" : "text-void-400",
            )}
          >
            {capture.error ?? capture.message}
          </p>
        </div>

        {!supported ? (
          <p className="rounded-lg border border-neon-amber/30 bg-neon-amber/10 px-3 py-2 text-[11px] text-neon-amber">
            {config.format.toUpperCase()} encoding is unavailable in this browser. GIF always works.
          </p>
        ) : null}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={start}
            disabled={busy || !supported}
            className="btn-neon flex-1"
          >
            {busy ? "Rendering…" : capture.phase === "done" ? "Render again" : `Render ${config.format.toUpperCase()}`}
          </button>
          {busy ? (
            <button type="button" onClick={cancel} className="btn-ghost">
              Cancel
            </button>
          ) : null}
        </div>

        {/* Result. `downloadBlob` avoids the popup blockers that `window.open` trips. */}
        {capture.resultUrl && blob ? (
          <div className="space-y-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-void-400">
                Output
              </span>
              <span className="stat-value">{formatBytes(capture.resultSize)}</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capture.resultUrl}
              alt="Rendered 3D logo loop preview"
              className="w-full rounded-lg border border-white/[0.07] bg-[repeating-conic-gradient(#1c1c22_0_25%,#121216_0_50%)] bg-[length:16px_16px]"
            />
            <button
              type="button"
              onClick={() => downloadBlob(blob, filename)}
              className="btn-ghost w-full"
            >
              Download {filename}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
