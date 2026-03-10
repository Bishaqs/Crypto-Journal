"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  icon?: React.ReactNode;
  className?: string;
  minWidth?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  icon,
  className = "",
  minWidth = "140px",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`} style={{ minWidth }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 pl-3 pr-2 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all cursor-pointer text-left"
      >
        {icon && <span className="text-muted shrink-0">{icon}</span>}
        <span className="flex-1 truncate">{selected?.label ?? "Select..."}</span>
        <ChevronDown
          size={14}
          className={`text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[100] rounded-xl bg-surface border border-border shadow-lg overflow-hidden">
          <div className="max-h-[240px] overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  opt.value === value
                    ? "text-accent bg-accent/5"
                    : "text-foreground hover:bg-surface-hover"
                }`}
              >
                <Check
                  size={14}
                  className={`shrink-0 ${opt.value === value ? "opacity-100" : "opacity-0"}`}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
