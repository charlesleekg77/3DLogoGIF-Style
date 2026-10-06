"use client";

import * as THREE from "three";
import { renderState } from "@/lib/render-state";
import { getSceneHandle } from "@/lib/scene-bridge";

/**
 * Offscreen frame capture.
 *
 * Exporting must not depend on the on-screen canvas size, the device pixel
 * ratio, or the browser's frame pacing. So instead of grabbing the visible
 * canvas we render into a `WebGLRenderTarget` at the exact export resolution and
 * read the pixels back with `readRenderTargetPixels`.
 *
 * Two subtleties this module handles:
 *
 *   1. **Y flip.** `gl.readPixels` returns rows bottom-to-top; `putImageData`
 *      expects top-to-bottom. Without the flip every export is upside-down.
 *
 *   2. **Transparency.** The render target has an alpha channel, but `gif.js`
 *      ignores source alpha. We therefore composite every frame over a single
 *      reserved chroma key so the encoder has an unambiguous "cut me out" colour,
 *      and we report the key back to the caller.
 */

/** Reserved key colour for transparent exports: a colour a logo never uses. */
export const CHROMA_KEY_RGB = { r: 0, g: 255, b: 1 } as const;
export const CHROMA_KEY_HEX = (CHROMA_KEY_RGB.r << 16) | (CHROMA_KEY_RGB.g << 8) | CHROMA_KEY_RGB.b;

export interface CaptureFrameTarget {
  renderTarget: THREE.WebGLRenderTarget;
  /** Scratch canvas the readback is written into, one frame at a time. */
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dispose: () => void;
}

/**
 * Allocate a render target + readback canvas at `size × size`.
 *
 * MSAA is deliberately disabled (`samples: 0`) because multisampled render
 * targets cannot be read back directly by Three.js; the export is instead
 * supersampled by rendering at a higher resolution than the output GIF.
 */
export function createCaptureTarget(size: number): CaptureFrameTarget {
  const renderTarget = new THREE.WebGLRenderTarget(size, size, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    colorSpace: THREE.SRGBColorSpace,
    samples: 0,
    depthBuffer: true,
    stencilBuffer: false,
  });
  renderTarget.texture.minFilter = THREE.LinearFilter;
  renderTarget.texture.magFilter = THREE.LinearFilter;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D context unavailable for frame readback.");

  return {
    renderTarget,
    canvas,
    ctx,
    dispose: () => {
      renderTarget.dispose();
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}

/** Reusable pixel buffer + ImageData to avoid per-frame allocations. */
interface Scratch {
  pixels: Uint8Array;
  image: ImageData;
  size: number;
}

function getScratch(size: number, scratch: Scratch | null): Scratch {
  if (scratch && scratch.size === size) return scratch;
  const pixels = new Uint8Array(size * size * 4);
  const image = new ImageData(size, size);
  return { pixels, image, size };
}

/**
 * Render one deterministic frame and write it into the capture canvas.
 *
 * @param target   Allocated render target + canvas.
 * @param rotation Rotation in radians to force before rendering.
 * @param time     Clock time used to evaluate secondary motion.
 * @param scratch  Persistent scratch buffers.
 */
export function renderCaptureFrame(
  target: CaptureFrameTarget,
  rotation: number,
  time: number,
  scratch: Scratch | null,
): Scratch {
  const { gl, scene, camera, advance } = getSceneHandle();
  const size = target.canvas.width;

  renderState.capturing = true;
  renderState.captureRotation = rotation;
  renderState.captureTime = time;

  // Re-render the frame. `advance()` runs the R3F render loop without painting
  // to the visible canvas, so the LogoMesh's useFrame picks up the capture
  // rotation we just wrote.
  advance(performance.now());

  const prevTarget = gl.getRenderTarget();
  gl.setRenderTarget(target.renderTarget);
  gl.clear();
  gl.render(scene, camera);
  gl.setRenderTarget(prevTarget);

  const buffers = getScratch(size, scratch);
  gl.readRenderTargetPixels(target.renderTarget, 0, 0, size, size, buffers.pixels);

  // Flip vertically (GL origin is bottom-left, canvas is top-left).
  const { pixels, image } = buffers;
  const rowBytes = size * 4;
  const out = image.data;
  for (let y = 0; y < size; y++) {
    const src = (size - 1 - y) * rowBytes;
    out.set(pixels.subarray(src, src + rowBytes), y * rowBytes);
  }

  target.ctx.putImageData(image, 0, 0);
  return buffers;
}

/**
 * Composite the capture canvas over a solid key colour.
 *
 * `gif.js` discards alpha, so for transparent exports we paint the reserved key
 * colour underneath and let the encoder map it to the transparent index. Opaque
 * exports keep the rendered background as-is.
 */
export function applyBackground(
  target: CaptureFrameTarget,
  transparent: boolean,
  background = "#0a0a0c",
) {
  const { ctx, canvas } = target;
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  if (transparent) {
    ctx.fillStyle = `rgb(${CHROMA_KEY_RGB.r}, ${CHROMA_KEY_RGB.g}, ${CHROMA_KEY_RGB.b})`;
  } else {
    ctx.fillStyle = background;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

/** Snapshot the canvas as a data URL (used by the MP4/WebP paths). */
export function captureCanvasDataUrl(target: CaptureFrameTarget, type = "image/png", quality = 0.92) {
  return target.canvas.toDataURL(type, quality);
}

/** Restore the scene to interactive mode after a capture finishes. */
export function releaseCapture() {
  renderState.capturing = false;
  renderState.captureRotation = 0;
  renderState.captureTime = 0;
}
