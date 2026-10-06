import type { Metadata } from "next";
import Link from "next/link";
import { PricingTable } from "@/components/pricing/PricingTable";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free watermarked GIF exports, Pro for 4K transparent renders and commercial use, or commission a hand-modelled 3D logo in Blender.",
};

const FAQ = [
  {
    q: "What does “client-side rendering” actually mean?",
    a: "The 3D scene, the animation, and the GIF/video encoding all run in your browser using WebGL and WebCodecs. Your artwork is not uploaded unless you explicitly save it to a project.",
  },
  {
    q: "Why does the free tier watermark the GIF?",
    a: "Encoding is genuinely expensive — a 4K loop can take a few seconds of CPU. The watermark keeps the free tier useful for testing while funding the compute for paying users.",
  },
  {
    q: "Can I use a Pro render commercially?",
    a: "Yes. Pro includes a worldwide, perpetual commercial license for anything you render, including client work and advertising.",
  },
  {
    q: "What happens if I cancel?",
    a: "You keep every file you already exported, under the license that was active when you rendered it. Your account drops back to the Starter limits at the end of the period.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 pb-24 pt-28 lg:px-10 lg:pt-36">
      <header className="max-w-2xl">
        <span className="eyebrow">Pricing · 03</span>
        <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.4vw,3.4rem)] font-semibold leading-[1.02] tracking-tightest text-void-50">
          Render as much as you like. Pay for the output.
        </h1>
        <p className="mt-5 text-pretty text-[15px] leading-relaxed text-void-300">
          Start free with watermarked 720p GIFs. Move to Pro when you need 4K, transparency and a
          commercial license. Or hand the whole thing to our modellers.
        </p>
      </header>

      <div className="mt-12">
        <PricingTable />
      </div>

      {/* Custom modeling call-out. */}
      <section
        id="custom"
        className="mt-20 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 lg:p-12"
      >
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="eyebrow">Custom modeling service</span>
            <h2 className="mt-4 text-balance font-display text-[clamp(1.6rem,3vw,2.4rem)] font-semibold leading-tight tracking-tight text-void-50">
              Send us vectors. Get a production-ready 3D asset.
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-void-300">
              For brands that need more than an extrusion: real depth, chamfered edges, clean
              topology, UVs you can texture, and a lighting rig tuned for the mark. Delivered as
              glTF plus the source .blend.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact?topic=modeling" className="btn-neon px-6 py-3">
                Book a project
              </Link>
              <Link href="/gallery" className="btn-ghost px-6 py-3">
                See examples
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 self-start">
            {[
              { k: "Turnaround", v: "5 days" },
              { k: "Revisions", v: "2 rounds" },
              { k: "Formats", v: "glTF · .blend" },
              { k: "From", v: "$499" },
            ].map((item) => (
              <div key={item.k} className="border-l border-white/[0.08] pl-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-void-400">
                  {item.k}
                </dt>
                <dd className="mt-1.5 font-display text-lg font-semibold tracking-tight text-void-50">
                  {item.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FAQ. */}
      <section className="mt-20">
        <h2 className="font-display text-xl font-semibold tracking-tight text-void-50">
          Questions
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {FAQ.map((entry) => (
            <details
              key={entry.q}
              className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.14]"
            >
              <summary className="cursor-pointer list-none text-[14px] font-medium tracking-tight text-void-100 marker:content-none">
                <span className="flex items-start justify-between gap-4">
                  {entry.q}
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 font-mono text-[12px] text-void-400 transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-[13px] leading-relaxed text-void-300">{entry.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
