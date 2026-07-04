import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendContactAlert } from "@/lib/emails";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many messages in a row. Give it a few minutes." },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message." },
      { status: 400 }
    );
  }

  const message = await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    },
  });

  void sendContactAlert(message).catch((error) =>
    console.error("[email] contact alert failed", error)
  );

  return NextResponse.json({ ok: true });
}
