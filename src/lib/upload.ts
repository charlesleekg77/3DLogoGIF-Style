"use client";

import { preloadImage } from "@/lib/image";
import type { LogoSource } from "@/types/studio";

/**
 * Artwork intake.
 *
 * Two accepted inputs, two very different pipelines:
 *
 *   SVG — parsed as text, sanitised, and handed to `SVGLoader`. This is the
 *         high-quality path: true vector extrusion, sharp bevels at any scale.
 *
 *   PNG — cannot be extruded directly. We keep the bitmap and generate a
 *         heightmap, which `LogoMesh` turns into a displaced relief. It is a
 *         different (softer) look, and the HUD says so rather than pretending
 *         the two are equivalent.
 */

export const MAX_FILE_BYTES = 8 * 1024 * 1024;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

/**
 * Strip active content from uploaded SVG.
 *
 * An uploaded SVG is untrusted input. Even though it is never injected into the
 * DOM as HTML here (it goes through `SVGLoader.parse`), removing script elements,
 * event handlers, and external references is cheap defence in depth — and some
 * of these would otherwise be fetched by the loader.
 */
export function sanitizeSvg(markup: string): string {
  const doc = new DOMParser().parseFromString(markup, "image/svg+xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new UploadError("That SVG could not be parsed.");

  // Remove script-bearing elements outright.
  doc.querySelectorAll("script, foreignObject, iframe, use[href^='http']").forEach((node) =>
    node.remove(),
  );

  // Strip inline event handlers and javascript: URLs.
  doc.querySelectorAll("*").forEach((node) => {
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on")) node.removeAttribute(attr.name);
      if ((name === "href" || name === "xlink:href") && value.startsWith("javascript:")) {
        node.removeAttribute(attr.name);
      }
    }
  });

  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg") {
    throw new UploadError("That file does not contain an <svg> root element.");
  }

  return new XMLSerializer().serializeToString(root);
}

/** Read the SVG's intrinsic aspect ratio so the HUD can report it. */
function svgAspect(svg: Element): number {
  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) return parts[2] / parts[3];
  }
  const width = Number.parseFloat(svg.getAttribute("width") ?? "");
  const height = Number.parseFloat(svg.getAttribute("height") ?? "");
  if (width > 0 && height > 0) return width / height;
  return 1;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new UploadError("Could not read that file."));
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new UploadError("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert an uploaded file into a `LogoSource`.
 *
 * @throws {UploadError} for unsupported types, oversized files, or bad markup.
 */
export async function logoFromFile(file: File): Promise<LogoSource> {
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadError(`Files must be under ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB.`);
  }

  const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
  const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");

  if (isSvg) {
    const raw = await readFileAsText(file);
    const svg = sanitizeSvg(raw);
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    return {
      name: file.name,
      kind: "svg",
      svg,
      aspect: svgAspect(doc.documentElement),
    };
  }

  if (isPng) {
    const dataUrl = await readFileAsDataUrl(file);
    // Decode up front so the heightmap builder can read pixels synchronously.
    const image = await preloadImage(dataUrl);
    return {
      name: file.name,
      kind: "png",
      dataUrl,
      heightmapUrl: dataUrl,
      aspect: (image.naturalWidth || 1) / (image.naturalHeight || 1),
    };
  }

  throw new UploadError("Upload an SVG or a transparent PNG. Other formats are not supported.");
}
