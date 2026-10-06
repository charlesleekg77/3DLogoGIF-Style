import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * /legal/[doc] — Terms, Privacy and License.
 *
 * Three static documents that share one layout. The copy here is deliberately
 * concrete about how the product actually behaves (client-side rendering, what a
 * licence grants) but it is still blueprint text: replace it with counsel-reviewed
 * wording before launch.
 */
const DOCS = {
  terms: {
    title: "Terms of Service",
    intro: "The agreement between you and 3DLogoGIF Studio for using the studio.",
    sections: [
      {
        h: "Using the studio",
        p: "You may render any artwork you hold the rights to. You are responsible for the files you upload and for confirming that you are allowed to turn them into 3D derivatives.",
      },
      {
        h: "Plans and limits",
        p: "The Starter plan renders a limited number of watermarked 720p GIFs per day. Pro raises the resolution to 4K, removes the watermark and adds transparency, custom HDRI environments and a commercial licence. Limits are enforced per account.",
      },
      {
        h: "Cancellation",
        p: "You can cancel at any time. Files you already exported stay covered by the licence that was active when you rendered them; your account drops back to Starter limits at the end of the billing period.",
      },
      {
        h: "Availability",
        p: "The client-side pipeline runs on your machine, so a render can be limited by your own hardware. We do not guarantee that any particular export completes on any particular device.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "What we do and do not collect when you use the studio.",
    sections: [
      {
        h: "Artwork stays local",
        p: "The 3D scene, the animation and the GIF/video encoding all run in your browser using WebGL and WebCodecs. Your artwork is not uploaded unless you explicitly save it to a project.",
      },
      {
        h: "Account data",
        p: "If you create an account we store your email address and plan so we can enforce render limits and bill you. We do not sell it, and we do not use your artwork to train models.",
      },
      {
        h: "Payments",
        p: "Card details are handled by Stripe. We never see or store your full card number; we only receive a customer id and subscription status.",
      },
      {
        h: "Analytics",
        p: "This blueprint build ships without third-party analytics or advertising trackers.",
      },
    ],
  },
  license: {
    title: "Render License",
    intro: "What you are allowed to do with the files you export.",
    sections: [
      {
        h: "Starter renders",
        p: "Starter exports are watermarked and licensed for evaluation and internal testing only. Do not ship them in public-facing work.",
      },
      {
        h: "Pro renders",
        p: "Pro includes a worldwide, perpetual, non-exclusive commercial licence for anything you render, including client work and advertising. The licence attaches to the file, not to your subscription: renders you already made stay licensed if you cancel.",
      },
      {
        h: "Custom modelling",
        p: "Commissioned assets are delivered with full ownership of the resulting model and source files, subject to the project agreement. We retain the right to show the work in our portfolio unless you ask us not to.",
      },
      {
        h: "Your input",
        p: "You keep all rights to the vectors and images you bring. We claim no ownership over your original artwork.",
      },
    ],
  },
} as const;

type DocKey = keyof typeof DOCS;

export function generateStaticParams() {
  return (Object.keys(DOCS) as DocKey[]).map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  const entry = DOCS[doc as DocKey];
  if (!entry) return { title: "Not found" };
  return { title: entry.title, description: entry.intro };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const entry = DOCS[doc as DocKey];
  if (!entry) notFound();

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 pb-24 pt-28 lg:pt-36">
      <span className="eyebrow">Legal</span>
      <h1 className="mt-5 font-display text-[clamp(2rem,4.4vw,3rem)] font-semibold leading-[1.05] tracking-tightest text-void-50">
        {entry.title}
      </h1>
      <p className="mt-5 text-[15px] leading-relaxed text-void-300">{entry.intro}</p>

      <div className="mt-12 space-y-10">
        {entry.sections.map((section) => (
          <section key={section.h}>
            <h2 className="font-display text-xl font-semibold tracking-tight text-void-50">
              {section.h}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-void-300">{section.p}</p>
          </section>
        ))}
      </div>

      <p className="mt-14 font-mono text-[11px] uppercase tracking-[0.2em] text-void-500">
        Blueprint text · replace with counsel-reviewed wording before launch
      </p>
    </div>
  );
}
