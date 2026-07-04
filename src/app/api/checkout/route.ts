import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createBooking, SoldOutError } from "@/lib/booking";
import { buildQuote } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings, taxRatePercent } from "@/lib/settings";
import { stripe } from "@/lib/stripe";
import { nightsBetween, parseDateParam, todayUtc } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validation";

export const runtime = "nodejs";

// Creates the booking hold and the Stripe PaymentIntent. Every number here
// is recomputed server-side; the client's displayed totals are cosmetic.
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`checkout:${ip}`, 10, 10 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts from this connection. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const checkIn = parseDateParam(input.checkIn);
  const checkOut = parseDateParam(input.checkOut);
  const today = todayUtc();
  if (
    !checkIn ||
    !checkOut ||
    checkIn < today ||
    checkOut <= checkIn ||
    nightsBetween(checkIn, checkOut) > 21
  ) {
    return NextResponse.json(
      {
        error:
          "Those dates do not work. Check-in must be today or later, and stays run up to 21 nights.",
      },
      { status: 400 }
    );
  }

  const roomType = await prisma.roomType.findUnique({
    where: { slug: input.roomTypeSlug },
  });
  if (!roomType || !roomType.active) {
    return NextResponse.json({ error: "That room no longer exists." }, { status: 404 });
  }
  if (input.adults + input.children > roomType.maxGuests) {
    return NextResponse.json(
      { error: `The ${roomType.name} sleeps up to ${roomType.maxGuests} guests.` },
      { status: 400 }
    );
  }

  const [settings, rules, catalog] = await Promise.all([
    getSettings(),
    prisma.rateRule.findMany({
      where: { active: true, OR: [{ roomTypeId: null }, { roomTypeId: roomType.id }] },
    }),
    prisma.addOn.findMany({ where: { active: true } }),
  ]);

  const quote = buildQuote({
    roomType,
    checkIn,
    checkOut,
    rules,
    taxRatePercent: taxRatePercent(settings),
    guests: input.adults + input.children,
    catalog,
    selections: input.addOns,
  });
  const addOnIdBySlug = new Map(catalog.map((a) => [a.slug, a.id]));

  try {
    const booking = await createBooking({
      roomTypeId: roomType.id,
      checkIn,
      checkOut,
      adults: input.adults,
      children: input.children,
      guest: {
        firstName: input.guest.firstName,
        lastName: input.guest.lastName,
        email: input.guest.email,
        phone: input.guest.phone || undefined,
        country: input.guest.country || undefined,
        marketingConsent: input.guest.marketingConsent,
      },
      quote,
      addOnIdBySlug,
      specialRequests: input.specialRequests || undefined,
    });

    const intent = await stripe.paymentIntents.create({
      amount: booking.totalCents,
      currency: "eur",
      receipt_email: booking.guest.email,
      description: `${roomType.name}, ${input.checkIn} to ${input.checkOut} (${booking.reference})`,
      metadata: { bookingReference: booking.reference },
      automatic_payment_methods: { enabled: true },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripePaymentIntentId: intent.id },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      reference: booking.reference,
      totalCents: booking.totalCents,
    });
  } catch (error) {
    if (error instanceof SoldOutError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[checkout]", error);
    return NextResponse.json(
      { error: "Could not start the payment. Nothing was charged; please try again." },
      { status: 500 }
    );
  }
}
