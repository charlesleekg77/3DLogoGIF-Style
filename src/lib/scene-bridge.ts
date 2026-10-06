import type * as THREE from "three";

/**
 * Imperative bridge between the React scene graph and non-React code.
 *
 * The capture controller needs the live renderer, scene and camera to render
 * individual frames, and it needs to take over R3F's frame loop so exported
 * frames are not interleaved with the interactive loop. Threading all of that
 * through props would couple the encoder to the component tree, so the scene
 * registers it here on mount and the controller reads it when a capture starts.
 */

export interface SceneHandle {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  /** Render exactly one frame. Only valid while frameloop is "never". */
  advance: (timestamp: number, runGlobalEffects?: boolean) => void;
  /** Switch R3F between "always" (interactive) and "never" (capture). */
  setFrameloop: (mode: "always" | "never" | "demand") => void;
}

let handle: SceneHandle | null = null;

export function registerScene(next: SceneHandle | null) {
  handle = next;
}

export function getSceneHandle(): SceneHandle {
  if (!handle) {
    throw new Error(
      "Scene not ready — the 3D canvas must be mounted before starting a capture.",
    );
  }
  return handle;
}

export function hasSceneHandle() {
  return handle !== null;
}
