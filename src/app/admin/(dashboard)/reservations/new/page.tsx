import { prisma } from "@/lib/db";
import { DESK, requireStaff } from "@/lib/guards";
import { eur } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { createManualBooking } from "../actions";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  await requireStaff(DESK);
  const roomTypes = await prisma.roomType.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <PageHeader
        title="New booking"
        description="For phone, email and walk-in bookings. Priced at current rates, marked as pay at the property, confirmed immediately."
      />

      {searchParams.error === "soldout" && (
        <p className="mb-4 border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          That room type has no unit left for those dates. Check the tape chart
          and try different dates or another type.
        </p>
      )}
      {searchParams.error === "invalid" && (
        <p className="mb-4 border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Something was missing or the dates were backwards. Check the form and
          try again.
        </p>
      )}

      <form
        action={createManualBooking}
        className="max-w-2xl space-y-6 border border-zinc-200 bg-white p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" required maxLength={60} />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" required maxLength={60} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required maxLength={120} />
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" name="phone" maxLength={30} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="roomTypeId">Room type</Label>
            <Select id="roomTypeId" name="roomTypeId" required defaultValue="">
              <option value="" disabled>
                Pick a room type
              </option>
              {roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} (from {eur(type.baseRateCents)}/night, sleeps {type.maxGuests})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="checkIn">Check-in</Label>
            <Input id="checkIn" name="checkIn" type="date" required />
          </div>
          <div>
            <Label htmlFor="checkOut">Check-out</Label>
            <Input id="checkOut" name="checkOut" type="date" required />
          </div>
          <div>
            <Label htmlFor="adults">Adults</Label>
            <Select id="adults" name="adults" defaultValue="2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="children">Children</Label>
            <Select id="children" name="children" defaultValue="0">
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="source">Source</Label>
            <Select id="source" name="source" defaultValue="PHONE">
              <option value="PHONE">Phone</option>
              <option value="EMAIL">Email</option>
              <option value="WALK_IN">Walk-in</option>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="specialRequests">Notes / requests (optional)</Label>
          <Input id="specialRequests" name="specialRequests" maxLength={1000} />
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" variant="dark">
            Create Booking
          </Button>
          <p className="text-[12px] text-zinc-400">
            The total is calculated from current rates and VAT on save.
          </p>
        </div>
      </form>
    </>
  );
}
