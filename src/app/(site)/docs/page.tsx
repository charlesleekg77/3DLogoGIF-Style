import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer docs",
  description:
    "Embed API, REST render API, self-hosting and the changelog for 3DLogoGIF Studio.",
};

const SECTIONS = [
  {
    id: "embed",
    eyebrow: "Embed API",
    title: "Drop a looping logo into any page",
    body: "Every render has a chrome-free player at /embed/{id}. Point an iframe at it and the loop runs on the visitor's GPU with a transparent background.",
    code: `<iframe
  src="https://3dlogogif.studio/embed/render-1"
  width="480" height="480"
  style="border:0;background:transparent"
  loading="lazy"
  title="3D logo loop"
></iframe>`,
  },
  {
    id: "rest",
    eyebrow: "REST render API",
    title: "Fetch rendered artefacts",
    body: "The download route serves an encoded file when the artefact exists, and a machine-readable 404 when it does not, so the UI can fall back to the client-side export path.",
    code: `GET /api/renders/{id}/download?format=gif|mp4|webp

200  image/gif | video/mp4 | image/webp
400  unsupported format
404  unknown id, or artefact not generated on this deployment`,
  },
  {
    id: "self-host",
    eyebrow: "Self-hosting",
    title: "Run the whole studio yourself",
    body: "The studio is a standard Next.js app. The only runtime assets it needs are the gif.js worker (copied from node_modules on install) and, for the pricing page, a Stripe key.",
    code: `npm install
npm run build
npm run start

# .env.local
STRIPE_SECRET_KEY=...
STRIPE_PRICE_PRO=...
STRIPE_PRICE_STUDIO=...`,
  },
  {
    id: "changelog",
    eyebrow: "Changelog",
    title: "What changed",
    body: "The blueprint build ships the full studio, gallery and pricing surfaces.",
    code: `2026-10  Migrated to React 19 + R3F v9 + drei v10.
2026-10  Split the site shell into a route group so /embed stays chrome-free.
2026-10  Client-side GIF + WebCodecs MP4 export.
2026-10  Studio, showcase and pricing surfaces.`,
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 pb-24 pt-28 lg:px-10 lg:pt-36">
      <header className="max-w-2xl">
        <span className="eyebrow">Developers</span>
        <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.4vw,3.4rem)] font-semibold leading-[1.02] tracking-tightest text-void-50">
          Build with the studio, not just in it.
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-void-300">
          Embed a loop, fetch a render over HTTP, or self-host the whole thing.
        </p>
      </header>

      <div className="mt-16 space-y-16">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <span className="eyebrow">{section.eyebrow}</span>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-void-50">
              {section.title}
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-void-300">
              {section.body}
            </p>
            <pre className="mt-6 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/40 p-5 font-mono text-[12px] leading-relaxed text-void-200">
              <code>{section.code}</code>
            </pre>
          </section>
        ))}
      </div>
    </div>
  );
}
