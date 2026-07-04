import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/site/contact-form";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Address, phone, email and directions for Hotel Transylvania, plus a contact form the front desk answers within one working day.",
};

export default async function ContactPage() {
  const settings = await getSettings();
  const mapQuery = encodeURIComponent(settings.address_line);

  const details = [
    { icon: MapPin, label: "Address", value: settings.address_line },
    { icon: Phone, label: "Phone", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    {
      icon: Clock,
      label: "Front desk",
      value: `Staffed around the clock. Check-in from ${settings.check_in_time}, check-out by ${settings.check_out_time}.`,
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to a person, not a portal"
        lede="The front desk answers the phone day and night, and emails within one working day. For bookings, the fastest route is the availability search above."
      />
      <section className="py-16 md:py-24">
        <div className="site-container grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <ul className="space-y-6">
              {details.map((item) => (
                <li key={item.label} className="flex gap-4">
                  <item.icon className="mt-1 h-5 w-5 shrink-0 text-brass" aria-hidden />
                  <div>
                    <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-parchment-faint">
                      {item.label}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="mt-1 block font-sans text-[14px] text-parchment underline-offset-2 hover:underline"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-1 font-sans text-[14px] leading-relaxed text-parchment">
                        {item.value}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-10 aspect-[4/3] overflow-hidden border border-parchment/15">
              <iframe
                title="Map showing the location of Hotel Transylvania"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                className="h-full w-full border-0 grayscale-[35%] contrast-[0.95]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="mt-3 font-sans text-[12px] text-parchment-faint">
              The last three kilometers climb through beech forest on a paved
              lane; it is plowed daily in winter.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-2xl font-medium">Write to us</h2>
            <p className="mt-2 font-sans text-[13px] text-parchment-dim">
              Questions about a stay, a booking change, or something we have
              not thought of. For event and wedding inquiries, the{" "}
              <a href="/events" className="text-brass underline underline-offset-2">
                events form
              </a>{" "}
              reaches the coordinator directly.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
