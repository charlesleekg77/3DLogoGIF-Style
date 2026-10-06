"use client";

import { useStudio } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Live render readout.
 *
 * The mono metadata strip the brief calls for: resolution, FPS, rotation speed,
 * triangle count. It reads from `stats` in the store, which the render loop
 * updates on a 500 ms cadence — fast enough to feel live, slow enough that it
 * never becomes the thing that costs frames.
 */
export function RenderStatsBar({ className }: { className?: string }) {
  const stats = useStudio((s) => s.stats);
  const direction = useStudio((s) => s.config.direction);

  const fpsTone =
    stats.fps >= 55 ? "text-neon-lime" : stats.fps >= 30 ? "text-neon-amber" : "text-neon-pink";

  return (
    <div
      className={cn(
        "glass flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest",
        className,
      )}
    >
      <Stat label="RES">
        {stats.resolution >= 1024 ? `${stats.resolution / 1024}K` : `${stats.resolution}p`}
        <span className="text-void-400">²</span>
      </Stat>
      <Stat label="FPS">
        <span className={fpsTone}>{stats.fps}</span>
      </Stat>
      <Stat label="ROT">
        {stats.rotationSpeed}°/s
        <span className="text-void-400"> {direction === "cw" ? "↻" : "↺"}</span>
      </Stat>
      <Stat label="TRIS">{stats.triangles.toLocaleString()}</Stat>
      <span className="ml-auto flex items-center gap-2 text-void-400">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            stats.fps > 0 ? "animate-pulse-glow bg-neon-lime" : "bg-void-500",
          )}
        />
        live
      </span>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-void-400">{label}</span>
      <span className="tabular-nums text-void-50">{children}</span>
    </span>
  );
}
