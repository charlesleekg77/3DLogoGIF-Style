"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { DEFAULT_LOGO } from "@/data/builtin-logos";
import { materialPresetById } from "@/lib/materials";
import { clamp } from "@/lib/utils";
import type {
  LogoSource,
  MaterialPresetId,
  OutputFormat,
  RenderStats,
  StudioConfig,
} from "@/types/studio";

/**
 * Single source of truth for the studio.
 *
 * Design notes:
 *  - The store is intentionally flat: every HUD control writes one key. That
 *    keeps the React render tree shallow and lets `useStudio` select narrowly so
 *    dragging a slider only re-renders the slider, not the whole page.
 *  - `subscribeWithSelector` is enabled so non-React consumers (the capture
 *    controller, the imperative Three.js rig) can subscribe to a single key
 *    without re-rendering React at all.
 *  - The Three.js scene reads config through refs and mutates objects directly
 *    inside the render loop; it never re-mounts when a value changes.
 */

export const DEFAULT_CONFIG: StudioConfig = {
  // Geometry
  geometrySource: "extrude",
  depth: 0.32,
  bevelThickness: 0.02,
  bevelSegments: 4,
  scale: 1,

  // Material
  material: "chrome",
  color: "#e8ecf1",
  metalness: 1,
  roughness: 0.04,
  transmission: 0,
  ior: 1.5,
  emissiveIntensity: 0,
  clearcoat: 1,
  wireframe: false,

  // Animation
  rotationAxis: "y",
  rotationSpeed: 45,
  direction: "cw",
  motion: "float",
  motionAmplitude: 0.12,

  // Camera
  fov: 35,
  zoom: 5.2,
  orbitPitch: 0.18,

  // Lighting & environment
  environment: "studio",
  envIntensity: 1,
  directionalIntensity: 2.4,
  ambientIntensity: 0.35,
  shadows: true,
  contactShadows: true,
  ambientOcclusion: true,
  rimColor: "#7c5cff",

  // Output
  format: "gif",
  resolution: 1024,
  frames: 60,
  frameDelay: 33,
  transparent: false,
  watermark: true,
};

export type CapturePhase =
  | "idle"
  | "preparing"
  | "rendering"
  | "encoding"
  | "done"
  | "error"
  | "aborted";

export interface CaptureStatus {
  phase: CapturePhase;
  /** 0 – 1. */
  progress: number;
  message: string;
  /** Object URL of the finished render, if any. */
  resultUrl: string | null;
  resultSize: number;
  resultFormat: OutputFormat | null;
  error: string | null;
}

export interface StudioState {
  config: StudioConfig;
  logo: LogoSource;
  stats: RenderStats;
  capture: CaptureStatus;

  /** Patch one or more config keys. */
  setConfig: (patch: Partial<StudioConfig>) => void;
  /** Apply a material preset, preserving geometry and animation settings. */
  applyMaterial: (id: MaterialPresetId) => void;
  setLogo: (logo: LogoSource) => void;
  setStats: (stats: Partial<RenderStats>) => void;
  setCapture: (patch: Partial<CaptureStatus>) => void;
  resetCapture: () => void;
  reset: () => void;
  /** Serialise the current look for share links / template seeding. */
  serialize: () => string;
}

export const useStudio = create<StudioState>()(
  subscribeWithSelector((set, get) => ({
    config: DEFAULT_CONFIG,
    logo: DEFAULT_LOGO,
    stats: { fps: 0, resolution: DEFAULT_CONFIG.resolution, rotationSpeed: DEFAULT_CONFIG.rotationSpeed, triangles: 0, drawCalls: 0 },
    capture: {
      phase: "idle",
      progress: 0,
      message: "Ready",
      resultUrl: null,
      resultSize: 0,
      resultFormat: null,
      error: null,
    },

    setConfig: (patch) =>
      set((state) => {
        const next = { ...state.config, ...patch };
        // Guard the ranges here rather than in each control so the store can
        // never hold a value the renderer would choke on.
        next.depth = clamp(next.depth, 0.02, 1.5);
        next.bevelThickness = clamp(next.bevelThickness, 0, 0.12);
        next.rotationSpeed = clamp(next.rotationSpeed, 0, 360);
        next.fov = clamp(next.fov, 12, 90);
        next.zoom = clamp(next.zoom, 2, 14);
        next.motionAmplitude = clamp(next.motionAmplitude, 0, 0.6);
        next.resolution = clamp(next.resolution, 256, 2048);
        next.frames = clamp(Math.round(next.frames), 12, 180);
        next.frameDelay = clamp(Math.round(next.frameDelay), 16, 200);
        return { config: next };
      }),

    applyMaterial: (id) =>
      set((state) => ({
        config: { ...state.config, material: id, ...materialPresetById(id).patch },
      })),

    setLogo: (logo) => set({ logo }),

    setStats: (stats) => set((state) => ({ stats: { ...state.stats, ...stats } })),

    setCapture: (patch) =>
      set((state) => ({ capture: { ...state.capture, ...patch } })),

    resetCapture: () =>
      set((state) => {
        if (state.capture.resultUrl) URL.revokeObjectURL(state.capture.resultUrl);
        return {
          capture: {
            phase: "idle",
            progress: 0,
            message: "Ready",
            resultUrl: null,
            resultSize: 0,
            resultFormat: null,
            error: null,
          },
        };
      }),

    reset: () => {
      const { capture } = get();
      if (capture.resultUrl) URL.revokeObjectURL(capture.resultUrl);
      set({
        config: DEFAULT_CONFIG,
        logo: DEFAULT_LOGO,
        capture: {
          phase: "idle",
          progress: 0,
          message: "Ready",
          resultUrl: null,
          resultSize: 0,
          resultFormat: null,
          error: null,
        },
      });
    },

    serialize: () => {
      const { config, logo } = get();
      return JSON.stringify({
        v: 1,
        logo: logo.kind === "builtin" ? { kind: logo.kind, name: logo.name } : { kind: logo.kind, name: logo.name },
        config,
      });
    },
  })),
);
