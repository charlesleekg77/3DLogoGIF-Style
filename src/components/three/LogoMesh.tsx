"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { renderState } from "@/lib/render-state";
import { getCachedImage } from "@/lib/image";
import { useStudio } from "@/lib/store";
import {
  countTriangles,
  createExtrudeGeometryFromSvg,
  createHeightmapGeometry,
} from "@/lib/svg-geometry";
import type { MotionEffect } from "@/types/studio";

/**
 * DELIVERABLE 1 — the 3D extrude module.
 *
 * Responsibilities:
 *   - Convert the active SVG/PNG artwork into an extruded mesh.
 *   - Drive a `MeshPhysicalMaterial` from the studio config.
 *   - Auto-rotate smoothly, while remaining deterministic during capture.
 *
 * Performance contract: changing material or animation settings must NOT rebuild
 * geometry. Only the geometry-affecting keys (depth, bevel, source, artwork) are
 * in the geometry memo's dependency list, so dragging the roughness slider
 * touches nothing but a material uniform.
 */

interface LogoMeshProps {
  /** When false the mesh holds still; the parent rig owns its transform. */
  autoRotate?: boolean;
}

export function LogoMesh({ autoRotate = true }: LogoMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  const logo = useStudio((s) => s.logo);
  const geometrySource = useStudio((s) => s.config.geometrySource);
  const depth = useStudio((s) => s.config.depth);
  const bevelThickness = useStudio((s) => s.config.bevelThickness);
  const bevelSegments = useStudio((s) => s.config.bevelSegments);
  const scale = useStudio((s) => s.config.scale);
  const material = useStudio((s) => s.config.material);
  const color = useStudio((s) => s.config.color);
  const metalness = useStudio((s) => s.config.metalness);
  const roughness = useStudio((s) => s.config.roughness);
  const transmission = useStudio((s) => s.config.transmission);
  const ior = useStudio((s) => s.config.ior);
  const emissiveIntensity = useStudio((s) => s.config.emissiveIntensity);
  const clearcoat = useStudio((s) => s.config.clearcoat);
  const wireframe = useStudio((s) => s.config.wireframe);
  const rotationAxis = useStudio((s) => s.config.rotationAxis);
  const rotationSpeed = useStudio((s) => s.config.rotationSpeed);
  const direction = useStudio((s) => s.config.direction);
  const motion = useStudio((s) => s.config.motion);
  const motionAmplitude = useStudio((s) => s.config.motionAmplitude);
  const setStats = useStudio((s) => s.setStats);

  // ---- Geometry ----------------------------------------------------------
  // Rebuilt only when the artwork or an extrusion parameter changes.
  const geometry = useMemo(() => {
    if (geometrySource === "heightmap" && logo.heightmapUrl) {
      // Populated by `preloadImage` before the config flips to heightmap.
      const img = getCachedImage(logo.heightmapUrl);
      if (img) return createHeightmapGeometry(img, 2, 200, Math.max(depth, 0.15));
    }

    if (!logo.svg) return new THREE.BufferGeometry();

    return createExtrudeGeometryFromSvg(logo.svg, 2, {
      depth,
      bevelEnabled: bevelThickness > 0,
      bevelThickness,
      bevelSize: bevelThickness * 0.75,
      bevelSegments,
      curveSegments: 12,
    }).geometry;
  }, [logo.svg, logo.heightmapUrl, geometrySource, depth, bevelThickness, bevelSegments]);

  // R3F disposes on unmount but not when a memo swaps the object underneath it,
  // so we release the previous geometry explicitly on every rebuild.
  useEffect(() => () => geometry.dispose(), [geometry]);
  // Dispose the last geometry when the component unmounts for good.

  useEffect(() => {
    setStats({ triangles: Math.round(countTriangles(geometry)) });
  }, [geometry, setStats]);

  // ---- Material ----------------------------------------------------------
  // `MeshPhysicalMaterial` covers every preset: transmission for glass,
  // emissive for neon/holographic, metalness/roughness for the rest.
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.color.set(color);
    mat.metalness = metalness;
    mat.roughness = roughness;
    mat.transmission = transmission;
    mat.ior = ior;
    mat.emissive.set(
      material === "neon" || material === "holographic" ? color : "#000000",
    );
    mat.emissiveIntensity = emissiveIntensity;
    mat.clearcoat = clearcoat;
    mat.clearcoatRoughness = 0.08;
    mat.wireframe = wireframe;
    // Transmission needs an explicit thickness to refract convincingly.
    mat.thickness = transmission > 0 ? Math.max(depth, 0.2) : 0;
    mat.needsUpdate = true;
  }, [
    color,
    metalness,
    roughness,
    transmission,
    ior,
    emissiveIntensity,
    clearcoat,
    wireframe,
    material,
    depth,
  ]);

  // ---- Animation ---------------------------------------------------------
  const angleRef = useRef(0);
  const axis = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    axis.set(
      rotationAxis === "x" ? 1 : 0,
      rotationAxis === "y" ? 1 : 0,
      rotationAxis === "z" ? 1 : 0,
    );
  }, [axis, rotationAxis]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Clamp delta so a backgrounded tab does not jump the rotation on resume.
    const dt = Math.min(delta, 1 / 20);
    renderState.elapsed += dt;

    const sign = direction === "cw" ? 1 : -1;

    if (renderState.capturing) {
      // Deterministic path: the capture controller sets an exact angle + time.
      mesh.rotation.set(0, 0, 0);
      mesh.rotateOnAxis(axis, renderState.captureRotation * sign);
      applyMotion(mesh, motion, motionAmplitude, renderState.captureTime);
    } else if (autoRotate) {
      angleRef.current += THREE.MathUtils.degToRad(rotationSpeed) * dt;
      if (angleRef.current > Math.PI * 2) angleRef.current -= Math.PI * 2;
      mesh.rotation.set(0, 0, 0);
      mesh.rotateOnAxis(axis, angleRef.current * sign);
      applyMotion(mesh, motion, motionAmplitude, renderState.elapsed);
    } else {
      applyMotion(mesh, motion, motionAmplitude, renderState.elapsed);
    }

    mesh.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial ref={materialRef} attach="material" />
    </mesh>
  );
}

/** Secondary motion layer, evaluated from explicit time so it stays in sync. */
function applyMotion(
  mesh: THREE.Mesh,
  motion: MotionEffect,
  amplitude: number,
  time: number,
) {
  switch (motion) {
    case "float":
      mesh.position.y = Math.sin(time * 1.4) * amplitude;
      mesh.rotation.z = 0;
      break;
    case "bounce":
      mesh.position.y = Math.abs(Math.sin(time * 2.2)) * amplitude;
      mesh.rotation.z = 0;
      break;
    case "wobble":
      mesh.position.y = 0;
      mesh.rotation.z = Math.sin(time * 2.4) * amplitude * 0.5;
      break;
    case "pulse":
      mesh.position.y = 0;
      mesh.rotation.z = 0;
      break;
    case "none":
    default:
      mesh.position.y = 0;
      mesh.rotation.z = 0;
      break;
  }
}
