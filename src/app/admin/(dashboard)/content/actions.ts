"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { GalleryCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MANAGEMENT, requireStaff } from "@/lib/guards";

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

function revalidateSite() {
  revalidatePath("/admin/content");
  revalidatePath("/offers");
  revalidatePath("/gallery");
  revalidatePath("/");
}

export async function upsertPackage(formData: FormData) {
  await requireStaff(MANAGEMENT);

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/content?error=invalid");

  const priceEuros = Number.parseFloat(String(formData.get("price") ?? "0"));
  const data = {
    name,
    slug: slugify(String(formData.get("slug") ?? "").trim() || name),
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    inclusions: lines(formData.get("inclusions")),
    priceCents: Math.max(Math.round((priceEuros || 0) * 100), 0),
    priceNote: String(formData.get("priceNote") ?? "").trim() || "per stay",
    image: String(formData.get("image") ?? "").trim(),
    active: formData.get("active") === "on",
    sortOrder: Number(formData.get("sortOrder")) || 0,
  };

  if (id) {
    await prisma.package.update({ where: { id }, data });
  } else {
    await prisma.package.create({ data });
  }

  revalidateSite();
  redirect("/admin/content?saved=1");
}

export async function deletePackage(formData: FormData) {
  await requireStaff(MANAGEMENT);
  const id = String(formData.get("id") ?? "");
  await prisma.package.delete({ where: { id } }).catch(() => null);
  revalidateSite();
}

export async function upsertGalleryImage(formData: FormData) {
  await requireStaff(MANAGEMENT);

  const id = String(formData.get("id") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim();
  if (!url || !alt) redirect("/admin/content?error=invalid");

  const data = {
    url,
    alt,
    category: (String(formData.get("category") ?? "ROOMS") as GalleryCategory) || "ROOMS",
    sortOrder: Number(formData.get("sortOrder")) || 0,
    active: formData.get("active") === "on",
  };

  if (id) {
    await prisma.galleryImage.update({ where: { id }, data });
  } else {
    await prisma.galleryImage.create({ data });
  }

  revalidateSite();
  redirect("/admin/content?saved=1");
}

export async function deleteGalleryImage(formData: FormData) {
  await requireStaff(MANAGEMENT);
  const id = String(formData.get("id") ?? "");
  await prisma.galleryImage.delete({ where: { id } }).catch(() => null);
  revalidateSite();
}
