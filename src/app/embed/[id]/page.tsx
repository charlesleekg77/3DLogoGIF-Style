import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createGalleryItems } from "@/data/gallery";
import { EmbedPlayer } from "@/components/gallery/EmbedPlayer";

/**
 * /embed/[id] — the iframe target offered by the gallery modal.
 *
 * Kept deliberately bare: no header, no footer, no analytics, transparent
 * background, so dropping it into someone else's page does not import this
 * site's chrome. `X-Frame-Options` is intentionally *not* set for this route so
 * third parties can frame it.
 */

export const metadata: Metadata = {
  title: "3D logo embed",
  robots: { index: false, follow: false },
};

export default async function EmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = createGalleryItems(60).find((entry) => entry.id === id);
  if (!item) notFound();

  return (
    <div className="grid min-h-screen place-items-center bg-transparent p-2">
      <EmbedPlayer item={item} />
    </div>
  );
}
