import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BedDouble, Check, Maximize, Mountain, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { unitsAvailable } from "@/lib/availability";
import { buildQuote } from "@/lib/pricing";
import { getSettings, taxRatePercent } from "@/lib/settings";
import {
  eur,
  formatDateShort,
  nightsBetween,
  parseDateParam,
  todayUtc,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { JsonLd } from "@/components/site/json-ld";
import { LedgerRule } from "@/components/site/ledger-rule";

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = await prisma.roomType.findUnique({ where: { slug: params.slug } });
  if (!room) return {};
  return { title: room.name, description: room.shortDescription };
}

export default async function RoomDetailPage({ params, searchParams }: Props) {
  const room = await prisma.roomType.findUnique({ where: { slug: params.slug } });
  if (!room || !room.active) notFound();

  const checkIn = parseDateParam(param(searchParams.checkIn));
  const checkOut = parseDateParam(param(searchParams.checkOut));
  const adults = Math.min(Math.max(Number(param(searchParams.adults)) || 2, 1), 6);
  const children = Math.min(Math.max(Number(param(searchParams.children)) || 0, 0), 4);

  const today = todayUtc();
  const hasValidDates = Boolean(
    checkIn &&
      checkOut &&
      checkIn >= today &&
      checkOut > checkIn &&
      nightsBetween(checkIn, checkOut) <= 21
  );
  const fitsParty = adults + children <= room.maxGuests;

  let quote = null;
  let available = 0;
  if (hasValidDates && checkIn && checkOut) {
    const [settings, rules] = await Promise.all([
      getSettings(),
      prisma.rateRule.findMany({
        where: {
          active: true,
          OR: [{ roomTypeId: null }, { roomTypeId: room.id }],
        },
      }),
    ]);
    quote = buildQuote({
      roomType: room,
      checkIn,
      checkOut,
      rules,
      taxRatePercent: taxRatePercent(settings),
      guests: adults + children,
      catalog: [],
      selections: [],
    });
    available = await unitsAvailable(room.id, checkIn, checkOut);
  }

  const bookQuery = new URLSearchParams();
  if (checkIn && checkOut && hasValidDates) {
    bookQuery.set("checkIn", param(searchParams.checkIn)!);
    bookQuery.set("checkOut", param(searchParams.checkOut)!);
    bookQuery.set("adults", String(adults));
    bookQuery.set("children", String(children));
  }
  const checkoutHref = `/book/checkout?roomType=${room.slug}&${bookQuery.toString()}`;

  const facts = [
    { icon: Maximize, label: `${room.sizeSqm} square meters` },
    { icon: BedDouble, label: room.bedConfig },
    { icon: Mountain, label: room.view },
    { icon: Users, label: `Sleeps ${room.maxGuests}` },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HotelRoom",
          name: room.name,
          description: room.shortDescription,
          bed: { "@type": "BedDetails", typeOfBed: room.bedConfig },
          occupancy: { "@type": "QuantitativeValue", maxValue: room.maxGuests },
          floorSize: {
            "@type": "QuantitativeValue",
            value: room.sizeSqm,
            unitCode: "MTK",
          },
        }}
      />
      <div className="site-container py-12 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-6 font-sans text-[12px] uppercase tracking-[0.16em] text-parchment-faint">
          <Link href="/rooms" className="hover:text-parchment">
            Rooms and suites
          </Link>{" "}
          / <span className="text-parchment-dim">{room.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
          <div>
            <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
              {room.name}
            </h1>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              {facts.map((fact) => (
                <li
                  key={fact.label}
                  className="flex items-center gap-2 font-sans text-[13px] text-parchment-dim"
                >
                  <fact.icon className="h-4 w-4 text-brass" aria-hidden />
                  {fact.label}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <GalleryGrid
                withTabs={false}
                items={room.images.map((url, index) => ({
                  id: `${room.slug}-${index}`,
                  url,
                  alt: `${room.name}, photo ${index + 1}`,
                  category: "ROOMS",
                }))}
              />
            </div>

            <div className="mt-10 max-w-2xl space-y-4">
              {room.description.split("\n\n").map((paragraph, index) => (
                <p
                  key={index}
                  className="font-sans text-[14px] leading-relaxed text-parchment-dim"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <LedgerRule className="my-10 w-40" />

            <h2 className="font-display text-2xl font-medium">In the room</h2>
            <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {room.amenities.map((amenity) => (
                <li
                  key={amenity}
                  className="flex items-start gap-2 font-sans text-[13px] text-parchment-dim"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass" aria-hidden />
                  {amenity}
                </li>
              ))}
            </ul>
          </div>

          {/* Price panel */}
          <aside className="h-fit lg:sticky lg:top-36">
            <div className="border border-parchment/15 bg-ink-soft p-6">
              {quote && hasValidDates && fitsParty && available > 0 && (
                <>
                  <p className="eyebrow">Your stay</p>
                  <p className="mt-3 font-sans text-[14px] text-parchment">
                    {formatDateShort(checkIn!)} to {formatDateShort(checkOut!)}
                    <span className="text-parchment-dim">
                      {" "}
                      &middot; {quote.nightCount} night
                      {quote.nightCount === 1 ? "" : "s"} &middot; {adults + children}{" "}
                      guest{adults + children === 1 ? "" : "s"}
                    </span>
                  </p>
                  <dl className="mt-5 space-y-2.5 border-t border-parchment/10 pt-5 font-sans text-[13px]">
                    <div className="flex justify-between text-parchment-dim">
                      <dt>
                        Room, {quote.nightCount} night
                        {quote.nightCount === 1 ? "" : "s"}
                      </dt>
                      <dd>{eur(quote.subtotalCents)}</dd>
                    </div>
                    <div className="flex justify-between text-parchment-dim">
                      <dt>VAT ({quote.taxRatePercent}%)</dt>
                      <dd>{eur(quote.taxCents)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-parchment/10 pt-3 text-[15px] text-parchment">
                      <dt>Total</dt>
                      <dd className="font-display text-xl">{eur(quote.totalCents)}</dd>
                    </div>
                  </dl>
                  {available <= 2 && (
                    <p className="mt-3 font-sans text-[12px] text-brass">
                      Only {available} left for these dates.
                    </p>
                  )}
                  <Button asChild variant="brass" size="lg" className="mt-5 w-full">
                    <Link href={checkoutHref}>Reserve This Room</Link>
                  </Button>
                  <p className="mt-3 text-center font-sans text-[11px] text-parchment-faint">
                    Add-ons like breakfast come next. Nothing is charged yet.
                  </p>
                </>
              )}

              {quote && hasValidDates && fitsParty && available < 1 && (
                <>
                  <p className="eyebrow">Your stay</p>
                  <p className="mt-3 font-sans text-[14px] leading-relaxed text-parchment-dim">
                    The {room.name} is sold out for {formatDateShort(checkIn!)} to{" "}
                    {formatDateShort(checkOut!)}. Try shifting your dates by a
                    day or two, or see what else is free.
                  </p>
                  <Button asChild variant="brass" size="lg" className="mt-5 w-full">
                    <Link href={`/book?${bookQuery.toString()}`}>
                      See available rooms
                    </Link>
                  </Button>
                </>
              )}

              {hasValidDates && !fitsParty && (
                <>
                  <p className="eyebrow">Party size</p>
                  <p className="mt-3 font-sans text-[14px] leading-relaxed text-parchment-dim">
                    This room sleeps up to {room.maxGuests}. For a party of{" "}
                    {adults + children}, the Carpathian Apartment or two
                    connecting rooms will suit better.
                  </p>
                  <Button asChild variant="brass" size="lg" className="mt-5 w-full">
                    <Link href={`/book?${bookQuery.toString()}`}>
                      See available rooms
                    </Link>
                  </Button>
                </>
              )}

              {!hasValidDates && (
                <>
                  <p className="eyebrow">Rates</p>
                  <p className="mt-3 font-sans text-[14px] text-parchment">
                    From{" "}
                    <span className="font-display text-2xl">
                      {eur(room.baseRateCents)}
                    </span>{" "}
                    <span className="text-parchment-dim">a night</span>
                  </p>
                  <p className="mt-3 font-sans text-[13px] leading-relaxed text-parchment-dim">
                    Pick your dates in the bar above to see the exact price for
                    your stay, taxes included.
                  </p>
                  <Button asChild variant="brass" size="lg" className="mt-5 w-full">
                    <Link href={`/book?roomType=${room.slug}`}>
                      Check Availability
                    </Link>
                  </Button>
                </>
              )}
            </div>
            <p className="mt-4 text-center font-sans text-[11px] leading-relaxed text-parchment-faint">
              Free cancellation until 7 days before check-in.{" "}
              <Link href="/policies" className="underline underline-offset-2">
                Full policy
              </Link>
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}
