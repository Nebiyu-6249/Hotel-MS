import { cache } from "react";
import { prisma } from "@/lib/db";

// Every value the admin can edit under Settings, with sensible fallbacks so
// the site renders before the first seed and never crashes on a missing key.
export const SETTING_DEFAULTS = {
  property_name: "Hotel Transylvania",
  address_line: "Strada Castelului 1, Magura, Brasov County 507149, Romania",
  phone: "+40 368 566 210",
  email: "reservations@hoteltransylvania.ro",
  tax_rate_percent: "9",
  check_in_time: "15:00",
  check_out_time: "11:00",
  cancellation_policy:
    "Free cancellation until 7 days before check-in. Cancellations within 7 days of arrival are charged the first night. No-shows are charged in full. To cancel or change a booking, reply to your confirmation email or call the front desk with your booking reference.",
  best_rate_note: "Booking direct always gets you our best rate.",
  notification_email: "frontdesk@hoteltransylvania.ro",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = Record<SettingKey, string>;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await prisma.setting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...SETTING_DEFAULTS, ...stored } as Settings;
});

export function taxRatePercent(settings: Settings): number {
  const parsed = Number.parseFloat(settings.tax_rate_percent);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
