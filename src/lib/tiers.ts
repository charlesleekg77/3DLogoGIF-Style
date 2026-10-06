import { PRICING_TIERS } from "@/data/gallery";
import type { PricingTier } from "@/types/studio";

/**
 * Server-side tier resolution.
 *
 * The client sends a tier *id*; the server maps it to a Stripe price. This is the
 * only place a price id is allowed to live, because a price id arriving from the
 * browser is a price-tampering vector.
 */

export interface ResolvedTier {
  tier: PricingTier;
  /** Env var name that holds the Stripe price id for this tier. */
  priceEnv: string;
}

export function resolveTier(tierId: string, interval: "monthly" | "annual"): ResolvedTier | null {
  const tier = PRICING_TIERS.find((t) => t.id === tierId);
  if (!tier) return null;
  if (interval === "annual") {
    // Annual uses the same price id with a different Stripe interval; keep the
    // env name suffix in one place so a missing var fails loudly, not silently.
    return { tier, priceEnv: `${tier.stripePriceEnv}_ANNUAL` };
  }
  return { tier, priceEnv: tier.stripePriceEnv };
}

/** True when every paid tier has a price configured for the requested interval. */
export function missingPriceConfig(interval: "monthly" | "annual"): string[] {
  return PRICING_TIERS.filter((t) => t.priceMonthly > 0)
    .map((t) => (interval === "annual" ? `${t.stripePriceEnv}_ANNUAL` : t.stripePriceEnv))
    .filter((name) => !process.env[name]);
}
