"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Rocket } from "lucide-react";
import { StargateLogo } from "@/components/stargate-logo";
import { useGuide } from "./guide-context";
import { useTour } from "@/lib/tour-context";
import type { TourStep } from "@/lib/tour-context";
import { StarWarpTransition } from "./star-warp";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const GUIDE_SIZE = 48;
const BUBBLE_WIDTH = 340;
const BUBBLE_GAP = 16;

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
    targetX = centerX - GUIDE_SIZE / 2;
    targetY = rect.top + rect.height + margin;
  }

  targetX = Math.max(8, Math.min(targetX, window.innerWidth - GUIDE_SIZE - 8));
  targetY = Math.max(8, Math.min(targetY, window.innerHeight - GUIDE_SIZE - 8));

  const homeX = window.innerWidth - 24 - GUIDE_SIZE / 2;
  const homeY = window.innerHeight - 24 - GUIDE_SIZE / 2;

  return {
    x: targetX + GUIDE_SIZE / 2 - homeX,
    y: targetY + GUIDE_SIZE / 2 - homeY,
  };
}

/* ── Calculate speech bubble position relative to guide ── */
function calcBubblePosition(
  guideAbsX: number,
  guideAbsY: number,
): { left: number; top: number; tail: "bottom-left" | "bottom-right" | "top-left" | "top-right" } {
  const vw = window.innerWidth;

  const aboveY = guideAbsY - BUBBLE_GAP - 10;
  const belowY = guideAbsY + GUIDE_SIZE + BUBBLE_GAP;

  const placeAbove = guideAbsY > 200;
  const top = placeAbove ? aboveY : belowY;

  let left = guideAbsX + GUIDE_SIZE / 2 - BUBBLE_WIDTH / 2;
  left = Math.max(8, Math.min(left, vw - BUBBLE_WIDTH - 8));

  const guideCenter = guideAbsX + GUIDE_SIZE / 2;
  const bubbleCenter = left + BUBBLE_WIDTH / 2;
  const isLeft = guideCenter <= bubbleCenter;

  const tail = placeAbove
    ? (isLeft ? "bottom-left" : "bottom-right")
    : (isLeft ? "top-left" : "top-right");

  return { left, top, tail };
}

