import type { GalleryItem, PricingTier } from "@/types/studio";

/**
 * Gallery seed data.
 *
 * The live product paginates this from Postgres. For the blueprint we generate a
 * deterministic set so the infinite grid has real content, and so hydration
 * produces identical markup on the server and the client (no `Math.random()`).
 */

const AUTHORS = [
  "nadia.builds",
  "studio.kova",
  "orbitlab",
  "hex.supply",
  "mika.renders",
  "formless.co",
  "atlas.nine",
  "verity.design",
  "prism.works",
  "deltaforge",
];

const TITLES = [
  "Chrome Orbit",
  "Neon Prism",
  "Glass Helix",
  "Gold Spark",
  "Holo Wordmark",
  "Matte Monogram",
  "Wire Delta",
  "Chrome Sigil",
  "Neon Cascade",
  "Glass Anchor",
  "Gold Vector",
  "Holo Bloom",
];

const LOGO_IDS = ["orbit", "prism", "helix", "spark"];
const MATERIALS = ["chrome", "glass", "matte", "gold", "holographic", "neon", "wireframe"] as const;
const COLORS = ["#e8ecf1", "#7c5cff", "#22d3ee", "#ffd479", "#f472b6", "#a3e635"];
const TAGS = ["logo", "3d", "loop", "transparent", "hdri", "metallic", "glass", "neon", "brand"];

/** Deterministic PRNG so server and client agree on every field. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGalleryItems(count = 24): GalleryItem[] {
  const rand = mulberry32(0x5eed);
  return Array.from({ length: count }, (_, i) => {
    const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
    const tagCount = 2 + Math.floor(rand() * 2);
    const tags = Array.from(new Set(Array.from({ length: tagCount }, () => pick(TAGS))));
    return {
      id: `render-${i + 1}`,
      title: `${pick(TITLES)} ${String(i + 1).padStart(2, "0")}`,
      author: pick(AUTHORS),
      logoId: pick(LOGO_IDS),
      material: pick(MATERIALS),
      color: pick(COLORS),
      rotationSpeed: 18 + Math.round(rand() * 60),
      likes: Math.round(rand() * 4200),
      downloads: Math.round(rand() * 1800),
      tags,
      pro: rand() > 0.55,
    } satisfies GalleryItem;
  });
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Starter",
    tagline: "Kick the tyres on the studio.",
    priceMonthly: 0,
    priceAnnual: 0,
    stripePriceEnv: "",
    features: [
      "Real-time 3D customizer",
      "720p GIF export (watermarked)",
      "7 material presets",
      "3 built-in environment maps",
      "Community gallery access",
    ],
    limits: "3 renders / day · 720p · watermark",
    cta: "Start free",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For designers shipping brand loops.",
    priceMonthly: 19,
    priceAnnual: 180,
    stripePriceEnv: "STRIPE_PRICE_PRO",
    features: [
      "Up to 4K GIF / MP4 / WebP export",
      "Transparent background renders",
      "All 7 HDRI environments + custom upload",
      "Commercial license",
      "No watermark, priority queue",
      "Saved projects & version history",
    ],
    limits: "Unlimited renders · 4K · transparent",
    cta: "Go Pro",
    highlight: true,
  },
  {
    id: "studio",
    name: "Custom Modeling",
    tagline: "We model it by hand in Blender.",
    priceMonthly: 499,
    priceAnnual: 4990,
    stripePriceEnv: "STRIPE_PRICE_STUDIO",
    features: [
      "Manual high-end Blender/3D modeling",
      "Retopology & clean UVs",
      "Bespoke HDRI lighting setup",
      "Source .blend + glTF handoff",
      "2 revision rounds, 5-day turnaround",
      "Dedicated Slack channel",
    ],
    limits: "Per-project · 5-day turnaround",
    cta: "Book a project",
  },
];
