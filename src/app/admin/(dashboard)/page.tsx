import Link from "next/link";
import { prisma } from "@/lib/db";
import { addDaysUtc, eur, formatDateShort, todayUtc } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Kpi } from "@/components/admin/kpi";
import { PageHeader } from "@/components/admin/page-header";
import { BookingStatusBadge } from "@/components/admin/status-badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { setBookingStatus } from "./reservations/actions";

const OCCUPYING = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] as const;

export default async function OverviewPage() {
  const today = todayUtc();
  const tomorrow = addDaysUtc(today, 1);
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
  );
  const nextMonth = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)
  );

  const [
    arrivals,
    departures,
    inHouse,
    occupiedTonight,
    totalUnits,
    monthRevenue,
    recent,
    newInquiries,
    openMessages,
    pendingReviews,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: { checkIn: today, status: "CONFIRMED" },
      include: { guest: true, roomType: true, assignedRoom: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { checkOut: today, status: "CHECKED_IN" },
      include: { guest: true, roomType: true, assignedRoom: true },
    }),
    prisma.booking.count({ where: { status: "CHECKED_IN" } }),
    prisma.booking.count({
      where: {
        checkIn: { lte: today },
        checkOut: { gt: today },
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
    }),
    prisma.room.count(),
    prisma.booking.aggregate({
      where: {
        checkIn: { gte: monthStart, lt: nextMonth },
        status: { in: [...OCCUPYING] },
      },
      _sum: { totalCents: true },
    }),
    prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { guest: true, roomType: true },
    }),
    prisma.eventInquiry.count({ where: { status: "NEW" } }),
    prisma.contactMessage.count({ where: { handled: false } }),
    prisma.review.count({ where: { status: "PENDING" } }),
  ]);

  const occupancy = totalUnits ? Math.round((occupiedTonight / totalUnits) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Today at the house"
        description={new Intl.DateTimeFormat("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(today)}
      >
        <Button asChild variant="dark" size="sm">
          <Link href="/admin/reservations/new">New booking</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi
          label="Occupancy tonight"
          value={`${occupancy}%`}
          sub={`${occupiedTonight} of ${totalUnits} rooms`}
        />
        <Kpi label="Arrivals" value={String(arrivals.length)} sub="expected today" />
        <Kpi label="Departures" value={String(departures.length)} sub="leaving today" />
        <Kpi label="In house" value={String(inHouse)} sub="stays right now" />
        <Kpi
          label="Revenue MTD"
          value={eur(monthRevenue._sum.totalCents ?? 0)}
          sub="booked value by arrival"
        />
      </div>

      {(newInquiries > 0 || openMessages > 0 || pendingReviews > 0) && (
        <p className="mt-4 border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Waiting on you:{" "}
          {[
            newInquiries > 0 ? `${newInquiries} new event inquir${newInquiries === 1 ? "y" : "ies"}` : null,
            openMessages > 0 ? `${openMessages} unanswered message${openMessages === 1 ? "" : "s"}` : null,
            pendingReviews > 0 ? `${pendingReviews} review${pendingReviews === 1 ? "" : "s"} to moderate` : null,
          ]
            .filter(Boolean)
            .join(", ")}
          . <Link href="/admin/reviews" className="underline">Reviews</Link>
        </p>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            Arrivals today
          </h2>
          {arrivals.length === 0 ? (
            <p className="border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-400">
              No arrivals expected today.
            </p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Guest</Th>
                  <Th>Room</Th>
                  <Th>Nights</Th>
                  <Th></Th>
                </tr>
              </THead>
              <tbody>
                {arrivals.map((booking) => (
                  <tr key={booking.id}>
                    <Td>
                      <Link
                        href={`/admin/reservations/${booking.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {booking.guest.firstName} {booking.guest.lastName}
                      </Link>
                      <span className="block text-[12px] text-zinc-400">
                        {booking.reference}
                      </span>
                    </Td>
                    <Td>
                      {booking.roomType.name}
                      <span className="block text-[12px] text-zinc-400">
                        {booking.assignedRoom
                          ? `Room ${booking.assignedRoom.number}`
                          : "No room assigned"}
                      </span>
                    </Td>
                    <Td>
                      {formatDateShort(booking.checkIn)} to{" "}
                      {formatDateShort(booking.checkOut)}
                    </Td>
                    <Td className="text-right">
                      <form action={setBookingStatus}>
                        <input type="hidden" name="id" value={booking.id} />
                        <input type="hidden" name="status" value="CHECKED_IN" />
                        <Button type="submit" variant="light" size="sm">
                          Check in
                        </Button>
                      </form>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            Departures today
          </h2>
          {departures.length === 0 ? (
            <p className="border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-400">
              Nobody checks out today.
            </p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Guest</Th>
                  <Th>Room</Th>
                  <Th></Th>
                </tr>
              </THead>
              <tbody>
                {departures.map((booking) => (
                  <tr key={booking.id}>
                    <Td>
                      <Link
                        href={`/admin/reservations/${booking.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {booking.guest.firstName} {booking.guest.lastName}
                      </Link>
                      <span className="block text-[12px] text-zinc-400">
                        {booking.reference}
                      </span>
                    </Td>
                    <Td>
                      {booking.roomType.name}
                      <span className="block text-[12px] text-zinc-400">
                        {booking.assignedRoom
                          ? `Room ${booking.assignedRoom.number}`
                          : "No room assigned"}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <form action={setBookingStatus}>
                        <input type="hidden" name="id" value={booking.id} />
                        <input type="hidden" name="status" value="CHECKED_OUT" />
                        <Button type="submit" variant="light" size="sm">
                          Check out
                        </Button>
                      </form>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">
          Latest bookings
        </h2>
        <Table>
          <THead>
            <tr>
              <Th>Reference</Th>
              <Th>Guest</Th>
              <Th>Room</Th>
              <Th>Dates</Th>
              <Th>Total</Th>
              <Th>Status</Th>
            </tr>
          </THead>
          <tbody>
            {recent.map((booking) => (
              <tr key={booking.id}>
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
                </Td>
                <Td>{booking.roomType.name}</Td>
                <Td>
                  {formatDateShort(booking.checkIn)} to{" "}
                  {formatDateShort(booking.checkOut)}
                </Td>
                <Td>{eur(booking.totalCents)}</Td>
                <Td>
                  <BookingStatusBadge status={booking.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
    </>
  );
}
