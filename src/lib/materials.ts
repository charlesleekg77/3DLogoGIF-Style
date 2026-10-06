import type { MaterialPresetId, StudioConfig } from "@/types/studio";

/**
 * Material presets.
 *
 * A preset is a *partial* of the studio config. Selecting a preset patches the
 * relevant material keys while leaving geometry/animation untouched, so users
 * can flip between looks without losing their extrusion settings.
 */
export interface MaterialPreset {
  id: MaterialPresetId;
  label: string;
  /** Short mono-font descriptor shown under the swatch. */
  meta: string;
  /** CSS swatch gradient for the HUD (DOM only — not used by WebGL). */
  swatch: string;
  patch: Pick<
    StudioConfig,
    | "color"
    | "metalness"
    | "roughness"
    | "transmission"
    | "ior"
    | "emissiveIntensity"
    | "clearcoat"
    | "wireframe"
  >;
}

export const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: "chrome",
    label: "Chrome",
    meta: "metal · 0.02 rough",
    swatch: "linear-gradient(135deg,#f8fafc 0%,#94a3b8 45%,#e2e8f0 100%)",
    patch: {
      color: "#e8ecf1",
      metalness: 1,
      roughness: 0.04,
      transmission: 0,
      ior: 1.5,
      emissiveIntensity: 0,
      clearcoat: 1,
      wireframe: false,
    },
  },
  {
    id: "glass",
    label: "Glass",
    meta: "transmission · 1.45 ior",
    swatch: "linear-gradient(135deg,#bae6fd 0%,#f0f9ff 40%,#a5b4fc 100%)",
    patch: {
      color: "#dbeafe",
      metalness: 0,
      roughness: 0.02,
      transmission: 1,
      ior: 1.45,
      emissiveIntensity: 0,
      clearcoat: 1,
      wireframe: false,
    },
  },
  {
    id: "matte",
    label: "Matte",
    meta: "plastic · 0.72 rough",
    swatch: "linear-gradient(135deg,#f4f4f5 0%,#d4d4d8 100%)",
    patch: {
      color: "#f4f4f5",
      metalness: 0,
      roughness: 0.72,
      transmission: 0,
      ior: 1.5,
      emissiveIntensity: 0,
      clearcoat: 0.1,
      wireframe: false,
    },
  },
  {
    id: "gold",
    label: "Gold",
    meta: "metal · 24k tint",
    swatch: "linear-gradient(135deg,#fde68a 0%,#d97706 55%,#fef3c7 100%)",
    patch: {
      color: "#ffd479",
      metalness: 1,
      roughness: 0.16,
      transmission: 0,
      ior: 1.5,
      emissiveIntensity: 0,
      clearcoat: 0.6,
      wireframe: false,
    },
  },
  {
    id: "holographic",
    label: "Holographic",
    meta: "iridescent · emissive",
    swatch:
      "linear-gradient(120deg,#22d3ee 0%,#a78bfa 35%,#f472b6 65%,#a3e635 100%)",
    patch: {
      color: "#c4b5fd",
      metalness: 0.85,
      roughness: 0.08,
      transmission: 0,
      ior: 1.8,
      emissiveIntensity: 0.35,
      clearcoat: 1,
      wireframe: false,
    },
  },
  {
    id: "neon",
    label: "Neon Glow",
    meta: "emissive · bloom-ready",
    swatch:
      "linear-gradient(135deg,#22d3ee 0%,#7c5cff 50%,#f472b6 100%)",
    patch: {
      color: "#7c5cff",
      metalness: 0.2,
      roughness: 0.35,
      transmission: 0,
      ior: 1.5,
      emissiveIntensity: 1.6,
      clearcoat: 0.4,
      wireframe: false,
    },
  },
  {
    id: "wireframe",
    label: "Wireframe",
    meta: "topology · 1px edges",
    swatch:
      "repeating-linear-gradient(45deg,#22d3ee 0 2px,transparent 2px 6px)",
    patch: {
      color: "#22d3ee",
      metalness: 0.1,
      roughness: 0.5,
      transmission: 0,
      ior: 1.5,
      emissiveIntensity: 0.5,
      clearcoat: 0,
      wireframe: true,
    },
  },
];

export const materialPresetById = (id: MaterialPresetId): MaterialPreset =>
  MATERIAL_PRESETS.find((p) => p.id === id) ?? MATERIAL_PRESETS[0];
