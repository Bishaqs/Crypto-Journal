"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type TailDirection = "bottom-left" | "bottom-right" | "top-left" | "top-right";

type SpeechBubbleProps = {
  visible: boolean;
  title?: string;
  body?: string;
  children?: ReactNode;
  onClose?: () => void;
  tail?: TailDirection;
  className?: string;
  maxHeight?: string;
};

export function SpeechBubble({
  visible,
  title,
  body,
  children,
  onClose,
  tail = "bottom-left",
  className = "",
  maxHeight = "80vh",
}: SpeechBubbleProps) {
  const isBottom = tail.startsWith("bottom");
  const isLeft = tail.endsWith("left");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: isBottom ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: isBottom ? 10 : -10 }}
          transition={{ type: "spring" as const, damping: 25, stiffness: 300 }}
          className={`glass rounded-2xl border border-border/50 w-[340px] max-w-[90vw] relative ${className}`}
          style={{
            boxShadow: "var(--shadow-card)",
            maxHeight,
          }}
        >
          {/* Tail triangle */}
          <div
            className="absolute w-3 h-3 rotate-45 border-border/50 glass"
            style={{
              [isBottom ? "bottom" : "top"]: "-6px",
              [isLeft ? "left" : "right"]: "24px",
              borderBottom: isBottom ? "1px solid" : "none",
              borderRight: isBottom && !isLeft ? "1px solid" : "none",
              borderLeft: isBottom && isLeft ? "1px solid" : "none",
              borderTop: !isBottom ? "1px solid" : "none",
              borderColor: "var(--border)",
              background: "var(--background)",
            }}
          />

          <div className="p-5 overflow-y-auto" style={{ maxHeight }}>
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all z-10"
              >
                <X size={14} />
              </button>
            )}

            {/* Title */}
            {title && (
              <h3 className="text-sm font-bold text-foreground mb-2 pr-6">
                {title}
              </h3>
            )}

            {/* Body text */}
            {body && (
              <p className="text-xs text-muted leading-relaxed mb-3">{body}</p>
            )}

            {/* Action area / custom content */}
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
