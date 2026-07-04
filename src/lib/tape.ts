import { prisma } from "@/lib/db";
import { addDaysUtc, toDateString } from "@/lib/utils";

export type TapeCell = { date: string; booked: number; capacity: number };
export type TapeRow = { id: string; name: string; units: number; cells: TapeCell[] };

// Occupancy matrix for the tape chart: per room type, per day, how many
// units are sold against how many are sellable (units minus blocks).
export async function buildTapeData(start: Date, days: number): Promise<TapeRow[]> {
  const end = addDaysUtc(start, days);
  const [types, bookings, blocks] = await Promise.all([
    prisma.roomType.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { rooms: true } } },
    }),
    prisma.booking.findMany({
      where: {
        checkIn: { lt: end },
        checkOut: { gt: start },
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
      select: { roomTypeId: true, checkIn: true, checkOut: true },
    }),
    prisma.roomBlock.findMany({
      where: { startDate: { lt: end }, endDate: { gt: start } },
      select: {
        roomId: true,
        startDate: true,
        endDate: true,
        room: { select: { roomTypeId: true } },
      },
    }),
  ]);

  return types.map((type) => {
    const cells: TapeCell[] = [];
    for (let i = 0; i < days; i++) {
      const day = addDaysUtc(start, i);
      const next = addDaysUtc(day, 1);
      const booked = bookings.filter(
        (b) => b.roomTypeId === type.id && b.checkIn < next && b.checkOut > day
      ).length;
      const blocked = new Set(
        blocks
          .filter(
            (b) =>
              b.room.roomTypeId === type.id &&
              b.startDate < next &&
              b.endDate > day
          )
          .map((b) => b.roomId)
      ).size;
      cells.push({
        date: toDateString(day),
        booked,
        capacity: Math.max(type._count.rooms - blocked, 0),
      });
    }
    return { id: type.id, name: type.name, units: type._count.rooms, cells };
  });
}
