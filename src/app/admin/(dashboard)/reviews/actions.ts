"use server";

import { revalidatePath } from "next/cache";
import type { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DESK, requireStaff } from "@/lib/guards";

function revalidate() {
  revalidatePath("/admin/reviews");
  revalidatePath("/"); // Featured reviews surface on the homepage.
}

export async function setReviewStatus(formData: FormData) {
  await requireStaff(DESK);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ReviewStatus;
  if (!id || !["APPROVED", "REJECTED", "PENDING"].includes(status)) return;

  await prisma.review.update({
    where: { id },
    data: {
      status,
      // A rejected review can never stay featured.
      ...(status !== "APPROVED" ? { featured: false } : {}),
    },
  });
  revalidate();
}

export async function toggleReviewFeatured(formData: FormData) {
  await requireStaff(DESK);
  const id = String(formData.get("id") ?? "");
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review || review.status !== "APPROVED") return;

  await prisma.review.update({
    where: { id },
    data: { featured: !review.featured },
  });
  revalidate();
}

export async function deleteReview(formData: FormData) {
  await requireStaff(DESK);
  const id = String(formData.get("id") ?? "");
  await prisma.review.delete({ where: { id } }).catch(() => null);
  revalidate();
}
