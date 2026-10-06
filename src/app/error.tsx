"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary.
 *
 * `error.tsx` catches render-time failures for a route segment. The most likely
 * cause in this app is a lost WebGL context (the GPU process crashed, or the tab
 * was backgrounded on a memory-constrained device), so the copy names that
 * possibility instead of the usual "something went wrong".
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route-error]", error);
  }, [error]);

  return (
    <div className="mx-auto grid min-h-[70vh] w-full max-w-[1440px] place-items-center px-6 lg:px-10">
      <div className="max-w-md text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-neon-pink">
          render error
        </p>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-void-50">
          The viewport dropped out.
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-void-300">
          This usually means the browser lost the WebGL context — often after the tab was
          backgrounded on a low-memory device. Retrying rebuilds the scene.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-neon px-6 py-3">
            Retry
          </button>
          <Link href="/" className="btn-ghost px-6 py-3">
            Reload studio
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-6 font-mono text-[10px] text-void-500">digest {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
