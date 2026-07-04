import type { BookingSource } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { NightlyRate } from "@/lib/pricing";
import { addDaysUtc, nightsBetween, toDateString } from "@/lib/utils";

const OCCUPYING = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] as const;

export type ReportData = {
  from: Date;
  to: Date; // exclusive
  days: number;
  totalUnits: number;
  roomNightsSold: number;
  roomRevenueCents: number;
  occupancyPercent: number;
  adrCents: number;
  revparCents: number;
  bookedValueCents: number;
  bookingCount: number;
  cancellations: number;
  noShows: number;
  revenueByDay: { date: string; revenueCents: number }[];
  bySource: { source: BookingSource; count: number }[];
};

// Room revenue is prorated per night from the rates stored on each booking,
// so a stay that straddles the range only counts the nights inside it. ADR
// and RevPAR follow the standard definitions on room revenue only; booked
// value (rooms + add-ons + tax, by arrival date) is reported separately.
export async function getReportData(from: Date, to: Date): Promise<ReportData> {
  const [totalUnits, overlapping, cancellations, noShows, sourceGroups, bookedAgg] =
    await Promise.all([
      prisma.room.count(),
      prisma.booking.findMany({
        where: {
          checkIn: { lt: to },
          checkOut: { gt: from },
          status: { in: [...OCCUPYING] },
        },
        select: { nightlyRates: true },
      }),
      prisma.booking.count({
        where: { status: "CANCELLED", checkIn: { gte: from, lt: to } },
      }),
      prisma.booking.count({
        where: { status: "NO_SHOW", checkIn: { gte: from, lt: to } },
      }),
      prisma.booking.groupBy({
        by: ["source"],
        where: {
          checkIn: { gte: from, lt: to },
          status: { in: [...OCCUPYING] },
        },
        _count: { _all: true },
      }),
      prisma.booking.aggregate({
        where: {
          checkIn: { gte: from, lt: to },
          status: { in: [...OCCUPYING] },
        },
        _sum: { totalCents: true },
        _count: { _all: true },
      }),
    ]);

  const days = Math.max(nightsBetween(from, to), 1);
  const revenueMap = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    revenueMap.set(toDateString(addDaysUtc(from, i)), 0);
  }

  let roomNightsSold = 0;
  let roomRevenueCents = 0;
  for (const booking of overlapping) {
    const nights = (booking.nightlyRates as unknown as NightlyRate[]) ?? [];
    for (const night of nights) {
      if (!revenueMap.has(night.date)) continue;
      roomNightsSold += 1;
      roomRevenueCents += night.rateCents;
      revenueMap.set(night.date, (revenueMap.get(night.date) ?? 0) + night.rateCents);
    }
  }

  const availableRoomNights = totalUnits * days;

  return {
    from,
    to,
    days,
    totalUnits,
    roomNightsSold,
    roomRevenueCents,
    occupancyPercent: availableRoomNights
      ? (roomNightsSold / availableRoomNights) * 100
      : 0,
    adrCents: roomNightsSold ? Math.round(roomRevenueCents / roomNightsSold) : 0,
    revparCents: availableRoomNights
      ? Math.round(roomRevenueCents / availableRoomNights)
      : 0,
    bookedValueCents: bookedAgg._sum.totalCents ?? 0,
    bookingCount: bookedAgg._count._all,
    cancellations,
    noShows,
    revenueByDay: Array.from(revenueMap.entries()).map(([date, revenueCents]) => ({
      date,
      revenueCents,
    })),
    bySource: sourceGroups.map((g) => ({ source: g.source, count: g._count._all })),
  };
}
