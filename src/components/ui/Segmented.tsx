"use client";

import { cn } from "@/lib/utils";

/**
 * Segmented control for mutually exclusive, low-cardinality choices
 * (rotation axis, spin direction, motion effect, output format).
 *
 * Rendered as a radiogroup rather than buttons so arrow-key navigation works and
 * assistive tech announces the selection state.
 */
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Optional mono sub-label, e.g. a short code. */
  meta?: string;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  columns,
  disabled,
}: {
  label?: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  /** Force a fixed column count; otherwise the control is a single flex row. */
  columns?: number;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn(disabled && "opacity-40")}>
      {label ? (
        <span className="mb-2 block text-[13px] font-medium tracking-tight text-void-100">
          {label}
        </span>
      ) : null}
      <div
        className={cn("gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-1")}
        style={
          columns
            ? { display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
            : { display: "flex" }
        }
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-3 py-1.5",
                "text-[12px] font-medium tracking-tight transition-all duration-150",
                active
                  ? "bg-white/[0.09] text-void-50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                  : "text-void-300 hover:bg-white/[0.04] hover:text-void-100",
              )}
            >
              <span>{option.label}</span>
              {option.meta ? (
                <span
                  className={cn(
                    "font-mono text-[9px] uppercase tracking-widest",
                    active ? "text-neon-cyan/90" : "text-void-400",
                  )}
                >
                  {option.meta}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
