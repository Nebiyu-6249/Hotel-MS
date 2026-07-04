import type { AddOn, RateRule, RoomType } from "@prisma/client";
import { addDaysUtc, nightsBetween, toDateString } from "@/lib/utils";

export type NightlyRate = { date: string; rateCents: number };
export type AddOnSelection = { slug: string; quantity: number };

type PricedRoomType = Pick<RoomType, "id" | "baseRateCents">;

// Highest priority rule covering the night wins. On a priority tie, a rule
// scoped to this room type beats a property-wide rule.
export function nightlyRateFor(
  roomType: PricedRoomType,
  date: Date,
  rules: RateRule[]
): number {
  const applicable = rules.filter(
    (r) =>
      r.active &&
      (r.roomTypeId === null || r.roomTypeId === roomType.id) &&
      date >= r.startDate &&
      date <= r.endDate
  );
  if (applicable.length === 0) return roomType.baseRateCents;
  applicable.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return (b.roomTypeId ? 1 : 0) - (a.roomTypeId ? 1 : 0);
  });
  const rule = applicable[0];
  if (rule.kind === "FIXED") return rule.value;
  return Math.round((roomType.baseRateCents * rule.value) / 100);
}

export function nightlyRates(
  roomType: PricedRoomType,
  checkIn: Date,
  checkOut: Date,
  rules: RateRule[]
): NightlyRate[] {
  const nights = nightsBetween(checkIn, checkOut);
  const out: NightlyRate[] = [];
  for (let i = 0; i < nights; i++) {
    const date = addDaysUtc(checkIn, i);
    out.push({
      date: toDateString(date),
      rateCents: nightlyRateFor(roomType, date, rules),
    });
  }
  return out;
}

export function addOnTotal(
  addOn: Pick<AddOn, "priceCents" | "pricing">,
  quantity: number,
  nights: number,
  guests: number
): number {
  switch (addOn.pricing) {
    case "PER_BOOKING":
      return addOn.priceCents * quantity;
    case "PER_NIGHT":
      return addOn.priceCents * nights * quantity;
    case "PER_GUEST":
      return addOn.priceCents * guests * quantity;
    case "PER_GUEST_NIGHT":
      return addOn.priceCents * guests * nights * quantity;
  }
}

export type QuoteAddOn = {
  slug: string;
  name: string;
  quantity: number;
  totalCents: number;
};

export type Quote = {
  nights: NightlyRate[];
  nightCount: number;
  subtotalCents: number;
  addOns: QuoteAddOn[];
  addOnsCents: number;
  taxRatePercent: number;
  taxCents: number;
  totalCents: number;
};

// The single source of truth for what a stay costs. The checkout API rebuilds
// the quote server-side from the same inputs, so a tampered client can never
// change what Stripe charges.
export function buildQuote(params: {
  roomType: PricedRoomType;
  checkIn: Date;
  checkOut: Date;
  rules: RateRule[];
  taxRatePercent: number;
  guests: number;
  catalog: AddOn[];
  selections: AddOnSelection[];
}): Quote {
  const nights = nightlyRates(
    params.roomType,
    params.checkIn,
    params.checkOut,
    params.rules
  );
  const nightCount = nights.length;
  const subtotalCents = nights.reduce((sum, n) => sum + n.rateCents, 0);

  const addOns: QuoteAddOn[] = [];
  for (const sel of params.selections) {
    const addOn = params.catalog.find((a) => a.slug === sel.slug && a.active);
    if (!addOn) continue;
    const quantity = Math.min(Math.max(sel.quantity, 1), 5);
    addOns.push({
      slug: addOn.slug,
      name: addOn.name,
      quantity,
      totalCents: addOnTotal(addOn, quantity, nightCount, params.guests),
    });
  }
  const addOnsCents = addOns.reduce((sum, a) => sum + a.totalCents, 0);
  const taxCents = Math.round(
    ((subtotalCents + addOnsCents) * params.taxRatePercent) / 100
  );

  return {
    nights,
    nightCount,
    subtotalCents,
    addOns,
    addOnsCents,
    taxRatePercent: params.taxRatePercent,
    taxCents,
    totalCents: subtotalCents + addOnsCents + taxCents,
  };
}
