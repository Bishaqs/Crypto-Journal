"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Rocket } from "lucide-react";
import { TraverseLogo } from "@/components/traverse-logo";
import { useGuide } from "./guide-context";
import { useNovaNudge } from "./use-nova-nudge";
import { useTour, getEffectiveLayout } from "@/lib/tour-context";
import { useI18n } from "@/lib/i18n";
import type { TourStep } from "@/lib/tour-context";
import { StarWarpTransition } from "./star-warp";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const GUIDE_SIZE = 48;
const BUBBLE_WIDTH = 380;
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
  const margin = 24;
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
  align?: "left" | "center",
  targetRect?: { left: number; width: number } | null,
  spotlightPadding?: number,
): { left: number; top: number; tail: "bottom-left" | "bottom-right" | "top-left" | "top-right" } {
  const vw = window.innerWidth;

  const aboveY = guideAbsY - BUBBLE_GAP - 10;
  const belowY = guideAbsY + GUIDE_SIZE + BUBBLE_GAP;

  const placeAbove = guideAbsY > 200;
  const top = placeAbove ? aboveY : belowY;

  let left: number;
  if (align === "left" && targetRect) {
    // Clear the spotlight area: target edge + spotlight padding + visual gap
    left = targetRect.left + targetRect.width + (spotlightPadding ?? 0) + 16;
  } else {
    left = guideAbsX + GUIDE_SIZE / 2 - BUBBLE_WIDTH / 2;
  }
  left = Math.max(8, Math.min(left, vw - BUBBLE_WIDTH - 8));

  const guideCenter = guideAbsX + GUIDE_SIZE / 2;
  const bubbleCenter = left + BUBBLE_WIDTH / 2;
  const isLeft = guideCenter <= bubbleCenter;

  const tail = placeAbove
    ? (isLeft ? "bottom-left" : "bottom-right")
    : (isLeft ? "top-left" : "top-right");

  return { left, top, tail };
}

