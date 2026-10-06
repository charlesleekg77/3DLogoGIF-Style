import type { LogoSource } from "@/types/studio";

/**
 * Built-in demo artwork.
 *
 * These ship as raw markup (not files) so the studio has something to render on
 * first paint with zero network round-trips, and so the SSR/client output is
 * identical. Each logo deliberately exercises a different geometry case:
 * counters, multi-contour lettering, and long thin strokes.
 */

const orbitMark = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <path fill="#fff" fill-rule="evenodd" d="
    M256 64a192 192 0 1 0 0 384 192 192 0 0 0 0-384Zm0 48a144 144 0 1 1 0 288 144 144 0 0 1 0-288Z"/>
  <path fill="#fff" d="M256 168a88 88 0 1 0 0 176 88 88 0 0 0 0-176Z"/>
  <path fill="#fff" d="M256 224a32 32 0 1 1 0 64 32 32 0 0 1 0-64Z"/>
</svg>`;

const prismWordmark = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 256" width="640" height="256">
  <path fill="#fff" fill-rule="evenodd" d="
    M40 40h96a72 72 0 0 1 0 144H40V40Zm48 48v48h44a24 24 0 0 0 0-48H88Z"/>
  <path fill="#fff" fill-rule="evenodd" d="
    M200 40h72c48 0 84 34 84 88s-36 88-84 88h-72V40Zm48 48v80h22c22 0 38-16 38-40s-16-40-38-40h-22Z"/>
  <path fill="#fff" d="M420 40h44v128h96v48H420V40Z"/>
  <path fill="#fff" d="M576 40h40v176h-40z"/>
</svg>`;

const helixMark = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <path fill="#fff" d="M256 32c-70 60-70 148 0 208s70 148 0 208c70-60 70-148 0-208s-70-148 0-208Z"/>
  <path fill="#fff" d="M256 32c70 60 70 148 0 208s-70 148 0 208c-70-60-70-148 0-208s70-148 0-208Z"/>
  <path fill="#fff" d="M128 96h256v40H128zM128 376h256v40H128z"/>
</svg>`;

const sparkMark = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <path fill="#fff" d="M256 32l44 148 148 44-148 44-44 148-44-148L64 224l148-44 44-148Z"/>
  <path fill="#fff" fill-rule="evenodd" d="
    M256 176a80 80 0 1 0 0 160 80 80 0 0 0 0-160Zm0 40a40 40 0 1 1 0 80 40 40 0 0 1 0-80Z"/>
</svg>`;

export interface BuiltinLogo extends LogoSource {
  id: string;
  label: string;
}

export const BUILTIN_LOGOS: BuiltinLogo[] = [
  {
    id: "orbit",
    label: "Orbit",
    name: "orbit-mark.svg",
    kind: "builtin",
    svg: orbitMark,
    aspect: 1,
  },
  {
    id: "prism",
    label: "Prism",
    name: "prism-wordmark.svg",
    kind: "builtin",
    svg: prismWordmark,
    aspect: 2.5,
  },
  {
    id: "helix",
    label: "Helix",
    name: "helix-mark.svg",
    kind: "builtin",
    svg: helixMark,
    aspect: 1,
  },
  {
    id: "spark",
    label: "Spark",
    name: "spark-mark.svg",
    kind: "builtin",
    svg: sparkMark,
    aspect: 1,
  },
];

export const builtinLogoById = (id: string): BuiltinLogo =>
  BUILTIN_LOGOS.find((logo) => logo.id === id) ?? BUILTIN_LOGOS[0];

export const DEFAULT_LOGO = BUILTIN_LOGOS[0];
