import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs of the rooms, the grounds, the restaurant and the Great Hall at Hotel Transylvania.",
};

export default async function GalleryPage() {
  const images = await prisma.galleryImage.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="The castle, honestly photographed"
        lede="No wide-angle tricks. The rooms, the table and the hills, the way you will find them."
      />
      <section className="py-14 md:py-20">
        <div className="site-container">
          <GalleryGrid
            items={images.map((img) => ({
              id: img.id,
              url: img.url,
              alt: img.alt,
              category: img.category,
            }))}
          />
        </div>
      </section>
    </>
  );
}
