"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StargateLogo } from "@/components/stargate-logo";
import { useGuide } from "./guide-context";

const GUIDE_SIZE = 48;

const GLOW_BY_MODE = {
  idle: "0 0 16px var(--accent-glow)",
  talking: "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
  help: "0 0 20px var(--accent-glow)",
  onboarding: "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
  tour: "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
};

/* ── Calculate where guide should fly relative to highlighted element ── */
function calcTourOffset(
  rect: { top: number; left: number; width: number; height: number },
  side: string,
): { x: number; y: number } {
  const margin = 16;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let targetX: number;
  let targetY: number;

  if (side.startsWith("right")) {
    targetX = rect.left + rect.width + margin;
    targetY = centerY - GUIDE_SIZE / 2;
  } else if (side.startsWith("left")) {
    targetX = rect.left - GUIDE_SIZE - margin;
    targetY = centerY - GUIDE_SIZE / 2;
  } else if (side.startsWith("top")) {
    targetX = centerX - GUIDE_SIZE / 2;
    targetY = rect.top - GUIDE_SIZE - margin;
  } else {
    // bottom or default
    targetX = centerX - GUIDE_SIZE / 2;
    targetY = rect.top + rect.height + margin;
  }

  // Clamp to viewport
  targetX = Math.max(8, Math.min(targetX, window.innerWidth - GUIDE_SIZE - 8));
  targetY = Math.max(8, Math.min(targetY, window.innerHeight - GUIDE_SIZE - 8));

  // Convert to offset from home position (bottom: 24, right: 24)
  const homeX = window.innerWidth - 24 - GUIDE_SIZE / 2;
  const homeY = window.innerHeight - 24 - GUIDE_SIZE / 2;

  return {
    x: targetX + GUIDE_SIZE / 2 - homeX,
    y: targetY + GUIDE_SIZE / 2 - homeY,
  };
}

export function StargateGuideCharacter() {
  const { state, toggleMenu, setMode, goHome } = useGuide();
  const guideRef = useRef<HTMLDivElement>(null);
  const [isFlying, setIsFlying] = useState(false);
  const [flyOffset, setFlyOffset] = useState({ x: 0, y: 0 });
  const [arrivalKey, setArrivalKey] = useState(0);

  // Expose ref to window for external position queries
  useEffect(() => {
    if (guideRef.current) {
      (window as unknown as Record<string, unknown>).__stargateGuideEl =
        guideRef.current;
    }
    return () => {
      delete (window as unknown as Record<string, unknown>).__stargateGuideEl;
    };
  }, []);

  // Listen for tour flight events
  useEffect(() => {
    function handleFly(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;

      if (detail.home) {
        // Tour ended — return home
        setIsFlying(false);
        setFlyOffset({ x: 0, y: 0 });
        return;
      }

      if (!detail.rect) {
        // Floating step (no selector) — stay home
        setIsFlying(false);
        setFlyOffset({ x: 0, y: 0 });
        return;
      }

      const offset = calcTourOffset(detail.rect, detail.side || "right");
      setFlyOffset(offset);
      setIsFlying(true);
      setArrivalKey((k) => k + 1);
    }

    window.addEventListener("tour-guide-fly", handleFly);
    return () => window.removeEventListener("tour-guide-fly", handleFly);
  }, []);

  const handleClick = useCallback(() => {
    if (state.mode === "idle" || state.mode === "help") {
      toggleMenu();
    }
  }, [state.mode, toggleMenu]);

  if (!state.isVisible) return null;

  const glowKey: keyof typeof GLOW_BY_MODE =
    (state.mode === "onboarding" || state.mode === "tour") && state.isSpeaking
      ? "talking"
      : state.mode;

  const glow = GLOW_BY_MODE[glowKey];
  const isClickable = state.mode === "idle" || state.mode === "help";
  const isTourMode = state.mode === "tour";

  return (
    <AnimatePresence>
      <motion.div
        ref={guideRef}
        className={`fixed ${isTourMode ? "z-[999]" : "z-50"} ${isClickable ? "cursor-pointer" : ""}`}
        style={{ bottom: "24px", right: "24px" }}
        animate={
          isFlying
            ? { x: flyOffset.x, y: flyOffset.y }
            : { x: 0, y: 0 }
        }
        transition={{
          type: "spring" as const,
          damping: 22,
          stiffness: 180,
          mass: 0.8,
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
          {/* Breathing scale pulse — 4s cycle */}
          <motion.div
            animate={isFlying ? { scale: 1 } : { scale: [1, 1.06, 1] }}
            transition={
              isFlying
                ? { duration: 0.3 }
                : {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                  }
            }
          >
            {/* Vertical float — 3s cycle */}
            <motion.div
              animate={isFlying ? { y: 0 } : { y: [0, -8, 0] }}
              transition={
                isFlying
                  ? { duration: 0.3 }
                  : {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut" as const,
                    }
              }
            >
              {/* Rotation tilt — 6s cycle */}
              <motion.div
                animate={
                  isFlying
                    ? { rotate: 0 }
                    : { rotate: [0, 4, -3, 0] }
                }
                transition={
                  isFlying
                    ? { duration: 0.3 }
                    : {
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut" as const,
                        times: [0, 0.3, 0.7, 1],
                      }
                }
              >
                {/* Horizontal curiosity sway — 8s cycle */}
                <motion.div
                  animate={
                    isFlying
                      ? { x: 0 }
                      : { x: [0, 4, -3, 0] }
                  }
                  transition={
                    isFlying
                      ? { duration: 0.3 }
                      : {
                          duration: 8,
                          repeat: Infinity,
                          ease: "easeInOut" as const,
                          times: [0, 0.25, 0.6, 1],
                        }
                  }
                >
                  {/* Arrival settle bounce */}
                  <motion.div
                    key={arrivalKey}
                    initial={isFlying ? { scale: 1.2 } : false}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring" as const,
                      damping: 12,
                      stiffness: 200,
                    }}
                  >
                    <div className="drop-shadow-[0_0_8px_var(--accent-glow)]">
                      <StargateLogo size={GUIDE_SIZE} />
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
