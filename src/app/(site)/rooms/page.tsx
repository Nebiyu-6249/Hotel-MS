import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { IMAGES } from "@/lib/images";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { RoomCard } from "@/components/site/room-card";

export const metadata: Metadata = {
  title: "Rooms and Suites",
  description:
    "Five room types across 26 rooms: courtyard rooms, forest rooms, the Library Suite, the Tower Suite and the Carpathian Apartment. Live rates and direct booking.",
};

export default async function RoomsPage() {
  const rooms = await prisma.roomType.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <PageHero
        eyebrow="Rooms and suites"
        title="Twenty-six rooms, five characters"
        lede="Each room type keeps a different corner of the castle: the quiet courtyard wing, the forest face, the old study in the tower. All of them keep the walls, the beams and the stoves that were here first."
        image={IMAGES.roomDetail}
        imageAlt="A made bed with reading lamps in a stone-walled room"
      />
      <section className="py-16 md:py-24">
        <div className="site-container grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, index) => (
            <Reveal key={room.id} delay={(index % 3) * 0.08}>
              <RoomCard
                room={{
                  slug: room.slug,
                  name: room.name,
                  shortDescription: room.shortDescription,
                  sizeSqm: room.sizeSqm,
                  bedConfig: room.bedConfig,
                  view: room.view,
                  maxGuests: room.maxGuests,
                  baseRateCents: room.baseRateCents,
                  image: room.images[0] ?? IMAGES.roomDetail,
                }}
              />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
