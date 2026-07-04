"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eur } from "@/lib/utils";

type AddOnPricing = "PER_BOOKING" | "PER_NIGHT" | "PER_GUEST" | "PER_GUEST_NIGHT";

export type CheckoutAddOn = {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  pricing: AddOnPricing;
};

type Props = {
  publishableKey: string;
  room: {
    slug: string;
    name: string;
    image: string;
    sizeSqm: number;
    bedConfig: string;
    view: string;
  };
  stay: {
    checkIn: string;
    checkOut: string;
    checkInLong: string;
    checkOutLong: string;
    nights: number;
    adults: number;
    children: number;
  };
  pricing: { subtotalCents: number; taxRatePercent: number };
  addOns: CheckoutAddOn[];
  policy: string;
  backHref: string;
};

// Display-only mirror of the server's add-on math. The amount Stripe charges
// is always recomputed server-side in /api/checkout.
function addOnTotal(addOn: CheckoutAddOn, nights: number, guests: number): number {
  switch (addOn.pricing) {
    case "PER_BOOKING":
      return addOn.priceCents;
    case "PER_NIGHT":
      return addOn.priceCents * nights;
    case "PER_GUEST":
      return addOn.priceCents * guests;
    case "PER_GUEST_NIGHT":
      return addOn.priceCents * guests * nights;
  }
}

function pricingLabel(pricing: AddOnPricing): string {
  switch (pricing) {
    case "PER_BOOKING":
      return "per stay";
    case "PER_NIGHT":
      return "per night";
    case "PER_GUEST":
      return "per guest";
    case "PER_GUEST_NIGHT":
      return "per guest, per night";
  }
}

