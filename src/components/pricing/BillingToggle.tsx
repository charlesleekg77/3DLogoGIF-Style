"use client";

import { cn } from "@/lib/utils";

/**
 * Billing-period switch.
 *
 * Annual pricing is expressed as a percentage of monthly so the two tiers can
 * never drift out of sync in the copy. The discount is stated explicitly rather
 * than hidden, because a surprise saving is a better conversion mechanic than a
 * hidden one.
 */
export function BillingToggle({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (annual: boolean) => void;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
      {[
        { value: false, label: "Monthly" },
        { value: true, label: "Annual" },
      ].map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={annual === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-[12px] font-medium tracking-tight transition-all duration-200",
            annual === option.value
              ? "bg-white/[0.09] text-void-50"
              : "text-void-300 hover:text-void-100",
          )}
        >
          {option.label}
          {option.value ? (
            <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-neon-lime">
              −20%
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
