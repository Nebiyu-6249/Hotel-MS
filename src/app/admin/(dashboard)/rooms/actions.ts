"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RateRuleKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MANAGEMENT, requireStaff } from "@/lib/guards";
import { parseDateParam } from "@/lib/utils";

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function upsertRoomType(formData: FormData) {
  await requireStaff(MANAGEMENT);

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/rooms?error=invalid");

  const baseRateEuros = Number.parseFloat(String(formData.get("baseRate") ?? "0"));
  const data = {
    name,
    slug: slugify(String(formData.get("slug") ?? "").trim() || name),
    shortDescription: String(formData.get("shortDescription") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    sizeSqm: Math.max(Number(formData.get("sizeSqm")) || 0, 0),
    bedConfig: String(formData.get("bedConfig") ?? "").trim(),
    view: String(formData.get("view") ?? "").trim(),
    maxGuests: Math.min(Math.max(Number(formData.get("maxGuests")) || 2, 1), 8),
    baseRateCents: Math.max(Math.round((baseRateEuros || 0) * 100), 0),
    images: lines(formData.get("images")),
    amenities: lines(formData.get("amenities")),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    sortOrder: Number(formData.get("sortOrder")) || 0,
  };

  if (id) {
    await prisma.roomType.update({ where: { id }, data });
  } else {
    await prisma.roomType.create({ data });
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/", "layout");
  redirect("/admin/rooms?saved=1");
}

export async function addRoomUnit(formData: FormData) {
  await requireStaff(MANAGEMENT);
  const roomTypeId = String(formData.get("roomTypeId") ?? "");
  const number = String(formData.get("number") ?? "").trim();
  const floor = Number(formData.get("floor")) || 0;
  if (!roomTypeId || !number) return;

  await prisma.room
    .create({ data: { roomTypeId, number, floor } })
    .catch(() => null); // Duplicate room number: quietly ignored, list unchanged.
  revalidatePath("/admin/rooms");
}

export async function deleteRoomUnit(formData: FormData) {
  await requireStaff(MANAGEMENT);
  const id = String(formData.get("id") ?? "");
  try {
    await prisma.room.delete({ where: { id } });
  } catch {
    // The unit has bookings or tasks attached; history wins over deletion.
    redirect("/admin/rooms?error=unit-used");
  }
  revalidatePath("/admin/rooms");
}

export async function upsertRateRule(formData: FormData) {
  await requireStaff(MANAGEMENT);

  const id = String(formData.get("id") ?? "");
  const kind = (String(formData.get("kind") ?? "MULTIPLIER") as RateRuleKind) || "MULTIPLIER";
  const rawValue = Number.parseFloat(String(formData.get("value") ?? "0"));
  const startDate = parseDateParam(String(formData.get("startDate") ?? ""));
  const endDate = parseDateParam(String(formData.get("endDate") ?? ""));
  if (!startDate || !endDate || endDate < startDate || !Number.isFinite(rawValue)) {
    redirect("/admin/rooms?error=rule-invalid");
  }

  const data = {
    name: String(formData.get("name") ?? "").trim() || "Unnamed rule",
    kind,
    // MULTIPLIER stores a percent of base (125 = +25%); FIXED stores cents.
    value: kind === "FIXED" ? Math.round(rawValue * 100) : Math.round(rawValue),
    startDate: startDate!,
    endDate: endDate!,
    priority: Number(formData.get("priority")) || 0,
    active: formData.get("active") === "on",
    roomTypeId: String(formData.get("roomTypeId") ?? "") || null,
  };

  if (id) {
    await prisma.rateRule.update({ where: { id }, data });
  } else {
    await prisma.rateRule.create({ data });
  }

  revalidatePath("/admin/rooms");
  redirect("/admin/rooms?saved=1");
}

export async function deleteRateRule(formData: FormData) {
  await requireStaff(MANAGEMENT);
  const id = String(formData.get("id") ?? "");
  await prisma.rateRule.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/rooms");
}
