"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { LogoMesh } from "@/components/three/LogoMesh";
import { environmentPresetById } from "@/lib/environment-presets";
import { useProceduralEnvironment } from "@/lib/environment";
import { renderState } from "@/lib/render-state";
import { registerScene } from "@/lib/scene-bridge";
import { useStudio } from "@/lib/store";

/**
 * Studio scene graph.
 *
 * Composition, top to bottom:
 *   <SceneRegistrar>   exposes gl/scene/camera/advance to the capture controller
 *   <EnvironmentRig>   procedural PMREM environment (IBL)
 *   <LightingRig>      directional key + accent rim + ambient fill
 *   <LogoMesh>         the extruded logo (Deliverable 1)
 *   <ContactShadows>   soft ground contact, toggled from the HUD
 *   <OrbitControls>    drag-to-rotate, disabled while capturing
 */

function SceneRegistrar() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const advance = useThree((s) => s.advance);
  const setFrameloop = useThree((s) => s.setFrameloop);

  useEffect(() => {
    registerScene({ gl, scene, camera, advance, setFrameloop });
    return () => registerScene(null);
  }, [gl, scene, camera, advance, setFrameloop]);

  return null;
}

function EnvironmentRig() {
  const environment = useStudio((s) => s.config.environment);
  const envIntensity = useStudio((s) => s.config.envIntensity);
  const preset = environmentPresetById(environment);
  useProceduralEnvironment(preset.tint, preset.intensity * envIntensity);
  return null;
}

function LightingRig() {
  const directionalIntensity = useStudio((s) => s.config.directionalIntensity);
  const ambientIntensity = useStudio((s) => s.config.ambientIntensity);
  const shadows = useStudio((s) => s.config.shadows);
  const rimColor = useStudio((s) => s.config.rimColor);

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      {/* Key light: up and to the right, so the bevel catches a specular. */}
      <directionalLight
        position={[4, 6, 5]}
        intensity={directionalIntensity}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.1, 20]} />
      </directionalLight>
      {/* Accent rim from behind-left: separates a dark logo from a dark bg. */}
      <directionalLight
        position={[-5, 2, -4]}
        intensity={directionalIntensity * 0.45}
        color={rimColor}
      />
      {/* Cool bounce from below keeps the underside from going fully black. */}
      <pointLight position={[0, -3, 2]} intensity={0.6} color="#22d3ee" />
    </>
  );
}

/** Camera dolly + FOV, written imperatively to avoid re-rendering on drag. */
function CameraRig() {
  const { camera } = useThree();
  const fov = useStudio((s) => s.config.fov);
  const zoom = useStudio((s) => s.config.zoom);
  const orbitPitch = useStudio((s) => s.config.orbitPitch);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = fov;
    cam.position.set(0, orbitPitch * zoom * 0.6, zoom);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, fov, zoom, orbitPitch]);

  return null;
}

function ContactShadowRig() {
  const contactShadows = useStudio((s) => s.config.contactShadows);
  if (!contactShadows) return null;
  return (
    <ContactShadows
      position={[0, -1.35, 0]}
      opacity={0.55}
      scale={7}
      blur={2.6}
      far={3}
      resolution={512}
      color="#000000"
    />
  );
}

export interface StudioSceneProps {
  /** Enables pointer orbit; disabled during export so frames stay deterministic. */
  interactive?: boolean;
}

export function StudioScene({ interactive = true }: StudioSceneProps) {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  // Freeze the orbit controls while a capture runs: damping or pointer input
  // would otherwise leak into the exported frames.
  useEffect(() => {
    if (controlsRef.current) controlsRef.current.enabled = interactive;
    const unsubscribe = useStudio.subscribe(
      (s) => s.capture.phase,
      (phase) => {
        if (controlsRef.current) {
          controlsRef.current.enabled = interactive && phase === "idle";
        }
      },
    );
    return unsubscribe;
  }, [interactive]);

  // Never leave the renderer stuck in capture mode if the page unmounts mid-export.
  useEffect(() => () => void (renderState.capturing = false), []);

  return (
    <>
      <SceneRegistrar />
      <EnvironmentRig />
      <LightingRig />
      <CameraRig />
      <Suspense fallback={null}>
        <LogoMesh autoRotate />
        <ContactShadowRig />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={interactive}
        enableRotate={interactive}
        minDistance={2.5}
        maxDistance={12}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
      />
    </>
  );
}
