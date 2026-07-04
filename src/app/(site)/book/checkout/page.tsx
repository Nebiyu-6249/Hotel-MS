import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { unitsAvailable } from "@/lib/availability";
import { buildQuote } from "@/lib/pricing";
import { getSettings, taxRatePercent } from "@/lib/settings";
import {
  formatDateLong,
  nightsBetween,
  parseDateParam,
  todayUtc,
} from "@/lib/utils";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const metadata: Metadata = {
  title: "Secure Checkout",
  robots: { index: false },
};

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const slug = param(searchParams.roomType);
  const checkInRaw = param(searchParams.checkIn);
  const checkOutRaw = param(searchParams.checkOut);
  const checkIn = parseDateParam(checkInRaw);
  const checkOut = parseDateParam(checkOutRaw);
  const adults = Math.min(Math.max(Number(param(searchParams.adults)) || 2, 1), 6);
  const children = Math.min(Math.max(Number(param(searchParams.children)) || 0, 0), 4);

  const today = todayUtc();
  if (
    !slug ||
    !checkIn ||
    !checkOut ||
    checkIn < today ||
    checkOut <= checkIn ||
    nightsBetween(checkIn, checkOut) > 21
  ) {
    redirect("/book");
  }

  const roomType = await prisma.roomType.findUnique({ where: { slug } });
  if (!roomType || !roomType.active) redirect("/book");

  const backQuery = new URLSearchParams({
    checkIn: checkInRaw!,
    checkOut: checkOutRaw!,
    adults: String(adults),
    children: String(children),
  }).toString();

  if (adults + children > roomType.maxGuests) redirect(`/book?${backQuery}`);

  const available = await unitsAvailable(roomType.id, checkIn, checkOut);
  if (available < 1) redirect(`/book?${backQuery}`);

  const [settings, rules, addOns] = await Promise.all([
    getSettings(),
    prisma.rateRule.findMany({
      where: { active: true, OR: [{ roomTypeId: null }, { roomTypeId: roomType.id }] },
    }),
    prisma.addOn.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const quote = buildQuote({
    roomType,
    checkIn,
    checkOut,
    rules,
    taxRatePercent: taxRatePercent(settings),
    guests: adults + children,
    catalog: [],
    selections: [],
  });

  return (
    <CheckoutFlow
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""}
      room={{
        slug: roomType.slug,
        name: roomType.name,
        image: roomType.images[0],
        sizeSqm: roomType.sizeSqm,
        bedConfig: roomType.bedConfig,
        view: roomType.view,
      }}
      stay={{
        checkIn: checkInRaw!,
        checkOut: checkOutRaw!,
        checkInLong: formatDateLong(checkIn),
        checkOutLong: formatDateLong(checkOut),
        nights: quote.nightCount,
        adults,
        children,
      }}
      pricing={{
        subtotalCents: quote.subtotalCents,
        taxRatePercent: quote.taxRatePercent,
      }}
      addOns={addOns.map((a) => ({
        slug: a.slug,
        name: a.name,
        description: a.description,
        priceCents: a.priceCents,
        pricing: a.pricing,
      }))}
      policy={settings.cancellation_policy}
      backHref={`/book?${backQuery}`}
    />
  );
}
