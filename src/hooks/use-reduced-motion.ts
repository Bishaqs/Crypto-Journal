"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme-context";

export function useReducedMotion(): boolean {
  const { reducedMotion: appToggle } = useTheme();
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setOsReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setOsReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return appToggle || osReduced;
}
