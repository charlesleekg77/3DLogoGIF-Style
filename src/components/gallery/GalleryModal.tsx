"use client";

import { useEffect, useRef, useState } from "react";
import { builtinLogoById } from "@/data/builtin-logos";
import { useStudio } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/studio";

/**
 * Expanded render modal.
 *
 * Offers the three deliverables a creator actually wants after finding a look
 * they like: the raw files, an embed snippet, and a one-click jump into the
 * studio with the template pre-loaded.
 *
 * Accessibility notes:
 *   - Rendered into the same tree rather than a portal, but focus is trapped and
 *     returned to the triggering card on close.
 *   - Escape closes; the backdrop click closes; scroll is locked underneath.
 */

const FORMATS = [
  { ext: "GIF", label: "Transparent loop", detail: "1024px · 60f · 1.8 MB" },
  { ext: "MP4", label: "H.264 video", detail: "1920px · 30 fps · 4.2 MB" },
  { ext: "WEBP", label: "Animated WebP", detail: "2048px · 60 f · 2.6 MB" },
];

export function GalleryModal({
  item,
  onClose,
}: {
  item: GalleryItem | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const setLogo = useStudio((s) => s.setLogo);
  const applyMaterial = useStudio((s) => s.applyMaterial);
  const setConfig = useStudio((s) => s.setConfig);

  // Focus management + scroll lock, active only while open.
  useEffect(() => {
    if (!item) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog so screen readers announce it.
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 20);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      // Simple focus trap over the dialog's focusable descendants.
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      restoreFocusRef.current?.focus();
    };
  }, [item, onClose]);

  if (!item) return null;

  const embed = `<iframe src="https://3dlogogif.studio/embed/${item.id}" width="480" height="480" style="border:0;background:transparent" allowtransparency="true" loading="lazy" title="${item.title} 3D logo"></iframe>`;

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  const customize = () => {
    // Seed the studio with this template, then send the user there.
    setLogo(builtinLogoById(item.logoId));
    applyMaterial(item.material);
    setConfig({ color: item.color, rotationSpeed: item.rotationSpeed });
    onClose();
    window.location.href = "/#studio";
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} by ${item.author}`}
    >
      {/* Backdrop. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-void/80 backdrop-blur-md"
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        className="glass-strong relative grid w-full max-w-4xl gap-0 overflow-hidden rounded-2xl outline-none md:grid-cols-[minmax(0,1fr)_320px]"
      >
        {/* Preview side. */}
        <div
          className="relative aspect-square w-full"
          style={{
            backgroundImage: "repeating-conic-gradient(#16161b 0 25%, #0d0d10 0 50%)",
            backgroundSize: "22px 22px",
          }}
        >
          <div className="grid h-full w-full place-items-center">
            <span
              className="h-32 w-32 rounded-2xl border border-white/10"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${item.color}66, transparent 70%)`,
              }}
            />
          </div>
          <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.24em] text-void-400">
            {item.logoId} · {item.material}
          </span>
        </div>

        {/* Detail side. */}
        <div className="flex max-h-[80vh] flex-col overflow-y-auto border-t border-white/[0.07] p-5 md:border-l md:border-t-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-void-50">
                {item.title}
              </h2>
              <p className="mt-0.5 font-mono text-[11px] text-void-400">@{item.author}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] text-void-300 transition-colors hover:border-white/25 hover:text-void-50"
            >
              ESC
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-void-300"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="hairline my-5" />

          {/* Downloads. */}
          <h3 className="font-mono text-[10px] uppercase tracking-[0.24em] text-void-400">
            Downloads
          </h3>
          <div className="mt-3 space-y-2">
            {FORMATS.map((format) => (
              <div
                key={format.ext}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-void-100">{format.ext}</p>
                  <p className="truncate font-mono text-[10px] text-void-400">{format.detail}</p>
                </div>
                <a
                  href={`/api/renders/${item.id}/download?format=${format.ext.toLowerCase()}`}
                  className="shrink-0 rounded-md border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-void-200 transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan"
                >
                  Get
                </a>
              </div>
            ))}
          </div>

          <div className="hairline my-5" />

          {/* Embed. */}
          <h3 className="font-mono text-[10px] uppercase tracking-[0.24em] text-void-400">
            Embed
          </h3>
          <div className="mt-3">
            <pre className="max-h-24 overflow-auto rounded-lg border border-white/[0.07] bg-void-950/70 p-3 font-mono text-[10px] leading-relaxed text-void-300">
              <code>{embed}</code>
            </pre>
            <button
              type="button"
              onClick={() => copy(embed, "embed")}
              className="btn-ghost mt-2 w-full text-[12px]"
            >
              {copied === "embed" ? "Copied ✓" : "Copy embed code"}
            </button>
          </div>

          <div className="mt-auto pt-6">
            <button type="button" onClick={customize} className={cn("btn-neon w-full")}>
              Customize this template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
