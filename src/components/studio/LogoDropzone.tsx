"use client";

import { useCallback, useRef, useState } from "react";
import { BUILTIN_LOGOS } from "@/data/builtin-logos";
import { useStudio } from "@/lib/store";
import { logoFromFile, UploadError } from "@/lib/upload";
import { cn } from "@/lib/utils";

/**
 * Logo intake control.
 *
 * Drag-and-drop plus a click-to-browse fallback, and a rail of built-in marks so
 * the studio is never empty on first load. The drop target is the whole panel,
 * not a small dashed box, because a large target is dramatically easier to hit.
 */
export function LogoDropzone() {
  const logo = useStudio((s) => s.logo);
  const setLogo = useStudio((s) => s.setLogo);
  const setConfig = useStudio((s) => s.setConfig);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      try {
        const next = await logoFromFile(file);
        setLogo(next);
        // A raster upload cannot be extruded, so switch the pipeline for the
        // user rather than rendering nothing.
        setConfig({ geometrySource: next.kind === "png" ? "heightmap" : "extrude" });
      } catch (err) {
        setError(err instanceof UploadError ? err.message : "Upload failed.");
      } finally {
        setBusy(false);
      }
    },
    [setConfig, setLogo],
  );

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an SVG or transparent PNG logo"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-xl border border-dashed px-4 py-5 text-center transition-all duration-200",
          dragging
            ? "border-neon-cyan/70 bg-neon-cyan/[0.06]"
            : "border-white/12 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]",
        )}
      >
        {/* Scanning highlight, purely decorative. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        />
        <p className="text-[13px] font-medium text-void-100">
          {busy ? "Reading file…" : dragging ? "Drop to load" : "Drop SVG / PNG"}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-void-400">
          or click to browse · max 8 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".svg,image/svg+xml,.png,image/png"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            // Reset so re-selecting the same file still fires `change`.
            event.target.value = "";
          }}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
          {error}
        </p>
      ) : null}

      {/* Current artwork readout. */}
      <div className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-void-100">{logo.name}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-void-400">
            {logo.kind} · {logo.aspect.toFixed(2)}:1
          </p>
        </div>
        <span
          className={cn(
            "ml-3 shrink-0 rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest",
            logo.kind === "svg"
              ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"
              : "border-neon-amber/30 bg-neon-amber/10 text-neon-amber",
          )}
        >
          {logo.kind === "svg" ? "vector" : "heightmap"}
        </span>
      </div>

      {/* Built-in marks. */}
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-void-400">
          Templates
        </p>
        <div className="grid grid-cols-4 gap-2">
          {BUILTIN_LOGOS.map((builtin) => {
            const active = logo.kind === "builtin" && logo.name === builtin.name;
            return (
              <button
                key={builtin.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setLogo(builtin);
                  setConfig({ geometrySource: "extrude" });
                }}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-2 transition-all duration-150",
                  active
                    ? "border-neon-violet/60 bg-neon-violet/[0.08]"
                    : "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
                )}
              >
                {/* Inline preview of the mark, tinted to the current material colour. */}
                <span
                  aria-hidden
                  className="grid h-8 w-full place-items-center [&_svg]:h-7 [&_svg]:w-auto"
                  dangerouslySetInnerHTML={{ __html: builtin.svg ?? "" }}
                />
                <span className="text-[9px] font-medium uppercase tracking-wider text-void-300">
                  {builtin.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
