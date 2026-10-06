"use client";

import { useCallback, useState } from "react";
import { BillingToggle } from "@/components/pricing/BillingToggle";
import { PRICING_TIERS } from "@/data/gallery";
import { cn } from "@/lib/utils";

/**
 * Pricing table.
 *
 * The three tiers map onto the brief exactly:
 *   1. Starter — 720p, watermarked GIF, three environments.
 *   2. Pro     — up to 4K, transparent export, all HDRIs, commercial license.
 *   3. Custom  — hand-modelled Blender work, ordered as a project.
 *
 * Checkout redirects to a Stripe Checkout Session created by `POST /api/checkout`,
 * so no card data ever touches this origin.
 */
export function PricingTable() {
  const [annual, setAnnual] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(
    async (tierId: string) => {
      setPending(tierId);
      setError(null);
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tierId, interval: annual ? "annual" : "monthly" }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Checkout could not be started.");
        }

        const { url } = (await response.json()) as { url: string };
        // Full-page redirect: Stripe Checkout is not embeddable by design.
        window.location.href = url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Checkout failed.");
        setPending(null);
      }
    },
    [annual],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BillingToggle annual={annual} onChange={setAnnual} />
        <p className="font-mono text-[11px] uppercase tracking-widest text-void-400">
          no card required on starter
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-300"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {PRICING_TIERS.map((tier) => {
          const price = annual ? tier.priceAnnual : tier.priceMonthly;
          const isFree = tier.priceMonthly === 0;
          const isPending = pending === tier.id;

          return (
            <article
              key={tier.id}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300",
                tier.highlight
                  ? "border-neon-violet/40 bg-gradient-to-b from-neon-violet/[0.07] to-transparent"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.16]",
              )}
            >
              {tier.highlight ? (
                <>
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-violet to-transparent" />
                  <span className="absolute right-5 top-5 rounded-full border border-neon-violet/40 bg-neon-violet/15 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-neon-violet">
                    most popular
                  </span>
                </>
              ) : null}

              <h2 className="font-display text-lg font-semibold tracking-tight text-void-50">
                {tier.name}
              </h2>
              <p className="mt-1.5 text-[13px] leading-snug text-void-300">{tier.tagline}</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-semibold tracking-tightest text-void-50">
                  {isFree ? "$0" : `$${price}`}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-widest text-void-400">
                  {isFree ? "forever" : annual ? "/ year" : "/ month"}
                </span>
              </div>

              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-void-400">
                {tier.limits}
              </p>

              <div className="hairline my-6" />

              <ul className="flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-[13px] leading-snug text-void-200">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full",
                        tier.highlight ? "bg-neon-violet" : "bg-void-400",
                      )}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isPending || isFree}
                onClick={isFree ? undefined : () => void checkout(tier.id)}
                className={cn(
                  "mt-8 w-full",
                  tier.highlight ? "btn-neon" : "btn-ghost",
                  isFree && "cursor-default opacity-70",
                )}
              >
                {isPending ? "Opening checkout…" : tier.cta}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
