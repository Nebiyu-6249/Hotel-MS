import Link from "next/link";
import { Lock } from "lucide-react";
import type { Settings } from "@/lib/settings";

const EXPLORE = [
  { href: "/rooms", label: "Rooms and suites" },
  { href: "/dining", label: "Dining" },
  { href: "/amenities", label: "Amenities" },
  { href: "/offers", label: "Offers and packages" },
  { href: "/events", label: "Events and weddings" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "Our story" },
];

export function SiteFooter({ settings }: { settings: Settings }) {
  return (
    <footer className="border-t border-parchment/10 bg-ink-soft">
      <div className="site-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-sans text-[9px] uppercase tracking-[0.34em] text-brass">
            Est. 1867 &middot; Carpathian Mountains
          </p>
          <p className="mt-1 font-display text-xl font-medium tracking-[0.18em]">
            HOTEL TRANSYLVANIA
          </p>
          <p className="mt-4 max-w-xs font-sans text-[13px] leading-relaxed text-parchment-dim">
            A restored castle above the Barsa valley. Twenty-six rooms, one
            long table, and forest on three sides.
          </p>
        </div>
        <div>
          <h3 className="eyebrow">Visit</h3>
          <address className="mt-4 space-y-2 font-sans text-[13px] not-italic leading-relaxed text-parchment-dim">
            <p>{settings.address_line}</p>
            <p>
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-parchment">
                {settings.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${settings.email}`} className="hover:text-parchment">
                {settings.email}
              </a>
            </p>
            <p>
              Check-in from {settings.check_in_time}, check-out by{" "}
              {settings.check_out_time}
            </p>
          </address>
        </div>
        <div>
          <h3 className="eyebrow">Explore</h3>
          <ul className="mt-4 space-y-2">
            {EXPLORE.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-sans text-[13px] text-parchment-dim transition-colors hover:text-parchment"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="eyebrow">Good to know</h3>
          <ul className="mt-4 space-y-2 font-sans text-[13px] text-parchment-dim">
            <li>{settings.best_rate_note}</li>
            <li>
              <Link href="/policies" className="transition-colors hover:text-parchment">
                Cancellation policy
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="transition-colors hover:text-parchment">
                Privacy policy
              </Link>
            </li>
            <li className="flex items-center gap-1.5 pt-2 text-parchment-faint">
              <Lock className="h-3.5 w-3.5 text-brass" aria-hidden />
              Payments processed by Stripe. Card details never touch our
              servers.
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-parchment/10">
        <div className="site-container flex flex-col gap-2 py-5 font-sans text-[12px] text-parchment-faint sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Hotel Transylvania. All rights reserved.</p>
          <p>Strada Castelului 1, Brasov County, Romania</p>
        </div>
      </div>
    </footer>
  );
}
