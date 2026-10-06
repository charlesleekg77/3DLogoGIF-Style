"use client";

import GIF from "gif.js";
import * as THREE from "three";
import {
  applyBackground,
  CHROMA_KEY_HEX,
  createCaptureTarget,
  releaseCapture,
  renderCaptureFrame,
} from "@/lib/capture-frames";
import { getSceneHandle } from "@/lib/scene-bridge";
import { useStudio } from "@/lib/store";
import type { OutputFormat, StudioConfig } from "@/types/studio";

/**
 * DELIVERABLE 2 — client-side WebGL GIF / MP4 capture controller.
 *
 * The public entry point is `captureRender()`. It loops the logo through a full
 * 360° rotation, capturing one frame per step, and hands the frames to a
 * browser-native encoder.
 *
 * Why this is not just "screenshot the canvas in a rAF loop":
 *
 *   - **Determinism.** Rotation is driven from `renderState.captureRotation`,
 *     not from wall-clock time, so frame 17 is always 17/60 of a turn. That is
 *     what makes the exported loop seamless even on a machine that drops frames.
 *   - **Resolution independence.** Frames are rendered into an offscreen
 *     `WebGLRenderTarget` at the export resolution, so a 4K export does not
 *     require a 4K browser window.
 *   - **Pacing.** Renders are yielded through `requestAnimationFrame` and
 *     encoding through `await`, so the tab never locks up and the progress bar
 *     can actually paint.
 *
 * Encoders:
 *   - GIF  → `gif.js`, which quantises in web workers. Supports the reserved
 *            chroma-key transparency path.
 *   - MP4  → `WebCodecs VideoEncoder` (avc1) muxed by `mp4-muxer`.
 *   - WebM → `WebCodecs VideoEncoder` (vp09) muxed by `mp4-muxer`.
 */

export interface CaptureOptions {
  /** Frames in the loop. Defaults to the config value (60). */
  frames?: number;
  /** Square output resolution in px. Defaults to the config value (1024). */
  resolution?: number;
  /** Output format. Defaults to the config value ("gif"). */
  format?: OutputFormat;
  /** Called with 0–1 after every rendered frame and encoder tick. */
  onProgress?: (progress: number, message: string) => void;
  /** Abort signal honoured between frames. */
  signal?: AbortSignal;
}

export interface CaptureResult {
  blob: Blob;
  url: string;
  format: OutputFormat;
  width: number;
  height: number;
  frames: number;
  durationMs: number;
}

export class CaptureAbortedError extends Error {
  constructor() {
    super("Capture aborted");
    this.name = "CaptureAbortedError";
  }
}

/** gif.js worker location, copied into /public by `scripts/copy-worker.mjs`. */
const GIF_WORKER_URL = "/vendor/gif.worker.js";

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new CaptureAbortedError();
}

/**
 * Render a full 360° loop and encode it.
 *
 * @param options - Overrides for frames/resolution/format plus progress hooks.
 */
