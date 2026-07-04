import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEventInquiryAlert } from "@/lib/emails";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseDateParam } from "@/lib/utils";
import { eventInquirySchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`inquiry:${ip}`, 5, 10 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many inquiries in a row. Give it a few minutes." },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = eventInquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid inquiry." },
      { status: 400 }
    );
  }

  const inquiry = await prisma.eventInquiry.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      eventType: parsed.data.eventType,
      eventDate: parsed.data.eventDate ? parseDateParam(parsed.data.eventDate) : null,
      guestCount: parsed.data.guestCount ?? null,
      message: parsed.data.message,
    },
  });

  void sendEventInquiryAlert(inquiry).catch((error) =>
    console.error("[email] inquiry alert failed", error)
  );

  return NextResponse.json({ ok: true });
}
