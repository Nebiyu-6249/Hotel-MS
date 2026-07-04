import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { LedgerRule } from "@/components/site/ledger-rule";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Built in 1867 as a timber merchant's summer residence, abandoned twice, and restored between 2019 and 2021 by craftsmen from the valley. This is the castle's story.",
};

const TIMELINE = [
  {
    year: "1867",
    text: "A Kronstadt timber merchant builds a summer residence on the ridge: forty rooms, meter-thick walls, and a tower for his study.",
  },
  {
    year: "1911",
    text: "The east wing gains its ceramic stoves, tiled in green by a workshop in Sighisoara. Twelve of the fourteen survive today.",
  },
  {
    year: "1948",
    text: "Nationalized. The house serves as a forestry school, then a sanatorium, then stands empty. The roof holds; little else does.",
  },
  {
    year: "2017",
    text: "The current owners buy the property from the county and spend two years just studying it before touching a wall.",
  },
  {
    year: "2019 to 2021",
    text: "The restoration: 11,000 clay roof tiles relaid, the oak staircase repaired plank by plank, the forty rooms remade as twenty-six so each one got a proper bathroom and honest proportions.",
  },
  {
    year: "2021",
    text: "The first guests arrive in October. The fires have been lit at six every evening since.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="A house that refused to fall down"
        lede="The castle survived two abandonments, one war and forty years as state property. What it needed was not rescue. It needed a use."
        image={IMAGES.exteriorFacade}
        imageAlt="The castle facade in afternoon light"
      />

      <section className="py-16 md:py-24">
        <div className="site-container grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
          <div className="max-w-2xl space-y-5">
            <Reveal>
              <p className="font-sans text-[15px] leading-relaxed text-parchment-dim">
                The merchant who built this house made his money floating
                timber down the Olt. He wanted somewhere cool in summer, close
                to the forests he bought from, far from the noise of Kronstadt,
                as Brasov was called then. So in 1867 he put up a house with
                walls a meter thick, a tower to work in, and a courtyard his
                grandchildren could not escape from before dinner.
              </p>
            </Reveal>
            <Reveal>
              <p className="font-sans text-[15px] leading-relaxed text-parchment-dim">
                The twentieth century was less kind. The family lost the house
                in 1948, and for four decades it served whichever institution
                needed a roof: a forestry school, a sanatorium, storage.
                By the 1990s it stood empty, and stayed that way for
                twenty-five years. The roof, remarkably, held.
              </p>
            </Reveal>
            <Reveal>
              <p className="font-sans text-[15px] leading-relaxed text-parchment-dim">
                The restoration took as long as the construction did. Masons
                from two villages repointed the stone with lime mortar mixed
                the old way. A retired joiner from Rasnov spent a winter on
                the oak staircase alone. The fourteen ceramic stoves were
                taken apart tile by tile, numbered, and rebuilt with new
                flues behind their 1911 faces. Where the house had forty small
                rooms, it now has twenty-six honest ones.
              </p>
            </Reveal>
            <Reveal>
              <p className="font-sans text-[15px] leading-relaxed text-parchment-dim">
                People ask about the name. Transylvania is simply where the
                castle stands, and the region deserves better than its
                reputation. What you will find here is what was always here:
                stone, forest, wood smoke and long dinners. The rest is
                fiction.
              </p>
            </Reveal>
          </div>

          <Reveal className="space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden border border-parchment/10">
              <Image
                src={IMAGES.stoneLane}
                alt="The stone lane along the outer wall"
                fill
                sizes="(max-width: 1024px) 100vw, 380px"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden border border-parchment/10">
              <Image
                src={IMAGES.stoneWall}
                alt="The outer wall with the mountains behind"
                fill
                sizes="(max-width: 1024px) 100vw, 380px"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-parchment/10 bg-ink-soft py-16 md:py-24">
        <div className="site-container max-w-2xl">
          <Reveal>
            <p className="eyebrow text-center">The short version</p>
            <h2 className="mt-3 text-center font-display text-3xl font-medium">
              159 years in six lines
            </h2>
            <LedgerRule className="mx-auto mt-6 w-40" />
          </Reveal>
          <ol className="mt-10 space-y-6">
            {TIMELINE.map((item, index) => (
              <Reveal key={item.year} delay={index * 0.05}>
                <li className="flex gap-6">
                  <span className="w-24 shrink-0 font-display text-xl text-brass">
                    {item.year}
                  </span>
                  <p className="font-sans text-[14px] leading-relaxed text-parchment-dim">
                    {item.text}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-12 text-center">
            <Button asChild variant="brass" size="lg">
              <Link href="/book">Check Availability</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}
