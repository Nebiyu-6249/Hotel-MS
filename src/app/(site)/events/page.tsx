import type { Metadata } from "next";
import Image from "next/image";
import { IMAGES } from "@/lib/images";
import { EventInquiryForm } from "@/components/site/event-inquiry-form";
import { LedgerRule } from "@/components/site/ledger-rule";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Events and Weddings",
  description:
    "Weddings and private events at a restored Carpathian castle. The Great Hall seats 80 for dinner, the terrace holds 120 for a ceremony, and we host one wedding per weekend.",
};

const FACTS = [
  { value: "80", label: "seated in the Great Hall, under the original larch beams" },
  { value: "120", label: "standing on the terrace for a ceremony facing the valley" },
  { value: "26", label: "rooms, so the whole party sleeps under one roof" },
  { value: "1", label: "wedding per weekend. Yours, not yours plus two others" },
];

export default function EventsPage() {
  return (
    <>
      <PageHero
        eyebrow="Events and weddings"
        title="One castle, one celebration at a time"
        lede="We host a single wedding per weekend, so the house, the kitchen and the staff belong to your party from Friday to Sunday."
        image={IMAGES.eventsFlowers}
        imageAlt="A long dinner table dressed with flowers and candles"
      />

      <section className="py-16 md:py-24">
        <div className="site-container">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map((fact, index) => (
              <Reveal key={fact.value + fact.label} delay={index * 0.08}>
                <p className="font-display text-5xl font-medium text-brass">
                  {fact.value}
                </p>
                <p className="mt-2 font-sans text-[13px] leading-relaxed text-parchment-dim">
                  {fact.label}
                </p>
              </Reveal>
            ))}
          </div>

          <div className="mt-16 grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <Reveal className="relative aspect-[4/3] overflow-hidden border border-parchment/10">
              <Image
                src={IMAGES.eventsLongTable}
                alt="A long wooden table set for a celebration dinner"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </Reveal>
            <Reveal delay={0.15}>
              <p className="eyebrow">How it works</p>
              <h2 className="mt-3 font-display text-3xl font-medium leading-tight">
                Plainly priced, properly planned
              </h2>
              <p className="mt-4 font-sans text-[14px] leading-relaxed text-parchment-dim">
                You get one coordinator from first email to last dance, a
                kitchen that cooks the wedding dinner over the same fire as
                every other night, and a written quote with no lines you have
                to decode. Ceremonies happen on the terrace or, in weather, in
                the Great Hall. Music outdoors ends at midnight; the cellar
                bar does not.
              </p>
              <p className="mt-4 font-sans text-[14px] leading-relaxed text-parchment-dim">
                Corporate retreats and private dinners follow the same idea:
                the Great Hall seats 80, the library seats 14 around one table,
                and the whole house can be taken exclusively.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-parchment/10 bg-ink-soft py-16 md:py-24">
        <div className="site-container max-w-2xl">
          <Reveal>
            <p className="eyebrow text-center">Start the conversation</p>
            <h2 className="mt-3 text-center font-display text-3xl font-medium">
              Tell us about the day
            </h2>
            <LedgerRule className="mx-auto mt-6 w-40" />
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <EventInquiryForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
