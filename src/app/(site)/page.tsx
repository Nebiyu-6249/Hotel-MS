import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/site/json-ld";
import { LedgerRule } from "@/components/site/ledger-rule";
import { Reveal } from "@/components/site/reveal";
import { ReviewCard } from "@/components/site/review-card";
import { RoomCard } from "@/components/site/room-card";
import { SectionHeading } from "@/components/site/section-heading";

const WHY_STAY = [
  {
    label: "The building",
    title: "Stone that has seen 159 winters",
    body: "Built in 1867 as the summer residence of a Kronstadt timber merchant, restored between 2019 and 2021 by craftsmen from the valley. They relaid 11,000 clay roof tiles and rebuilt all 14 ceramic stoves. The oak staircase in the entrance hall is the original.",
  },
  {
    label: "The table",
    title: "Dinner from a wood-fired hearth",
    body: "Restaurant Vatra cooks over oak and beech embers. Venison and trout come from the valley, vegetables from two farms in the next village, and the wine list runs deep on Feteasca Neagra. Breakfast is laid out until half past ten.",
  },
  {
    label: "The setting",
    title: "Forest on three sides, silence on all four",
    body: "The castle sits on a beech-covered ridge at 740 meters, forty minutes into the hills above Brasov. Marked trails start at the gate. In winter the staff clear a path to the sledding slope and light the terrace braziers at dusk.",
  },
];

