import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { confirmBooking, releasePendingBooking } from "@/lib/booking";
import { getSettings } from "@/lib/settings";
import { stripe } from "@/lib/stripe";
import { eur, formatDateLong } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LedgerRule } from "@/components/site/ledger-rule";

export const metadata: Metadata = {
  title: "Booking Confirmation",
  robots: { index: false },
};

const INCLUDE = {
  roomType: true,
  guest: true,
  addOns: { include: { addOn: true } },
} as const;

export default async function ConfirmationPage({
  params,
}: {
  params: { reference: string };
}) {
  const reference = params.reference.toUpperCase();
  let booking = await prisma.booking.findUnique({
    where: { reference },
    include: INCLUDE,
  });
  if (!booking) notFound();

  // Webhook-independent fallback: if Stripe has not called back yet (or the
  // webhook is not wired in this environment), ask Stripe directly. The
  // confirm step is idempotent, so racing the webhook is harmless.
  if (booking.status === "PENDING" && booking.stripePaymentIntentId) {
    try {
      const intent = await stripe.paymentIntents.retrieve(
        booking.stripePaymentIntentId
      );
      if (intent.status === "succeeded") {
        await confirmBooking(reference);
      } else if (intent.status === "canceled") {
        await releasePendingBooking(reference, "Payment canceled");
      }
      booking = await prisma.booking.findUnique({
        where: { reference },
        include: INCLUDE,
      });
      if (!booking) notFound();
    } catch (error) {
      console.error("[confirmation] payment check failed", error);
    }
  }

  const settings = await getSettings();
  const confirmed =
    booking.status === "CONFIRMED" || booking.status === "CHECKED_IN";
  const failed = booking.status === "CANCELLED";
  const processing = !confirmed && !failed;

  return (
    <div className="site-container max-w-2xl py-16 md:py-24">
      <div className="text-center">
        {confirmed && (
          <CheckCircle2 className="mx-auto h-10 w-10 text-brass" aria-hidden />
        )}
        {processing && (
          <Clock3 className="mx-auto h-10 w-10 text-brass" aria-hidden />
        )}
        {failed && (
          <XCircle className="mx-auto h-10 w-10 text-burgundy" aria-hidden />
        )}
        <h1 className="mt-4 font-display text-4xl font-medium">
          {confirmed && "Your room is reserved"}
          {processing && "Payment on its way"}
          {failed && "That payment did not go through"}
        </h1>
        <p className="mx-auto mt-3 max-w-md font-sans text-[14px] leading-relaxed text-parchment-dim">
          {confirmed &&
            `A confirmation email is on its way to ${booking.guest.email}. Keep the reference below; the front desk will ask for it.`}
          {processing &&
            "The bank is still confirming the payment. This page updates on refresh; the confirmation email follows the moment it clears."}
          {failed &&
            "Nothing was charged and the room was released. Your dates may still be free if you try again now."}
        </p>
        <p className="mt-6 font-sans text-[11px] uppercase tracking-[0.28em] text-parchment-faint">
          Booking reference
        </p>
        <p className="mt-1 font-display text-3xl tracking-[0.1em] text-brass">
          {booking.reference}
        </p>
        <LedgerRule className="mx-auto mt-8 w-40" />
      </div>

      {!failed && (
        <div className="mt-10 border border-parchment/15 bg-ink-soft p-6">
          <dl className="space-y-3 font-sans text-[14px]">
            <div className="flex justify-between gap-6">
              <dt className="text-parchment-dim">Room</dt>
              <dd className="text-right">{booking.roomType.name}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-parchment-dim">Check-in</dt>
              <dd className="text-right">
                {formatDateLong(booking.checkIn)}, from {settings.check_in_time}
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-parchment-dim">Check-out</dt>
              <dd className="text-right">
                {formatDateLong(booking.checkOut)}, by {settings.check_out_time}
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-parchment-dim">Guests</dt>
              <dd className="text-right">
                {booking.adults} adult{booking.adults === 1 ? "" : "s"}
                {booking.children > 0
                  ? `, ${booking.children} ${booking.children === 1 ? "child" : "children"}`
                  : ""}
              </dd>
            </div>
            <div className="space-y-2 border-t border-parchment/10 pt-3">
              <div className="flex justify-between gap-6 text-parchment-dim">
                <dt>Room</dt>
                <dd>{eur(booking.subtotalCents)}</dd>
              </div>
              {booking.addOns.map((line) => (
                <div
                  key={line.id}
                  className="flex justify-between gap-6 text-parchment-dim"
                >
                  <dt>
                    {line.addOn.name}
                    {line.quantity > 1 ? ` (x${line.quantity})` : ""}
                  </dt>
                  <dd>{eur(line.totalCents)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-6 text-parchment-dim">
                <dt>VAT ({settings.tax_rate_percent}%)</dt>
                <dd>{eur(booking.taxCents)}</dd>
              </div>
              <div className="flex justify-between gap-6 border-t border-parchment/10 pt-3 text-parchment">
                <dt>Total {confirmed ? "paid" : ""}</dt>
                <dd className="font-display text-xl">{eur(booking.totalCents)}</dd>
              </div>
            </div>
          </dl>
        </div>
      )}

      <div className="mt-8 space-y-4 font-sans text-[13px] leading-relaxed text-parchment-dim">
        {!failed && (
          <>
            <p>{settings.cancellation_policy}</p>
            <p>
              Getting here: {settings.address_line}. Arriving after dark? Call{" "}
              {settings.phone} and we will leave the gate lanterns lit.
            </p>
          </>
        )}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {failed ? (
          <Button asChild variant="brass" size="lg">
            <Link href="/book">Try Again</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/">Back to the site</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
