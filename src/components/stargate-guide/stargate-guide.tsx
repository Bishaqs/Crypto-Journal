"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StargateLogo } from "@/components/stargate-logo";
import { useGuide } from "./guide-context";

const HOME_POSITION = { x: 0, y: 0 };

const GLOW_BY_MODE = {
  idle: "0 0 16px var(--accent-glow)",
  talking: "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
  help: "0 0 20px var(--accent-glow)",
  onboarding: "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
  tour: "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
};

export function StargateGuideCharacter() {
  const { state, toggleMenu } = useGuide();
  const guideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (guideRef.current) {
      const el = guideRef.current;
      (window as unknown as Record<string, unknown>).__stargateGuideEl = el;
    }
    return () => {
      delete (window as unknown as Record<string, unknown>).__stargateGuideEl;
    };
  }, []);

  const handleClick = useCallback(() => {
    if (state.mode === "idle" || state.mode === "help") {
      toggleMenu();
    }
  }, [state.mode, toggleMenu]);

  if (!state.isVisible) return null;

  const isMoving = state.position !== "home";
  const targetPos =
    state.position === "home"
      ? HOME_POSITION
      : { x: state.position.x, y: state.position.y };

  const glowKey: keyof typeof GLOW_BY_MODE =
    (state.mode === "onboarding" || state.mode === "tour") && state.isSpeaking
      ? "talking"
      : state.mode;

  const glow = GLOW_BY_MODE[glowKey];
  const isClickable = state.mode === "idle" || state.mode === "help";

  return (
    <AnimatePresence>
      <motion.div
        ref={guideRef}
        className={`fixed z-50 ${isClickable ? "cursor-pointer" : ""}`}
        style={{
          bottom: isMoving ? "auto" : "24px",
          right: isMoving ? "auto" : "24px",
          top: isMoving ? 0 : "auto",
          left: isMoving ? "auto" : "auto",
        }}
        animate={
          isMoving
            ? { x: targetPos.x, y: targetPos.y }
            : { x: 0, y: 0 }
        }
        transition={{
          type: "spring" as const,
          damping: 25,
          stiffness: 200,
        }}
        onClick={handleClick}
        role={isClickable ? "button" : undefined}
        aria-label="Stargate Guide"
        tabIndex={isClickable ? 0 : -1}
        onKeyDown={(e) => {
          if (isClickable && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="rounded-full"
          animate={{ boxShadow: glow }}
          transition={{ duration: 0.5 }}
        >
          {/* Floating animation wrapper */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          >
            <div className="drop-shadow-[0_0_8px_var(--accent-glow)]">
              <StargateLogo size={48} />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
