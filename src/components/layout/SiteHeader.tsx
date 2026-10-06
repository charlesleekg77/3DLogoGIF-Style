"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Studio", index: "01" },
  { href: "/gallery", label: "Showcase", index: "02" },
  { href: "/pricing", label: "Pricing", index: "03" },
];

/**
 * Sticky site header.
 *
 * Becomes opaque once the user leaves the top of the page, so the hero's WebGL
 * canvas shows through cleanly on first paint but text never sits on a busy
 * background once scrolling starts.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-white/[0.06] bg-void/80 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-6 lg:px-10">
        <Link href="/" className="group flex items-center gap-3" aria-label="3DLogoGIF home">
          {/* Wordmark: a rotating wireframe cube drawn in CSS, no asset needed. */}
          <span className="relative grid h-8 w-8 place-items-center">
            <span className="absolute inset-0 rounded-md border border-white/15 transition-colors group-hover:border-neon-violet/60" />
            <span className="h-3 w-3 animate-spin-slow rounded-[3px] border border-neon-cyan/80" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-void-50">
            3DLogo<span className="text-neon-violet">GIF</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
                  active ? "text-void-50" : "text-void-300 hover:text-void-100",
                )}
              >
                <span className="font-mono text-[10px] text-void-400">{item.index}</span>
                {item.label}
                {active && (
                  <span className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-transparent via-neon-violet to-transparent" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/pricing" className="hidden text-sm text-void-300 transition-colors hover:text-void-50 sm:block">
            Sign in
          </Link>
          <Link href="/#studio" className="btn-neon">
            Open studio
          </Link>
        </div>
      </div>
    </header>
  );
}
