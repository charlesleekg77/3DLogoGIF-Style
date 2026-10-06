/**
 * Shared, mutable render state for imperative frame control.
 *
 * Why this exists: React state is the wrong tool for per-frame values. Pushing a
 * rotation angle through `useState` at 60 fps would re-render the tree 60 times a
 * second. Instead the R3F render loop reads these plain fields directly.
 *
 * The capture controller flips `capturing` to true and writes an exact
 * `captureRotation` for every frame. That makes exported GIFs perfectly
 * deterministic — frame N is always the same angle — which is what guarantees a
 * seamless loop regardless of the machine's frame rate.
 */

export interface RenderState {
  /** True while the capture controller is driving the animation. */
  capturing: boolean;
  /** Exact rotation (radians) the mesh must use for the current capture frame. */
  captureRotation: number;
  /** Exact clock time (seconds) used to evaluate motion effects during capture. */
  captureTime: number;
  /** Free-running clock time accumulated by the render loop. */
  elapsed: number;
}

export const renderState: RenderState = {
  capturing: false,
  captureRotation: 0,
  captureTime: 0,
  elapsed: 0,
};

export function beginCapture() {
  renderState.capturing = true;
  renderState.captureRotation = 0;
  renderState.captureTime = 0;
}

export function endCapture() {
  renderState.capturing = false;
}
