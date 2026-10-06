"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { builtinLogoById } from "@/data/builtin-logos";
import { MATERIAL_PRESETS } from "@/lib/materials";
import { createExtrudeGeometryFromSvg } from "@/lib/svg-geometry";
import type { GalleryItem } from "@/types/studio";

/**
 * Gallery preview — a deliberately minimal cousin of the studio mesh.
 *
 * Differences from `LogoMesh`, and why:
 *   - No shadows, no contact shadows, no transmission. Each forces an extra
 *     render pass, and a masonry grid can hold dozens of these at once.
 *   - Lighting is two directional lights rather than a PMREM environment bake.
 *     Baking a room per card is the difference between a smooth grid and a fan
 *     spinning up.
 *   - `speedRef` carries the hover speed as a mutable ref, so hovering a card
 *     never re-renders React — it just changes a number the frame loop reads.
 */

interface GalleryMeshProps {
  item: GalleryItem;
  /** Base spin in degrees/second. */
  speed: number;
  /** Multiplier applied while the card is hovered. */
  speedRef: React.MutableRefObject<number>;
}

function GalleryMesh({ item, speed, speedRef }: GalleryMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const preset = MATERIAL_PRESETS.find((p) => p.id === item.material) ?? MATERIAL_PRESETS[0];
  const logo = builtinLogoById(item.logoId);

  const geometry = useMemo(() => {
    if (!logo.svg) return new THREE.BufferGeometry();
    return createExtrudeGeometryFromSvg(logo.svg, 1.7, {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.014,
      bevelSegments: 3,
      curveSegments: 8,
    }).geometry;
  }, [logo.svg]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.y += THREE.MathUtils.degToRad(speed * speedRef.current) * Math.min(delta, 1 / 20);
    // Gentle bob so static cards do not read as frozen screenshots.
    mesh.position.y = Math.sin(performance.now() * 0.0012) * 0.05;
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhysicalMaterial
        color={item.color}
        metalness={preset.patch.metalness}
        roughness={preset.patch.roughness}
        emissive={preset.patch.emissiveIntensity > 0 ? item.color : "#000000"}
        emissiveIntensity={preset.patch.emissiveIntensity}
        clearcoat={preset.patch.clearcoat}
        wireframe={preset.patch.wireframe}
      />
    </mesh>
  );
}

export function GalleryPreview({
  item,
  speed = 40,
  speedRef,
}: {
  item: GalleryItem;
  speed?: number;
  speedRef: React.MutableRefObject<number>;
}) {
  return (
    <Canvas
      // DPR 1: these are thumbnails, and halving the pixel count quarters the
      // fragment work per card.
      dpr={1}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0.6, 3.6], fov: 32 }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0);
        scene.background = null;
      }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 4]} intensity={2.2} />
      <directionalLight position={[-3, 1, -3]} intensity={0.8} color={item.color} />
      <GalleryMesh item={item} speed={speed} speedRef={speedRef} />
    </Canvas>
  );
}
