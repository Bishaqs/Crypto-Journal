"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function ScarcityBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  const [tierName, setTierName] = useState("Founding");
  const [discount, setDiscount] = useState(50);

  useEffect(() => {
    // Check if dismissed this session
    if (sessionStorage.getItem("scarcity_banner_dismissed")) {
      setDismissed(true);
      return;
    }

    fetch("/api/waitlist/count")
      .then((r) => r.json())
      .then((data) => {
        if (data.tierRemaining !== undefined && data.tierRemaining > 0) {
          setSpotsLeft(data.tierRemaining);
          setTierName(data.currentTierName ?? "Founding 100");
          setDiscount(data.currentDiscount ?? 50);
        } else {
          setSpotsLeft(null);
        }
      })
      .catch(() => {
        setSpotsLeft(null);
      });
  }, []);

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("scarcity_banner_dismissed", "1");
  }

  if (dismissed || spotsLeft === null) return null;

  return (
    <div className="relative z-[60] bg-cyan-500 text-black text-center py-2.5 px-4 text-xs sm:text-sm font-medium">
      <a href="/quiz" className="hover:underline">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-black/50 animate-pulse" />
          Only {spotsLeft} {tierName} spots left at {discount}% off forever
          <span className="ml-1 opacity-70">&rarr;</span>
        </span>
      </a>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