export function CheckoutFlow(props: Props) {
  const { stay, room, pricing } = props;
  const guests = stay.adults + stay.children;

  const [phase, setPhase] = useState<"details" | "payment">("details");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [guest, setGuest] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
  });
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const stripePromise = useMemo<Promise<StripeJs | null> | null>(
    () => (props.publishableKey ? loadStripe(props.publishableKey) : null),
    [props.publishableKey]
  );

  const selectedAddOns = props.addOns.filter((a) => selected.has(a.slug));
  const addOnsCents = selectedAddOns.reduce(
    (sum, a) => sum + addOnTotal(a, stay.nights, guests),
    0
  );
  const taxCents = Math.round(
    ((pricing.subtotalCents + addOnsCents) * pricing.taxRatePercent) / 100
  );
  const totalCents = pricing.subtotalCents + addOnsCents + taxCents;

  function toggleAddOn(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function startPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!policyAccepted) {
      setError("Please read and accept the cancellation policy first.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomTypeSlug: room.slug,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          adults: stay.adults,
          children: stay.children,
          addOns: selectedAddOns.map((a) => ({ slug: a.slug, quantity: 1 })),
          guest: { ...guest, marketingConsent },
          specialRequests,
          policyAccepted: true,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error ?? "Could not start the payment.");
      }
      setClientSecret(body.clientSecret);
      setReference(body.reference);
      setPhase("payment");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="site-container py-10 md:py-14">
      <Link
        href={props.backHref}
        className="inline-flex items-center gap-1.5 font-sans text-[12px] uppercase tracking-[0.14em] text-parchment-dim hover:text-parchment"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to room choice
      </Link>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl font-medium sm:text-4xl">
          {phase === "details" ? "Your details" : "Payment"}
        </h1>
        <p className="font-sans text-[12px] uppercase tracking-[0.16em] text-parchment-faint">
          Step {phase === "details" ? "1" : "2"} of 3
        </p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <div>
          {phase === "details" && (
            <form onSubmit={startPayment} className="space-y-10">
              {/* Add-ons */}
              <section>
                <h2 className="font-display text-2xl font-medium">
                  Make the stay yours
                </h2>
                <p className="mt-1 font-sans text-[13px] text-parchment-dim">
                  All optional. Prices shown are what actually gets added.
                </p>
                <ul className="mt-5 space-y-3">
                  {props.addOns.map((addOn) => {
                    const lineTotal = addOnTotal(addOn, stay.nights, guests);
                    const checked = selected.has(addOn.slug);
                    return (
                      <li key={addOn.slug}>
                        <label
                          className={`flex cursor-pointer items-start gap-4 border p-4 transition-colors ${
                            checked
                              ? "border-brass bg-ink-soft"
                              : "border-parchment/15 hover:border-parchment/35"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddOn(addOn.slug)}
                            className="mt-1 h-4 w-4 accent-[#c19a5b]"
                          />
                          <span className="flex-1">
                            <span className="block font-sans text-[14px] text-parchment">
                              {addOn.name}
                            </span>
                            <span className="mt-0.5 block font-sans text-[12px] leading-relaxed text-parchment-dim">
                              {addOn.description}
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block font-sans text-[14px] text-parchment">
                              {eur(lineTotal)}
                            </span>
                            <span className="block font-sans text-[11px] text-parchment-faint">
                              {eur(addOn.priceCents)} {pricingLabel(addOn.pricing)}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Guest details */}
              <section>
                <h2 className="font-display text-2xl font-medium">Who is staying</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="label-dark">
                      First name
                    </label>
                    <input
                      id="firstName"
                      required
                      maxLength={60}
                      autoComplete="given-name"
                      className="field-dark"
                      value={guest.firstName}
                      onChange={(e) =>
                        setGuest({ ...guest, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="label-dark">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      required
                      maxLength={60}
                      autoComplete="family-name"
                      className="field-dark"
                      value={guest.lastName}
                      onChange={(e) =>
                        setGuest({ ...guest, lastName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="label-dark">
                      Email (for your confirmation)
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      maxLength={120}
                      autoComplete="email"
                      className="field-dark"
                      value={guest.email}
                      onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="label-dark">
                      Phone (optional)
                    </label>
                    <input
                      id="phone"
                      maxLength={30}
                      autoComplete="tel"
                      className="field-dark"
                      value={guest.phone}
                      onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="label-dark">
                      Country (optional)
                    </label>
                    <input
                      id="country"
                      maxLength={60}
                      autoComplete="country-name"
                      className="field-dark"
                      value={guest.country}
                      onChange={(e) =>
                        setGuest({ ...guest, country: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="requests" className="label-dark">
                    Anything we should know? (optional)
                  </label>
                  <textarea
                    id="requests"
                    rows={3}
                    maxLength={1000}
                    className="field-dark"
                    placeholder="Arrival after dark, a dog in the party, an anniversary worth a small fuss..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  />
                </div>
                <label className="mt-4 flex items-start gap-3 font-sans text-[13px] text-parchment-dim">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#c19a5b]"
                  />
                  Send me the occasional email about seasons and offers. A few a
                  year, never more.
                </label>
              </section>

              {/* Policy, stated before payment */}
              <section>
                <h2 className="font-display text-2xl font-medium">
                  Before you pay
                </h2>
                <div className="mt-4 border border-parchment/15 bg-ink-soft p-4">
                  <p className="font-sans text-[13px] leading-relaxed text-parchment-dim">
                    {props.policy}
                  </p>
                </div>
                <label className="mt-4 flex items-start gap-3 font-sans text-[13px] text-parchment">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#c19a5b]"
                    required
                  />
                  I have read the cancellation policy above.
                </label>
              </section>

              {error && (
                <p role="alert" className="font-sans text-[13px] text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="brass"
                size="lg"
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? "One moment..." : "Continue to Secure Payment"}
              </Button>
            </form>
          )}

          {phase === "payment" && clientSecret && stripePromise && reference && (
            <div>
              <button
                type="button"
                onClick={() => {
                  // The unpaid hold behind the old payment releases itself
                  // after 30 minutes; a fresh one is created on resubmit.
                  setPhase("details");
                  setClientSecret(null);
                  setReference(null);
                }}
                className="mb-6 inline-flex items-center gap-1.5 font-sans text-[12px] uppercase tracking-[0.14em] text-parchment-dim hover:text-parchment"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Change details
                or add-ons
              </button>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorPrimary: "#c19a5b",
                      colorBackground: "#221c17",
                      colorText: "#ede4d3",
                      borderRadius: "2px",
                      fontFamily:
                        "Inter, system-ui, -apple-system, sans-serif",
                    },
                  },
                }}
              >
                <PaymentForm reference={reference} totalCents={totalCents} />
              </Elements>
            </div>
          )}

          {phase === "payment" && !stripePromise && (
            <p className="font-sans text-[13px] text-red-400">
              Payments are not configured on this environment yet. Set the
              Stripe keys and reload.
            </p>
          )}
        </div>

        {/* Order summary */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="border border-parchment/15 bg-ink-soft">
            <div className="relative aspect-[16/9]">
              <Image
                src={room.image}
                alt={room.name}
                fill
                sizes="(max-width: 1024px) 100vw, 360px"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <h2 className="font-display text-xl font-medium">{room.name}</h2>
              <p className="mt-1 font-sans text-[11px] uppercase tracking-[0.18em] text-parchment-faint">
                {room.sizeSqm} m&sup2; &middot; {room.bedConfig} &middot;{" "}
                {room.view}
              </p>
              <p className="mt-3 font-sans text-[13px] text-parchment-dim">
                {stay.checkInLong} to {stay.checkOutLong}
                <br />
                {stay.nights} night{stay.nights === 1 ? "" : "s"} &middot;{" "}
                {stay.adults} adult{stay.adults === 1 ? "" : "s"}
                {stay.children > 0
                  ? `, ${stay.children} ${stay.children === 1 ? "child" : "children"}`
                  : ""}
              </p>
              <dl className="mt-5 space-y-2 border-t border-parchment/10 pt-4 font-sans text-[13px]">
                <div className="flex justify-between text-parchment-dim">
                  <dt>
                    Room, {stay.nights} night{stay.nights === 1 ? "" : "s"}
                  </dt>
                  <dd>{eur(pricing.subtotalCents)}</dd>
                </div>
                {selectedAddOns.map((addOn) => (
                  <div key={addOn.slug} className="flex justify-between text-parchment-dim">
                    <dt>{addOn.name}</dt>
                    <dd>{eur(addOnTotal(addOn, stay.nights, guests))}</dd>
                  </div>
                ))}
                <div className="flex justify-between text-parchment-dim">
                  <dt>VAT ({pricing.taxRatePercent}%)</dt>
                  <dd>{eur(taxCents)}</dd>
                </div>
                <div className="flex justify-between border-t border-parchment/10 pt-3 text-[15px] text-parchment">
                  <dt>Total, all in</dt>
                  <dd className="font-display text-xl">{eur(totalCents)}</dd>
                </div>
              </dl>
            </div>
          </div>
          <ul className="mt-4 space-y-2 font-sans text-[12px] text-parchment-faint">
            <li className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-brass" aria-hidden />
              Secure checkout by Stripe. Card details never touch our servers.
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-brass" aria-hidden />
              Free cancellation until 7 days before check-in.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

function PaymentForm({
  reference,
  totalCents,
}: {
  reference: string;
  totalCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError("");
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/confirmation/${reference}`,
      },
    });
    // Only reached on failure; success redirects to the confirmation page.
    if (result.error) {
      setError(result.error.message ?? "The payment did not go through.");
      setPaying(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <PaymentElement />
      {error && (
        <p role="alert" className="font-sans text-[13px] text-red-400">
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="brass"
        size="lg"
        disabled={!stripe || paying}
        className="w-full sm:w-auto"
      >
        {paying ? "Processing..." : `Pay ${eur(totalCents)}`}
      </Button>
      <p className="font-sans text-[12px] text-parchment-faint">
        Booking reference {reference}. You are charged once, in euros, taxes
        included.
      </p>
    </form>
  );
}
