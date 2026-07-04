import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { confirmBooking, releasePendingBooking } from "@/lib/booking";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Source of truth for payment outcomes. Note: a failed *attempt*
// (payment_intent.payment_failed) is deliberately ignored, because the guest
// can retry the same PaymentIntent; only a canceled intent releases the hold.
// If a payment succeeds after the 30-minute hold lapsed and the last unit was
// resold in between, the booking still confirms (the guest paid) and the
// front desk resolves the rare clash by upgrading or re-homing a stay.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const reference = intent.metadata?.bookingReference;
      if (reference) await confirmBooking(reference);
      break;
    }
    case "payment_intent.canceled": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const reference = intent.metadata?.bookingReference;
      if (reference) await releasePendingBooking(reference, "Payment canceled");
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
