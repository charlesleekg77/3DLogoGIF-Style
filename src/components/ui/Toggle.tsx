"use client";

import { cn } from "@/lib/utils";

/** Neon toggle switch for boolean HUD settings (shadows, AO, transparency). */
export function Toggle({
  label,
  checked,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 py-1.5",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span>
        <span className="block text-[13px] font-medium tracking-tight text-void-100">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11px] text-void-400">{hint}</span> : null}
      </span>
      <span className="relative shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          className={cn(
            "block h-5 w-9 rounded-full border transition-colors duration-200",
            checked
              ? "border-neon-violet/60 bg-neon-violet/30"
              : "border-white/10 bg-white/[0.05]",
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
          style={{ boxShadow: checked ? "0 0 12px -1px rgba(124,92,255,0.9)" : undefined }}
        />
      </span>
    </label>
  );
}
