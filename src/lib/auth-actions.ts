"use server";

import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sendPasswordReset } from "@/lib/emails";
import { rateLimit } from "@/lib/rate-limit";

// Always lands on the same "sent" screen whether or not the account exists,
// so the form cannot be used to probe staff email addresses.
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();

  if (email && rateLimit(`pwreset:${email}`, 3, 60 * 60_000).ok) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = randomUUID();
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60_000),
        },
      });
      const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      await sendPasswordReset(
        email,
        `${base}/admin/reset-password?token=${token}`
      ).catch((error) => console.error("[email] password reset failed", error));
    }
  }

  redirect("/admin/forgot-password?sent=1");
}

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!token || password.length < 10) {
    redirect(`/admin/reset-password?token=${token}&error=weak`);
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    redirect("/admin/forgot-password?invalid=1");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record!.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/admin/login?reset=1");
}
