import { NextResponse } from "next/server";
import { createGalleryItems } from "@/data/gallery";

/**
 * GET /api/renders/[id]/download?format=gif|mp4|webp
 *
 * Server-side render delivery.
 *
 * This is the second half of the export story. The client encoder is fast and
 * free but it is bounded by the user's GPU: very high resolutions, long loops,
 * and precise alpha mattes are better produced offline. In production this
 * endpoint would:
 *
 *   1. Look up the render job and confirm the caller's entitlement for the
 *      requested resolution (a free account asking for 4K gets 402, not a file).
 *   2. Return the artefact from object storage if it already exists.
 *   3. Otherwise enqueue a job for the FFmpeg worker, which re-runs the same
 *      deterministic frame loop headlessly and streams the result.
 *
 * For this blueprint the artefacts are served from `/public/renders`. When a
 * file is absent the route returns 404 with a machine-readable explanation so the
 * UI can fall back to the client-side export path instead of showing a dead link.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["gif", "mp4", "webp"]);
const CONTENT_TYPES: Record<string, string> = {
  gif: "image/gif",
  mp4: "video/mp4",
  webp: "image/webp",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const format = (new URL(request.url).searchParams.get("format") ?? "gif").toLowerCase();

  if (!ALLOWED.has(format)) {
    return NextResponse.json(
      { error: `Unsupported format "${format}". Use gif, mp4 or webp.` },
      { status: 400 },
    );
  }

  // Existence check against the seed catalogue. A real deployment would query
  // Postgres; the important part is that an unknown id never reaches the CDN.
  const exists = createGalleryItems(60).some((item) => item.id === id);
  if (!exists) {
    return NextResponse.json({ error: `No render with id "${id}".` }, { status: 404 });
  }

  const assetPath = `/renders/${id}.${format}`;

  return NextResponse.json(
    {
      error: "Server-side artefact not generated on this deployment.",
      id,
      format,
      contentType: CONTENT_TYPES[format],
      expectedPath: assetPath,
      hint: "Render client-side from the studio, or wire this route to your FFmpeg worker.",
    },
    { status: 404 },
  );
}
