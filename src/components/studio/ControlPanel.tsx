"use client";

import { useState } from "react";
import { MaterialPicker } from "@/components/ui/MaterialPicker";
import { Segmented } from "@/components/ui/Segmented";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { LogoDropzone } from "@/components/studio/LogoDropzone";
import { ENVIRONMENT_PRESETS } from "@/lib/environment-presets";
import { useStudio } from "@/lib/store";
import { cn } from "@/lib/utils";
import type {
  EnvironmentPresetId,
  GeometrySource,
  MotionEffect,
  OutputFormat,
  RotationAxis,
  SpinDirection,
} from "@/types/studio";

/**
 * DELIVERABLE 3 — the floating glassmorphism HUD.
 *
 * Every control writes straight into the Zustand store, and `LogoMesh` reads
 * those keys. There is no intermediate "apply" step, which is what makes the
 * preview feel live: the mesh reacts on the same frame the slider moves.
 *
 * Structure: four collapsible sections (Artwork / Material / Motion / Light &
 * Output). Collapsing keeps the panel usable on a laptop screen without hiding
 * the most-used controls behind a scroll.
 */

const AXIS_OPTIONS: { value: RotationAxis; label: string; meta: string }[] = [
  { value: "x", label: "X", meta: "pitch" },
  { value: "y", label: "Y", meta: "yaw" },
  { value: "z", label: "Z", meta: "roll" },
];

const DIRECTION_OPTIONS: { value: SpinDirection; label: string; meta: string }[] = [
  { value: "cw", label: "CW", meta: "fwd" },
  { value: "ccw", label: "CCW", meta: "rev" },
];

const MOTION_OPTIONS: { value: MotionEffect; label: string; meta: string }[] = [
  { value: "none", label: "Static", meta: "off" },
  { value: "float", label: "Float", meta: "sin" },
  { value: "bounce", label: "Bounce", meta: "abs" },
  { value: "wobble", label: "Wobble", meta: "tilt" },
  { value: "pulse", label: "Pulse", meta: "scale" },
];

const GEOMETRY_OPTIONS: { value: GeometrySource; label: string; meta: string }[] = [
  { value: "extrude", label: "Extrude", meta: "svg" },
  { value: "heightmap", label: "Relief", meta: "png" },
];

const FORMAT_OPTIONS: { value: OutputFormat; label: string; meta: string }[] = [
  { value: "gif", label: "GIF", meta: "loop" },
  { value: "mp4", label: "MP4", meta: "h264" },
  { value: "webm", label: "WebM", meta: "vp9" },
];

const RESOLUTION_OPTIONS = [512, 1024, 2048, 4096];

function Section({
  title,
  index,
  children,
  defaultOpen = true,
}: {
  title: string;
  index: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-white/[0.06] last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] text-void-400">{index}</span>
          <span className="text-[13px] font-semibold tracking-tight text-void-50">{title}</span>
        </span>
        <span
          aria-hidden
          className={cn(
            "font-mono text-[10px] text-void-400 transition-transform duration-200",
            open && "rotate-90",
          )}
        >
          ▶
        </span>
      </button>
      {open ? <div className="space-y-4 px-5 pb-5 pt-1">{children}</div> : null}
    </section>
  );
}

