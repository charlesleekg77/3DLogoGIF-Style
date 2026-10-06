"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { StudioScene } from "@/components/three/StudioScene";
import { palette, threeColors } from "@/lib/design-tokens";
import { useStudio } from "@/lib/store";

/**
 * WebGL canvas wrapper.
 *
 * Kept separate from `StudioScene` so the R3F `<Canvas>` (which owns the GL
 * context and therefore cannot be SSR'd) is the only client-only boundary, and
 * so the scene graph itself stays a plain component that is easy to test.
 */

/** Publishes a rolling FPS average into the store for the HUD readout. */
function FpsProbe() {
  const setStats = useStudio((s) => s.setStats);
  const frames = { count: 0, last: performance.now() };

  useFrame(() => {
    frames.count += 1;
    const now = performance.now();
    if (now - frames.last >= 500) {
      const fps = (frames.count * 1000) / (now - frames.last);
      setStats({ fps: Math.round(fps) });
      frames.count = 0;
      frames.last = now;
    }
  });

  return null;
}

/** Applies the transparent/opaque clear colour to the live renderer. */
function ClearColorRig() {
  const gl = useThree((s) => s.gl);
  const transparent = useStudio((s) => s.config.transparent);

  useEffect(() => {
    gl.setClearColor(threeColors.background, transparent ? 0 : 1);
    gl.setClearAlpha(transparent ? 0 : 1);
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, transparent]);

  return null;
}

export function StudioCanvas() {
  const transparent = useStudio((s) => s.config.transparent);
  const setStats = useStudio((s) => s.setStats);
  const resolution = useStudio((s) => s.config.resolution);

  useEffect(() => {
    setStats({ resolution });
  }, [resolution, setStats]);

  return (
    <Canvas
      // `alpha` must be true whenever transparent export is possible; the clear
      // alpha rig decides whether the background is actually drawn.
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.1, 5.2], fov: 35, near: 0.1, far: 100 }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(threeColors.background, transparent ? 0 : 1);
        scene.background = transparent ? null : new THREE.Color(palette.background);
      }}
    >
      <ClearColorRig />
      <FpsProbe />
      <StudioScene interactive />
    </Canvas>
  );
}
