import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDaysUtc, parseDateParam, toDateString, todayUtc } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// Bookings overlapping the range, one row each, ready for a spreadsheet.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["OWNER", "MANAGER"].includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const today = todayUtc();
  const from =
    parseDateParam(url.searchParams.get("from")) ??
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const to = parseDateParam(url.searchParams.get("to")) ?? addDaysUtc(today, 1);

  const bookings = await prisma.booking.findMany({
    where: { checkIn: { lt: to }, checkOut: { gt: from } },
    include: { guest: true, roomType: true },
    orderBy: { checkIn: "asc" },
  });

  const header = [
    "reference",
    "status",
    "source",
    "guest",
    "email",
    "room_type",
    "check_in",
    "check_out",
    "adults",
    "children",
    "room_eur",
    "add_ons_eur",
    "vat_eur",
    "total_eur",
    "created_at",
  ].join(",");

  const rows = bookings.map((b) =>
    [
      b.reference,
      b.status,
      b.source,
      csvEscape(`${b.guest.firstName} ${b.guest.lastName}`),
      csvEscape(b.guest.email),
      csvEscape(b.roomType.name),
      toDateString(b.checkIn),
      toDateString(b.checkOut),
      String(b.adults),
      String(b.children),
      (b.subtotalCents / 100).toFixed(2),
      (b.addOnsCents / 100).toFixed(2),
      (b.taxCents / 100).toFixed(2),
      (b.totalCents / 100).toFixed(2),
      b.createdAt.toISOString(),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings_${toDateString(from)}_${toDateString(to)}.csv"`,
    },
  });
}
