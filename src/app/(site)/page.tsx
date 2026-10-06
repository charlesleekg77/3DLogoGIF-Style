import Link from "next/link";
import { StudioShell } from "@/components/studio/StudioShell";

/**
 * Hero.
 *
 * Deliberately short: one headline, one supporting line, two actions, then
 * straight into the studio. The product *is* the interactive preview, so the
 * page gets out of its own way rather than making the user scroll past marketing
 * to reach the tool.
 */
function Hero() {
  return (
    <section className="relative mx-auto w-full max-w-[1440px] px-6 pb-14 pt-28 lg:px-10 lg:pt-36">
      <div className="max-w-3xl">
        <span className="eyebrow">Real-time 3D · client-side render</span>

        <h1 className="mt-5 text-balance font-display text-[clamp(2.4rem,6vw,4.6rem)] font-semibold leading-[0.98] tracking-tightest text-void-50">
          Turn any logo into a
          <span className="relative mx-2 inline-block">
            <span className="bg-gradient-to-r from-neon-violet via-neon-cyan to-neon-pink bg-clip-text text-transparent">
              spinning 3D loop
            </span>
          </span>
          in seconds.
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-void-300">
          Drop in an SVG or a transparent PNG. Pick a chrome, glass or neon material. Export a
          seamless transparent GIF — rendered on your GPU, not in an upload queue.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="#studio" className="btn-neon px-6 py-3">
            Start customizing
          </Link>
          <Link href="/gallery" className="btn-ghost px-6 py-3">
            Browse showcase
          </Link>
        </div>

        <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
          {[
            { k: "Export", v: "4K" },
            { k: "Materials", v: "7 presets" },
            { k: "Loop", v: "360°" },
            { k: "Uploads", v: "0 bytes" },
          ].map((item) => (
            <div key={item.k} className="border-l border-white/[0.08] pl-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-void-400">
                {item.k}
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold tracking-tight text-void-50">
                {item.v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * Trust strip.
 *
 * A CSS marquee of material names rather than a logo wall — honest about the fact
 * that this is a blueprint build, and it doubles as a legend of what the studio
 * can produce.
 */
function MaterialMarquee() {
  const items = [
    "Chrome",
    "Glass",
    "Matte Plastic",
    "Gold",
    "Holographic",
    "Neon Glow",
    "Wireframe",
    "Transparent GIF",
    "HDRI Lighting",
    "4K Export",
  ];
  // Duplicated so the translateX(-50%) keyframe wraps seamlessly.
  const track = [...items, ...items];

  return (
    <div className="relative mt-16 overflow-hidden border-y border-white/[0.06] py-4">
      <div className="marquee-track">
        {track.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex shrink-0 items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-void-400"
          >
            <span className="h-1 w-1 rounded-full bg-neon-violet/70" />
            {item}
          </span>
        ))}
      </div>
      {/* Edge fades so the marquee does not hard-cut at the viewport. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-void to-transparent" />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <MaterialMarquee />
      <div className="pt-14">
        <StudioShell />
      </div>
    </>
  );
}
