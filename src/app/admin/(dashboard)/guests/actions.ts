"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DESK, requireStaff } from "@/lib/guards";

export async function updateGuest(formData: FormData) {
  await requireStaff(DESK);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.guest.update({
    where: { id },
    data: {
      phone: String(formData.get("phone") ?? "").trim() || null,
      country: String(formData.get("country") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      marketingConsent: formData.get("marketingConsent") === "on",
    },
  });

  revalidatePath(`/admin/guests/${id}`);
  revalidatePath("/admin/guests");
  redirect(`/admin/guests/${id}?saved=1`);
}
