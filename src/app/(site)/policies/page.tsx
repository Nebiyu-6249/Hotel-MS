import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = {
  title: "Cancellation Policy and House Times",
  description:
    "The cancellation policy, check-in and check-out times at Hotel Transylvania, stated before you pay, not after.",
};

export default async function PoliciesPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHero
        eyebrow="The small print, printed large"
        title="Cancellation policy and house times"
        lede="You see this policy before you pay, on the checkout page, in your confirmation email and here. No surprises."
      />
      <section className="py-16 md:py-24">
        <div className="site-container max-w-2xl space-y-10">
          <div>
            <h2 className="font-display text-2xl font-medium">Cancellation</h2>
            <p className="mt-3 font-sans text-[14px] leading-relaxed text-parchment-dim">
              {settings.cancellation_policy}
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-medium">Arrival and departure</h2>
            <p className="mt-3 font-sans text-[14px] leading-relaxed text-parchment-dim">
              Check-in runs from {settings.check_in_time}; check-out is by{" "}
              {settings.check_out_time}. Arriving late is never a problem, the
              front desk is staffed around the clock; just call so we leave
              the gate lanterns lit. A late checkout until 14:00 can be added
              during booking, subject to the room being free that day.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-medium">Payment</h2>
            <p className="mt-3 font-sans text-[14px] leading-relaxed text-parchment-dim">
              Online bookings are paid in full at checkout through Stripe, in
              euros, taxes included in the total you see. Bookings made by
              phone can be paid at the property. Refunds due under the policy
              above go back to the original payment method within 5 to 10
              business days.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-medium">Children and dogs</h2>
            <p className="mt-3 font-sans text-[14px] leading-relaxed text-parchment-dim">
              Children are welcome; cots and extra beds are free under six.
              Well-behaved dogs stay free in ground-floor rooms; tell us when
              you book so we assign the right one. The one rule: not on the
              armchairs in the library. The house cat was here first.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
