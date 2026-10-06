# Technical Blueprint

This is the build guide: the three code deliverables, the data contracts behind
them, and what a production deployment would add on top of the blueprint.

---

## Deliverable 1 — Three.js / R3F 3D extrude module

**File:** `src/components/three/LogoMesh.tsx`
**Helpers:** `src/lib/svg-geometry.ts`, `src/lib/materials.ts`, `src/lib/image.ts`

### Responsibilities

1. Accept SVG markup (or a transparent PNG for the relief path).
2. Convert it to geometry:
   - `createExtrudeGeometryFromSvg` parses paths with `SVGLoader` and builds an
     `ExtrudeGeometry` with depth and bevel controls.
   - `createHeightmapGeometry` samples PNG luminance into a displaced plane.
3. Apply a `MeshPhysicalMaterial` from the preset + HUD overrides.
4. Auto-rotate smoothly on the configured axis.

### Interface

```ts
interface LogoMeshProps {
  source: LogoSource;      // { kind: "svg" | "png", data, name }
  config: StudioConfig;    // geometry, material, animation keys
}
```

### Two performance contracts

- **Geometry is expensive; material is cheap.** The geometry memo depends only on
  `{ source, geometrySource, depth, bevelThickness, bevelSegments, scale }`.
  Dragging roughness or metalness must not rebuild a single triangle. This is why
  `useMemo` is keyed narrowly rather than on the whole `config` object.
- **Rotation is not React state.** The mesh is rotated inside `useFrame` by writing
  `ref.current.rotation` directly. A per-frame `setState` would re-render the tree
  60 times a second.

### Material presets

Seven presets in `lib/materials.ts` — Chrome, Glass, Matte Plastic, Gold,
Holographic, Neon Glow, Wireframe — each a `MeshPhysicalMaterial` parameter set
(metalness, roughness, transmission, ior, clearcoat, emissive). The HUD applies
per-key overrides on top of the preset, so a preset is a starting point, not a
lock.

### Transparent export

When `config.transparent` is set, the canvas clear colour is alpha `0` and the
renderer is created with `alpha: true`. `setClearAlpha` is driven from a small rig
component rather than from render-body code.

---

## Deliverable 2 — Client-side capture controller

**Files:** `src/lib/capture.ts`, `src/lib/capture-frames.ts`

### Frame stepping

```ts
// capture-frames.ts — conceptual
for (let i = 0; i < frames; i++) {
  const t = i / frames;                       // 0 → 1 across one full turn
  renderState.captureTime = i / fps;
  renderState.rotation[axis] = direction * TAU * t;
  bridge.advance();                           // render exactly one frame
  yield frameToBitmap(bridge.gl.domElement);  // hand off for encoding
}
```

Key properties:

- The rotation is a pure function of the frame index, so the first and last frames
  meet seamlessly and the loop is identical at any frame rate.
- The visible canvas is not repainted 60 times: `setFrameloop("never")` for the
  duration, restored afterwards.
- Yielding between frames keeps the main thread responsive so progress can render
  and `Cancel` can be clicked.

### GIF encoding (`capture.ts`)

`gif.js` runs an encoder pool in Web Workers. Frames are pushed with a delay
derived from `frameDelay`; alpha is preserved for transparent exports. The worker
script must be a real URL — hence `scripts/copy-worker.mjs` copying
`node_modules/gif.js/dist/gif.worker.js` to `public/vendor/gif.worker.js` on
`postinstall`. A library that constructs `new Worker(url)` internally cannot be
bundled by webpack.

### MP4 / WebM encoding

WebCodecs `VideoEncoder` with `mp4-muxer`. One keyframe per second. Chunks are
appended as they arrive; `finalize()` is called **only** on the last frame. The
export returns a `Blob` and is abortable at any point.

### Return contract

```ts
type CaptureResult = { blob: Blob; filename: string; format: OutputFormat };
```

The filename is derived from the render size and frame count, e.g.
`logo-1024px-60f.gif`.

---

## Deliverable 3 — HUD controls panel

**File:** `src/components/studio/ControlPanel.tsx`
**Primitives:** `src/components/ui/{Slider,Toggle,Segmented,MaterialPicker}.tsx`

### Wiring

Every control writes one flat key on the Zustand store:

```tsx
<Slider
  label="Extrusion depth"
  value={depth}
  min={0.02} max={1.2} step={0.01}
  hint="0 disables the bevel and speeds up geometry rebuilds."
  onChange={(v) => set({ depth: v })}
/>
```

Because the store is flat and components select narrowly, moving the depth slider
re-renders the depth slider and the mesh — not the other twenty controls.

### Slider set

| Control | Range | Drives |
| --- | --- | --- |
| Extrusion depth | 0.02–1.2 | `ExtrudeGeometry.depth` |
| Bevel thickness | 0–0.1 | `bevelThickness` / `bevelSize` |
| Bevel segments | 1–8 | Curve smoothness (geometry rebuild) |
| Metalness | 0–1 | `material.metalness` |
| Roughness | 0–1 | `material.roughness` |
| Transmission | 0–1 | `material.transmission` (glass) |
| Clearcoat | 0–1 | `material.clearcoat` |
| Emissive | 0–2 | `material.emissiveIntensity` (neon) |
| Rotation speed | 0–240 °/s | `useFrame` integration |
| Motion amplitude | 0–0.5 | Secondary motion |
| Camera FOV | 20–70 | `PerspectiveCamera.fov` |
| Zoom | 3–10 | Camera distance |
| Directional / ambient | — | Light intensities |

Controls whose changes force a geometry rebuild are annotated in the UI (bevel
thickness, bevel segments, geometry source) so the cost is never a surprise.

---

## Data contracts

```ts
// types/studio.ts (abridged)
type GeometrySource = "extrude" | "relief";
type MaterialPresetId =
  | "chrome" | "glass" | "matte" | "gold"
  | "holographic" | "neon" | "wireframe";
type RotationAxis = "x" | "y" | "z";
type OutputFormat = "gif" | "mp4" | "webp";

interface StudioConfig {
  // geometry, material, animation, camera, lighting, output …
}
```

The store defaults in `lib/store.ts` are the single source of truth for a fresh
session; `DEFAULT_CONFIG` is what `Reset` restores.

---

## Production hardening (beyond the blueprint)

1. **Entitlement checks.** `/api/renders/[id]/download` currently serves a
   catalogue id and returns a machine-readable 404 when no artefact exists. A real
   deployment must verify the caller's plan against the requested resolution and
   return `402` rather than a file for a free account asking for 4K.
2. **Server-side renders.** Very high resolutions, long loops and precise alpha
   mattes belong on an FFmpeg worker that re-runs the same deterministic frame loop
   headlessly. The client path is the fast, free tier of a two-tier system.
3. **Storage.** Artefacts in object storage behind a CDN, keyed by render id and
   format; the route then redirects instead of encoding.
4. **Auth and billing.** Clerk/Supabase for identity, Stripe webhooks to keep
   subscription state in sync. Price ids already resolve server-side only.
5. **Rate limiting.** Per-account limits on the checkout and download routes.
6. **Persistence.** Saved projects and version history for Pro, so a studio session
   can be resumed.
