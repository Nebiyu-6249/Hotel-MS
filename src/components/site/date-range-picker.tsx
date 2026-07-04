"use client";

import { useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// The picker works in the guest's local calendar; dates leave the client as
// plain yyyy-mm-dd strings, which the server reads as UTC calendar dates.
export function toDateInputString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseLocalDate(value: string | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function DateRangePicker({
  value,
  onChange,
  months = 2,
  className,
}: {
  value?: DateRange;
  onChange: (range?: DateRange) => void;
  months?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const label = value?.from
    ? value.to
      ? `${format(value.from, "d MMM")} to ${format(value.to, "d MMM yyyy")}`
      : `${format(value.from, "d MMM")} to ...`
    : "Add dates";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-[42px] items-center gap-2 border border-parchment/25 bg-ink-soft px-3 py-2 font-sans text-[13px] text-parchment transition-colors hover:border-brass focus:border-brass focus:outline-none",
            !value?.from && "text-parchment-faint",
            className
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-brass" aria-hidden />
          <span>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <DayPicker
          mode="range"
          numberOfMonths={months}
          selected={value}
          onSelect={(range) => {
            onChange(range);
            if (range?.from && range?.to) setOpen(false);
          }}
          disabled={{ before: new Date() }}
          defaultMonth={value?.from ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
