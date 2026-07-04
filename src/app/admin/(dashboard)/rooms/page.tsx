import { prisma } from "@/lib/db";
import { MANAGEMENT, requireStaff } from "@/lib/guards";
import { buildTapeData } from "@/lib/tape";
import { eur, toDateString, todayUtc } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { RoomStatusBadge } from "@/components/admin/status-badge";
import { RateRuleDialog } from "@/components/admin/rate-rule-dialog";
import { RoomTypeDialog } from "@/components/admin/room-type-dialog";
import { TapeChart } from "@/components/admin/tape-chart";
import { addRoomUnit, deleteRateRule, deleteRoomUnit } from "./actions";

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  await requireStaff(MANAGEMENT);

  const [roomTypes, rules, tape] = await Promise.all([
    prisma.roomType.findMany({
      orderBy: { sortOrder: "asc" },
      include: { rooms: { orderBy: { number: "asc" } } },
    }),
    prisma.rateRule.findMany({
      orderBy: [{ startDate: "asc" }],
      include: { roomType: { select: { name: true } } },
    }),
    buildTapeData(todayUtc(), 21),
  ]);

  return (
    <>
      <PageHeader
        title="Rooms and rates"
        description="Room types guests book, the physical units behind them, and the pricing rules on top of base rates."
      >
        <RoomTypeDialog triggerLabel="New room type" triggerVariant="dark" />
      </PageHeader>

      {searchParams.saved && (
        <p className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Saved.
        </p>
      )}
      {searchParams.error === "unit-used" && (
        <p className="mb-4 border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          That unit has bookings or tasks in its history, so it stays. Block it
          instead if it should stop selling.
        </p>
      )}
      {searchParams.error === "rule-invalid" && (
        <p className="mb-4 border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          The rule needs a valid date range and a numeric value.
        </p>
      )}

      {/* Room types */}
      <Table>
        <THead>
          <tr>
            <Th>Room type</Th>
            <Th>Units</Th>
            <Th>Base rate</Th>
            <Th>Sleeps</Th>
            <Th>Status</Th>
            <Th></Th>
          </tr>
        </THead>
        <tbody>
          {roomTypes.map((type) => (
            <tr key={type.id}>
              <Td>
                <span className="font-medium text-zinc-900">{type.name}</span>
                <span className="block text-[12px] text-zinc-400">
                  /rooms/{type.slug}
                  {type.featured ? " (featured on homepage)" : ""}
                </span>
              </Td>
              <Td>{type.rooms.length}</Td>
              <Td>{eur(type.baseRateCents)}/night</Td>
              <Td>{type.maxGuests}</Td>
              <Td>
                <Badge tone={type.active ? "green" : "neutral"}>
                  {type.active ? "Active" : "Hidden"}
                </Badge>
              </Td>
              <Td className="text-right">
                <RoomTypeDialog
                  triggerLabel="Edit"
                  roomType={{
                    id: type.id,
                    name: type.name,
                    slug: type.slug,
                    shortDescription: type.shortDescription,
                    description: type.description,
                    sizeSqm: type.sizeSqm,
                    bedConfig: type.bedConfig,
                    view: type.view,
                    maxGuests: type.maxGuests,
                    baseRateEuros: type.baseRateCents / 100,
                    images: type.images,
                    amenities: type.amenities,
                    featured: type.featured,
                    active: type.active,
                    sortOrder: type.sortOrder,
                  }}
                />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Physical units */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">
          Physical rooms
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {roomTypes.map((type) => (
            <div key={type.id} className="border border-zinc-200 bg-white p-4">
              <p className="text-sm font-medium text-zinc-900">{type.name}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {type.rooms.map((room) => (
                  <li
                    key={room.id}
                    className="flex items-center gap-2 border border-zinc-200 px-2.5 py-1.5 text-[12px]"
                  >
                    <span className="font-medium">Room {room.number}</span>
                    <span className="text-zinc-400">fl. {room.floor}</span>
                    <RoomStatusBadge status={room.status} />
                    <form action={deleteRoomUnit}>
                      <input type="hidden" name="id" value={room.id} />
                      <button
                        type="submit"
                        aria-label={`Remove room ${room.number}`}
                        className="text-zinc-400 hover:text-red-600"
                      >
                        &times;
                      </button>
                    </form>
                  </li>
                ))}
                {type.rooms.length === 0 && (
                  <li className="text-[12px] text-zinc-400">
                    No units yet, so this type cannot sell.
                  </li>
                )}
              </ul>
              <form action={addRoomUnit} className="mt-3 flex gap-2">
                <input type="hidden" name="roomTypeId" value={type.id} />
                <Input name="number" placeholder="Number (e.g. 204)" required className="h-8 w-36 text-[13px]" />
                <Input
                  name="floor"
                  type="number"
                  placeholder="Floor"
                  className="h-8 w-20 text-[13px]"
                />
                <Button type="submit" variant="light" size="sm">
                  Add unit
                </Button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* Rate rules */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">
            Seasonal and dynamic pricing
          </h2>
          <RateRuleDialog
            triggerLabel="New rule"
            triggerVariant="dark"
            roomTypes={roomTypes.map((t) => ({ id: t.id, name: t.name }))}
          />
        </div>
        <Table>
          <THead>
            <tr>
              <Th>Rule</Th>
              <Th>Effect</Th>
              <Th>Dates</Th>
              <Th>Scope</Th>
              <Th>Priority</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </THead>
          <tbody>
            {rules.length === 0 && (
              <tr>
                <Td colSpan={7} className="py-6 text-center text-zinc-400">
                  No rules yet; every night sells at base rate.
                </Td>
              </tr>
            )}
            {rules.map((rule) => (
              <tr key={rule.id}>
                <Td className="font-medium text-zinc-900">{rule.name}</Td>
                <Td>
                  {rule.kind === "MULTIPLIER"
                    ? `${rule.value}% of base`
                    : `${eur(rule.value)}/night fixed`}
                </Td>
                <Td>
                  {toDateString(rule.startDate)} to {toDateString(rule.endDate)}
                </Td>
                <Td>{rule.roomType?.name ?? "All types"}</Td>
                <Td>{rule.priority}</Td>
                <Td>
                  <Badge tone={rule.active ? "green" : "neutral"}>
                    {rule.active ? "Active" : "Off"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <RateRuleDialog
                      triggerLabel="Edit"
                      roomTypes={roomTypes.map((t) => ({ id: t.id, name: t.name }))}
                      rule={{
                        id: rule.id,
                        name: rule.name,
                        kind: rule.kind,
                        value:
                          rule.kind === "FIXED" ? rule.value / 100 : rule.value,
                        startDate: toDateString(rule.startDate),
                        endDate: toDateString(rule.endDate),
                        priority: rule.priority,
                        active: rule.active,
                        roomTypeId: rule.roomTypeId,
                      }}
                    />
                    <form action={deleteRateRule}>
                      <input type="hidden" name="id" value={rule.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      {/* Availability calendar */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">
          Availability, next 21 nights
        </h2>
        <TapeChart rows={tape} />
      </section>
    </>
  );
}
