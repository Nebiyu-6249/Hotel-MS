"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type State = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          subject: data.get("subject"),
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
        <p className="font-display text-xl text-parchment">Message received.</p>
        <p className="mt-2 font-sans text-[13px] text-parchment-dim">
          We answer within one working day. If it is urgent, call the front
          desk; someone is there around the clock.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="label-dark">
            Name
          </label>
          <input id="contact-name" name="name" required maxLength={80} className="field-dark" />
        </div>
        <div>
          <label htmlFor="contact-email" className="label-dark">
            Email
          </label>
          <input id="contact-email" name="email" type="email" required maxLength={120} className="field-dark" />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="label-dark">
          Subject (optional)
        </label>
        <input id="contact-subject" name="subject" maxLength={120} className="field-dark" />
      </div>
      <div>
        <label htmlFor="contact-message" className="label-dark">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          className="field-dark"
        />
      </div>
      {error && <p className="font-sans text-[13px] text-red-400">{error}</p>}
      <Button type="submit" variant="brass" size="lg" disabled={state === "sending"}>
        {state === "sending" ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
