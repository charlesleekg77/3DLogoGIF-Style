"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { threeColors } from "@/lib/design-tokens";

/**
 * Environment-map rig (the React half).
 *
 * Pure preset data lives in `@/lib/environment-presets` so server components can
 * import the list without this module's `@react-three/fiber` dependency.
 *
 * Strategy: bake `RoomEnvironment` into a PMREM cubemap once per tint and install
 * it as `scene.environment`. That gives believable image-based lighting with no
 * network round-trip, which is what makes the studio feel instant on first paint.
 * Photographic HDRIs are the higher-fidelity opt-in path and are loaded by the
 * scene when a preset carries a `file`.
 */

export function useProceduralEnvironment(tint: number, intensity: number) {
  const { gl, scene } = useThree();

  useEffect(() => {
    if (intensity <= 0) {
      scene.environment = null;
      scene.environmentIntensity = 1;
      return;
    }

    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    const room = new RoomEnvironment();
    const renderTarget = pmrem.fromScene(room, 0.04);

    // Tint the bake by modulating the room's own emissive panels rather than
    // multiplying the resulting texture: one fewer full-resolution pass.
    const tintColor = new THREE.Color(tint);
    room.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (material?.emissive) material.emissive.multiply(tintColor);
    });

    scene.environment = renderTarget.texture;
    scene.environmentIntensity = intensity;

    return () => {
      scene.environment = null;
      renderTarget.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, tint, intensity]);
}

/** Default canvas clear colour when exporting with a transparent background. */
export const TRANSPARENT_CLEAR = { color: threeColors.backgroundDeep, alpha: 0 };