/* ── Glassmorphic Tour Card ── */
function TourCard({
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
  tail?: "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const { t } = useI18n();
  const title = step.titleKey ? t(step.titleKey) : step.title;
  const content = step.contentKey ? t(step.contentKey) : step.content;
  const skipLabel = t("tours.skipTour");

  // Parse tail direction
  const isTop = tail?.startsWith("top");
  const isBottom = tail?.startsWith("bottom");
  const isRight = tail?.includes("right");
  const isLeft = tail?.includes("left") && !isRight;
  const horizontalClass = isRight ? "right-4" : isLeft ? "left-4" : "left-1/2 -translate-x-1/2";

  return (
    <div className="relative">
      {/* Tail pointing toward guide */}
      {isTop && (
        <div
          className={`absolute -top-[6px] ${horizontalClass} w-3 h-3 rotate-45 z-[-1]`}
          style={{ background: "rgba(15, 23, 42, 0.85)" }}
        />
      )}
      {isBottom && (
        <div
          className={`absolute -bottom-[6px] ${horizontalClass} w-3 h-3 rotate-45 z-[-1]`}
          style={{ background: "rgba(15, 23, 42, 0.85)" }}
        />
      )}

      <div className="tour-card">
        {/* Segmented progress dots */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex items-center gap-1 flex-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                className="h-1 rounded-full"
                animate={{
                  width: i === currentStep ? 20 : 8,
                  background:
                    i <= currentStep
                      ? "var(--accent)"
                      : "rgba(255, 255, 255, 0.15)",
                  boxShadow:
                    i === currentStep
                      ? "0 0 8px var(--accent-glow)"
                      : "none",
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            ))}
          </div>
          <span className="text-[10px] font-medium text-muted/50 tabular-nums whitespace-nowrap">
            {currentStep + 1} of {totalSteps}
          </span>
        </div>

        {/* Icon + title */}
        <motion.div
          className="flex items-center gap-2.5 mb-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          {step.icon && <span className="text-xl">{step.icon}</span>}
          <h3 className="text-base font-bold text-foreground">{title}</h3>
        </motion.div>

        {/* Content */}
        <motion.p
          className="text-sm text-muted leading-relaxed mb-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {content}
        </motion.p>

        {/* Controls */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          {step.showSkip ? (
            <button
              onClick={onSkip}
              className="text-xs text-muted/40 hover:text-muted/70 transition-colors"
            >
              {skipLabel}
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            {currentStep > 0 && (
              <motion.button
                onClick={onPrev}
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-muted hover:text-foreground hover:bg-white/5 transition-all"
              >
                <ArrowLeft size={12} />
                Back
              </motion.button>
            )}
            <motion.button
              onClick={onNext}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isLast
                  ? "bg-accent text-background tour-cta-shimmer"
                  : "bg-accent text-background hover:bg-accent-hover"
              }`}
              style={isLast ? { position: "relative", overflow: "hidden" } : undefined}
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
            </motion.button>
          </div>
        </motion.div>
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
          <TraverseLogo size={size} />
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
          <TraverseLogo size={size} />
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
                <TraverseLogo size={size} />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function TraverseGuideCharacter() {
  const { state, toggleMenu } = useGuide();
  useNovaNudge();
  const hasNudge = state.novaNudge !== null;
  const { state: tourState, currentStepDef, stepTarget, nextStep, prevStep, skipTour, advanceStep } = useTour();
  const guideRef = useRef<HTMLDivElement>(null);
  const [isFlying, setIsFlying] = useState(false);
  const [flyOffset, setFlyOffset] = useState({ x: 0, y: 0 });
  const [arrivalKey, setArrivalKey] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [showStarWarp, setShowStarWarp] = useState(false);
  const [pendingFly, setPendingFly] = useState(false);
  const wasCenteredRef = useRef(false);
  const needsTargetRef = useRef(false);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [spotlightRect, setSpotlightRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    padding: number;
    radius: number;
  } | null>(null);

  // Expose guide element on window for external access
  useEffect(() => {
    if (guideRef.current) {
      (window as unknown as Record<string, unknown>).__traverseGuideEl = guideRef.current;
    }
    return () => {
      delete (window as unknown as Record<string, unknown>).__traverseGuideEl;
    };
  }, []);

  const isTourMode = state.mode === "tour" && tourState.isActive;

  // ── Step change: hide bubble and prepare for transition ──
  useEffect(() => {
    // Clear any pending bubble timer from previous step
    if (bubbleTimerRef.current) {
      clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = null;
    }

    if (!isTourMode || !currentStepDef) {
      needsTargetRef.current = false;
      setShowBubble(false);
      setIsFlying(false);
      setFlyOffset({ x: 0, y: 0 });
      setIsCentered(false);
      setSpotlightRect(null);
      return;
    }

    const layout = getEffectiveLayout(currentStepDef);
    setShowBubble(false);

    if (layout === "fullscreen") {
      setIsFlying(false);
      setFlyOffset({ x: 0, y: 0 });
      setIsCentered(true);
      wasCenteredRef.current = true;

      if (currentStepDef.selector) {
        // Fullscreen with spotlight target — wait for stepTarget
        needsTargetRef.current = true;
      } else {
        // Pure fullscreen — show bubble now
        needsTargetRef.current = false;
        setSpotlightRect(null);
        const timer = setTimeout(() => setShowBubble(true), 200);
        return () => clearTimeout(timer);
      }
    } else {
      // Spotlight mode
      setIsCentered(false);

      if (currentStepDef.selector) {
        needsTargetRef.current = true;
        // Hold guide at center position if transitioning from centered to spotlight
        setPendingFly(wasCenteredRef.current);
      } else {
        // Spotlight with no selector — show at home
        needsTargetRef.current = false;
        setIsFlying(false);
        setFlyOffset({ x: 0, y: 0 });
        setSpotlightRect(null);
        const timer = setTimeout(() => setShowBubble(true), 200);
        return () => clearTimeout(timer);
      }
    }
  }, [isTourMode, tourState.currentStep, currentStepDef]);

  // ── stepTarget arrived: position guide and show bubble ──
  useEffect(() => {
    if (!isTourMode || !currentStepDef || !stepTarget) return;

    const layout = getEffectiveLayout(currentStepDef);
    const p = stepTarget.padding;

    // Always update spotlight rect (handles resize too)
    setSpotlightRect({
      left: stepTarget.rect.left - p,
      top: stepTarget.rect.top - p,
      width: stepTarget.rect.width + p * 2,
      height: stepTarget.rect.height + p * 2,
      padding: p,
      radius: stepTarget.radius,
    });

    if (layout === "spotlight") {
      // Update guide position
      const offset = calcTourOffset(stepTarget.rect, stepTarget.side);
      setFlyOffset(offset);

      if (needsTargetRef.current) {
        // Initial target arrival — full transition
        needsTargetRef.current = false;
        setPendingFly(false);
        setIsFlying(true);
        setArrivalKey((k) => k + 1);
        // Use ref-based timer — scroll/resize re-triggering stepTarget must NOT cancel this
        bubbleTimerRef.current = setTimeout(() => {
          setShowBubble(true);
          bubbleTimerRef.current = null;
        }, 350);
      }
      // Resize — position already updated
    } else if (needsTargetRef.current) {
      // Fullscreen with selector — target arrived
      needsTargetRef.current = false;
      bubbleTimerRef.current = setTimeout(() => {
        setShowBubble(true);
        bubbleTimerRef.current = null;
      }, 200);
    }
  }, [isTourMode, stepTarget, currentStepDef]);

  // Reset wasCentered ref after the guide remounts from centered -> attached
  useEffect(() => {
    if (!isCentered && wasCenteredRef.current) {
      requestAnimationFrame(() => {
        wasCenteredRef.current = false;
      });
    }
  }, [isCentered]);

  // ── Star warp trigger ──
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

  // ── Keyboard navigation during tour ──
  useEffect(() => {
    if (!isTourMode) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      } else if (e.key === "Escape") {
        e.preventDefault();
        skipTour();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourMode, nextStep, prevStep, skipTour]);

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
  const isTalking = isTourMode && showBubble;

  // Guide absolute position for attached bubble placement
  const homeX = typeof window !== "undefined" ? window.innerWidth - 24 - GUIDE_SIZE / 2 : 0;
  const homeY = typeof window !== "undefined" ? window.innerHeight - 24 - GUIDE_SIZE / 2 : 0;
  const guideAbsX = homeX + flyOffset.x - GUIDE_SIZE / 2;
  const guideAbsY = homeY + flyOffset.y - GUIDE_SIZE / 2;

  const bubblePos = calcBubblePosition(guideAbsX, guideAbsY, currentStepDef?.bubbleAlign, stepTarget?.rect, stepTarget?.padding);
  const isLast = tourState.currentStep >= tourState.totalSteps - 1;

  return (
    <>
      {/* ── Tour Overlay ── */}
      {isTourMode && (
        <>
          {/* Click blocker — prevents background clicks (drawer backdrop, sidebar) during tour */}
          <div className="fixed inset-0 z-[997]" />

          <AnimatePresence>
            {isCentered ? (
              /* Full dark overlay for centered mode */
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
                  damping: 30,
                  stiffness: 250,
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

      {/* ── Centered Tour Dialog (fullscreen layout) ── */}
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

            {/* Tour card */}
            <motion.div
              className="w-[380px] max-w-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring" as const, damping: 25, stiffness: 300, delay: 0.05 }}
            >
              <TourCard
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

      {/* ── Attached Tour Card (spotlight layout) ── */}
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
            <TourCard
              step={currentStepDef}
              currentStep={tourState.currentStep}
              totalSteps={tourState.totalSteps}
              isLast={isLast}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={skipTour}
              tail={bubblePos.tail}
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
              : pendingFly
                ? {
                    x: (typeof window !== "undefined" ? window.innerWidth / 2 - GUIDE_SIZE / 2 : 0) - homeX,
                    y: (typeof window !== "undefined" ? window.innerHeight / 2 - GUIDE_SIZE / 2 : 0) - homeY,
                  }
                : { x: 0, y: 0 }
          }
          transition={{
            type: "spring" as const,
            damping: 28,
            stiffness: 220,
            mass: 0.7,
          }}
          onClick={handleClick}
          role={isClickable ? "button" : undefined}
          aria-label="Traverse Guide"
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
          {hasNudge && !isTourMode && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent border-2 border-background animate-pulse" />
          )}
        </motion.div>
      )}

      {/* ── Star Warp Transition ── */}
      {showStarWarp && <StarWarpTransition onComplete={handleWarpComplete} />}
    </>
  );
}
