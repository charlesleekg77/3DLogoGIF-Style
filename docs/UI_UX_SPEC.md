# UI / UX Specification

## 1. Brand direction

A dark, instrument-panel aesthetic: the interface reads like a render control room
rather than a marketing site. High contrast, geometric, quiet until touched.

### 1.1 Colour

| Token | Value | Use |
| --- | --- | --- |
| `void.900` | `#0a0a0c` | Page background |
| `void-deep` | near-black, translucent | Footer, modal scrim |
| `void.50` | near-white | Primary type |
| `void.200/300/400/500` | descending greys | Body, secondary, metadata, disabled |
| `neon-violet` | `#7c5cff` | Default accent, focus rings, glow |
| `neon-cyan` | `#22d3ee` | Link hover, secondary accent |
| lime / pink / amber | — | Material + status accents |

Rules:

- Never place neon on neon. One accent per component.
- Text on `void.900` is at least `void.300`; metadata is `void.400` or lighter on
  dark panels only.
- Glow is a shadow, not a fill: `box-shadow: 0 0 0 1px` ring plus a soft violet
  bloom, and only on `:focus-visible` or the active state.

### 1.2 Type

| Role | Face | Notes |
| --- | --- | --- |
| Display | Space Grotesk | Headings, wordmark. `tracking-tightest`, tight leading. |
| Body | Inter | Copy and controls. |
| Metadata | JetBrains Mono | Resolution, FPS, rotation, tri count. Uppercase, wide tracking. |

All three are self-hosted through `next/font`, so there is no FOIT and no
third-party request. Fluid headings use `clamp()`, e.g.
`text-[clamp(2rem,4.4vw,3.4rem)]`.

### 1.3 Surfaces and depth

- Glass panels: `bg-white/[0.02]`, 1 px `border-white/[0.08]`, `rounded-2xl`,
  `backdrop-blur` where the panel floats over the canvas.
- Decorative layers (`radial-bloom`, `grid-overlay`) are fixed, `aria-hidden`, and
  sit at `-z-10`.
- Hairline dividers instead of heavy borders.

### 1.4 Motion

| Interaction | Implementation |
| --- | --- |
| Page scroll | Lenis inertia scroll |
| HUD panel open/close | GSAP; accordion sections 01–05 |
| Gallery hover | Local preview loop speeds up |
| Viewport drag | Orbit; Lenis is paused while dragging |
| Button hover | 150 ms colour/shadow transition, no layout shift |

Motion respects the user's intent: nothing animates on a control the pointer is not
near, and no transition exceeds ~400 ms.

## 2. Page specifications

### 2.1 Studio (`/`)

Layout: full-bleed hero, then the customizer as a two-column shell on desktop —
canvas left (sticky), HUD right; stacked on mobile.

Hero:

- Eyebrow: `Real-time 3D · client-side render`.
- Headline with the middle phrase emphasised in the accent.
- Two CTAs: primary neon "Start customizing", ghost "Browse showcase".
- A four-up stat strip: Export 4K, Materials 7 presets, Loop 360°, Uploads 0 bytes.

Canvas overlay:

- Top-left: monospace live stats — `RES`, `FPS`, `ROT`, `TRIS`, with a `live` dot.
- Bottom-left: `viewport — drag to orbit · scroll to zoom`.

HUD sections (collapsible, numbered):

1. **Artwork** — dropzone (SVG/PNG, max 8 MB), built-in template presets
   (Orbit / Prism / Helix / Spark), geometry source (Extrude SVG / Relief PNG).
2. **Material** — seven preset chips, then sliders: extrusion depth, bevel
   thickness, bevel segments, metalness, roughness, transmission, clearcoat,
   emissive, tint colour, wireframe toggle.
3. **Animation** — rotation speed, axis (X/Y/Z), direction (CW/CCW), secondary
   motion (static/float/bounce/wobble/pulse), motion amplitude.
4. **Camera & light** — FOV, zoom, orbit pitch, environment map select, environment
   intensity, directional, ambient, rim light, shadows / contact shadows / AO.
5. **Export** — render engine select, loop length, phase readout (`idle` → `done`,
   percent), primary render button, cancel while running, and the result card
   (output size, filename, download).

Feedback rules:

- The primary button is `Render GIF` → `Rendering… (n%)` → `Render again`.
- A `Cancel` button appears only while a render is in flight.
- Progress is a percentage plus a phase word; never a spinner alone.
- After success, show the byte size and the filename so the download is unambiguous.

### 2.2 Showcase (`/gallery`)

- Eyebrow `Showcase · 02`, headline, one-line description.
- Filter chips: All / Chrome / Glass / Gold / Holo / Neon / Wire.
- Masonry grid; each card carries a looping preview, a material tag, a rotation
  speed, an author handle, like and download counts, and a `pro` badge where the
  render is 4K/transparent.
- Hover: the card's preview loop accelerates and lighting shifts.
- Click: modal with `.gif` / `.mp4` / `.webp` download links, an `<iframe>` embed
  snippet, and "Customize this template".
- Infinite scroll: a "loading more renders…" sentinel appends the next page.

### 2.3 Pricing (`/pricing`)

- Eyebrow `Pricing · 03`, headline "Render as much as you like. Pay for the output."
- Monthly/Annual toggle with a `−20%` badge; annual state must be visually obvious.
- Three tiers: Starter ($0, watermarked 720p), Pro ($19/mo, most-popular badge,
  4K transparent, commercial licence), Custom Modeling ($499, per project).
- Feature lists are plain bullets, benefit-first, no check-mark clutter.
- A custom-modeling call-out below the table with `Book a project` and
  `See examples`, plus a stat strip (Turnaround 5 days, Revisions 2 rounds,
  Formats glTF · .blend, From $499).
- FAQ accordion at the bottom.

### 2.4 Embed (`/embed/[id]`)

No header, no footer, no scroll provider, transparent background, a single centred
player at `min(88vw, 88vh)`. This is enforced structurally by a `(site)` route
group, not by CSS.

## 3. Accessibility

- Every control is a real `<button>`, `<input>`, `<select>`, or `<label>` — no
  clickable `<div>`s.
- Sliders expose a label, current value, and `aria-valuetext` where the raw number
  is not the display string (e.g. `45°/s`).
- Focus is always visible: a violet ring, never removed.
- Decorative layers are `aria-hidden`; the canvas carries a descriptive label.
- Motion is optional: the render loop pauses when the tab is hidden.

## 4. Responsive behaviour

| Breakpoint | Studio | Gallery | Pricing |
| --- | --- | --- | --- |
| `< 768` | Stacked; canvas first, HUD below; stat strip 2-up | 1 column | Tiers stacked |
| `768–1024` | Stacked, wider canvas | 2 columns | Tiers stacked |
| `> 1024` | Canvas sticky left, HUD right | 3–4 columns | 3-up, middle emphasised |

Container width caps at `1440px` with `px-6 lg:px-10` gutters.
