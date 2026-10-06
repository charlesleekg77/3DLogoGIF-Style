"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Inertia smooth-scroll provider.
 *
 * Lenis takes over the document scroll and interpolates it, which is what gives
 * the page its weighted, inertial feel. Two details matter:
 *
 *  - The instance is torn down on unmount; a leaked Lenis loop keeps calling
 *    `requestAnimationFrame` and fights the next page's scroll.
 *  - `prefers-reduced-motion` disables it entirely. Hijacking scroll is a
 *    vestibular trigger for some users, and there is no visual payoff for them.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      // Exponential ease-out: fast pickup, long settle — the "inertia" feel.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 0.9,
      lerp: 0.1,
    });
    lenisRef.current = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Reset scroll position on navigation; the browser keeps the old offset
  // otherwise, which lands the user mid-page on the new route.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return <>{children}</>;
}