export function ControlPanel() {
  const config = useStudio((s) => s.config);
  const setConfig = useStudio((s) => s.setConfig);

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-void-400">
            Customizer
          </p>
          <p className="mt-0.5 text-[13px] font-semibold tracking-tight text-void-50">
            Logo pipeline
          </p>
        </div>
        <button
          type="button"
          onClick={() => useStudio.getState().reset()}
          className="rounded-md border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-void-300 transition-colors hover:border-white/25 hover:text-void-50"
        >
          Reset
        </button>
      </div>

      {/* 01 — Artwork ------------------------------------------------------ */}
      <Section title="Artwork" index="01">
        <LogoDropzone />
        <Segmented<GeometrySource>
          label="Geometry source"
          value={config.geometrySource}
          options={GEOMETRY_OPTIONS}
          onChange={(geometrySource) => setConfig({ geometrySource })}
        />
      </Section>

      {/* 02 — Material ----------------------------------------------------- */}
      <Section title="Material" index="02">
        <MaterialPicker />
        <Slider
          label="Extrusion depth"
          value={config.depth}
          min={0.02}
          max={1.5}
          step={0.01}
          onChange={(depth) => setConfig({ depth })}
        />
        <Slider
          label="Bevel thickness"
          value={config.bevelThickness}
          min={0}
          max={0.12}
          step={0.005}
          onChange={(bevelThickness) => setConfig({ bevelThickness })}
          hint="0 disables the bevel and speeds up geometry rebuilds."
        />
        <Slider
          label="Bevel segments"
          value={config.bevelSegments}
          min={1}
          max={8}
          step={1}
          format={(v) => v.toFixed(0)}
          onChange={(bevelSegments) => setConfig({ bevelSegments: Math.round(bevelSegments) })}
        />
        <div className="hairline my-1" />
        <Slider
          label="Metalness"
          value={config.metalness}
          min={0}
          max={1}
          step={0.01}
          onChange={(metalness) => setConfig({ metalness })}
        />
        <Slider
          label="Roughness"
          value={config.roughness}
          min={0}
          max={1}
          step={0.01}
          onChange={(roughness) => setConfig({ roughness })}
        />
        <Slider
          label="Transmission"
          value={config.transmission}
          min={0}
          max={1}
          step={0.01}
          onChange={(transmission) => setConfig({ transmission })}
          hint="Glass-like refraction. Costs a second render pass."
        />
        <Slider
          label="Clearcoat"
          value={config.clearcoat}
          min={0}
          max={1}
          step={0.01}
          onChange={(clearcoat) => setConfig({ clearcoat })}
        />
        <Slider
          label="Emissive"
          value={config.emissiveIntensity}
          min={0}
          max={3}
          step={0.05}
          onChange={(emissiveIntensity) => setConfig({ emissiveIntensity })}
        />
        <div className="flex items-center justify-between gap-3 pt-1">
          <label className="text-[13px] font-medium tracking-tight text-void-100" htmlFor="tint">
            Tint
          </label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase text-void-300">{config.color}</span>
            <input
              id="tint"
              type="color"
              value={config.color}
              onChange={(event) => setConfig({ color: event.target.value })}
              className="h-7 w-9 cursor-pointer rounded-md border border-white/15 bg-transparent p-0.5"
            />
          </div>
        </div>
        <Toggle
          label="Wireframe"
          checked={config.wireframe}
          onChange={(wireframe) => setConfig({ wireframe })}
          hint="Shows the extruded topology."
        />
      </Section>

      {/* 03 — Motion ------------------------------------------------------- */}
      <Section title="Animation" index="03">
        <Slider
          label="Rotation speed"
          value={config.rotationSpeed}
          min={0}
          max={360}
          step={1}
          unit="°/s"
          format={(v) => v.toFixed(0)}
          onChange={(rotationSpeed) => setConfig({ rotationSpeed })}
        />
        <Segmented<RotationAxis>
          label="Rotation axis"
          value={config.rotationAxis}
          options={AXIS_OPTIONS}
          onChange={(rotationAxis) => setConfig({ rotationAxis })}
        />
        <Segmented<SpinDirection>
          label="Direction"
          value={config.direction}
          options={DIRECTION_OPTIONS}
          onChange={(direction) => setConfig({ direction })}
        />
        <Segmented<MotionEffect>
          label="Secondary motion"
          value={config.motion}
          options={MOTION_OPTIONS}
          onChange={(motion) => setConfig({ motion })}
          columns={3}
        />
        <Slider
          label="Motion amplitude"
          value={config.motionAmplitude}
          min={0}
          max={0.6}
          step={0.01}
          onChange={(motionAmplitude) => setConfig({ motionAmplitude })}
          disabled={config.motion === "none"}
        />
      </Section>

      {/* 04 — Camera, light, output ---------------------------------------- */}
      <Section title="Camera & light" index="04">
        <Slider
          label="Camera FOV"
          value={config.fov}
          min={12}
          max={90}
          step={1}
          unit="°"
          format={(v) => v.toFixed(0)}
          onChange={(fov) => setConfig({ fov })}
        />
        <Slider
          label="Zoom (dolly)"
          value={config.zoom}
          min={2}
          max={14}
          step={0.1}
          onChange={(zoom) => setConfig({ zoom })}
        />
        <Slider
          label="Orbit pitch"
          value={config.orbitPitch}
          min={-0.6}
          max={0.9}
          step={0.01}
          onChange={(orbitPitch) => setConfig({ orbitPitch })}
        />
        <div className="hairline my-1" />
        <label className="block">
          <span className="mb-2 block text-[13px] font-medium tracking-tight text-void-100">
            Environment map
          </span>
          <select
            value={config.environment}
            onChange={(event) =>
              setConfig({ environment: event.target.value as EnvironmentPresetId })
            }
            className="w-full appearance-none rounded-lg border border-white/[0.09] bg-void-800 px-3 py-2 text-[12px] text-void-100 outline-none transition-colors focus:border-neon-violet/60"
          >
            {ENVIRONMENT_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <Slider
          label="Environment intensity"
          value={config.envIntensity}
          min={0}
          max={3}
          step={0.05}
          onChange={(envIntensity) => setConfig({ envIntensity })}
        />
        <Slider
          label="Directional light"
          value={config.directionalIntensity}
          min={0}
          max={8}
          step={0.1}
          onChange={(directionalIntensity) => setConfig({ directionalIntensity })}
        />
        <Slider
          label="Ambient light"
          value={config.ambientIntensity}
          min={0}
          max={2}
          step={0.05}
          onChange={(ambientIntensity) => setConfig({ ambientIntensity })}
        />
        <div className="flex items-center justify-between gap-3">
          <label className="text-[13px] font-medium tracking-tight text-void-100" htmlFor="rim">
            Rim light
          </label>
          <input
            id="rim"
            type="color"
            value={config.rimColor}
            onChange={(event) => setConfig({ rimColor: event.target.value })}
            className="h-7 w-9 cursor-pointer rounded-md border border-white/15 bg-transparent p-0.5"
          />
        </div>
        <div className="space-y-0.5 pt-1">
          <Toggle
            label="Shadows"
            checked={config.shadows}
            onChange={(shadows) => setConfig({ shadows })}
          />
          <Toggle
            label="Contact shadows"
            checked={config.contactShadows}
            onChange={(contactShadows) => setConfig({ contactShadows })}
          />
          <Toggle
            label="Ambient occlusion"
            checked={config.ambientOcclusion}
            onChange={(ambientOcclusion) => setConfig({ ambientOcclusion })}
            hint="Applied by the post-processing pass in the Pro build."
          />
        </div>
      </Section>

      {/* 05 — Output ------------------------------------------------------- */}
      <Section title="Export" index="05" defaultOpen={false}>
        <Segmented<OutputFormat>
          label="Format"
          value={config.format}
          options={FORMAT_OPTIONS}
          onChange={(format) => setConfig({ format })}
        />
        <div>
          <span className="mb-2 block text-[13px] font-medium tracking-tight text-void-100">
            Resolution
          </span>
          <Segmented<string>
            value={String(config.resolution)}
            options={RESOLUTION_OPTIONS.map((r) => ({
              value: String(r),
              label: r >= 1024 ? `${r / 1024}K` : `${r}p`,
              meta: r > 1024 ? "pro" : undefined,
            }))}
            onChange={(value) => setConfig({ resolution: Number(value) })}
          />
        </div>
        <Slider
          label="Frames per loop"
          value={config.frames}
          min={12}
          max={180}
          step={1}
          format={(v) => v.toFixed(0)}
          onChange={(frames) => setConfig({ frames: Math.round(frames) })}
          hint="60 frames at 33 ms ≈ a 2 s seamless loop."
        />
        <Slider
          label="Frame delay"
          value={config.frameDelay}
          min={16}
          max={200}
          step={1}
          unit="ms"
          format={(v) => v.toFixed(0)}
          onChange={(frameDelay) => setConfig({ frameDelay: Math.round(frameDelay) })}
        />
        <div className="space-y-0.5 pt-1">
          <Toggle
            label="Transparent background"
            checked={config.transparent}
            onChange={(transparent) => setConfig({ transparent })}
            hint="GIF uses a reserved chroma key; MP4/WebM keep an alpha-ish matte."
          />
          <Toggle
            label="Watermark"
            checked={config.watermark}
            onChange={(watermark) => setConfig({ watermark })}
            hint="Free tier. Removed on Pro."
          />
        </div>
      </Section>
    </div>
  );
}
