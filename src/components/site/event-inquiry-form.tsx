"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type State = "idle" | "sending" | "sent" | "error";

export function EventInquiryForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const guestCountRaw = String(data.get("guestCount") ?? "");
    try {
      const res = await fetch("/api/event-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          eventType: data.get("eventType"),
          eventDate: data.get("eventDate"),
          guestCount: guestCountRaw ? Number(guestCountRaw) : undefined,
          message: data.get("message"),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      form.reset();
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="border border-brass/40 bg-ink-soft p-6">
        <p className="font-display text-xl text-parchment">
          Inquiry received. Thank you.
        </p>
        <p className="mt-2 font-sans text-[13px] text-parchment-dim">
          Our events coordinator replies within two working days with dates,
          menus and a straight answer on price.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ev-name" className="label-dark">
            Name
          </label>
          <input id="ev-name" name="name" required maxLength={80} className="field-dark" />
        </div>
        <div>
          <label htmlFor="ev-email" className="label-dark">
            Email
          </label>
          <input id="ev-email" name="email" type="email" required maxLength={120} className="field-dark" />
        </div>
        <div>
          <label htmlFor="ev-phone" className="label-dark">
            Phone (optional)
          </label>
          <input id="ev-phone" name="phone" maxLength={30} className="field-dark" />
        </div>
        <div>
          <label htmlFor="ev-type" className="label-dark">
            Event type
          </label>
          <select id="ev-type" name="eventType" required className="field-dark">
            <option value="Wedding">Wedding</option>
            <option value="Corporate retreat">Corporate retreat</option>
            <option value="Private dinner">Private dinner</option>
            <option value="Family celebration">Family celebration</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="ev-date" className="label-dark">
            Preferred date (optional)
          </label>
          <input id="ev-date" name="eventDate" type="date" className="field-dark" />
        </div>
        <div>
          <label htmlFor="ev-guests" className="label-dark">
            Guest count (optional)
          </label>
          <input
            id="ev-guests"
            name="guestCount"
            type="number"
            min={1}
            max={500}
            className="field-dark"
          />
        </div>
      </div>
      <div>
        <label htmlFor="ev-message" className="label-dark">
          Tell us about the day
        </label>
        <textarea
          id="ev-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          className="field-dark"
          placeholder="What are you planning, roughly when, and what matters most to you?"
        />
      </div>
      {error && <p className="font-sans text-[13px] text-red-400">{error}</p>}
      <Button type="submit" variant="brass" size="lg" disabled={state === "sending"}>
        {state === "sending" ? "Sending..." : "Request Event Info"}
      </Button>
    </form>
  );
}
