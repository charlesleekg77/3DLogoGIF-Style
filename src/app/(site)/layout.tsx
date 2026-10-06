import { LenisProvider } from "@/components/layout/LenisProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

/**
 * Layout for the public marketing/studio pages.
 *
 * Everything the embed must not inherit lives here: the header, the footer, the
 * smooth-scroll provider, and the decorative background layers. Routes inside
 * `(site)` get the full chrome; `/embed/[id]` sits outside the group and stays bare.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fixed decorative layers; `-z-10` keeps them behind all content. */}
      <div className="radial-bloom" aria-hidden />
      <div className="grid-overlay" aria-hidden />
      <LenisProvider>
        <SiteHeader />
        <main className="relative z-0">{children}</main>
        <SiteFooter />
      </LenisProvider>
    </>
  );
}