export async function captureRender(options: CaptureOptions = {}): Promise<CaptureResult> {
  const started = performance.now();
  const config = useStudio.getState().config;
  const frames = Math.max(12, Math.round(options.frames ?? config.frames));
  const resolution = Math.max(256, Math.round(options.resolution ?? config.resolution));
  const format = options.format ?? config.format;

  const report = (progress: number, message: string) => {
    options.onProgress?.(Math.min(1, Math.max(0, progress)), message);
  };

  // ---- 1. Prepare --------------------------------------------------------
  report(0.01, "Preparing offscreen render target");
  const handle = getSceneHandle();

  // The interactive loop would fight us for the GL context, so park it.
  handle.setFrameloop("never");

  const target = createCaptureTarget(resolution);
  const camera = handle.camera as THREE.PerspectiveCamera;
  const prevAspect = camera.aspect;
  camera.aspect = 1;
  camera.updateProjectionMatrix();

  let scratch = null;
  const rgbaFrames: ImageData[] = [];

  try {
    // ---- 2. Render the loop ---------------------------------------------
    for (let i = 0; i < frames; i++) {
      throwIfAborted(options.signal);
      const rotation = (i / frames) * Math.PI * 2;
      const time = (i / frames) * (frames * (config.frameDelay / 1000));

      scratch = renderCaptureFrame(target, rotation, time, scratch);
      applyBackground(target, config.transparent);

      // The GIF path keeps decoded pixels for the encoder. The video paths can
      // hand the canvas straight to WebCodecs, so they skip this copy.
      if (format === "gif") {
        rgbaFrames.push(
          new ImageData(new Uint8ClampedArray(scratch.image.data), resolution, resolution),
        );
      } else {
        await encodeVideoFrame(target.canvas, i, format, resolution);
      }

      report(0.05 + (i / frames) * 0.6, `Rendering frame ${i + 1} / ${frames}`);
      await nextFrame();
    }

    // ---- 3. Encode ------------------------------------------------------
    report(0.7, format === "gif" ? "Quantising palette in workers" : "Finalising container");

    let blob: Blob;
    if (format === "gif") {
      blob = await encodeGif(rgbaFrames, resolution, config, (p) =>
        report(0.7 + p * 0.3, `Encoding GIF ${Math.round(p * 100)}%`),
      );
    } else {
      blob = await finaliseVideo(format);
    }

    report(1, "Done");
    const url = URL.createObjectURL(blob);
    return {
      blob,
      url,
      format,
      width: resolution,
      height: resolution,
      frames,
      durationMs: performance.now() - started,
    };
  } finally {
    // ---- 4. Restore interactive state -----------------------------------
    releaseCapture();
    camera.aspect = prevAspect;
    camera.updateProjectionMatrix();
    target.dispose();
    videoEncoderState = null;
    handle.setFrameloop("always");
    // A full turn of frames at export resolution can be hundreds of MB; drop
    // the references so the GC can reclaim them immediately.
    rgbaFrames.length = 0;
  }
}

// ---------------------------------------------------------------------------
// GIF encoder
// ---------------------------------------------------------------------------

function encodeGif(
  frames: ImageData[],
  size: number,
  config: StudioConfig,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const workers = Math.min(4, Math.max(2, Math.floor((navigator.hardwareConcurrency || 4) / 2)));
    const gif = new GIF({
      workers,
      // Quality scales with resolution: sampling every pixel of a 4K frame is
      // slow for a marginal colour gain.
      quality: size > 1024 ? 10 : size > 512 ? 6 : 3,
      repeat: 0,
      workerScript: GIF_WORKER_URL,
      width: size,
      height: size,
      // A logo rarely uses this exact green; it becomes the transparent index.
      transparent: config.transparent ? CHROMA_KEY_HEX : null,
      dither: size <= 1024 ? "FloydSteinberg" : false,
    });

    gif.on("progress", onProgress);
    gif.on("finished", resolve);
    gif.on("abort", () => reject(new CaptureAbortedError()));

    for (const frame of frames) {
      gif.addFrame(frame, { delay: config.frameDelay });
    }
    gif.render();
  });
}

// ---------------------------------------------------------------------------
// MP4 / WebM encoder (WebCodecs)
// ---------------------------------------------------------------------------

/**
 * `VideoEncoder` is stateful across the whole capture: the encoder is created on
 * the first frame and flushed on the last. The muxer accumulates chunks. Both
 * live here rather than in locals because `captureRender` calls this once per
 * frame from a loop.
 */
interface VideoEncoderState {
  encoder: VideoEncoder;
  muxer: import("mp4-muxer").Muxer<import("mp4-muxer").ArrayBufferTarget>;
  target: import("mp4-muxer").ArrayBufferTarget;
  keyframeEvery: number;
}

let videoEncoderState: VideoEncoderState | null = null;

export function isVideoEncodingSupported(): boolean {
  return typeof VideoEncoder !== "undefined";
}

