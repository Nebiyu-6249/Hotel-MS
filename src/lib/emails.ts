import { Resend } from "resend";
import type { BookingWithRelations } from "@/lib/booking";
import { getSettings } from "@/lib/settings";
import { eur, formatDateLong, nightsBetween } from "@/lib/utils";

const FROM =
  process.env.EMAIL_FROM ?? "Hotel Transylvania <reservations@hoteltransylvania.ro>";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Development fallback: no key configured, log instead of sending.
    const preview = params.html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
    console.info(`[email:dev] to=${params.to} subject="${params.subject}"\n${preview}`);
    return;
  }
  const resend = new Resend(key);
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

// ---------- Template shell ----------

function shell(title: string, body: string, footerLine: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#efe9dd;font-family:Georgia,'Times New Roman',serif;color:#241e19;">
    <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
      <div style="background:#191512;color:#ede4d3;padding:28px 32px;text-align:center;">
        <div style="font-size:11px;letter-spacing:3px;color:#c19a5b;">EST. 1867 &middot; CARPATHIAN MOUNTAINS</div>
        <div style="font-size:24px;margin-top:8px;letter-spacing:1px;">HOTEL TRANSYLVANIA</div>
      </div>
      <div style="background:#fffdf8;padding:32px;border:1px solid #ddd2bf;border-top:none;">
        <h1 style="font-size:20px;font-weight:normal;margin:0 0 16px;">${title}</h1>
        ${body}
      </div>
      <div style="padding:20px 8px;text-align:center;font-size:12px;color:#7a6f5d;line-height:1.6;">
        ${footerLine}
      </div>
    </div>
  </body>
</html>`;
}

function row(label: string, value: string, strong = false): string {
  const weight = strong ? "font-weight:bold;" : "";
  return `<tr>
    <td style="padding:6px 0;color:#7a6f5d;font-size:14px;">${label}</td>
    <td style="padding:6px 0;text-align:right;font-size:14px;${weight}">${value}</td>
  </tr>`;
}

function bookingTable(booking: BookingWithRelations, taxLabel: string): string {
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const addOnRows = booking.addOns
    .map((line) =>
      row(
        `${line.addOn.name}${line.quantity > 1 ? ` (x${line.quantity})` : ""}`,
        eur(line.totalCents)
      )
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
    ${row("Booking reference", booking.reference, true)}
    ${row("Room", booking.roomType.name)}
    ${row("Check-in", formatDateLong(booking.checkIn))}
    ${row("Check-out", formatDateLong(booking.checkOut))}
    ${row("Guests", `${booking.adults} adult${booking.adults === 1 ? "" : "s"}${booking.children ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""}`)}
    ${row(`Room, ${nights} night${nights === 1 ? "" : "s"}`, eur(booking.subtotalCents))}
    ${addOnRows}
    ${row(taxLabel, eur(booking.taxCents))}
    <tr><td colspan="2" style="border-top:1px solid #ddd2bf;padding:0;"></td></tr>
    ${row("Total paid", eur(booking.totalCents), true)}
  </table>`;
}

// ---------- Guest-facing emails ----------

export async function sendBookingConfirmation(booking: BookingWithRelations) {
  const settings = await getSettings();
  const body = `
    <p style="font-size:15px;line-height:1.6;">Dear ${booking.guest.firstName},</p>
    <p style="font-size:15px;line-height:1.6;">Your room is reserved. Keep the reference below; the front desk will ask for it at check-in and if you need to change anything.</p>
    ${bookingTable(booking, `VAT (${settings.tax_rate_percent}%)`)}
    <p style="font-size:14px;line-height:1.6;color:#7a6f5d;">Check-in from ${settings.check_in_time}, check-out by ${settings.check_out_time}. ${settings.cancellation_policy}</p>
    <p style="font-size:15px;line-height:1.6;">We look forward to having you. If you are arriving after dark, call us and we will leave the gate lanterns lit.</p>
    <p style="font-size:15px;line-height:1.6;">The team at ${settings.property_name}</p>`;
  await sendEmail({
    to: booking.guest.email,
    subject: `Booking confirmed: ${booking.reference}`,
    html: shell(
      "Your booking is confirmed",
      body,
      `${settings.address_line}<br/>${settings.phone} &middot; ${settings.email}`
    ),
  });
}

