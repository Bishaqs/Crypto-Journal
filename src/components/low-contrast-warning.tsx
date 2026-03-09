"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Palette, Moon, X } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useCosmetics, getAccentDef } from "@/lib/cosmetics";
import { isAccentLowContrast } from "@/lib/contrast-utils";
import Link from "next/link";

const DISMISS_PREFIX = "stargate-low-contrast-dismissed-";

export function LowContrastWarning() {
  const { theme, setTheme } = useTheme();
  const { equipped, definitions } = useCosmetics();
  const [dismissed, setDismissed] = useState(true);

  // Resolve equipped accent hex
  const accentHex = (() => {
    if (!equipped.theme_accent) return null;
    const def = definitions.find((d) => d.id === equipped.theme_accent);
    if (!def?.css_class) return null;
    return getAccentDef(def.css_class)?.accent ?? null;
  })();

  const lowContrast = accentHex ? isAccentLowContrast(theme, accentHex) : false;
  const dismissKey = `${DISMISS_PREFIX}${theme}-${equipped.theme_accent ?? "none"}`;

  useEffect(() => {
    if (!lowContrast) {
      setDismissed(true);
      return;
    }
    setDismissed(localStorage.getItem(dismissKey) === "true");
  }, [lowContrast, dismissKey]);

  if (dismissed || !lowContrast) return null;

  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 flex items-start gap-3">
      <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-foreground">
          Your accent color may be hard to see with this theme
        </p>
        <p className="text-xs text-muted">
          Icons, the logo, and text highlights use your accent color which has low contrast against the current background.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setTheme("obsidian")}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-foreground hover:border-amber-400/30 transition-all flex items-center gap-1.5"
          >
            <Moon size={12} />
            Switch to Dark theme
          </button>
          <Link
            href="/dashboard/profile"
            className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-foreground hover:border-amber-400/30 transition-all flex items-center gap-1.5"
          >
            <Palette size={12} />
            Change accent
          </Link>
          <button
            onClick={() => {
              localStorage.setItem(dismissKey, "true");
              setDismissed(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground transition-all flex items-center gap-1.5"
          >
            <X size={12} />
            Continue anyway
          </button>
        </div>
      </div>
    </div>
  );
}
