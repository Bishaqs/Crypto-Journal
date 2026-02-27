"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

interface SidebarFlyoutProps {
  triggerRef: RefObject<HTMLButtonElement | null>;
  sidebarWidth: number;
  onClose: () => void;
  children: ReactNode;
}

export function SidebarFlyout({ triggerRef, sidebarWidth, onClose, children }: SidebarFlyoutProps) {
  const flyoutRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [visible, setVisible] = useState(false);

  // Position the flyout relative to the trigger button
  useEffect(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const left = sidebarWidth + 8;
    let top = rect.top;

    // Clamp so flyout doesn't overflow below viewport
    const flyoutHeight = 400; // estimate max height
    if (top + flyoutHeight > window.innerHeight) {
      top = Math.max(8, window.innerHeight - flyoutHeight);
    }

    setPos({ top, left });
    // Trigger enter animation on next frame
    requestAnimationFrame(() => setVisible(true));
  }, [triggerRef, sidebarWidth]);

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        flyoutRef.current && !flyoutRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose, triggerRef]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!pos) return null;

  return createPortal(
    <div
      ref={flyoutRef}
      className="fixed z-[55] glass border border-border/50 rounded-2xl py-2 px-1 min-w-[220px] max-h-[70vh] overflow-y-auto transition-all duration-200"
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        left: pos.left,
        top: pos.top,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-8px)",
      }}
    >
      {children}
    </div>,
    document.body
  );
}
