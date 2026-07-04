import { z } from "zod";

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a yyyy-mm-dd date");

export const checkoutSchema = z.object({
  roomTypeSlug: z.string().min(1),
  checkIn: dateString,
  checkOut: dateString,
  adults: z.number().int().min(1).max(6),
  children: z.number().int().min(0).max(4),
  addOns: z
    .array(
      z.object({
        slug: z.string().min(1),
        quantity: z.number().int().min(1).max(5),
      })
    )
    .max(10)
    .default([]),
  guest: z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    email: z.string().trim().email().max(120),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    country: z.string().trim().max(60).optional().or(z.literal("")),
    marketingConsent: z.boolean().default(false),
  }),
  specialRequests: z.string().trim().max(1000).optional().or(z.literal("")),
  policyAccepted: z.literal(true, {
    errorMap: () => ({ message: "Please read and accept the cancellation policy." }),
  }),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const eventInquirySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  eventType: z.string().trim().min(1).max(60),
  eventDate: dateString.optional().or(z.literal("")),
  guestCount: z.number().int().min(1).max(500).optional(),
  message: z.string().trim().min(10).max(2000),
});
export type EventInquiryInput = z.infer<typeof eventInquirySchema>;
