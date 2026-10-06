import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book a custom 3D logo modeling project, or get help with the studio.",
};

const TOPICS: Record<string, { heading: string; blurb: string }> = {
  modeling: {
    heading: "Commission a hand-modelled logo",
    blurb:
      "Send the vector and a short brief. You get a production-ready glTF plus the source .blend, with two revision rounds inside five working days.",
  },
  support: {
    heading: "Studio support",
    blurb:
      "Stuck on an export, a material, or a billing question? Describe what you expected and what happened.",
  },
  default: {
    heading: "Talk to the studio",
    blurb: "Custom modelling, licensing, or anything else — tell us what you need.",
  },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const active = (topic && TOPICS[topic]) || TOPICS.default;

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 pb-24 pt-28 lg:pt-36">
      <span className="eyebrow">Contact</span>
      <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.4vw,3rem)] font-semibold leading-[1.05] tracking-tightest text-void-50">
        {active.heading}
      </h1>
      <p className="mt-5 text-[15px] leading-relaxed text-void-300">{active.blurb}</p>

      <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <p className="text-sm text-void-300">
          This blueprint build ships without a form backend. Wire this page to your mail provider
          or a form service to go live.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/gallery" className="btn-ghost px-6 py-3">
            Browse showcase
          </Link>
          <Link href="/pricing" className="btn-ghost px-6 py-3">
            See pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
