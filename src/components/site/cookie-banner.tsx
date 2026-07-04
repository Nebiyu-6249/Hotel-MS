"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "ht-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      // Storage unavailable (private mode with restrictions): stay quiet.
    }
  }, []);

  function decide(analytics: boolean) {
    try {
      window.localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ analytics, decidedAt: new Date().toISOString() })
      );
    } catch {
      // Ignore; the banner simply reappears next visit.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-parchment/15 bg-ink-raised p-4 sm:p-5"
    >
      <div className="site-container flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <p className="flex-1 font-sans text-[13px] leading-relaxed text-parchment-dim">
          We use a strictly necessary cookie to run the booking process, and
          optional analytics cookies to see which pages help guests most.
          Details are in our{" "}
          <Link href="/privacy" className="text-brass underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => decide(false)}>
            Essential only
          </Button>
          <Button variant="brass" size="sm" onClick={() => decide(true)}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
