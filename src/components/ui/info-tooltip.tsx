"use client";

import { useState } from "react";
import { Info } from "lucide-react";

export function InfoTooltip({ text, size = 14 }: { text: string; size?: number }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-muted/50 hover:text-muted transition-colors"
      >
        <Info size={size} />
      </button>
      {show && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 px-3 py-2 rounded-xl text-xs text-foreground bg-surface border border-border shadow-lg z-50 pointer-events-none whitespace-normal">
          {text}
        </span>
      )}
    </span>
  );
}
