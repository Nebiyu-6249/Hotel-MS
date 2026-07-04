import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/images";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { LedgerRule } from "@/components/site/ledger-rule";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Dining",
  description:
    "Restaurant Vatra cooks over a wood-fired hearth: valley venison, river trout and Feteasca Neagra. The Cellar Bar pours forty Romanian wines until midnight.",
};

const MENU = [
  { course: "To start", dish: "Smoked trout, celeriac, dill oil", price: "9" },
  { course: "To start", dish: "Roast beetroot, telemea cheese, walnuts", price: "8" },
  { course: "Main", dish: "Red deer loin, smoked plum, mamaliga", price: "26" },
  { course: "Main", dish: "Whole river trout, brown butter, spring greens", price: "22" },
  { course: "Main", dish: "Cabbage rolls the long way, 6 hours in the oven", price: "18" },
  { course: "To finish", dish: "Papanasi with sour cherries", price: "8" },
];

export default async function DiningPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHero
        eyebrow="Dining"
        title="One hearth, one long evening"
        lede="Restaurant Vatra is named for the Romanian word for hearth, and it means it. Almost everything crosses the wood fire on its way to the table."
        image={IMAGES.diningCandles}
        imageAlt="A candlelit dinner table laid for two"
      />

      {/* Restaurant Vatra */}
      <section className="py-16 md:py-24">
        <div className="site-container grid items-start gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <p className="eyebrow">Restaurant Vatra</p>
            <h2 className="mt-3 font-display text-3xl font-medium leading-tight">
              Cooking from the valley, over oak and beech
            </h2>
            <p className="mt-4 font-sans text-[14px] leading-relaxed text-parchment-dim">
              The kitchen buys whole animals from licensed hunters in the
              valley, trout from a cold-water farm twenty minutes downhill, and
              vegetables from two families in the next village. The menu is
              short and changes with what arrives. The wine list does not
              hurry either: it runs deep on Feteasca Neagra and old-vine
              whites from Dealu Mare.
            </p>
            <dl className="mt-6 space-y-1.5 font-sans text-[13px] text-parchment-dim">
              <div className="flex gap-4">
                <dt className="w-24 text-parchment-faint">Breakfast</dt>
                <dd>7:30 to 10:30, included with most rates</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-24 text-parchment-faint">Dinner</dt>
                <dd>18:30 to 22:00, last orders 21:30</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-24 text-parchment-faint">Tables</dt>
                <dd>
                  Held for house guests until 19:00. Outside guests are welcome
                  by phone: {settings.phone}
                </dd>
              </div>
            </dl>
          </Reveal>
          <Reveal delay={0.15} className="relative aspect-[4/3] overflow-hidden border border-parchment/10">
            <Image
              src={IMAGES.diningDish}
              alt="A plated main course beside a glass of red wine"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* Menu highlights */}
      <section className="border-y border-parchment/10 bg-ink-soft py-16 md:py-24">
        <div className="site-container max-w-2xl">
          <Reveal>
            <p className="eyebrow text-center">From a recent menu</p>
            <h2 className="mt-3 text-center font-display text-3xl font-medium">
              What the fire sent out last week
            </h2>
            <LedgerRule className="mx-auto mt-6 w-40" />
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="mt-10 space-y-4">
              {MENU.map((item) => (
                <li
                  key={item.dish}
                  className="flex items-baseline justify-between gap-4 border-b border-parchment/10 pb-4"
                >
                  <div>
                    <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-parchment-faint">
                      {item.course}
                    </p>
                    <p className="mt-1 font-display text-lg text-parchment">
                      {item.dish}
                    </p>
                  </div>
                  <p className="font-sans text-[13px] text-parchment-dim">
                    &euro;{item.price}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center font-sans text-[12px] text-parchment-faint">
              Sample dishes; the menu changes with the season and the hunt.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Cellar bar */}
      <section className="py-16 md:py-24">
        <div className="site-container grid items-start gap-10 md:grid-cols-2 md:gap-16">
          <Reveal className="relative order-2 aspect-[4/3] overflow-hidden border border-parchment/10 md:order-1">
            <Image
              src={IMAGES.barGlass}
              alt="A glass of plum brandy on the bar"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal delay={0.15} className="order-1 md:order-2">
            <p className="eyebrow">The Cellar Bar</p>
            <h2 className="mt-3 font-display text-3xl font-medium leading-tight">
              Forty wines, one fireplace, no music after eleven
            </h2>
            <p className="mt-4 font-sans text-[14px] leading-relaxed text-parchment-dim">
              The bar keeps to the vaulted cellar under the east wing. Radu,
              who has run it since the reopening, pours Romanian wine by the
              glass, keeps a short and serious list of plum brandies, and will
              make you exactly one cocktail: whichever one you ask for. Open
              16:00 to midnight.
            </p>
            <div className="mt-7">
              <Button asChild variant="brass">
                <Link href="/book">Check Availability</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
