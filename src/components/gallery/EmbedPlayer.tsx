"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { GalleryItem } from "@/types/studio";

/**
 * Embed player.
 *
 * A single rotating mesh on a transparent background — no chrome, no controls.
 * The canvas is client-only (WebGL cannot be SSR'd) and the iframe host page
 * gets nothing but the animation.
 */
const GalleryPreview = dynamic(
  () => import("@/components/gallery/GalleryPreview").then((m) => m.GalleryPreview),
  { ssr: false },
);

export function EmbedPlayer({ item }: { item: GalleryItem }) {
  const speedRef = useRef(1);

  return (
    <div className="h-[min(88vw,88vh)] w-[min(88vw,88vh)]">
      <GalleryPreview item={item} speed={item.rotationSpeed} speedRef={speedRef} />
    </div>
  );
}
