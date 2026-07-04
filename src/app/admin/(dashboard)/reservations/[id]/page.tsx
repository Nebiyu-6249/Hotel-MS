import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DESK, requireStaff } from "@/lib/guards";
import {
  eur,
  formatDateLong,
  nightsBetween,
  toDateString,
  todayUtc,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { BookingStatusBadge } from "@/components/admin/status-badge";
import {
  assignRoom,
  cancelBookingAction,
  setBookingStatus,
  updateBookingDates,
} from "../actions";

const BANNERS: Record<string, { tone: string; text: string }> = {
  created: { tone: "green", text: "Booking created and confirmed." },
  updated: { tone: "green", text: "Dates updated and the stay re-priced at current rates." },
  cancelled: { tone: "green", text: "Booking cancelled." },
  dates: { tone: "red", text: "Those dates were invalid. Check-out must come after check-in, 21 nights maximum." },
  full: { tone: "red", text: "No unit of this type is free for those dates, so nothing changed." },
};

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) {
  await requireStaff(DESK);

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      guest: true,
      roomType: { include: { rooms: { orderBy: { number: "asc" } } } },
      assignedRoom: true,
      addOns: { include: { addOn: true } },
    },
  });
  if (!booking) notFound();

  const today = todayUtc();
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const banner = Object.keys(BANNERS).find((key) => searchParams[key]);
  const active = ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(booking.status);

  return (
    <>
      <PageHeader
        title={`Booking ${booking.reference}`}
        description={`${booking.roomType.name}, ${formatDateLong(booking.checkIn)} to ${formatDateLong(booking.checkOut)}`}
      >
        <BookingStatusBadge status={booking.status} />
      </PageHeader>

      {banner && (
        <p
          className={`mb-4 border px-4 py-2.5 text-sm ${
            BANNERS[banner].tone === "green"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {BANNERS[banner].text}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Stay */}
        <Card>
          <CardHeader>
            <CardTitle>The stay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-zinc-500">Room type:</span>{" "}
              {booking.roomType.name}
            </p>
            <p>
              <span className="text-zinc-500">Dates:</span>{" "}
              {formatDateLong(booking.checkIn)} to {formatDateLong(booking.checkOut)}{" "}
              ({nights} night{nights === 1 ? "" : "s"})
            </p>
            <p>
              <span className="text-zinc-500">Guests:</span> {booking.adults} adult
              {booking.adults === 1 ? "" : "s"}
              {booking.children > 0 ? `, ${booking.children} children` : ""}
            </p>
            <p>
              <span className="text-zinc-500">Source:</span>{" "}
              <span className="capitalize">
                {booking.source.replace("_", " ").toLowerCase()}
              </span>
            </p>
            {booking.specialRequests && (
              <p className="border-t border-zinc-100 pt-3">
                <span className="text-zinc-500">Requests:</span>{" "}
                {booking.specialRequests}
              </p>
            )}
            {booking.cancellationReason && (
              <p className="border-t border-zinc-100 pt-3 text-red-700">
                Cancelled: {booking.cancellationReason}
              </p>
            )}

            {active && (
              <form action={assignRoom} className="border-t border-zinc-100 pt-4">
                <Label htmlFor="roomId">Assigned room</Label>
                <div className="flex gap-2">
                  <Select
                    id="roomId"
                    name="roomId"
                    defaultValue={booking.assignedRoomId ?? ""}
                  >
                    <option value="">Not assigned yet</option>
                    {booking.roomType.rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        Room {room.number} (floor {room.floor},{" "}
                        {room.status.toLowerCase()})
                      </option>
                    ))}
                  </Select>
                  <input type="hidden" name="id" value={booking.id} />
                  <Button type="submit" variant="light" size="sm">
                    Save
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Money */}
        <Card>
          <CardHeader>
            <CardTitle>Money</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">
                Room, {nights} night{nights === 1 ? "" : "s"}
              </span>
              <span>{eur(booking.subtotalCents)}</span>
            </div>
            {booking.addOns.map((line) => (
              <div key={line.id} className="flex justify-between">
                <span className="text-zinc-500">
                  {line.addOn.name}
                  {line.quantity > 1 ? ` (x${line.quantity})` : ""}
                </span>
                <span>{eur(line.totalCents)}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-zinc-500">VAT</span>
              <span>{eur(booking.taxCents)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-100 pt-2 font-semibold">
              <span>Total</span>
              <span>{eur(booking.totalCents)}</span>
            </div>
            <p className="border-t border-zinc-100 pt-3 text-[12px] text-zinc-500">
              {booking.stripePaymentIntentId ? (
                <>
                  Paid online via Stripe. Payment intent:{" "}
                  <span className="break-all font-mono">
                    {booking.stripePaymentIntentId}
                  </span>
                </>
              ) : (
                "Pay at the property. No online payment attached."
              )}
            </p>
          </CardContent>
        </Card>

        {/* Guest */}
        <Card>
          <CardHeader>
            <CardTitle>Guest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">
              {booking.guest.firstName} {booking.guest.lastName}
            </p>
            <p className="text-zinc-500">{booking.guest.email}</p>
            {booking.guest.phone && <p className="text-zinc-500">{booking.guest.phone}</p>}
            {booking.guest.country && (
              <p className="text-zinc-500">{booking.guest.country}</p>
            )}
            <p className="text-[12px] text-zinc-400">
              Marketing consent: {booking.guest.marketingConsent ? "yes" : "no"}
            </p>
            <p className="pt-2">
              <Link
                href={`/admin/guests/${booking.guest.id}`}
                className="text-zinc-900 underline underline-offset-2"
              >
                Open guest profile and stay history
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {active && (
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          {/* Status moves */}
          <Card>
            <CardHeader>
              <CardTitle>Front desk actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {booking.status === "CONFIRMED" && booking.checkIn <= today && (
                <form action={setBookingStatus}>
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="status" value="CHECKED_IN" />
                  <Button type="submit" variant="dark" size="sm">
                    Check in
                  </Button>
                </form>
              )}
              {booking.status === "CHECKED_IN" && (
                <form action={setBookingStatus}>
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="status" value="CHECKED_OUT" />
                  <Button type="submit" variant="dark" size="sm">
                    Check out
                  </Button>
                </form>
              )}
              {booking.status === "CONFIRMED" && booking.checkIn < today && (
                <form action={setBookingStatus}>
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="status" value="NO_SHOW" />
                  <Button type="submit" variant="light" size="sm">
                    Mark no-show
                  </Button>
                </form>
              )}
              {booking.status === "PENDING" && (
                <p className="text-[13px] text-zinc-500">
                  Awaiting online payment. The hold releases itself 30 minutes
                  after creation if the guest never pays.
                </p>
              )}
              {booking.status === "CONFIRMED" && booking.checkIn > today && (
                <p className="text-[13px] text-zinc-500">
                  Nothing to do until arrival day.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Change dates */}
          <Card>
            <CardHeader>
              <CardTitle>Move the stay</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateBookingDates} className="space-y-3">
                <input type="hidden" name="id" value={booking.id} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="newCheckIn">Check-in</Label>
                    <Input
                      id="newCheckIn"
                      name="checkIn"
                      type="date"
                      defaultValue={toDateString(booking.checkIn)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCheckOut">Check-out</Label>
                    <Input
                      id="newCheckOut"
                      name="checkOut"
                      type="date"
                      defaultValue={toDateString(booking.checkOut)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" variant="light" size="sm">
                  Update dates
                </Button>
                <p className="text-[12px] text-zinc-500">
                  Availability is re-checked and the room re-priced at current
                  rates.
                  {booking.stripePaymentIntentId &&
                    " This booking was paid online; if the new total differs, settle the difference at the desk or refund via the Stripe dashboard."}
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Cancel */}
          <Card>
            <CardHeader>
              <CardTitle>Cancel booking</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={cancelBookingAction} className="space-y-3">
                <input type="hidden" name="id" value={booking.id} />
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    name="reason"
                    placeholder="Guest request, weather, illness..."
                  />
                </div>
                {booking.stripePaymentIntentId && (
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      name="refund"
                      defaultChecked
                      className="h-4 w-4"
                    />
                    Refund the full amount via Stripe
                  </label>
                )}
                <Button type="submit" variant="danger" size="sm">
                  Cancel booking
                </Button>
                <p className="text-[12px] text-zinc-500">
                  The guest gets a cancellation email. The room goes straight
                  back on sale.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
