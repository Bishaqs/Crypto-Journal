"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "stargate-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    // Hide during active tour
    const tourActive = sessionStorage.getItem("stargate-tour-active");
    if (!consent && !tourActive) {
      setVisible(true);
    }
  }, []);

  function accept(level: "all" | "essential") {
    localStorage.setItem(CONSENT_KEY, level);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div className="glass rounded-xl border border-border/50 p-5 max-w-lg w-full pointer-events-auto shadow-lg">
        <p className="text-xs text-muted mb-3">
          We use cookies and local storage to keep you signed in, remember your
          preferences, and improve your experience.{" "}
          <Link
            href="/privacy"
            className="text-accent hover:underline"
          >
            Privacy Policy
          </Link>
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-foreground font-medium">Essential</span>
              <span className="text-muted ml-2">
                Authentication, security
              </span>
            </div>
            <span className="text-muted/60 text-[10px] uppercase tracking-wider">
              Always on
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-foreground font-medium">Functional</span>
              <span className="text-muted ml-2">
                Theme, onboarding, UI state
              </span>
            </div>
            <span className="text-muted/60 text-[10px] uppercase tracking-wider">
              Opt-in
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => accept("essential")}
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-border/50 text-muted hover:text-foreground hover:border-border transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={() => accept("all")}
            className="flex-1 text-xs px-3 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
