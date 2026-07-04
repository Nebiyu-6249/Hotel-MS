import { Prisma, type BookingSource, type BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { unitsAvailable } from "@/lib/availability";
import type { Quote } from "@/lib/pricing";
import { stripe } from "@/lib/stripe";
import {
  sendAdminNewBooking,
  sendBookingCancelled,
  sendBookingConfirmation,
} from "@/lib/emails";

export class SoldOutError extends Error {
  constructor() {
    super("No rooms of this type are left for those dates.");
    this.name = "SoldOutError";
  }
}

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    roomType: true;
    guest: true;
    addOns: { include: { addOn: true } };
  };
}>;

// Crockford-style alphabet: no 0/O/1/I/L, so references survive being read
// over the phone at the front desk.
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateReference(): string {
  let ref = "HT-";
  for (let i = 0; i < 6; i++) {
    ref += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return ref;
}

export async function createBooking(params: {
  roomTypeId: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    country?: string;
    marketingConsent: boolean;
  };
  quote: Quote;
  addOnIdBySlug: Map<string, string>;
  source?: BookingSource;
  status?: Extract<BookingStatus, "PENDING" | "CONFIRMED">;
  specialRequests?: string;
}): Promise<BookingWithRelations> {
  return prisma.$transaction(async (tx) => {
    // Serialize concurrent bookings for the same room type. The row lock makes
    // the availability check and the insert atomic, which is what actually
    // prevents overbooking under concurrent checkouts.
    await tx.$queryRaw`SELECT id FROM "RoomType" WHERE id = ${params.roomTypeId} FOR UPDATE`;

    const available = await unitsAvailable(
      params.roomTypeId,
      params.checkIn,
      params.checkOut,
      tx
    );
    if (available < 1) throw new SoldOutError();

    const email = params.guest.email.toLowerCase().trim();
    const guest = await tx.guest.upsert({
      where: { email },
      update: {
        firstName: params.guest.firstName,
        lastName: params.guest.lastName,
        phone: params.guest.phone || undefined,
        country: params.guest.country || undefined,
        marketingConsent: params.guest.marketingConsent,
      },
      create: {
        email,
        firstName: params.guest.firstName,
        lastName: params.guest.lastName,
        phone: params.guest.phone || null,
        country: params.guest.country || null,
        marketingConsent: params.guest.marketingConsent,
      },
    });

    // Retry on the astronomically unlikely reference collision.
    for (let attempt = 0; attempt < 3; attempt++) {
      const reference = generateReference();
      try {
        return await tx.booking.create({
          data: {
            reference,
            roomTypeId: params.roomTypeId,
            guestId: guest.id,
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            adults: params.adults,
            children: params.children,
            status: params.status ?? "PENDING",
            source: params.source ?? "WEBSITE",
            nightlyRates: params.quote.nights as unknown as Prisma.InputJsonValue,
            subtotalCents: params.quote.subtotalCents,
            addOnsCents: params.quote.addOnsCents,
            taxCents: params.quote.taxCents,
            totalCents: params.quote.totalCents,
            specialRequests: params.specialRequests || null,
            addOns: {
              create: params.quote.addOns
                .filter((a) => params.addOnIdBySlug.has(a.slug))
                .map((a) => ({
                  addOnId: params.addOnIdBySlug.get(a.slug)!,
                  quantity: a.quantity,
                  totalCents: a.totalCents,
                })),
            },
          },
          include: {
            roomType: true,
            guest: true,
            addOns: { include: { addOn: true } },
          },
        });
      } catch (error) {
        const isRefCollision =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          attempt < 2;
        if (!isRefCollision) throw error;
      }
    }
    throw new Error("Could not generate a unique booking reference.");
  });
}

// Idempotent: safe to call from both the Stripe webhook and the confirmation
// page fallback. Emails go out exactly once, on the PENDING to CONFIRMED
// transition.
export async function confirmBooking(reference: string): Promise<boolean> {
  const updated = await prisma.booking.updateMany({
    where: { reference, status: "PENDING" },
    data: { status: "CONFIRMED" },
  });
  if (updated.count === 0) return false;

  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { roomType: true, guest: true, addOns: { include: { addOn: true } } },
  });
  if (booking) {
    // Fire and forget. A failed email must never fail a paid booking.
    void sendBookingConfirmation(booking).catch((error) =>
      console.error("[email] confirmation failed", error)
    );
    void sendAdminNewBooking(booking).catch((error) =>
      console.error("[email] admin alert failed", error)
    );
  }
  return true;
}

// Releases inventory held by an unpaid booking (e.g. after a failed payment).
export async function releasePendingBooking(reference: string, reason: string) {
  await prisma.booking.updateMany({
    where: { reference, status: "PENDING" },
    data: { status: "CANCELLED", cancellationReason: reason, cancelledAt: new Date() },
  });
}

export async function cancelBooking(params: {
  bookingId: string;
  reason: string;
  refund: boolean;
}): Promise<BookingWithRelations | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { roomType: true, guest: true, addOns: { include: { addOn: true } } },
  });
  if (!booking) return null;
  if (booking.status === "CANCELLED" || booking.status === "CHECKED_OUT") {
    return booking;
  }

  if (params.refund && booking.stripePaymentIntentId) {
    try {
      await stripe.refunds.create({
        payment_intent: booking.stripePaymentIntentId,
      });
    } catch (error) {
      // Surface but do not block the cancellation; the refund can be retried
      // from the Stripe dashboard with the payment intent on the booking.
      console.error(`[stripe] refund failed for ${booking.reference}`, error);
    }
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancellationReason: params.reason,
      cancelledAt: new Date(),
    },
    include: { roomType: true, guest: true, addOns: { include: { addOn: true } } },
  });

  void sendBookingCancelled(updated).catch((error) =>
    console.error("[email] cancellation email failed", error)
  );

  return updated;
}
