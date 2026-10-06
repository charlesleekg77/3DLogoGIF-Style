# AGENTS.md

Repository-specific knowledge for `3dlogogif-studio`. Read this before changing
anything in `src/components/three` or `src/app`.

## Commands

```bash
npm run dev        # Next dev server (default port 3000; use -p 12000 in this sandbox)
npm run build      # production build — must stay green
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run prepare-assets  # re-copy public/vendor/gif.worker.js from node_modules
```

`postinstall` already runs the asset copy, so a clean `npm install` is enough.

## The rule that will bite you

**Never let a server-reachable module import `@react-three/fiber` or `three`.**

R3F builds its reconciler at module scope. Next 15 aliases `react` to its bundled
React 19; an R3F v8 reconciler (React 18) then throws
`TypeError: Cannot read properties of undefined (reading 'ReactCurrentOwner')` and
the whole route drops into the error boundary. This exact bug has already happened
once in this repo.

Concretely:

- Keep preset data pure and separate from hooks. Example:
  `lib/environment-presets.ts` (data) vs `lib/environment.ts` (`useThree` hook).
- Keep non-React helpers free of React imports. Example: `lib/image.ts`.
- The studio is a client island: `StudioCanvas` is `dynamic(..., { ssr: false })`.

## Version constraints

The R3F stack must stay on React 19: `react@^19`, `react-dom@^19`,
`@react-three/fiber@^9`, `@react-three/drei@^10`. `drei@10` requires
`react@^19`, so installing it without also upgrading React fails with ERESOLVE.
If you must reinstall, remove the old packages first:

```bash
npm uninstall @react-three/drei @react-three/fiber
npm install react@^19 react-dom@^19 @react-three/fiber@^9 @react-three/drei@^10
npm install -D @types/react@^19 @types/react-dom@^19
```

Do not reach for `--legacy-peer-deps`; it hides the mismatch rather than fixing it.

## Layout structure

The site chrome lives in a `(site)` route group so `/embed/[id]` stays bare:

```
src/app/
  layout.tsx           document shell only (html, body, fonts, globals.css)
  (site)/layout.tsx    header + footer + Lenis + background layers
  (site)/page.tsx      studio
  (site)/gallery       showcase
  (site)/pricing       pricing
  (site)/docs          developer docs
  (site)/about, (site)/contact, (site)/legal/[doc]
  embed/[id]/page.tsx  chrome-free player — must NOT gain the header/footer
  api/checkout, api/renders/[id]/download
```

If you add a page that needs the header and footer, put it under `(site)/`.
If you add one that must not have them, keep it outside the group.

## Testing notes

- There is no test runner configured. Verification is typecheck + lint + build plus
  manual browser checks of `/`, `/gallery`, `/pricing`, `/embed/render-1`.
- Gallery/render ids are `render-1` … `render-N` (`createGalleryItems(60)`). A 404
  from `/embed/...` or the download API usually means the id was out of range, not
  that routing is broken.
- The GIF export is the slowest thing to verify by hand (~20 s for 60 frames at
  1024px). A success shows `done 100%`, a byte size, and a
  `logo-1024px-60f.gif` download button.

## Dev server in this sandbox

Reach the app through the proxy host, and note that `next build` and `next dev`
share `.next`, so a dev server started after a build may serve stale output. When
in doubt: kill the server, `rm -rf .next`, restart.
