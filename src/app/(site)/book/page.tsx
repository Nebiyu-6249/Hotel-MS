import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { unitsAvailable } from "@/lib/availability";
import { buildQuote } from "@/lib/pricing";
import { getSettings, taxRatePercent } from "@/lib/settings";
import {
  eur,
  formatDateLong,
  nightsBetween,
  parseDateParam,
  todayUtc,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookingWidget } from "@/components/site/booking-widget";
import { LedgerRule } from "@/components/site/ledger-rule";

export const metadata: Metadata = {
  title: "Check Availability",
  description:
    "Search live availability and rates at Hotel Transylvania. Taxes shown up front, best rate when you book direct.",
};

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function BookPage({ searchParams }: Props) {
  const checkIn = parseDateParam(param(searchParams.checkIn));
  const checkOut = parseDateParam(param(searchParams.checkOut));
  const adults = Math.min(Math.max(Number(param(searchParams.adults)) || 2, 1), 6);
  const children = Math.min(Math.max(Number(param(searchParams.children)) || 0, 0), 4);
  const roomTypeFilter = param(searchParams.roomType);

  const today = todayUtc();
  const validDates = Boolean(
    checkIn &&
      checkOut &&
      checkIn >= today &&
      checkOut > checkIn &&
      nightsBetween(checkIn, checkOut) <= 21
  );

  const roomTypes = await prisma.roomType.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true },
  });

  // No usable dates yet: ask for them, front and center.
  if (!validDates || !checkIn || !checkOut) {
    return (
      <section className="py-20 md:py-28">
        <div className="site-container max-w-lg">
          <p className="eyebrow text-center">Book your stay</p>
          <h1 className="mt-3 text-center font-display text-4xl font-medium">
            When are you coming?
          </h1>
          <p className="mt-4 text-center font-sans text-[14px] text-parchment-dim">
            Pick your dates and party size. Prices come back with taxes
            included and the cancellation policy shown before you pay.
          </p>
          <LedgerRule className="mx-auto mt-8 w-40" />
          <div className="mt-10">
            <BookingWidget roomTypes={roomTypes} layout="stacked" />
          </div>
        </div>
      </section>
    );
  }

  const nights = nightsBetween(checkIn, checkOut);
  const guests = adults + children;

  const [settings, rules, allTypes] = await Promise.all([
    getSettings(),
    prisma.rateRule.findMany({ where: { active: true } }),
    prisma.roomType.findMany({
      where: {
        active: true,
        ...(roomTypeFilter ? { slug: roomTypeFilter } : {}),
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const taxPercent = taxRatePercent(settings);

  const results = await Promise.all(
    allTypes.map(async (roomType) => {
      const available = await unitsAvailable(roomType.id, checkIn, checkOut);
      const quote = buildQuote({
        roomType,
        checkIn,
        checkOut,
        rules,
        taxRatePercent: taxPercent,
        guests,
        catalog: [],
        selections: [],
      });
      return { roomType, available, quote };
    })
  );

  const sorted = [
    ...results.filter((r) => r.available > 0 && guests <= r.roomType.maxGuests),
    ...results.filter((r) => r.available > 0 && guests > r.roomType.maxGuests),
    ...results.filter((r) => r.available < 1),
  ];

  const baseQuery = new URLSearchParams({
    checkIn: param(searchParams.checkIn)!,
    checkOut: param(searchParams.checkOut)!,
    adults: String(adults),
    children: String(children),
  });

  return (
    <section className="py-12 md:py-16">
      <div className="site-container">
        <p className="eyebrow">Availability</p>
        <h1 className="mt-2 font-display text-3xl font-medium sm:text-4xl">
          {formatDateLong(checkIn)} to {formatDateLong(checkOut)}
        </h1>
        <p className="mt-2 font-sans text-[13px] text-parchment-dim">
          {nights} night{nights === 1 ? "" : "s"} &middot; {adults} adult
          {adults === 1 ? "" : "s"}
          {children > 0
            ? `, ${children} ${children === 1 ? "child" : "children"}`
            : ""}{" "}
          &middot; prices include VAT ({settings.tax_rate_percent}%) &middot;{" "}
          change dates in the bar above
        </p>

        {roomTypeFilter && (
          <p className="mt-4 font-sans text-[13px] text-parchment-dim">
            Showing one room type.{" "}
            <Link
              href={`/book?${baseQuery.toString()}`}
              className="text-brass underline underline-offset-2"
            >
              See all rooms for these dates
            </Link>
          </p>
        )}

        <div className="mt-10 space-y-5">
          {sorted.map(({ roomType, available, quote }) => {
            const soldOut = available < 1;
            const tooSmall = guests > roomType.maxGuests;
            const checkoutHref = `/book/checkout?roomType=${roomType.slug}&${baseQuery.toString()}`;
            const detailHref = `/rooms/${roomType.slug}?${baseQuery.toString()}`;
            return (
              <article
                key={roomType.id}
                className={`grid gap-0 border border-parchment/10 bg-ink-soft md:grid-cols-[280px_minmax(0,1fr)_240px] ${
                  soldOut ? "opacity-60" : ""
                }`}
              >
                <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[190px]">
                  <Image
                    src={roomType.images[0]}
                    alt={`${roomType.name} at Hotel Transylvania`}
                    fill
                    sizes="(max-width: 768px) 100vw, 280px"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h2 className="font-display text-2xl font-medium">
                    <Link href={detailHref} className="hover:text-brass">
                      {roomType.name}
                    </Link>
                  </h2>
                  <p className="mt-1 font-sans text-[11px] uppercase tracking-[0.2em] text-parchment-faint">
                    {roomType.sizeSqm} m&sup2; &middot; {roomType.bedConfig}{" "}
                    &middot; {roomType.view} &middot; sleeps {roomType.maxGuests}
                  </p>
                  <p className="mt-3 font-sans text-[13px] leading-relaxed text-parchment-dim">
                    {roomType.shortDescription}
                  </p>
                  <Link
                    href={detailHref}
                    className="mt-3 inline-block font-sans text-[12px] uppercase tracking-[0.14em] text-brass underline-offset-4 hover:underline"
                  >
                    Room details and photos
                  </Link>
                </div>
                <div className="flex flex-col justify-center border-t border-parchment/10 p-6 md:border-l md:border-t-0">
                  {soldOut ? (
                    <p className="font-sans text-[13px] text-parchment-dim">
                      Sold out for these dates. Shifting by a day or two often
                      helps.
                    </p>
                  ) : tooSmall ? (
                    <p className="font-sans text-[13px] text-parchment-dim">
                      Sleeps up to {roomType.maxGuests}; your party is {guests}.
                    </p>
                  ) : (
                    <>
                      <p className="font-sans text-[12px] text-parchment-faint">
                        {eur(Math.round(quote.subtotalCents / nights))} a night
                        average
                      </p>
                      <p className="mt-1 font-display text-3xl text-parchment">
                        {eur(quote.totalCents)}
                      </p>
                      <p className="font-sans text-[12px] text-parchment-faint">
                        total for {nights} night{nights === 1 ? "" : "s"}, VAT
                        included
                      </p>
                      {available <= 2 && (
                        <p className="mt-2 font-sans text-[12px] text-brass">
                          Only {available} left
                        </p>
                      )}
                      <Button asChild variant="brass" className="mt-4">
                        <Link href={checkoutHref}>Reserve This Room</Link>
                      </Button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-8 font-sans text-[12px] text-parchment-faint">
          {settings.best_rate_note} Payment is taken securely by Stripe on the
          next step; the cancellation policy is shown in full before you pay.
        </p>
      </div>
    </section>
  );
}
