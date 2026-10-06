"use client";

import { useStudio } from "@/lib/store";
import { MATERIAL_PRESETS } from "@/lib/materials";
import { cn } from "@/lib/utils";

/**
 * Material preset rail.
 *
 * Each swatch is a CSS gradient that approximates the WebGL look, so the picker
 * reads correctly before the user has clicked anything and costs nothing to
 * render. Selecting one patches the material half of the config (see
 * `useStudio.applyMaterial`).
 */
export function MaterialPicker() {
  const active = useStudio((s) => s.config.material);
  const applyMaterial = useStudio((s) => s.applyMaterial);

  return (
    <div role="radiogroup" aria-label="Material preset" className="grid grid-cols-4 gap-2">
      {MATERIAL_PRESETS.map((preset) => {
        const isActive = preset.id === active;
        return (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            title={preset.meta}
            onClick={() => applyMaterial(preset.id)}
            className={cn(
              "group relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all duration-200",
              isActive
                ? "border-neon-violet/60 bg-neon-violet/[0.08]"
                : "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
            )}
          >
            <span
              aria-hidden
              className="h-7 w-full rounded-md border border-white/10"
              style={{ background: preset.swatch }}
            />
            <span
              className={cn(
                "text-[10px] font-medium leading-none tracking-tight",
                isActive ? "text-void-50" : "text-void-300 group-hover:text-void-100",
              )}
            >
              {preset.label}
            </span>
            {isActive ? (
              <span className="absolute -top-px left-1/2 h-px w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-neon-violet to-transparent" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
