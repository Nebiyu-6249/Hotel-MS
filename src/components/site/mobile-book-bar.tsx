"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookingWidget,
  type RoomTypeOption,
} from "@/components/site/booking-widget";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Thumb-reach booking entry on phones: a fixed bar that opens the same
// widget the desktop header carries.
export function MobileBookBar({ roomTypes }: { roomTypes: RoomTypeOption[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (
    pathname.startsWith("/book/checkout") ||
    pathname.startsWith("/book/confirmation")
  ) {
    return null;
  }

  return (
    <>
      <div className="h-16 md:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-parchment/15 bg-ink/95 p-3 backdrop-blur md:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="brass" size="lg" className="w-full">
              Check Availability
            </Button>
          </DialogTrigger>
          <DialogContent dark title="Find your dates">
            <BookingWidget
              roomTypes={roomTypes}
              layout="stacked"
              onNavigate={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
