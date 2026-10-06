import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";

export const metadata: Metadata = {
  title: "Showcase",
  description:
    "Endlessly scrolling gallery of community 3D logo loops — chrome, glass, gold, holographic and neon renders. Download GIF, MP4 or WebP, or remix any template in the studio.",
};

export default function GalleryPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 pb-24 pt-28 lg:px-10 lg:pt-36">
      <header className="max-w-2xl">
        <span className="eyebrow">Showcase · 02</span>
        <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.4vw,3.4rem)] font-semibold leading-[1.02] tracking-tightest text-void-50">
          Every loop here was made in the browser.
        </h1>
        <p className="mt-5 text-pretty text-[15px] leading-relaxed text-void-300">
          Hover a card to spin it up. Open one to grab the GIF, the MP4, the embed snippet, or to
          remix the whole thing in the studio.
        </p>
      </header>

      <div className="mt-12">
        <GalleryGrid />
      </div>
    </div>
  );
}
