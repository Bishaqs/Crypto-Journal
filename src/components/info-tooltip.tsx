"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

export function InfoTooltip({
  text,
  heading = "Why track this?",
  size = 12,
}: {
  text: string;
  heading?: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <span className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="p-0.5 rounded text-muted/40 hover:text-accent/70 transition-colors"
        aria-label={heading}
      >
        <Info size={size} />
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-64 p-3 rounded-xl glass border border-accent/20 shadow-lg text-left"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
        >
          <div className="text-[10px] font-semibold text-accent mb-1">{heading}</div>
          <p className="text-[11px] text-muted leading-relaxed">{text}</p>
        </div>
      )}
    </span>
  );
}

/**
 * Helper to render a label with an info tooltip inline.
 * Usage: <LabelWithInfo label="Confidence" info="Confidence tracking reveals..." />
 */
export function LabelWithInfo({
  label,
  info,
  className = "block text-xs text-muted mb-2",
}: {
  label: string;
  info: string;
  className?: string;
}) {
  return (
    <label className={`${className} flex items-center gap-1`}>
      {label}
      <InfoTooltip text={info} />
    </label>
  );
}
