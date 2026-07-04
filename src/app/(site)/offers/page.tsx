import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PackageCard } from "@/components/site/package-card";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Offers and Packages",
  description:
    "Seasonal offers and packages at Hotel Transylvania: winter firelight stays, honeymoons in the hills and the chef's table package.",
};

export default async function OffersPage() {
  const packages = await prisma.package.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <PageHero
        eyebrow="Offers and packages"
        title="A few good reasons to stay longer"
        lede="Each package bundles a room with the things guests ask for most, priced plainly. Book the room online and mention the package, or call and we will set the whole thing up."
      />
      <section className="py-16 md:py-24">
        <div className="site-container grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pack, index) => (
            <Reveal key={pack.id} delay={(index % 3) * 0.08}>
              <PackageCard
                pack={{
                  slug: pack.slug,
                  name: pack.name,
                  tagline: pack.tagline,
                  description: pack.description,
                  inclusions: pack.inclusions,
                  priceCents: pack.priceCents,
                  priceNote: pack.priceNote,
                  image: pack.image,
                }}
              />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