/* ── Chat-style speech bubble (shared between centered and attached modes) ── */
function ChatBubble({
  step,
  currentStep,
  totalSteps,
  isLast,
  onNext,
  onPrev,
  onSkip,
  tail,
}: {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  tail?: "top" | "bottom";
}) {
  return (
    <div className="relative">
      {/* Tail pointing toward guide */}
      {tail === "top" && (
        <div
          className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
          style={{ background: "var(--surface-elevated, var(--surface))" }}
        />
      )}
      {tail === "bottom" && (
        <div
          className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
          style={{ background: "var(--surface-elevated, var(--surface))" }}
        />
      )}

      <div
        className="rounded-3xl relative overflow-hidden"
        style={{
          background: "var(--surface-elevated, var(--surface))",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        <div className="p-5">
          {/* Progress bar */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[10px] font-medium text-muted/60 tabular-nums">
              {currentStep + 1}/{totalSteps}
            </span>
            <div className="flex-1 h-0.5 bg-muted/10 rounded-full overflow-hidden max-w-[120px]">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Icon + title */}
          <div className="flex items-center gap-2.5 mb-2">
            {step.icon && <span className="text-xl">{step.icon}</span>}
            <h3 className="text-base font-bold text-foreground">{step.title}</h3>
          </div>

          {/* Content */}
          <p className="text-sm text-muted leading-relaxed mb-4">{step.content}</p>

          {/* Controls */}
          <div className="flex items-center justify-between">
            {step.showSkip ? (
              <button
                onClick={onSkip}
                className="text-xs text-muted/50 hover:text-muted transition-colors"
              >
                Skip tour
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={onPrev}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-muted hover:text-foreground hover:bg-surface-hover transition-all"
                >
                  <ArrowLeft size={12} />
                  Back
                </button>
              )}
              <button
                onClick={onNext}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-accent text-background text-xs font-semibold hover:bg-accent-hover transition-all"
              >
                {isLast ? (
                  <>
                    <Rocket size={12} />
                    {"Let's go!"}
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight size={12} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Guide with talking animation ── */
function GuideCharacterAnimated({
  size,
  isTalking,
  isFlying,
  glow,
  arrivalKey,
}: {
  size: number;
  isTalking: boolean;
  isFlying: boolean;
  glow: string;
  arrivalKey: number;
}) {
  const reducedMotion = useReducedMotion();

  // Reduced motion: static guide with glow, still clickable
  if (reducedMotion) {
    return (
      <div className="rounded-full" style={{ boxShadow: glow }}>
        <div className="drop-shadow-[0_0_8px_var(--accent-glow)]">
          <StargateLogo size={size} />
        </div>
      </div>
    );
  }

  // Idle: single gentle float. Talking/flying: full 3-layer animation.
  if (!isTalking && !isFlying) {
    return (
      <motion.div
        className="rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const }}
        style={{ boxShadow: "0 0 16px var(--accent-glow)" }}
      >
        <div className="drop-shadow-[0_0_8px_var(--accent-glow)]">
          <StargateLogo size={size} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="rounded-full overflow-visible">
      {/* Talking pulse or flying */}
      <motion.div
        animate={
          isFlying
            ? { scale: 1 }
            : { scale: [1, 1.08, 1, 1.05, 1] }
        }
        transition={
          isFlying
            ? { duration: 0.3 }
            : { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const }
        }
      >
        {/* Float + glow */}
        <motion.div
          className="rounded-full"
          animate={
            isFlying
              ? { y: 0, boxShadow: glow }
              : {
                    y: [0, -8, 0],
                    boxShadow: [
                      "0 0 20px var(--accent-glow)",
                      "0 0 36px var(--accent-glow), 0 0 64px var(--accent-glow)",
                      "0 0 20px var(--accent-glow)",
                    ],
                  }
          }
          transition={
            isFlying
              ? { duration: 0.3 }
              : { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const }
          }
        >
          {/* Tilt */}
          <motion.div
            animate={isFlying ? { rotate: 0 } : { rotate: [0, 4, -3, 0] }}
            transition={
              isFlying
                ? { duration: 0.3 }
                : { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const, times: [0, 0.3, 0.7, 1] }
            }
          >
            {/* Arrival bounce */}
            <motion.div
              key={arrivalKey}
              initial={isFlying ? { scale: 1.2 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring" as const, damping: 12, stiffness: 200 }}
            >
              <div className="drop-shadow-[0_0_8px_var(--accent-glow)]">
                <StargateLogo size={size} />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function StargateGuideCharacter() {
  const { state, toggleMenu } = useGuide();
  const { state: tourState, currentStepDef, nextStep, prevStep, skipTour, advanceStep } = useTour();
  const guideRef = useRef<HTMLDivElement>(null);
  const [isFlying, setIsFlying] = useState(false);
  const [flyOffset, setFlyOffset] = useState({ x: 0, y: 0 });
  const [arrivalKey, setArrivalKey] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [showStarWarp, setShowStarWarp] = useState(false);
  const wasCenteredRef = useRef(false);

  const [spotlightRect, setSpotlightRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    padding: number;
    radius: number;
  } | null>(null);

  useEffect(() => {
    if (guideRef.current) {
      (window as unknown as Record<string, unknown>).__stargateGuideEl = guideRef.current;
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

      setShowBubble(false);

      if (detail.home) {
        setIsFlying(false);
        setFlyOffset({ x: 0, y: 0 });
        setSpotlightRect(null);
        setIsCentered(false);
        return;
      }

      // Centered mode — guide + bubble rendered as centered dialog
      if (detail.centered) {
        setIsFlying(false);
        setFlyOffset({ x: 0, y: 0 });
        setSpotlightRect(null);
        setIsCentered(true);
        wasCenteredRef.current = true;
        setTimeout(() => setShowBubble(true), 200);
        return;
      }

      setIsCentered(false);

      if (!detail.rect) {
        setIsFlying(false);
        setFlyOffset({ x: 0, y: 0 });
        setSpotlightRect(null);
        setTimeout(() => setShowBubble(true), 200);
        return;
      }

      const rect = detail.rect as { top: number; left: number; width: number; height: number };
      const padding = (detail.padding as number) ?? 8;
      const radius = (detail.radius as number) ?? 12;

      setSpotlightRect({
        left: rect.left - padding,
        top: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        padding,
        radius,
      });

      const offset = calcTourOffset(rect, (detail.side as string) || "right");
      setFlyOffset(offset);
      setIsFlying(true);
      setArrivalKey((k) => k + 1);

      setTimeout(() => setShowBubble(true), 500);
    }

    window.addEventListener("tour-guide-fly", handleFly);
    return () => window.removeEventListener("tour-guide-fly", handleFly);
  }, []);

  // Reset wasCentered ref after the guide remounts from centered→attached
  useEffect(() => {
    if (!isCentered && wasCenteredRef.current) {
      // Reset after the initial prop is consumed on mount
      requestAnimationFrame(() => { wasCenteredRef.current = false; });
    }
  }, [isCentered]);

  // Listen for star warp trigger
  useEffect(() => {
    function handleWarp() {
      setShowBubble(false);
      setShowStarWarp(true);
    }
    window.addEventListener("tour-star-warp", handleWarp);
    return () => window.removeEventListener("tour-star-warp", handleWarp);
  }, []);

  const handleWarpComplete = useCallback(() => {
    setShowStarWarp(false);
    advanceStep();
  }, [advanceStep]);

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
  const isTourMode = state.mode === "tour" && tourState.isActive;
  const isTalking = isTourMode && showBubble;

  // Guide absolute position for attached bubble placement
  const homeX = typeof window !== "undefined" ? window.innerWidth - 24 - GUIDE_SIZE / 2 : 0;
  const homeY = typeof window !== "undefined" ? window.innerHeight - 24 - GUIDE_SIZE / 2 : 0;
  const guideAbsX = homeX + flyOffset.x - GUIDE_SIZE / 2;
  const guideAbsY = homeY + flyOffset.y - GUIDE_SIZE / 2;

  const bubblePos = calcBubblePosition(guideAbsX, guideAbsY);
  const isLast = tourState.currentStep >= tourState.totalSteps - 1;

  return (
    <>
      {/* ── Tour Overlay ── */}
      {isTourMode && (
        <>
          {/* Click blocker — only block in centered mode */}
          {isCentered && <div className="fixed inset-0 z-[997]" />}

          <AnimatePresence>
            {isCentered ? (
              /* Full dark overlay for centered mode — fully opaque for star-warp step */
              <motion.div
                key="centered-overlay"
                className="fixed inset-0 z-[998] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: currentStepDef?.transitionEffect === "star-warp"
                    ? "rgb(0, 0, 0)"
                    : "rgba(0, 0, 0, 0.75)",
                }}
              />
            ) : spotlightRect ? (
              <motion.div
                key="spotlight"
                className="fixed z-[998] pointer-events-none"
                initial={{
                  left: spotlightRect.left,
                  top: spotlightRect.top,
                  width: spotlightRect.width,
                  height: spotlightRect.height,
                  opacity: 0,
                }}
                animate={{
                  left: spotlightRect.left,
                  top: spotlightRect.top,
                  width: spotlightRect.width,
                  height: spotlightRect.height,
                  opacity: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "spring" as const,
                  damping: 25,
                  stiffness: 200,
                  opacity: { duration: 0.3 },
                }}
                style={{
                  borderRadius: spotlightRect.radius,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
                }}
              />
            ) : (
              <motion.div
                key="fulloverlay"
                className="fixed inset-0 z-[998] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ background: "rgba(0, 0, 0, 0.75)" }}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Centered Tour Dialog (welcome tour) ── */}
      <AnimatePresence mode="wait">
        {isTourMode && isCentered && showBubble && currentStepDef && (
          <motion.div
            key={`centered-${tourState.currentStep}`}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center pointer-events-auto px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Guide character — centered */}
            <motion.div
              className="mb-3"
              initial={{ scale: currentStepDef.logoSize && currentStepDef.logoSize > 56 ? 0.5 : 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" as const, damping: 18, stiffness: 200 }}
            >
              <GuideCharacterAnimated
                size={currentStepDef.logoSize ?? 56}
                isTalking={true}
                isFlying={false}
                glow={GLOW_BY_MODE.talking}
                arrivalKey={arrivalKey}
              />
            </motion.div>

            {/* Chat bubble */}
            <motion.div
              className="w-[380px] max-w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring" as const, damping: 25, stiffness: 300, delay: 0.05 }}
            >
              <ChatBubble
                step={currentStepDef}
                currentStep={tourState.currentStep}
                totalSteps={tourState.totalSteps}
                isLast={isLast}
                onNext={nextStep}
                onPrev={prevStep}
                onSkip={skipTour}
                tail="top"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Attached Tour Speech Bubble (page tours) ── */}
      <AnimatePresence mode="wait">
        {isTourMode && !isCentered && showBubble && currentStepDef && (
          <motion.div
            key={`bubble-${tourState.currentStep}`}
            className="fixed z-[999] pointer-events-auto"
            initial={{ opacity: 0, scale: 0.85, y: bubblePos.tail.startsWith("bottom") ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring" as const, damping: 25, stiffness: 300 }}
            style={{
              left: bubblePos.left,
              top: bubblePos.tail.startsWith("bottom") ? "auto" : bubblePos.top,
              bottom: bubblePos.tail.startsWith("bottom")
                ? (typeof window !== "undefined" ? window.innerHeight - guideAbsY + BUBBLE_GAP : 100)
                : "auto",
              width: BUBBLE_WIDTH,
              maxWidth: "90vw",
            }}
          >
            <ChatBubble
              step={currentStepDef}
              currentStep={tourState.currentStep}
              totalSteps={tourState.totalSteps}
              isLast={isLast}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={skipTour}
              tail={bubblePos.tail.startsWith("bottom") ? "bottom" : "top"}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Guide Character (bottom-right, used in attached mode + idle) ── */}
      {!isCentered && (
        <motion.div
          ref={guideRef}
          className={`fixed ${isTourMode ? "z-[999]" : "z-50"} ${isClickable ? "cursor-pointer" : ""}`}
          style={{ bottom: "24px", right: "24px" }}
          initial={
            wasCenteredRef.current
              ? {
                  x: (typeof window !== "undefined" ? window.innerWidth / 2 - GUIDE_SIZE / 2 : 0) - homeX,
                  y: (typeof window !== "undefined" ? window.innerHeight / 2 - GUIDE_SIZE / 2 : 0) - homeY,
                }
              : false
          }
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
          <GuideCharacterAnimated
            size={GUIDE_SIZE}
            isTalking={isTalking}
            isFlying={isFlying}
            glow={glow}
            arrivalKey={arrivalKey}
          />
        </motion.div>
      )}

      {/* ── Star Warp Transition ── */}
      {showStarWarp && <StarWarpTransition onComplete={handleWarpComplete} />}
    </>
  );
}
