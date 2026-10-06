/**
 * Design tokens shared between the DOM UI and the WebGL scene.
 *
 * Tailwind reads the same hex values from `tailwind.config.ts`; this module is
 * for the places where a colour must be handed to Three.js as a raw value
 * (lights, fog, emissive materials) or to the canvas recorder as a clear colour.
 */

export const palette = {
  background: "#0a0a0c",
  backgroundDeep: "#060607",
  surface: "#121216",
  surfaceRaised: "#1c1c22",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#f5f5f7",
  textMuted: "#a1a1aa",
  textFaint: "#6f6f7a",
  neonViolet: "#7c5cff",
  neonCyan: "#22d3ee",
  neonLime: "#a3e635",
  neonPink: "#f472b6",
  neonAmber: "#fbbf24",
} as const;

/** Numeric equivalents for Three.js, which wants `number` for lights/clear. */
export const hexToNumber = (hex: string): number =>
  Number.parseInt(hex.replace("#", ""), 16);

export const threeColors = {
  background: hexToNumber(palette.background),
  backgroundDeep: hexToNumber(palette.backgroundDeep),
  neonViolet: hexToNumber(palette.neonViolet),
  neonCyan: hexToNumber(palette.neonCyan),
  neonPink: hexToNumber(palette.neonPink),
} as const;

export const layout = {
  hudWidth: 360,
  gridSize: 48,
  maxContentWidth: 1440,
} as const;
