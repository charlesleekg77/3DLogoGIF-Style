"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { GalleryItem } from "@/types/studio";
import { cn, formatNumber } from "@/lib/utils";

/**
 * Lazy WebGL for the grid.
 *
 * Browsers cap live WebGL contexts (typically 8–16) and evict the oldest when
 * you exceed it, which produces blank cards. A masonry grid can easily hold
 * dozens of tiles, so a card mounts its canvas only while it is near the
 * viewport and unmounts it again once it scrolls away. The IntersectionObserver
 * root margin gives a one-screen buffer so cards are already rendering by the
 * time they scroll into view.
 */
const GalleryPreview = dynamic(
  () => import("@/components/gallery/GalleryPreview").then((m) => m.GalleryPreview),
  { ssr: false },
);

/** Skeleton shown until a card enters the mount zone. */
function PreviewSkeleton({ item }: { item: GalleryItem }) {
  return (
    <div className="grid h-full w-full place-items-center">
      <span
        className="h-16 w-16 rounded-xl border border-white/10"
        style={{ background: `radial-gradient(circle at 35% 30%, ${item.color}55, transparent 70%)` }}
      />
    </div>
  );
}

export interface GalleryCardProps {
  item: GalleryItem;
  onOpen: (item: GalleryItem) => void;
  /** Row-span for the masonry rhythm. */
  span?: "short" | "tall";
}

export function GalleryCard({ item, onOpen, span = "short" }: GalleryCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(1);
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Mount/unmount the canvas based on proximity to the viewport.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setMounted(entry.isIntersecting),
      { rootMargin: "600px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={containerRef}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.07] bg-void-800/60 transition-all duration-300",
        "hover:border-white/20 hover:shadow-[0_24px_60px_-30px_rgba(124,92,255,0.7)]",
        span === "tall" ? "row-span-2" : "",
      )}
      onMouseEnter={() => {
        setHovered(true);
        // 3× spin on hover — the brief's "speeds up on hover" cue, applied
        // without a React render because the frame loop reads the ref.
        speedRef.current = 3;
      }}
      onMouseLeave={() => {
        setHovered(false);
        speedRef.current = 1;
      }}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.title} by ${item.author}`}
    >
      {/* Preview well. Aspect ratio is set per span so the masonry stays tidy. */}
      <div
        className={cn(
          "relative w-full overflow-hidden",
          span === "tall" ? "aspect-[3/4]" : "aspect-[4/3]",
        )}
        style={{
          backgroundImage: "repeating-conic-gradient(#131318 0 25%, #0d0d11 0 50%)",
          backgroundSize: "18px 18px",
        }}
      >
        {mounted ? <GalleryPreview item={item} speed={item.rotationSpeed} speedRef={speedRef} /> : <PreviewSkeleton item={item} />}

        {/* Hover overlay with the render metadata the brief asks for. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-void/95 via-void/60 to-transparent p-3 transition-opacity duration-300",
            hovered ? "opacity-100" : "opacity-0",
          )}
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-void-200">
            {item.rotationSpeed}°/s
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan">
            {item.material}
          </span>
        </div>

        {item.pro ? (
          <span className="absolute right-3 top-3 rounded-md border border-neon-violet/40 bg-neon-violet/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-neon-violet backdrop-blur-sm">
            pro
          </span>
        ) : null}
      </div>

      {/* Card footer. */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-medium tracking-tight text-void-50">
            {item.title}
          </h3>
          <p className="truncate font-mono text-[10px] text-void-400">@{item.author}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 font-mono text-[10px] text-void-400">
          <span title="likes">♥ {formatNumber(item.likes)}</span>
          <span title="downloads">↓ {formatNumber(item.downloads)}</span>
        </div>
      </div>
    </article>
  );
}
