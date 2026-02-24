"use client";

import { Info } from "lucide-react";
import { useNextStep } from "nextstepjs";
import { TOUR_KEY_PREFIX } from "@/lib/onboarding";

export function PageInfoButton({ tourName }: { tourName: string }) {
  const { startNextStep } = useNextStep();

  return (
    <button
      onClick={() => {
        localStorage.removeItem(TOUR_KEY_PREFIX + tourName);
        setTimeout(() => startNextStep(tourName), 100);
      }}
      className="p-1.5 rounded-lg text-muted/50 hover:text-accent hover:bg-accent/10 transition-all"
      title="Take a quick tour of this page"
    >
      <Info size={16} />
    </button>
  );
}
