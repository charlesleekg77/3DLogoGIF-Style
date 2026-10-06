"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GalleryCard } from "@/components/gallery/GalleryCard";
import { GalleryModal } from "@/components/gallery/GalleryModal";
import { createGalleryItems } from "@/data/gallery";
import { cn } from "@/lib/utils";
import type { GalleryItem, MaterialPresetId } from "@/types/studio";

/**
 * Infinite masonry grid.
 *
 * Pagination is driven by a sentinel + IntersectionObserver rather than a scroll
 * listener: one callback per page rather than one per scroll event, and it works
 * unchanged with Lenis since Lenis still drives the real document scroll.
 *
 * The filter rail is client-side over the generated set. In production the same
 * props would become query params on a paginated endpoint; the component's shape
 * does not change.
 */

const PAGE_SIZE = 12;
/** Total items available in the seed set; a real backend would return `hasMore`. */
const TOTAL = 60;

const FILTERS: { id: MaterialPresetId | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "chrome", label: "Chrome" },
  { id: "glass", label: "Glass" },
  { id: "gold", label: "Gold" },
  { id: "holographic", label: "Holo" },
  { id: "neon", label: "Neon" },
  { id: "wireframe", label: "Wire" },
];

export function GalleryGrid() {
  const [filter, setFilter] = useState<MaterialPresetId | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Deterministic seed set, generated once. `TOTAL` items keep the "infinite"
  // grid honest without a fake loading spinner that never resolves.
  const allItems = useMemo(() => createGalleryItems(TOTAL), []);
  const filtered = useMemo(
    () => (filter === "all" ? allItems : allItems.filter((item) => item.material === filter)),
    [allItems, filter],
  );

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  // Reset pagination whenever the filter changes.
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const loadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div>
      {/* Filter rail. */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((entry) => {
          const active = entry.id === filter;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setFilter(entry.id)}
              aria-pressed={active}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-all duration-200",
                active
                  ? "border-neon-violet/60 bg-neon-violet/[0.12] text-void-50"
                  : "border-white/[0.08] bg-white/[0.02] text-void-300 hover:border-white/20 hover:text-void-100",
              )}
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      {/* Masonry. CSS columns give the staggered rhythm with no JS measurement;
          `break-inside-avoid` keeps cards intact across column breaks. */}
      <div className="mt-6 columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
        {visible.map((item, index) => (
          <div key={item.id} className="mb-5 break-inside-avoid">
            <GalleryCard item={item} onOpen={setSelected} span={index % 5 === 2 ? "tall" : "short"} />
          </div>
        ))}
      </div>

      {/* Pagination sentinel. */}
      {hasMore ? (
        <div ref={sentinelRef} className="flex justify-center py-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-void-400">
            loading more renders…
          </span>
        </div>
      ) : (
        <p className="py-12 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-void-500">
          end of showcase · {filtered.length} renders
        </p>
      )}

      <GalleryModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
