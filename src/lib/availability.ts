import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

type Db = PrismaClient | Prisma.TransactionClient;

// A PENDING booking holds its room while the guest completes payment, then
// silently expires. Expired holds need no cleanup job; the time filter below
// simply stops counting them.
export const PENDING_HOLD_MINUTES = 30;

export async function unitsAvailable(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  db: Db = prisma,
  // When moving an existing booking, that booking must not block itself.
  excludeBookingId?: string
): Promise<number> {
  const totalUnits = await db.room.count({ where: { roomTypeId } });
  const holdCutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60_000);

  const overlappingBookings = await db.booking.count({
    where: {
      roomTypeId,
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      OR: [
        { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
        { status: "PENDING", createdAt: { gt: holdCutoff } },
      ],
    },
  });

  const blocked = await db.roomBlock.findMany({
    where: {
      room: { roomTypeId },
      startDate: { lt: checkOut },
      endDate: { gt: checkIn },
    },
    select: { roomId: true },
  });
  const blockedUnits = new Set(blocked.map((b) => b.roomId)).size;

  return totalUnits - overlappingBookings - blockedUnits;
}
