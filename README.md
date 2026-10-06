# 3DLogoGIF Studio

An interactive 3D logo studio that runs entirely in the browser: drop in an SVG or a
transparent PNG, choose a material, and export a seamless 360° loop as a transparent
GIF, MP4, or animated WebP — rendered on the visitor's GPU, not in an upload queue.

Built with Next.js 15 (App Router), React 19, TypeScript, React Three Fiber, and Tailwind.

---

## 1. Architecture

### 1.1 Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) | Server components for content pages, client islands for the WebGL layer. |
| UI | React 19 + Tailwind CSS | React 19 is required by React Three Fiber v9. |
| 3D | `three` + `@react-three/fiber` v9 + `@react-three/drei` v10 | Declarative scene graph; `SVGLoader` for vector extrusion. |
| State | Zustand | One store shared by the HUD and the frame loop, without prop drilling. |
| Scroll | Lenis | Inertia scrolling; disabled while the user drags the viewport. |
| Encoding | WebCodecs `VideoEncoder` (MP4/WebM) + `gif.js` (GIF) | Hardware-accelerated video, worker-pooled GIF. |
| Payments | Stripe | Server-resolved price ids. |
| Muxing | `mp4-muxer` | Wraps WebCodecs chunks into a playable MP4. |

### 1.2 The one rule that shapes the whole codebase

**Nothing that can be server-rendered may import `@react-three/fiber`.**

R3F creates its reconciler at module scope. Importing it from a module that the
server render graph touches throws `Cannot read properties of undefined (reading
'ReactCurrentOwner')` and takes down the route. That is why the shared modules are
split by purity:

- `lib/environment-presets.ts` — pure data (safe anywhere).
- `lib/environment.ts` — the `useThree` hook (client only).
- `lib/image.ts` — image decode + cache, no React (safe anywhere).
- `lib/design-tokens.ts`, `lib/materials.ts` — pure data (safe anywhere).

If you add a module that the HUD needs, keep it free of `three` and
`@react-three/fiber` imports, or mark the consuming component `"use client"` and
keep it out of every server component's import graph.

### 1.3 Render loop and the capture contract

The scene animates from a single clock. During live preview the clock is wall time;
during export it is driven deterministically so that frame *N* of a loop is always
the same image, at any frame rate.

```
StudioScene
  └── AnimationRig ── useFrame ──┐
                                 │  reads
                    renderState ─┘
                 { rotation, captureTime }
                          ▲
                          │ writes
   capture-frames.ts ─────┘   (export only: sets rotation = f(frame), then
                               calls the R3F advance() once per frame)
```

`lib/scene-bridge.ts` publishes the imperative handle (`gl`, `scene`, `camera`,
`advance`, `setFrameloop`, `setSize`) so the capture controller can step the loop
without a visible canvas repaint.

---

## 2. Page architecture

### Page 1 — Studio (`src/app/page.tsx`)

Hero plus the interactive customizer.

- **`three/StudioCanvas.tsx`** — owns the `<Canvas>`, the GL context, the clear-colour
  rig (transparent vs. opaque), and the FPS probe.
- **`three/StudioScene.tsx`** — the scene graph: lights, environment rig, shadows,
  the logo mesh, and the animation rig.
- **`studio/ControlPanel.tsx`** — the floating glass HUD, grouped into Artwork,
  Material, Animation, Camera & Light, Export.
- **`studio/StudioShell.tsx`** — layout that binds the HUD to the canvas.
- **`studio/RenderStatsBar.tsx`** — monospace live readout (resolution, FPS,
  rotation speed, triangle count).

### Page 2 — Showcase (`src/app/gallery/page.tsx`)

- **`GalleryGrid`** — filterable masonry grid.
- **`GalleryCard`** — hover accelerates the local preview loop.
- **`GalleryModal`** — download links (`.gif`, `.mp4`, `.webp`), `<iframe>` embed
  snippet, and "Customize this template".
- **`GalleryPreview`** — the per-card looping preview.

### Page 3 — Pricing (`src/app/pricing/page.tsx`)

