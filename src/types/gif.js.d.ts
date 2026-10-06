/**
 * Minimal typings for gif.js (the package ships no types).
 *
 * Only the surface the capture controller touches is declared.
 */
declare module "gif.js" {
  export interface GIFOptions {
    /** Workers to spawn; more is faster but each holds a copy of the frame. */
    workers?: number;
    /** Pixel sample interval. Lower = better colour, slower. 1–30. */
    quality?: number;
    /** Repeat count: 0 = loop forever, -1 = play once. */
    repeat?: number;
    /** URL of `gif.worker.js`. */
    workerScript?: string;
    /** Background colour painted behind transparent source pixels. */
    background?: string;
    width?: number;
    height?: number;
    /**
     * Hex colour (0xRRGGBB) treated as the transparent colour index, or null.
     */
    transparent?: number | null;
    dither?: string | boolean;
    debug?: boolean;
  }

  export interface GIFFrameOptions {
    delay?: number;
    copy?: boolean;
    /** Per-frame transparent colour override. */
    transparent?: number | null;
    dispose?: number;
  }

  export default class GIF {
    constructor(options?: GIFOptions);
    addFrame(
      image: HTMLCanvasElement | CanvasRenderingContext2D | ImageData,
      options?: GIFFrameOptions,
    ): void;
    render(): void;
    abort(): void;
    on(event: "finished", handler: (blob: Blob) => void): void;
    on(event: "progress", handler: (progress: number) => void): void;
    on(event: "abort", handler: () => void): void;
  }
}
