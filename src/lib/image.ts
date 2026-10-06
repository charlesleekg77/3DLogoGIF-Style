/**
 * Decode an image URL into an `HTMLImageElement`, with a module-level cache.
 *
 * Lives in its own module rather than beside `LogoMesh` because the upload path
 * needs it too, and importing it from the mesh component would pull
 * `@react-three/fiber` into the server render graph — which throws at module
 * scope when there is no `ReactCurrentOwner`.
 *
 * The cache is deliberately outside React: an uploaded PNG decodes once, then is
 * read synchronously inside the geometry `useMemo`, which keeps that build a pure
 * function.
 */

const imageCache = new Map<string, HTMLImageElement>();

export function preloadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      imageCache.set(url, image);
      resolve(image);
    };
    image.onerror = () => reject(new Error("Could not decode that image."));
    image.src = url;
  });
}

/** Synchronous lookup for callers that know the image has already decoded. */
export function getCachedImage(url: string): HTMLImageElement | undefined {
  return imageCache.get(url);
}
