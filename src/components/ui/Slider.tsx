"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * DELIVERABLE 3 — HUD slider.
 *
 * A thin, accessible wrapper over `<input type="range">`. It keeps the native
 * element (keyboard support, touch handling, screen-reader semantics for free)
 * and only paints the neon fill via a CSS custom property so the track does not
 * need a second, decorative element.
 *
 * The value label is monospaced and tabular so digits do not jitter while the
 * user drags — a small detail that makes the whole panel feel stable.
 */

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Formatter for the readout, e.g. `(v) => \`${v.toFixed(2)}\``. */
  format?: (value: number) => string;
  /** Unit suffix shown in muted type after the value. */
  unit?: string;
  onChange: (value: number) => void;
  /** Optional one-line explanation shown under the label. */
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  format,
  unit,
  onChange,
  hint,
  disabled,
  className,
}: SliderProps) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  const display = format ? format(value) : value.toFixed(step < 1 ? 2 : 0);

  return (
    <div className={cn("group/slider", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[13px] font-medium tracking-tight text-void-100"
        >
          {label}
        </label>
        <span className="font-mono text-[11px] tabular-nums text-void-300">
          {display}
          {unit ? <span className="ml-0.5 text-void-400">{unit}</span> : null}
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number.parseFloat(event.target.value))}
        className="hud-slider mt-2.5"
        // `--fill` drives the gradient stop in `.hud-slider` (see globals.css).
        style={{ ["--fill" as string]: `${fill}%` }}
      />

      {hint ? <p className="mt-1.5 text-[11px] leading-snug text-void-400">{hint}</p> : null}
    </div>
  );
}
