"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { MANAGEMENT, requireStaff } from "@/lib/guards";
import { SETTING_DEFAULTS, type SettingKey } from "@/lib/settings";

export async function saveSettings(formData: FormData) {
  await requireStaff(MANAGEMENT);

  const keys = Object.keys(SETTING_DEFAULTS) as SettingKey[];
  await prisma.$transaction(
    keys
      .filter((key) => formData.has(key))
      .map((key) => {
        const value = String(formData.get(key) ?? "").trim();
        return prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      })
  );

  // Settings surface across the whole public site and the emails.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
