import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DESK, requireStaff } from "@/lib/guards";
import { eur, formatDateShort } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { BookingStatusBadge } from "@/components/admin/status-badge";
import { updateGuest } from "../actions";

export default async function GuestDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { saved?: string };
}) {
  await requireStaff(DESK);

  const guest = await prisma.guest.findUnique({
    where: { id: params.id },
    include: {
      bookings: {
        orderBy: { checkIn: "desc" },
        include: { roomType: { select: { name: true } } },
      },
    },
  });
  if (!guest) notFound();

  const lifetime = guest.bookings
    .filter((b) => ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(b.status))
    .reduce((sum, b) => sum + b.totalCents, 0);

  return (
    <>
      <PageHeader
        title={`${guest.firstName} ${guest.lastName}`}
        description={`${guest.bookings.length} booking${guest.bookings.length === 1 ? "" : "s"} on file, ${eur(lifetime)} lifetime value`}
      />

      {searchParams.saved && (
        <p className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Guest profile saved.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateGuest} className="space-y-4">
              <input type="hidden" name="id" value={guest.id} />
              <p className="text-sm text-zinc-500">{guest.email}</p>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={guest.phone ?? ""} />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" defaultValue={guest.country ?? ""} />
              </div>
              <div>
                <Label htmlFor="notes">
                  Notes (staff only, never shown to the guest)
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={guest.notes ?? ""}
                  placeholder="Prefers the quiet wing, allergic to walnuts, anniversary in May..."
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="marketingConsent"
                  defaultChecked={guest.marketingConsent}
                  className="h-4 w-4"
                />
                Marketing consent
              </label>
              <Button type="submit" variant="dark" size="sm">
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            Stay history
          </h2>
          <Table>
            <THead>
              <tr>
                <Th>Reference</Th>
                <Th>Room</Th>
                <Th>Dates</Th>
                <Th>Total</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <tbody>
              {guest.bookings.length === 0 && (
                <tr>
                  <Td colSpan={5} className="py-6 text-center text-zinc-400">
                    No bookings yet.
                  </Td>
                </tr>
              )}
              {guest.bookings.map((booking) => (
                <tr key={booking.id}>
                  <Td>
                    <Link
                      href={`/admin/reservations/${booking.id}`}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {booking.reference}
                    </Link>
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
      </div>
    </>
  );
}
