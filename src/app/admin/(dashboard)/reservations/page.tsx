import Link from "next/link";
import type { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildTapeData } from "@/lib/tape";
import {
  eur,
  formatDateShort,
  parseDateParam,
  todayUtc,
} from "@/lib/utils";
import { DESK, requireStaff } from "@/lib/guards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { BookingStatusBadge } from "@/components/admin/status-badge";
import { TapeChart } from "@/components/admin/tape-chart";
import { createRoomBlock, deleteRoomBlock } from "./actions";

const STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
  "NO_SHOW",
];

type Props = {
  searchParams: {
    status?: string;
    roomType?: string;
    from?: string;
    to?: string;
    q?: string;
  };
};

export default async function ReservationsPage({ searchParams }: Props) {
  await requireStaff(DESK);

  const where: Prisma.BookingWhereInput = {};
  if (searchParams.status && STATUSES.includes(searchParams.status as BookingStatus)) {
    where.status = searchParams.status as BookingStatus;
  }
  if (searchParams.roomType) where.roomTypeId = searchParams.roomType;
  const from = parseDateParam(searchParams.from);
  const to = parseDateParam(searchParams.to);
  if (from || to) {
    // Stays overlapping the window.
    where.AND = [
      ...(to ? [{ checkIn: { lte: to } }] : []),
      ...(from ? [{ checkOut: { gte: from } }] : []),
    ];
  }
  if (searchParams.q) {
    const q = searchParams.q.trim();
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { guest: { firstName: { contains: q, mode: "insensitive" } } },
      { guest: { lastName: { contains: q, mode: "insensitive" } } },
      { guest: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [tape, bookings, roomTypes, rooms, blocks] = await Promise.all([
    buildTapeData(todayUtc(), 14),
    prisma.booking.findMany({
      where,
      include: { guest: true, roomType: true },
      orderBy: { checkIn: "asc" },
      take: 100,
    }),
    prisma.roomType.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.room.findMany({
      include: { roomType: { select: { name: true } } },
      orderBy: { number: "asc" },
    }),
    prisma.roomBlock.findMany({
      where: { endDate: { gte: todayUtc() } },
      include: { room: { include: { roomType: { select: { name: true } } } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Reservations"
        description="Next 14 nights at a glance, then every booking below."
      >
        <Button asChild variant="dark" size="sm">
          <Link href="/admin/reservations/new">New booking</Link>
        </Button>
      </PageHeader>

      <TapeChart rows={tape} />

      {/* Filters */}
      <form
        method="get"
        className="mt-8 grid gap-3 border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <Input
            name="q"
            placeholder="Search name, email or reference"
            defaultValue={searchParams.q ?? ""}
          />
        </div>
        <Select name="status" defaultValue={searchParams.status ?? ""}>
          <option value="">Any status</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ").toLowerCase()}
            </option>
          ))}
        </Select>
        <Select name="roomType" defaultValue={searchParams.roomType ?? ""}>
          <option value="">Any room type</option>
          {roomTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </Select>
        <Input type="date" name="from" defaultValue={searchParams.from ?? ""} aria-label="From date" />
        <div className="flex gap-2">
          <Input type="date" name="to" defaultValue={searchParams.to ?? ""} aria-label="To date" />
          <Button type="submit" variant="dark">
            Filter
          </Button>
        </div>
      </form>

      {/* Booking list */}
      <div className="mt-4">
        <Table>
          <THead>
            <tr>
              <Th>Reference</Th>
              <Th>Guest</Th>
              <Th>Room type</Th>
              <Th>Dates</Th>
              <Th>Source</Th>
              <Th>Total</Th>
              <Th>Status</Th>
            </tr>
          </THead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <Td colSpan={7} className="py-8 text-center text-zinc-400">
                  Nothing matches those filters.
                </Td>
              </tr>
            )}
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-zinc-50">
                <Td>
                  <Link
                    href={`/admin/reservations/${booking.id}`}
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    {booking.reference}
                  </Link>
                </Td>
                <Td>
                  {booking.guest.firstName} {booking.guest.lastName}
                  <span className="block text-[12px] text-zinc-400">
                    {booking.guest.email}
                  </span>
                </Td>
                <Td>{booking.roomType.name}</Td>
                <Td>
                  {formatDateShort(booking.checkIn)} to{" "}
                  {formatDateShort(booking.checkOut)}
                </Td>
                <Td className="capitalize">
                  {booking.source.replace("_", " ").toLowerCase()}
                </Td>
                <Td>{eur(booking.totalCents)}</Td>
                <Td>
                  <BookingStatusBadge status={booking.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-2 text-[12px] text-zinc-400">
          Showing up to 100 stays, soonest arrival first.
        </p>
      </div>

      {/* Room blocks */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">
          Blocked rooms
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            action={createRoomBlock}
            className="grid gap-3 border border-zinc-200 bg-white p-4"
          >
            <p className="text-[12px] text-zinc-500">
              Take a physical room out of sale for a date range. Blocked units
              come straight off availability.
            </p>
            <Select name="roomId" required defaultValue="">
              <option value="" disabled>
                Pick a room
              </option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.number} ({room.roomType.name})
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" name="startDate" required aria-label="Block start" />
              <Input type="date" name="endDate" required aria-label="Block end (exclusive)" />
            </div>
            <Input name="reason" placeholder="Reason (leak, repaint, owner stay...)" required />
            <Button type="submit" variant="dark" size="sm" className="justify-self-start">
              Block room
            </Button>
          </form>

          <div>
            {blocks.length === 0 ? (
              <p className="border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-400">
                No current or upcoming blocks.
              </p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Room</Th>
                    <Th>Dates</Th>
                    <Th>Reason</Th>
                    <Th></Th>
                  </tr>
                </THead>
                <tbody>
                  {blocks.map((block) => (
                    <tr key={block.id}>
                      <Td>
                        Room {block.room.number}
                        <span className="block text-[12px] text-zinc-400">
                          {block.room.roomType.name}
                        </span>
                      </Td>
                      <Td>
                        {formatDateShort(block.startDate)} to{" "}
                        {formatDateShort(block.endDate)}
                      </Td>
                      <Td>{block.reason}</Td>
                      <Td className="text-right">
                        <form action={deleteRoomBlock}>
                          <input type="hidden" name="id" value={block.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Remove
                          </Button>
                        </form>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
