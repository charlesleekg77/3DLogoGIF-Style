"use client";

import dynamic from "next/dynamic";
import { ControlPanel } from "@/components/studio/ControlPanel";
import { ExportPanel } from "@/components/studio/ExportPanel";
import { RenderStatsBar } from "@/components/studio/RenderStatsBar";
import { useStudio } from "@/lib/store";

/**
 * Page 1 — the customizer studio.
 *
 * Layout: the WebGL canvas fills the section and the HUD floats over it on the
 * right. On narrow screens the HUD drops below the canvas instead of covering it,
 * because a 360 px panel over a phone-sized viewport would leave no preview at
 * all.
 *
 * The canvas is loaded with `ssr: false`: `WebGLRenderer` touches `document` at
 * module scope and cannot run on the server. The skeleton matches the canvas's
 * final size so there is no layout shift when it mounts.
 */
const StudioCanvas = dynamic(
  () => import("@/components/three/StudioCanvas").then((m) => m.StudioCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin-slow rounded-md border border-neon-cyan/60" />
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-void-400">
            initialising webgl
          </span>
        </div>
      </div>
    ),
  },
);

export function StudioShell() {
  const transparent = useStudio((s) => s.config.transparent);

  return (
    <section id="studio" className="relative mx-auto w-full max-w-[1440px] px-6 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Viewport ------------------------------------------------------- */}
        <div className="relative">
          <div
            className="relative h-[52vh] min-h-[380px] overflow-hidden rounded-2xl border border-white/[0.07] lg:h-[calc(100vh-11rem)] lg:min-h-[560px]"
            style={
              transparent
                ? {
                    // Checkerboard signals "this export has no background".
                    backgroundImage:
                      "repeating-conic-gradient(#16161b 0 25%, #0d0d10 0 50%)",
                    backgroundSize: "20px 20px",
                  }
                : { background: "#060607" }
            }
          >
            <StudioCanvas />

            {/* Corner ticks: cheap way to make a plain rectangle feel instrumented. */}
            <CornerTick className="left-3 top-3 border-l border-t" />
            <CornerTick className="right-3 top-3 border-r border-t" />
            <CornerTick className="bottom-3 left-3 border-b border-l" />
            <CornerTick className="bottom-3 right-3 border-b border-r" />

            <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-void-400">
                viewport
              </span>
              <span className="font-mono text-[10px] text-void-300">
                drag to orbit · scroll to zoom
              </span>
            </div>
          </div>

          <RenderStatsBar className="mt-3" />
        </div>

        {/* HUD ------------------------------------------------------------ */}
        <aside className="flex flex-col gap-4 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:pr-1 no-scrollbar">
          <ControlPanel />
          <ExportPanel />
        </aside>
      </div>
    </section>
  );
}

function CornerTick({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-4 w-4 border-neon-cyan/40 ${className}`}
    />
  );
}
