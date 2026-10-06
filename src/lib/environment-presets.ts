import type { EnvironmentPresetId } from "@/types/studio";

/**
 * Environment presets.
 *
 * Kept in a module with no Three.js or React imports so that server components
 * and the HUD can read the list without pulling `@react-three/fiber` into the
 * server render graph. The hook that actually installs an environment lives in
 * `@/lib/environment`.
 *
 * Two families of preset exist:
 *   - Procedural ("studio", "warehouse", "none"): a `RoomEnvironment` is baked
 *     into a PMREM cubemap at runtime. ~15 ms and zero bytes over the wire.
 *   - Photographic ("city" … "forest"): a bundled `.hdr` gives higher fidelity at
 *     the cost of a download, so it is opt-in.
 */

export interface EnvironmentPreset {
  id: EnvironmentPresetId;
  label: string;
  /** Tint applied to the procedural room bake. */
  tint: number;
  /** Relative exposure for the environment. */
  intensity: number;
  /** CDN path for a photographic HDRI, when the preset has one. */
  file?: string;
}

export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  { id: "studio", label: "Studio Softbox", tint: 0xffffff, intensity: 1 },
  { id: "warehouse", label: "Warehouse", tint: 0xdfe6f2, intensity: 1.1 },
  { id: "city", label: "City Dusk", tint: 0x8fa6d8, intensity: 1, file: "/hdri/city.hdr" },
  { id: "sunset", label: "Sunset Rim", tint: 0xff9e6b, intensity: 1.2, file: "/hdri/sunset.hdr" },
  { id: "dawn", label: "Dawn Haze", tint: 0xffd9c0, intensity: 1.05, file: "/hdri/dawn.hdr" },
  { id: "night", label: "Neon Night", tint: 0x6d7cff, intensity: 0.9, file: "/hdri/night.hdr" },
  { id: "forest", label: "Forest Canopy", tint: 0x9fd6a0, intensity: 0.95, file: "/hdri/forest.hdr" },
  { id: "none", label: "None (lights only)", tint: 0xffffff, intensity: 0 },
];

export const environmentPresetById = (id: EnvironmentPresetId): EnvironmentPreset =>
  ENVIRONMENT_PRESETS.find((p) => p.id === id) ?? ENVIRONMENT_PRESETS[0];
