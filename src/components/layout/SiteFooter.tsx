import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#studio", label: "3D Studio" },
      { href: "/gallery", label: "Showcase" },
      { href: "/pricing", label: "Pricing" },
      { href: "/pricing#custom", label: "Custom modeling" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/docs#embed", label: "Embed API" },
      { href: "/docs#rest", label: "REST render API" },
      { href: "/docs#self-host", label: "Self-hosting" },
      { href: "/docs#changelog", label: "Changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/license", label: "License" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-32 border-t border-white/[0.06] bg-void-deep/60">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-16 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-md border border-white/15">
                <span className="h-3 w-3 rounded-[3px] border border-neon-cyan/80" />
              </span>
              <span className="font-display text-[15px] font-semibold tracking-tight">
                3DLogo<span className="text-neon-violet">GIF</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-void-300">
              Real-time 3D logo loops, rendered entirely in your browser. No plugins, no upload
              queue, no waiting.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="stat-chip">
                <span className="text-void-400">ENGINE</span>
                <span className="stat-value">three.js r169</span>
              </span>
              <span className="stat-chip">
                <span className="text-void-400">EXPORT</span>
                <span className="stat-value">WebCodecs</span>
              </span>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.24em] text-void-400">
                {column.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-void-200 transition-colors hover:text-neon-cyan"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline my-10" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-void-400">
            © {new Date().getFullYear()} 3DLogoGIF Studio — blueprint build
          </p>
          <p className="font-mono text-[11px] text-void-400">
            Client-side rendering · zero-upload by default
          </p>
        </div>
      </div>
    </footer>
  );
}
