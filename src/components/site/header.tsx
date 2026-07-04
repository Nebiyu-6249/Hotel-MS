"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  BookingWidget,
  type RoomTypeOption,
} from "@/components/site/booking-widget";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/rooms", label: "Rooms" },
  { href: "/amenities", label: "Amenities" },
  { href: "/dining", label: "Dining" },
  { href: "/gallery", label: "Gallery" },
  { href: "/offers", label: "Offers" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  roomTypes,
  bestRateNote,
}: {
  roomTypes: RoomTypeOption[];
  bestRateNote: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const inCheckout =
    pathname.startsWith("/book/checkout") ||
    pathname.startsWith("/book/confirmation");

  return (
    <header className="sticky top-0 z-40 border-b border-parchment/10 bg-ink/95 backdrop-blur">
      <div className="site-container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="leading-none" onClick={() => setOpen(false)}>
          <span className="block font-sans text-[9px] uppercase tracking-[0.34em] text-brass">
            Est. 1867 &middot; Carpathian Mountains
          </span>
          <span className="mt-1 block font-display text-xl font-medium tracking-[0.18em] text-parchment">
            HOTEL TRANSYLVANIA
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "font-sans text-[12px] uppercase tracking-[0.16em] transition-colors",
                pathname.startsWith(item.href)
                  ? "text-brass"
                  : "text-parchment-dim hover:text-parchment"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="brass" size="sm" className="hidden sm:inline-flex">
            <Link href="/book">Check Availability</Link>
          </Button>
          <button
            className="p-2 text-parchment lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Persistent booking strip: availability search is one click away on
          every page, without hijacking the top row. */}
      {!inCheckout && (
        <div className="hidden border-t border-parchment/10 bg-ink-soft/80 md:block">
          <div className="site-container flex items-center gap-3 py-2.5">
            <BookingWidget roomTypes={roomTypes} layout="bar" />
            <p className="ml-auto hidden shrink-0 font-sans text-[11px] tracking-wide text-parchment-faint xl:block">
              {bestRateNote}
            </p>
          </div>
        </div>
      )}

      {open && (
        <div className="border-t border-parchment/10 bg-ink lg:hidden">
          <nav className="site-container flex flex-col py-2" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-parchment/5 py-3.5 font-sans text-sm uppercase tracking-[0.14em] text-parchment-dim"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
