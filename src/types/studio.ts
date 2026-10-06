/**
 * Shared domain types for the 3D logo studio.
 *
 * Everything that the HUD can mutate lives in `StudioConfig`. Keeping the type
 * flat (rather than nested) makes it trivial to patch from a slider without
 * deep-merging, and lets the capture controller snapshot the whole render state
 * in one object.
 */

export type MaterialPresetId =
  | "chrome"
  | "glass"
  | "matte"
  | "gold"
  | "holographic"
  | "neon"
  | "wireframe";

export type EnvironmentPresetId =
  | "studio"
  | "city"
  | "sunset"
  | "dawn"
  | "night"
  | "warehouse"
  | "forest"
  | "none";

export type RotationAxis = "x" | "y" | "z";

export type SpinDirection = "cw" | "ccw";

export type MotionEffect = "none" | "float" | "bounce" | "wobble" | "pulse";

export type GeometrySource = "extrude" | "heightmap";

/**
 * Formats the *client* can encode without a server round-trip.
 *
 * Animated WebP is deliberately absent: no browser ships an animated-WebP
 * encoder, and bundling a wasm one would dwarf the rest of the bundle. The
 * gallery serves `.webp` variants from the server-side render pipeline instead.
 */
export type OutputFormat = "gif" | "mp4" | "webm";

export interface StudioConfig {
  // ---- Geometry -----------------------------------------------------------
  /** How the source artwork becomes a mesh. */
  geometrySource: GeometrySource;
  /** Extrusion depth in world units (0.02 – 1.5). */
  depth: number;
  /** Bevel edge thickness (0 – 0.12). */
  bevelThickness: number;
  /** Number of bevel segments; higher = smoother bevel, more triangles. */
  bevelSegments: number;
  /** Uniform scale applied to the normalised mesh. */
  scale: number;

  // ---- Material -----------------------------------------------------------
  material: MaterialPresetId;
  /** Base colour (hex string) when the preset exposes a tint. */
  color: string;
  metalness: number;
  roughness: number;
  /** Physical-material transmission (glass). */
  transmission: number;
  /** Physical-material index of refraction. */
  ior: number;
  /** Emissive intensity for neon/holographic presets. */
  emissiveIntensity: number;
  clearcoat: number;
  wireframe: boolean;

  // ---- Animation ----------------------------------------------------------
  rotationAxis: RotationAxis;
  /** Degrees per second. */
  rotationSpeed: number;
  direction: SpinDirection;
  motion: MotionEffect;
  /** Amplitude of the secondary motion effect. */
  motionAmplitude: number;

  // ---- Camera -------------------------------------------------------------
  fov: number;
  /** Dolly distance from the origin. */
  zoom: number;
  /** Optional user-controlled orbit offset (radians). */
  orbitPitch: number;

  // ---- Lighting & environment --------------------------------------------
  environment: EnvironmentPresetId;
  /** HDR/background intensity multiplier. */
  envIntensity: number;
  directionalIntensity: number;
  ambientIntensity: number;
  shadows: boolean;
  contactShadows: boolean;
  ambientOcclusion: boolean;
  /** Accent rim light colour. */
  rimColor: string;

  // ---- Output -------------------------------------------------------------
  format: OutputFormat;
  /** Square output resolution in px (256 – 2048). */
  resolution: number;
  /** Total frames in the capture loop. */
  frames: number;
  /** GIF playback frame delay in ms. */
  frameDelay: number;
  /** Export on a transparent background. */
  transparent: boolean;
  /** Free tier watermark. */
  watermark: boolean;
}

export interface LogoSource {
  /** Original file name, surfaced in the HUD. */
  name: string;
  /** Raw SVG markup (preferred) or a transparent PNG data URL. */
  kind: "svg" | "png" | "builtin";
  svg?: string;
  dataUrl?: string;
  /** Luminance map used by the heightmap displacement path. */
  heightmapUrl?: string;
  /** Detected/target aspect ratio of the artwork. */
  aspect: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  author: string;
  /** Built-in logo id used to render the live preview mesh. */
  logoId: string;
  material: MaterialPresetId;
  color: string;
  /** Author-selected camera framing, used to make the grid feel varied. */
  rotationSpeed: number;
  likes: number;
  downloads: number;
  tags: string[];
  pro: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  /** Stripe price id, resolved server-side from env. */
  stripePriceEnv: string;
  features: string[];
  limits: string;
  cta: string;
  highlight?: boolean;
}

export interface RenderStats {
  fps: number;
  resolution: number;
  rotationSpeed: number;
  triangles: number;
  drawCalls: number;
}
