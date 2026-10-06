# Architecture

## 1. System shape

```
┌──────────────────────── browser (the whole render pipeline) ────────────────────────┐
│                                                                                     │
│  ┌── (site) route group ──────────────┐        ┌── /embed/[id] ─────────────────┐   │
│  │  /  studio   /gallery   /pricing   │        │  bare player, no chrome        │   │
│  │  /docs  /about  /contact  /legal/* │        └────────────────────────────────┘   │
│  └────────────────┬───────────────────┘                                             │
│                   │                                                                 │
│        ┌──────────▼──────────┐        ┌──────────────────────┐                      │
│        │  StudioShell (HUD)  │◄──────►│  Zustand studio store │                      │
│        └──────────┬──────────┘        └──────────┬───────────┘                      │
│                   │  selects narrow             │  subscribeWithSelector           │
│        ┌──────────▼──────────┐        ┌──────────▼───────────┐                      │
│        │  StudioCanvas (R3F) │        │  capture-frames.ts   │                      │
│        │   └ StudioScene     │◄───────│  capture.ts          │                      │
│        │      └ LogoMesh     │  steps │  (gif.js / WebCodecs)│                      │
│        └──────────┬──────────┘  loop  └──────────────────────┘                      │
│                   │                                                                 │
│              WebGL canvas  ──►  Blob  ──►  download                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                       server (Next.js route handlers)
                       ┌─────────────────────────────────────────┐
                       │ POST /api/checkout        (Stripe)      │
                       │ GET  /api/renders/[id]/download         │
                       └─────────────────────────────────────────┘
```

The render pipeline has no server dependency. The two API routes exist only for
billing and for serving pre-rendered artefacts when a deployment has them.

## 2. Layering rules

| Layer | Directory | May import | Must never import |
| --- | --- | --- | --- |
| Pure data | `src/data`, `src/lib/*-presets.ts`, `src/lib/design-tokens.ts`, `src/lib/materials.ts` | types | `three`, `@react-three/fiber` |
| Pure logic | `src/lib/image.ts`, `src/lib/svg-geometry.ts`, `src/lib/utils.ts` | types, pure data | React, R3F |
| State | `src/lib/store.ts` | pure data | `three`, R3F |
| Client hooks | `src/lib/environment.ts`, `src/lib/scene-bridge.ts`, `src/lib/capture*.ts` | R3F, store | — (client only) |
| 3D components | `src/components/three/**` | R3F, client hooks | — |
| Server components | `src/app/**/page.tsx` outside the client boundary | pure data, pure logic | R3F, `three` |

### The R3F/SSR rule

React Three Fiber builds its reconciler at module scope. If any module reachable
from a server component imports R3F, the route throws
`Cannot read properties of undefined (reading 'ReactCurrentOwner')`. This is not
hypothetical — it is the bug this build was rescued from.

Consequences:

- Preset data is split from the hook that consumes it:
  `environment-presets.ts` (pure) vs `environment.ts` (`useThree`).
- Image decoding and caching live in `image.ts`, with no React import, so the
  upload pipeline can use them without dragging R3F into a server graph.
- The studio is a client island: `StudioCanvas` is `dynamic(..., { ssr: false })`.

## 3. Animation and capture contract

Live preview and export share one code path. `renderState` is a module-level,
non-reactive object that the frame loop reads every tick:

```ts
// lib/render-state.ts (shape)
{ rotation: { x, y, z }, captureTime: number | null }
```

- **Live**: `AnimationRig` integrates `rotation[axis] += speed * delta` from
  `useFrame`'s clock. `captureTime` is `null`.
- **Export**: `capture-frames.ts` sets `captureTime = i / fps` and computes
  `rotation[axis] = 2π * i / frames`, then calls the bridge's `advance()` once.
  The R3F loop runs exactly one tick, so frame *i* is deterministic regardless of
  the host frame rate.

`scene-bridge.ts` exposes the imperative handle the capture controller needs:

```ts
interface SceneBridge {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  advance: () => void;      // render one frame on demand
  setFrameloop: (mode: "always" | "never") => void;
  setSize: (w: number, h: number) => void;
}
```

## 4. Export encoders

| Format | Encoder | Notes |
| --- | --- | --- |
| GIF | `gif.js` worker pool | Preserves alpha; the worker script is copied to `/public/vendor` by `scripts/copy-worker.mjs` because a library-instantiated `new Worker(url)` cannot be bundled. |
| MP4 | WebCodecs `VideoEncoder` + `mp4-muxer` | One keyframe per second; `encodeVideoFrame` finalizes only on the last frame. |
| WebM | WebCodecs `VideoEncoder` | Same path as MP4, different codec string. |

The whole export is abortable. `setFrameloop("never")` is set for the duration of
the capture and restored afterwards so the visible canvas does not repaint 60
times while the user waits.

## 5. Build and runtime

- Next 15 App Router, `reactStrictMode` on.
- `transpilePackages: ["three"]` keeps ESM sub-module resolution identical between
  the client and server bundles.
- `Cross-Origin-Opener-Policy: same-origin` +
  `Cross-Origin-Embedder-Policy: credentialless` enable a cross-origin-isolated
  context, which WebCodecs and `OffscreenCanvas` want.
- `allowedDevOrigins` covers proxy hostnames so `/ _next/*` requests do not warn.
- `postinstall` runs the worker copy, so a clean `npm install` is enough to run.
