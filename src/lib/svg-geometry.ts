import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/**
 * SVG → THREE.Shape conversion.
 *
 * `SVGLoader.createShapes()` already resolves holes for well-formed artwork
 * (the counters in "O", "A", "8"), so we lean on it rather than re-deriving
 * containment ourselves. What it does *not* do is normalise the result, and that
 * is the bulk of this module:
 *
 *   - SVG's Y axis points down, Three.js points up. Extruding raw SVG data
 *     renders logos vertically mirrored, so we mirror the geometry and repair
 *     the resulting triangle winding (see `mirrorY`).
 *   - Artwork arrives at arbitrary user-unit sizes. We centre and scale it to a
 *     predictable world size so camera framing and lighting stay stable no
 *     matter what the user uploads.
 */

export interface SvgGeometryOptions {
  /** Extrusion depth in world units. */
  depth: number;
  bevelEnabled: boolean;
  bevelThickness: number;
  bevelSize: number;
  bevelSegments: number;
  /** Curve resolution for bezier segments. */
  curveSegments: number;
}

export interface ExtractedShapes {
  shapes: THREE.Shape[];
  /** Bounding box of the source art in SVG user units (pre-extrusion). */
  bounds: { width: number; height: number };
}

/** Signed area of a closed 2D contour; the sign encodes winding direction. */
function signedArea(points: THREE.Vector2[]): number {
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += points[j].x * points[i].y - points[i].x * points[j].y;
  }
  return area / 2;
}

function pointInPolygon(point: THREE.Vector2, polygon: THREE.Vector2[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Re-parent orphan contours as holes.
 *
 * Some exporters emit every contour with the same winding, which defeats the
 * winding-based hole detection inside `createShapes` and renders counters as
 * solid islands. The tell-tale signature is a shape with no holes whose contour
 * sits entirely inside a larger shape's contour.
 */
function adoptOrphanHoles(shapes: THREE.Shape[]): THREE.Shape[] {
  const entries = shapes.map((shape) => {
    const outline = shape.getPoints(24);
    return { shape, outline, area: Math.abs(signedArea(outline)) };
  });

  const adopted = new Set<THREE.Shape>();

  for (const child of entries) {
    if (child.shape.holes.length > 0) continue;
    let parent: (typeof entries)[number] | null = null;
    for (const candidate of entries) {
      if (candidate === child) continue;
      if (candidate.area <= child.area) continue;
      if (!pointInPolygon(child.outline[0], candidate.outline)) continue;
      if (!parent || candidate.area < parent.area) parent = candidate;
    }
    if (parent) {
      parent.shape.holes.push(new THREE.Path(child.outline));
      adopted.add(child.shape);
    }
  }

  return entries.map((e) => e.shape).filter((shape) => !adopted.has(shape));
}

/**
 * Parse SVG markup into extrudable shapes plus the artwork's user-unit bounds.
 *
 * @param svg - Raw SVG markup string.
 */
export function extractShapesFromSvg(svg: string): ExtractedShapes {
  const loader = new SVGLoader();
  const data = loader.parse(svg);

  let shapes: THREE.Shape[] = [];
  for (const path of data.paths) {
    shapes.push(...SVGLoader.createShapes(path));
  }

  // Only fires when createShapes left a fully-contained contour solid.
  shapes = adoptOrphanHoles(shapes);

  const allPoints: THREE.Vector2[] = [];
  for (const shape of shapes) {
    allPoints.push(...shape.getPoints(24));
    for (const hole of shape.holes) allPoints.push(...hole.getPoints(24));
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of allPoints) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 1;
    maxY = 1;
  }

  return {
    shapes,
    bounds: {
      width: Math.max(maxX - minX, 1e-6),
      height: Math.max(maxY - minY, 1e-6),
    },
  };
}

/**
 * Mirror geometry across the XZ plane and repair face winding.
 *
 * A negative scale flips handedness: `computeVertexNormals` would then produce
 * inward-facing normals and a metallic material would render black. Swapping the
 * last two indices of every triangle restores outward-facing normals.
 */
function mirrorY(geometry: THREE.BufferGeometry) {
  geometry.scale(1, -1, 1);
  const index = geometry.getIndex();
  if (index) {
    const array = index.array as Uint16Array | Uint32Array;
    for (let i = 0; i < array.length; i += 3) {
      const tmp = array[i + 1];
      array[i + 1] = array[i + 2];
      array[i + 2] = tmp;
    }
    index.needsUpdate = true;
  }
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Build an `ExtrudeGeometry` from SVG markup, centred on the origin and scaled
 * so the longest side measures `targetSize` world units.
 *
 * @param svg        - Raw SVG markup.
 * @param targetSize - World-unit size of the longest dimension.
 */
export function createExtrudeGeometryFromSvg(
  svg: string,
  targetSize = 2,
  options: Partial<SvgGeometryOptions> = {},
): { geometry: THREE.ExtrudeGeometry; bounds: { width: number; height: number } } {
  const {
    depth = 0.3,
    bevelEnabled = true,
    bevelThickness = 0.02,
    bevelSize = 0.015,
    bevelSegments = 4,
    curveSegments = 12,
  } = options;

  const { shapes, bounds } = extractShapesFromSvg(svg);

  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled,
    bevelThickness,
    bevelSize,
    bevelOffset: 0,
    bevelSegments,
    curveSegments,
  });

  // Centre before scaling so rotation orbits the visual centre, not the SVG's
  // top-left origin.
  geometry.center();

  const longest = Math.max(bounds.width, bounds.height);
  const scale = targetSize / longest;
  geometry.scale(scale, scale, scale);

  mirrorY(geometry);

  geometry.computeBoundingSphere();
  return { geometry, bounds };
}

/**
 * Heightmap fallback for transparent PNG uploads.
 *
 * Without a vector trace we approximate depth by displacing a dense plane using
 * the image's alpha/luminance. This yields a convincing embossed relief for
 * raster logos at a fraction of the cost of running a tracer in the browser.
 */
export function createHeightmapGeometry(
  image: HTMLImageElement,
  targetSize = 2,
  segments = 220,
  depth = 0.35,
): THREE.BufferGeometry {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = Math.min(image.naturalWidth || image.width || 256, 512));
  const h = (canvas.height = Math.min(image.naturalHeight || image.height || 256, 512));
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.PlaneGeometry(targetSize, targetSize, 1, 1);

  ctx.drawImage(image, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const geometry = new THREE.PlaneGeometry(targetSize, targetSize, segments, segments);
  const pos = geometry.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) / targetSize + 0.5) * (w - 1);
    const v = (0.5 - pos.getY(i) / targetSize) * (h - 1);
    const px = Math.min(w - 1, Math.max(0, Math.round(u)));
    const py = Math.min(h - 1, Math.max(0, Math.round(v)));
    const idx = (py * w + px) * 4;
    const alpha = data[idx + 3] / 255;
    const luminance =
      (0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2]) / 255;
    // Alpha gates the relief so transparent PNG padding stays flat.
    const height = alpha * (0.35 + luminance * 0.65);
    pos.setZ(i, height * depth);
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Triangle count for the render-stats readout. */
export function countTriangles(geometry: THREE.BufferGeometry): number {
  const index = geometry.getIndex();
  if (index) return index.count / 3;
  const position = geometry.getAttribute("position");
  return position ? position.count / 3 : 0;
}