export default async function HomePage() {
  const [settings, rooms, reviews] = await Promise.all([
    getSettings(),
    prisma.roomType.findMany({
      where: { active: true, featured: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
    prisma.review.findMany({
      where: { status: "APPROVED", featured: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Hotel",
          name: settings.property_name,
          description:
            "A restored 1867 castle hotel in the Carpathian mountains above Brasov, Romania.",
          url: siteUrl,
          image: IMAGES.hero,
          telephone: settings.phone,
          email: settings.email,
          priceRange: "EUR 180 - EUR 520",
          checkinTime: settings.check_in_time,
          checkoutTime: settings.check_out_time,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Strada Castelului 1",
            addressLocality: "Magura",
            addressRegion: "Brasov County",
            postalCode: "507149",
            addressCountry: "RO",
          },
          geo: { "@type": "GeoCoordinates", latitude: 45.5412, longitude: 25.2755 },
          amenityFeature: [
            { "@type": "LocationFeatureSpecification", name: "Restaurant" },
            { "@type": "LocationFeatureSpecification", name: "Bar" },
            { "@type": "LocationFeatureSpecification", name: "Spa" },
            { "@type": "LocationFeatureSpecification", name: "Free parking" },
          ],
        }}
      />

      {/* Hero */}
      <section className="relative flex min-h-[560px] items-end overflow-hidden md:h-[82vh]">
        <div className="absolute inset-0 hero-zoom">
          <Image
            src={IMAGES.hero}
            alt="The castle above the treeline at dusk, with the Carpathian ridge behind"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10"
          aria-hidden
        />
        <div className="site-container relative pb-16 pt-40 md:pb-24">
          <Reveal>
            <p className="eyebrow">A castle hotel above Brasov, Romania</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-medium leading-[1.08] sm:text-5xl md:text-6xl">
              A castle in the Carpathians, kept warm since 1867
            </h1>
            <p className="mt-5 max-w-xl font-sans text-[15px] leading-relaxed text-parchment-dim">
              Twenty-six rooms behind meter-thick stone walls, forty minutes
              into the hills. Wood fires, long dinners, mountain air.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button asChild variant="brass" size="lg">
                <Link href="/book">Check Availability</Link>
              </Button>
              <Link
                href="/rooms"
                className="group flex items-center gap-1.5 font-sans text-[12px] uppercase tracking-[0.16em] text-parchment-dim transition-colors hover:text-parchment"
              >
                See the rooms
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Why stay */}
      <section className="py-20 md:py-28">
        <div className="site-container">
          <Reveal>
            <SectionHeading
              eyebrow="Why guests come back"
              title="Heritage first, comfort close behind"
              lede="The castle was never a theme. It is a working house with thick walls, warm rooms and people who remember your name at breakfast."
            />
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {WHY_STAY.map((item, index) => (
              <Reveal key={item.label} delay={index * 0.12}>
                <p className="eyebrow">{item.label}</p>
                <h3 className="mt-3 font-display text-2xl font-medium leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 font-sans text-[13px] leading-relaxed text-parchment-dim">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms teaser */}
      <section className="border-y border-parchment/10 bg-ink-soft py-20 md:py-28">
        <div className="site-container">
          <Reveal>
            <SectionHeading
              eyebrow="Rooms and suites"
              title="Five rooms, no two alike"
              lede="Every room keeps its original bones: beamed ceilings, deep window seats, a ceramic stove or an open fire. What changes is the view."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {rooms.map((room, index) => (
              <Reveal key={room.id} delay={index * 0.1}>
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
          <Reveal className="mt-10 text-center">
            <Link
              href="/rooms"
              className="group inline-flex items-center gap-1.5 font-sans text-[12px] uppercase tracking-[0.16em] text-brass"
            >
              See all rooms and suites
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Evening band */}
      <section className="py-20 md:py-28">
        <div className="site-container grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal className="relative aspect-[4/3] overflow-hidden border border-parchment/10">
            <Image
              src={IMAGES.roomLibrary1}
              alt="A guest reading in bed by lamplight"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal delay={0.15}>
            <p className="eyebrow">Evenings here</p>
            <h2 className="mt-3 font-display text-3xl font-medium leading-tight sm:text-4xl">
              The fires are lit at six
            </h2>
            <p className="mt-4 font-sans text-[14px] leading-relaxed text-parchment-dim">
              Dinner runs long at Vatra, then the house goes quiet. Guests
              drift to the library with a glass of Feteasca, or down to the
              cellar bar where the barman keeps forty Romanian wines and a
              short, serious list of plum brandies. Someone always claims the
              armchair nearest the hearth. Nobody hurries them.
            </p>
            <div className="mt-7 flex flex-wrap gap-5">
              <Button asChild variant="outline" size="md">
                <Link href="/dining">See dining</Link>
              </Button>
              <Button asChild variant="brass" size="md">
                <Link href="/book">Check Availability</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="border-y border-parchment/10 bg-ink-soft py-20 md:py-28">
          <div className="site-container">
            <Reveal>
              <SectionHeading
                eyebrow="From the guest book"
                title="What guests write on the way out"
              />
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {reviews.map((review, index) => (
                <Reveal key={review.id} delay={index * 0.1}>
                  <ReviewCard review={review} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location teaser */}
      <section className="py-20 md:py-28">
        <div className="site-container grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <p className="eyebrow">Getting here</p>
            <h2 className="mt-3 font-display text-3xl font-medium leading-tight sm:text-4xl">
              Close enough to reach, far enough to matter
            </h2>
            <p className="mt-4 font-sans text-[14px] leading-relaxed text-parchment-dim">
              Forty minutes by car from Brasov, two and a half hours from
              Bucharest airport, and the last three kilometers climb through
              beech forest on a paved lane. We arrange transfers, and the car
              park by the gatehouse is free for guests.
            </p>
            <address className="mt-6 font-sans text-[13px] not-italic leading-relaxed text-parchment-dim">
              {`Strada Castelului 1, Magura, Brasov County 507149, Romania`}
              <br />
              {`+40 368 566 210`}
            </address>
            <div className="mt-7">
              <Button asChild variant="outline">
                <Link href="/contact">Plan your route</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.15} className="relative aspect-[4/3] overflow-hidden border border-parchment/10">
            <Image
              src={IMAGES.exteriorRidge}
              alt="The castle seen from the valley road, ringed by forest"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-parchment/10 bg-ink-soft py-20 text-center md:py-24">
        <div className="site-container">
          <Reveal>
            <LedgerRule className="mx-auto mb-8 w-40" />
            <h2 className="font-display text-3xl font-medium sm:text-4xl">
              The mountains are patient. Your dates are not.
            </h2>
            <p className="mx-auto mt-4 max-w-md font-sans text-[14px] text-parchment-dim">
              Twenty-six rooms fill quickly on weekends and holidays. Booking
              direct always gets you our best rate.
            </p>
            <div className="mt-8">
              <Button asChild variant="brass" size="lg">
                <Link href="/book">Check Availability</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
