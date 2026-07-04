import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What data Hotel Transylvania collects, why, how long it is kept, and the rights you have over it under the GDPR.",
};

export default async function PrivacyPage() {
  const settings = await getSettings();

  const sections = [
    {
      title: "What we collect",
      body: `When you book, we collect your name, email address, phone number and stay details. If you write to us or send an event inquiry, we keep the message and your contact details. Our booking system also logs technical basics (IP address, browser type) to keep the service secure.`,
    },
    {
      title: "What we never see",
      body: `Your card details. Payment runs through Stripe, a certified payment processor. The card number goes from your browser to Stripe directly and never touches our servers. We store only a payment reference so we can process refunds.`,
    },
    {
      title: "Why we use your data",
      body: `To run your booking, send confirmations and answer your messages. That is a contract between us, and processing your data for it is lawful under Article 6(1)(b) of the GDPR. We send marketing email only if you tick the box that asks for it, and every such email carries an unsubscribe link.`,
    },
    {
      title: "Cookies",
      body: `One strictly necessary cookie runs the booking session. Optional analytics cookies are set only after you accept them in the banner, and choosing "Essential only" is a perfectly good choice that changes nothing about your stay.`,
    },
    {
      title: "How long we keep it",
      body: `Booking records are kept for the periods Romanian accounting and tax law require. Contact messages are deleted after two years. You can ask us to remove marketing consent at any time and it happens immediately.`,
    },
    {
      title: "Your rights",
      body: `Under the GDPR you can ask what we hold about you, have it corrected or deleted, restrict how it is used, receive a copy, or object to processing. Write to ${settings.email} and we answer within one month. If you are unhappy with our answer, you can complain to ANSPDCP, the Romanian data protection authority.`,
    },
    {
      title: "Who to contact",
      body: `The data controller is the operating company of ${settings.property_name}, ${settings.address_line}. For anything in this policy: ${settings.email} or ${settings.phone}.`,
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="Your data, in plain language"
        lede="No legalese wall. This page says what we collect, why, and how to make us stop."
      />
      <section className="py-16 md:py-24">
        <div className="site-container max-w-2xl space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-2xl font-medium">{section.title}</h2>
              <p className="mt-3 font-sans text-[14px] leading-relaxed text-parchment-dim">
                {section.body}
              </p>
            </div>
          ))}
          <p className="border-t border-parchment/10 pt-6 font-sans text-[12px] text-parchment-faint">
            Last reviewed July 2026.
          </p>
        </div>
      </section>
    </>
  );
}
