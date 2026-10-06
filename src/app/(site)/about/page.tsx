import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why 3DLogoGIF Studio renders everything client-side, and what the blueprint build covers.",
};

const PRINCIPLES = [
  {
    title: "Zero upload by default",
    body: "Your artwork is decoded, extruded and encoded in the browser. Nothing leaves the machine unless you explicitly save a project, which makes the studio safe for unreleased brand marks.",
  },
  {
    title: "Deterministic loops",
    body: "Export drives the animation clock frame by frame instead of recording wall time, so a 360° loop is pixel-identical at 24 or 60 frames per second.",
  },
  {
    title: "One source of truth for design",
    body: "The Tailwind tokens and the Three.js scene read from the same palette, so a material swatch in the HUD is the exact colour that renders.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 pb-24 pt-28 lg:px-10 lg:pt-36">
      <header className="max-w-2xl">
        <span className="eyebrow">Company</span>
        <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.4vw,3.4rem)] font-semibold leading-[1.02] tracking-tightest text-void-50">
          A logo studio that never sees your logo.
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-void-300">
          3DLogoGIF Studio exists to close the gap between a flat vector and a loop that looks
          like it came out of a motion studio — without an upload queue in between.
        </p>
      </header>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {PRINCIPLES.map((principle) => (
          <div
            key={principle.title}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
          >
            <h2 className="font-display text-lg font-semibold tracking-tight text-void-50">
              {principle.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-void-300">{principle.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