- **`PricingTable`** + **`BillingToggle`** — Starter / Pro / Custom Modeling, with
  monthly↔annual switching.
- **`lib/tiers.ts`** — server-side tier → Stripe price resolution. The browser only
  ever sends a *tier id*; a price id arriving from the client is a tampering vector,
  so it never does.
- **`api/checkout/route.ts`** — creates the Checkout Session.

### Embed surface (`src/app/embed/[id]/page.tsx`)

A chrome-free player intended for `<iframe>` embedding, backed by
`api/renders/[id]/download/route.ts`.

---

## 3. Design system

Tokens live in `tailwind.config.ts` and `src/lib/design-tokens.ts` so the Tailwind
utilities and the raw Three.js scene read from one source of truth.

- **Background** `#0a0a0c` (`void.900`), layered with a 48 px grid overlay and a
  radial violet fade at the top of each page.
- **Accents** violet `#7c5cff` (default neon), cyan `#22d3ee`, lime, pink, amber.
- **Type** display sans (Space Grotesk / Inter) for headings; monospace
  (JetBrains Mono) for render metadata — resolution, FPS, rotation speed, tri count.
- **Surfaces** glassmorphism HUD panels: translucent fill, 1 px inner highlight,
  violet glow shadow on focus/active.
- **Motion** GSAP for panel transitions; Lenis for page scroll.

---

## 4. Deliverables

### Deliverable 1 — 3D extrude module

`src/components/three/LogoMesh.tsx`

Accepts SVG markup or a transparent PNG (heightmap path), converts it to geometry,
and drives a `MeshPhysicalMaterial`. Two geometry sources:

- `extrude` — `createExtrudeGeometryFromSvg` (`lib/svg-geometry.ts`) builds an
  `ExtrudeGeometry` from parsed `SVGLoader` paths, with bevel and depth controls.
- `relief` — `createHeightmapGeometry` samples the PNG's luminance into a displaced
  plane for a bas-relief look.

Performance contract: material and animation changes must **not** rebuild geometry.
Only depth, bevel, source, and artwork are in the geometry memo's dependency list,
so dragging the roughness slider touches one uniform and nothing else.

### Deliverable 2 — Client-side capture controller

`src/lib/capture.ts` + `src/lib/capture-frames.ts`

`capture-frames.ts` steps the scene through a full 360° loop off-screen: it sets
`renderState.captureRotation` per frame and calls `advance()` so the R3F loop runs
without painting the visible canvas. `capture.ts` then encodes:

- **GIF** — frames are pushed to a `gif.js` worker pool, with alpha preserved for
  transparent exports.
- **MP4/WebM** — WebCodecs `VideoEncoder`, one keyframe per second, chunks muxed by
  `mp4-muxer`. `encodeVideoFrame` finalizes only on the last frame, and the whole
  run is abortable.

### Deliverable 3 — HUD controls panel

`src/components/studio/ControlPanel.tsx`

Tailwind markup for the floating sliders (speed, extrusion depth, bevel thickness,
metalness, roughness, transmission, clearcoat, emissive) wired straight to the
Zustand store, which the frame loop reads. Primitives live in
`src/components/ui/` (`Slider`, `Toggle`, `Segmented`, `MaterialPicker`).

---

## 5. Running it

```bash
npm install          # also copies the gif.js worker via postinstall
npm run dev          # http://localhost:3000
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
```

Copy `.env.example` to `.env.local` and fill in the Stripe values before using the
pricing page. The studio, gallery, and export pipeline need no configuration.

---

## 6. Verification status

| Check | Result |
| --- | --- |
| `tsc --noEmit` | Pass |
| `next lint` | Pass — no warnings or errors |
| `next build` | Pass — 6 routes |
| Studio page renders with live geometry | Pass — 3,774 tris, chrome material |
| Gallery renders 12 cards | Pass |
| Pricing renders 3 tiers | Pass |
| End-to-end GIF export | Pass — 60 frames → 3.7 MB `logo-1024px-60f.gif` |

Verified against React 19.3.0, R3F 9.8.1, drei 10.7.9, Next 15.5.27.
