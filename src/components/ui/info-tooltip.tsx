"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { useHelpCenterSafe } from "@/lib/help-center-context";

const TOOLTIP_W = 256; // w-64
const PAD = 8;
const GAP = 8;

export function LabelWithInfo({
  label,
  info,
  articleId,
  className = "block text-xs text-muted mb-2",
}: {
  label: string;
  info: string;
  articleId?: string;
  className?: string;
}) {
  return (
    <label className={`${className} flex items-center gap-1`}>
      {label}
      <InfoTooltip text={info} articleId={articleId} />
    </label>
  );
}

export function InfoTooltip({
  text,
  size = 14,
  position = "below",
  articleId,
}: {
  text: string;
  size?: number;
  position?: "above" | "below";
  articleId?: string;
}) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { openArticle } = useHelpCenterSafe();

  useEffect(() => {
    if (!show || !btnRef.current) { setCoords(null); return; }
    const rect = btnRef.current.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    left = Math.max(PAD, Math.min(left, window.innerWidth - TOOLTIP_W - PAD));
    const top = position === "below" ? rect.bottom + GAP : rect.top - GAP;
    setCoords({ top, left });
  }, [show, position]);

  function handleClick() {
    if (articleId) {
      openArticle(articleId);
    } else {
      setShow(!show);
    }
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={handleClick}
        className="text-muted/50 hover:text-muted transition-colors"
      >
        <Info size={size} />
      </button>
      {show && coords && createPortal(
        <span
          style={{ position: "fixed", top: coords.top, left: coords.left, width: TOOLTIP_W }}
          className={`${position === "above" ? "-translate-y-full" : ""} px-3 py-2 rounded-xl text-xs text-foreground bg-surface border border-border shadow-lg z-50 pointer-events-none whitespace-normal`}
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}