async function ensureVideoEncoder(format: "mp4" | "webm", size: number) {
  if (videoEncoderState) return videoEncoderState;

  const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");

  const codec = format === "mp4" ? "avc1.640028" : "vp09.00.10.08";
  const mp4Codec = format === "mp4" ? "avc" : "vp9";

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: mp4Codec, width: size, height: size },
    // In-memory fast-start puts the moov atom at the front so the file streams
    // and previews instantly instead of only after a full download.
    fastStart: "in-memory",
  });

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => {
      // Surface encoder failures through the console; the capture loop will
      // reject on the next flush attempt.
      console.error("[capture] VideoEncoder error", error);
    },
  });

  const supported = await VideoEncoder.isConfigSupported({
    codec,
    width: size,
    height: size,
    bitrate: Math.round(size * size * 0.35),
    framerate: 30,
  });
  if (!supported.supported) {
    throw new Error(
      `This browser cannot encode ${format.toUpperCase()} at ${size}×${size} (${codec}). Try GIF, or lower the resolution.`,
    );
  }

  encoder.configure({
    codec,
    width: size,
    height: size,
    bitrate: Math.round(size * size * 0.35),
    framerate: 30,
    latencyMode: "quality",
  });

  videoEncoderState = { encoder, muxer, target, keyframeEvery: 30 };
  return videoEncoderState;
}

async function encodeVideoFrame(
  canvas: HTMLCanvasElement,
  index: number,
  format: "mp4" | "webm",
  size: number,
) {
  const state = await ensureVideoEncoder(format, size);
  const timestamp = Math.round((index * 1_000_000) / 30);

  const frame = new VideoFrame(canvas, {
    timestamp,
    duration: Math.round(1_000_000 / 30),
  });

  // One keyframe per second keeps scrubbing responsive without bloating the file.
  const keyFrame = index % state.keyframeEvery === 0;
  state.encoder.encode(frame, { keyFrame });
  frame.close();

  // Backpressure: if the encoder queue grows past 8 frames, wait for it to drain
  // before submitting more, otherwise memory climbs unbounded on long captures.
  while (state.encoder.encodeQueueSize > 8) {
    await new Promise((resolve) => setTimeout(resolve, 4));
  }
}

async function finaliseVideo(format: "mp4" | "webm"): Promise<Blob> {
  if (!videoEncoderState) throw new Error("Video encoder was never initialised.");
  const { encoder, muxer, target } = videoEncoderState;
  if (encoder.state !== "closed") {
    await encoder.flush();
    encoder.close();
  }
  muxer.finalize();
  return new Blob([target.buffer], { type: format === "mp4" ? "video/mp4" : "video/webm" });
}

/** True when the browser can produce a file for the given format. */
export function isFormatSupported(format: OutputFormat): boolean {
  if (format === "gif") return true;
  return isVideoEncodingSupported();
}

/**
 * Convenience wrapper that mirrors capture progress into the Zustand store so
 * the HUD progress bar updates without the caller wiring callbacks.
 */
export async function captureRenderToStore(overrides: CaptureOptions = {}) {
  const store = useStudio.getState();
  store.resetCapture();
  store.setCapture({ phase: "preparing", progress: 0, message: "Preparing" });

  try {
    const result = await captureRender({
      ...overrides,
      onProgress: (progress, message) => {
        const phase = progress < 0.65 ? "rendering" : "encoding";
        store.setCapture({ phase, progress, message });
        overrides.onProgress?.(progress, message);
      },
    });

    store.setCapture({
      phase: "done",
      progress: 1,
      message: `${result.frames} frames · ${(result.blob.size / 1024 / 1024).toFixed(2)} MB`,
      resultUrl: result.url,
      resultSize: result.blob.size,
      resultFormat: result.format,
      error: null,
    });
    return result;
  } catch (error) {
    if (error instanceof CaptureAbortedError) {
      store.setCapture({ phase: "aborted", message: "Cancelled", progress: 0 });
      return null;
    }
    const message = error instanceof Error ? error.message : "Capture failed";
    store.setCapture({ phase: "error", message, error: message });
    throw error;
  }
}