export async function sendBookingCancelled(booking: BookingWithRelations) {
  const settings = await getSettings();
  const body = `
    <p style="font-size:15px;line-height:1.6;">Dear ${booking.guest.firstName},</p>
    <p style="font-size:15px;line-height:1.6;">Booking <strong>${booking.reference}</strong> for ${formatDateLong(booking.checkIn)} to ${formatDateLong(booking.checkOut)} has been cancelled.</p>
    <p style="font-size:15px;line-height:1.6;">Any refund due under our cancellation policy is on its way back to your original payment method and usually arrives within 5 to 10 business days.</p>
    <p style="font-size:15px;line-height:1.6;">If this was not expected, call us and we will sort it out.</p>`;
  await sendEmail({
    to: booking.guest.email,
    subject: `Booking cancelled: ${booking.reference}`,
    html: shell(
      "Booking cancelled",
      body,
      `${settings.address_line}<br/>${settings.phone} &middot; ${settings.email}`
    ),
  });
}

// ---------- Staff alerts ----------

export async function sendAdminNewBooking(booking: BookingWithRelations) {
  const settings = await getSettings();
  const body = `
    <p style="font-size:15px;line-height:1.6;">New paid booking from the website.</p>
    ${bookingTable(booking, `VAT (${settings.tax_rate_percent}%)`)}
    <p style="font-size:14px;color:#7a6f5d;">Guest: ${booking.guest.firstName} ${booking.guest.lastName}, ${booking.guest.email}${booking.guest.phone ? `, ${booking.guest.phone}` : ""}</p>
    ${booking.specialRequests ? `<p style="font-size:14px;color:#7a6f5d;">Requests: ${booking.specialRequests}</p>` : ""}`;
  await sendEmail({
    to: settings.notification_email,
    subject: `New booking ${booking.reference}: ${booking.roomType.name}, ${formatDateLong(booking.checkIn)}`,
    html: shell("New booking", body, "Sent by the booking engine"),
  });
}

export async function sendEventInquiryAlert(inquiry: {
  name: string;
  email: string;
  phone?: string | null;
  eventType: string;
  eventDate?: Date | null;
  guestCount?: number | null;
  message: string;
}) {
  const settings = await getSettings();
  const body = `
    <p style="font-size:15px;line-height:1.6;">New event inquiry from the website.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      ${row("Name", inquiry.name)}
      ${row("Email", inquiry.email)}
      ${inquiry.phone ? row("Phone", inquiry.phone) : ""}
      ${row("Event", inquiry.eventType)}
      ${inquiry.eventDate ? row("Date", formatDateLong(inquiry.eventDate)) : ""}
      ${inquiry.guestCount ? row("Guests", String(inquiry.guestCount)) : ""}
    </table>
    <p style="font-size:14px;line-height:1.6;">${inquiry.message}</p>`;
  await sendEmail({
    to: settings.notification_email,
    subject: `Event inquiry: ${inquiry.eventType} from ${inquiry.name}`,
    html: shell("Event inquiry", body, "Sent by the website"),
  });
}

export async function sendContactAlert(message: {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}) {
  const settings = await getSettings();
  const body = `
    <p style="font-size:14px;color:#7a6f5d;">From ${message.name} (${message.email})</p>
    <p style="font-size:15px;line-height:1.6;">${message.message}</p>`;
  await sendEmail({
    to: settings.notification_email,
    subject: `Contact form: ${message.subject || "New message"}`,
    html: shell(message.subject || "New message", body, "Sent by the website"),
  });
}

export async function sendPasswordReset(email: string, link: string) {
  const body = `
    <p style="font-size:15px;line-height:1.6;">A password reset was requested for your staff account. The link below works once and expires in one hour.</p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${link}" style="background:#191512;color:#ede4d3;padding:12px 28px;text-decoration:none;font-size:14px;letter-spacing:1px;">Set a new password</a>
    </p>
    <p style="font-size:13px;color:#7a6f5d;line-height:1.6;">If you did not request this, you can ignore this email; your password stays as it is.</p>`;
  await sendEmail({
    to: email,
    subject: "Reset your staff password",
    html: shell("Reset your password", body, "Hotel Transylvania back office"),
  });
}
