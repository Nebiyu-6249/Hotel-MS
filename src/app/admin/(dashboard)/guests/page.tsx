import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DESK, requireStaff } from "@/lib/guards";
import { formatDateShort } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireStaff(DESK);

  const q = searchParams.q?.trim();
  const where: Prisma.GuestWhereInput = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const guests = await prisma.guest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        orderBy: { checkIn: "desc" },
        take: 1,
        select: { checkIn: true },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Guests"
        description="Everyone who has booked or been booked in, with stay history and notes."
      />

      <form method="get" className="mb-4 flex max-w-md gap-2">
        <Input name="q" placeholder="Search name, email or phone" defaultValue={q ?? ""} />
        <Button type="submit" variant="dark">
          Search
        </Button>
      </form>

      <Table>
        <THead>
          <tr>
            <Th>Guest</Th>
            <Th>Contact</Th>
            <Th>Stays</Th>
            <Th>Last stay</Th>
            <Th>Marketing</Th>
          </tr>
        </THead>
        <tbody>
          {guests.length === 0 && (
            <tr>
              <Td colSpan={5} className="py-8 text-center text-zinc-400">
                No guests match.
              </Td>
            </tr>
          )}
          {guests.map((guest) => (
            <tr key={guest.id} className="hover:bg-zinc-50">
              <Td>
                <Link
                  href={`/admin/guests/${guest.id}`}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  {guest.firstName} {guest.lastName}
                </Link>
                {guest.country && (
                  <span className="block text-[12px] text-zinc-400">
                    {guest.country}
                  </span>
                )}
              </Td>
              <Td>
                {guest.email}
                {guest.phone && (
                  <span className="block text-[12px] text-zinc-400">
                    {guest.phone}
                  </span>
                )}
              </Td>
              <Td>{guest._count.bookings}</Td>
              <Td>
                {guest.bookings[0]
                  ? formatDateShort(guest.bookings[0].checkIn)
                  : "Never stayed"}
              </Td>
              <Td>
                <Badge tone={guest.marketingConsent ? "green" : "neutral"}>
                  {guest.marketingConsent ? "Opted in" : "No"}
                </Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="mt-2 text-[12px] text-zinc-400">
        Showing up to 100 guests, newest first.
      </p>
    </>
  );
}
