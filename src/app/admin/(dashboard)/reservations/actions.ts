"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BookingSource, BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { unitsAvailable } from "@/lib/availability";
import { cancelBooking, createBooking } from "@/lib/booking";
import { buildQuote } from "@/lib/pricing";
import { DESK, requireStaff } from "@/lib/guards";
import { getSettings, taxRatePercent } from "@/lib/settings";
import { nightsBetween, parseDateParam } from "@/lib/utils";

function revalidateReservations(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  if (id) revalidatePath(`/admin/reservations/${id}`);
}

// ---------- Status transitions ----------

const ALLOWED_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  CONFIRMED: ["CHECKED_IN", "NO_SHOW"],
  CHECKED_IN: ["CHECKED_OUT"],
};

export async function setBookingStatus(formData: FormData) {
  await requireStaff(DESK);
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("status") ?? "") as BookingStatus;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return;
  if (!ALLOWED_TRANSITIONS[booking.status]?.includes(next)) return;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id }, data: { status: next } });
    // Keep the housekeeping board honest as guests move through the day.
    if (booking.assignedRoomId) {
      if (next === "CHECKED_IN") {
        await tx.room.update({
          where: { id: booking.assignedRoomId },
          data: { status: "OCCUPIED" },
        });
      }
      if (next === "CHECKED_OUT") {
        await tx.room.update({
          where: { id: booking.assignedRoomId },
          data: { status: "DIRTY" },
        });
      }
    }
  });

  revalidateReservations(id);
  revalidatePath("/admin/housekeeping");
}

export async function assignRoom(formData: FormData) {
  await requireStaff(DESK);
  const id = String(formData.get("id") ?? "");
  const roomId = String(formData.get("roomId") ?? "");

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return;

  if (roomId) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.roomTypeId !== booking.roomTypeId) return;
  }

  await prisma.booking.update({
    where: { id },
    data: { assignedRoomId: roomId || null },
  });
  revalidateReservations(id);
}

// ---------- Date changes ----------

export async function updateBookingDates(formData: FormData) {
  await requireStaff(DESK);
  const id = String(formData.get("id") ?? "");
  const checkIn = parseDateParam(String(formData.get("checkIn") ?? ""));
  const checkOut = parseDateParam(String(formData.get("checkOut") ?? ""));

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { roomType: true, addOns: true },
  });
  if (!booking || !checkIn || !checkOut) return;
  if (checkOut <= checkIn || nightsBetween(checkIn, checkOut) > 21) {
    redirect(`/admin/reservations/${id}?error=dates`);
  }
  if (!["CONFIRMED", "PENDING", "CHECKED_IN"].includes(booking.status)) return;

  const available = await unitsAvailable(
    booking.roomTypeId,
    checkIn,
    checkOut,
    prisma,
    booking.id
  );
  if (available < 1) redirect(`/admin/reservations/${id}?error=full`);

  // Re-quote the room nights at current rates; add-on lines carry over as
  // they were sold. If the guest already paid online, the detail page flags
  // any difference so the desk can settle or refund it.
  const [settings, rules] = await Promise.all([
    getSettings(),
    prisma.rateRule.findMany({
      where: {
        active: true,
        OR: [{ roomTypeId: null }, { roomTypeId: booking.roomTypeId }],
      },
    }),
  ]);
  const quote = buildQuote({
    roomType: booking.roomType,
    checkIn,
    checkOut,
    rules,
    taxRatePercent: taxRatePercent(settings),
    guests: booking.adults + booking.children,
    catalog: [],
    selections: [],
  });
  const addOnsCents = booking.addOns.reduce((sum, a) => sum + a.totalCents, 0);
  const taxCents = Math.round(
    ((quote.subtotalCents + addOnsCents) * quote.taxRatePercent) / 100
  );

  await prisma.booking.update({
    where: { id },
    data: {
      checkIn,
      checkOut,
      nightlyRates: quote.nights,
      subtotalCents: quote.subtotalCents,
      addOnsCents,
      taxCents,
      totalCents: quote.subtotalCents + addOnsCents + taxCents,
    },
  });

  revalidateReservations(id);
  redirect(`/admin/reservations/${id}?updated=1`);
}

// ---------- Cancellation ----------

export async function cancelBookingAction(formData: FormData) {
  await requireStaff(DESK);
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "Cancelled by staff";
  const refund = formData.get("refund") === "on";

  await cancelBooking({ bookingId: id, reason, refund });
  revalidateReservations(id);
  redirect(`/admin/reservations/${id}?cancelled=1`);
}

// ---------- Manual bookings (phone, email, walk-in) ----------

export async function createManualBooking(formData: FormData) {
  await requireStaff(DESK);

  const roomTypeId = String(formData.get("roomTypeId") ?? "");
  const checkIn = parseDateParam(String(formData.get("checkIn") ?? ""));
  const checkOut = parseDateParam(String(formData.get("checkOut") ?? ""));
  const adults = Math.min(Math.max(Number(formData.get("adults")) || 1, 1), 6);
  const children = Math.min(Math.max(Number(formData.get("children")) || 0, 0), 4);
  const source = (String(formData.get("source") ?? "PHONE") as BookingSource) || "PHONE";
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const specialRequests = String(formData.get("specialRequests") ?? "").trim();

  if (!roomTypeId || !checkIn || !checkOut || checkOut <= checkIn || !firstName || !lastName || !email) {
    redirect("/admin/reservations/new?error=invalid");
  }

  const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
  if (!roomType) redirect("/admin/reservations/new?error=invalid");

  const [settings, rules] = await Promise.all([
    getSettings(),
    prisma.rateRule.findMany({
      where: { active: true, OR: [{ roomTypeId: null }, { roomTypeId }] },
    }),
  ]);
  const quote = buildQuote({
    roomType: roomType!,
    checkIn: checkIn!,
    checkOut: checkOut!,
    rules,
    taxRatePercent: taxRatePercent(settings),
    guests: adults + children,
    catalog: [],
    selections: [],
  });

  let bookingId: string;
  try {
    const booking = await createBooking({
      roomTypeId,
      checkIn: checkIn!,
      checkOut: checkOut!,
      adults,
      children,
      guest: {
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        marketingConsent: false,
      },
      quote,
      addOnIdBySlug: new Map(),
      source,
      status: "CONFIRMED", // Paid at the property; no online payment step.
      specialRequests: specialRequests || undefined,
    });
    bookingId = booking.id;
  } catch {
    redirect("/admin/reservations/new?error=soldout");
  }

  revalidateReservations();
  redirect(`/admin/reservations/${bookingId!}?created=1`);
}

// ---------- Room blocks ----------

export async function createRoomBlock(formData: FormData) {
  await requireStaff(DESK);
  const roomId = String(formData.get("roomId") ?? "");
  const startDate = parseDateParam(String(formData.get("startDate") ?? ""));
  const endDate = parseDateParam(String(formData.get("endDate") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim() || "Blocked";

  if (!roomId || !startDate || !endDate || endDate <= startDate) return;

  await prisma.roomBlock.create({
    data: { roomId, startDate, endDate, reason },
  });
  revalidateReservations();
  revalidatePath("/admin/rooms");
}

export async function deleteRoomBlock(formData: FormData) {
  await requireStaff(DESK);
  const id = String(formData.get("id") ?? "");
  await prisma.roomBlock.delete({ where: { id } }).catch(() => null);
  revalidateReservations();
  revalidatePath("/admin/rooms");
}
