"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { ChevronDown } from "lucide-react";
import {
  DateRangePicker,
  parseLocalDate,
  toDateInputString,
} from "@/components/site/date-range-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RoomTypeOption = { slug: string; name: string };

function DarkSelect({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[42px] w-full appearance-none border border-parchment/25 bg-ink-soft px-3 py-2 pr-8 font-sans text-[13px] text-parchment transition-colors hover:border-brass focus:border-brass focus:outline-none"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-parchment-faint"
        aria-hidden
      />
    </label>
  );
}

export function BookingWidget({
  roomTypes,
  layout = "bar",
  onNavigate,
}: {
  roomTypes: RoomTypeOption[];
  layout?: "bar" | "stacked";
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const initial = useMemo<DateRange | undefined>(() => {
    const from = parseLocalDate(params.get("checkIn"));
    const to = parseLocalDate(params.get("checkOut"));
    return from && to ? { from, to } : undefined;
  }, [params]);

  const [range, setRange] = useState<DateRange | undefined>(initial);
  const [adults, setAdults] = useState(params.get("adults") ?? "2");
  const [children, setChildren] = useState(params.get("children") ?? "0");
  const [roomType, setRoomType] = useState(params.get("roomType") ?? "");

  const ready = Boolean(range?.from && range?.to);
  const stacked = layout === "stacked";

  function submit() {
    if (!range?.from || !range.to) return;
    const query = new URLSearchParams({
      checkIn: toDateInputString(range.from),
      checkOut: toDateInputString(range.to),
      adults,
      children,
    });
    if (roomType) query.set("roomType", roomType);
    onNavigate?.();
    router.push(`/book?${query.toString()}`);
  }

  return (
    <div
      className={cn(
        "flex gap-2",
        stacked ? "flex-col" : "flex-1 flex-wrap items-center"
      )}
      role="search"
      aria-label="Check room availability"
    >
      <DateRangePicker
        value={range}
        onChange={setRange}
        months={stacked ? 1 : 2}
        className={stacked ? "w-full" : "min-w-[220px]"}
      />
      <DarkSelect
        label="Adults"
        value={adults}
        onChange={setAdults}
        className={stacked ? "w-full" : "w-[120px]"}
      >
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <option key={n} value={n}>
            {n} adult{n === 1 ? "" : "s"}
          </option>
        ))}
      </DarkSelect>
      <DarkSelect
        label="Children"
        value={children}
        onChange={setChildren}
        className={stacked ? "w-full" : "w-[130px]"}
      >
        {[0, 1, 2, 3, 4].map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? "child" : "children"}
          </option>
        ))}
      </DarkSelect>
      <DarkSelect
        label="Room type"
        value={roomType}
        onChange={setRoomType}
        className={stacked ? "w-full" : "w-[190px]"}
      >
        <option value="">Any room</option>
        {roomTypes.map((rt) => (
          <option key={rt.slug} value={rt.slug}>
            {rt.name}
          </option>
        ))}
      </DarkSelect>
      <Button
        variant="brass"
        size={stacked ? "lg" : "md"}
        onClick={submit}
        disabled={!ready}
        className={stacked ? "mt-1 w-full" : ""}
      >
        Check Availability
      </Button>
      {!ready && stacked && (
        <p className="text-center font-sans text-[12px] text-parchment-faint">
          Pick your dates to see live rates.
        </p>
      )}
    </div>
  );
}
