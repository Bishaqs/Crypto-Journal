"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  UserCircle,
  ChevronDown,
  Sprout,
  Mountain,
  Swords,
  Brain,
} from "lucide-react";
import { useI18n, LOCALES } from "@/lib/i18n";
import { TraverseLogo } from "@/components/traverse-logo";
import { createClient } from "@/lib/supabase/client";
import { awardXP } from "@/lib/xp/engine";
import { xpForLevel } from "@/lib/xp/types";
import { TradingCard } from "@/components/trading-card";
import { SELF_CONCEPT_IDENTITIES } from "@/lib/validators";
import type { SelfConceptIdentity } from "@/lib/types";
import {
  RISK_SCENARIOS,
  LOSS_AVERSION_SCENARIOS,
  DECISION_STYLE_QUESTIONS,
  DISCIPLINE_QUESTIONS,
  EMOTIONAL_REGULATION_QUESTIONS,
  FOMO_REVENGE_QUESTIONS,
  STRESS_RESPONSE_QUESTION,
} from "@/lib/psychology-questions";
import {
  computeRiskPersonality,
  computeLossAversion,
  computeDecisionStyle,
  computeDisciplineScore,
  computeEmotionalRegulation,
  computeFomoRevengeScore,
  computeStressResponse,
  computeTradingArchetype,
  ARCHETYPES,
  type TradingArchetype,
} from "@/lib/psychology-scoring";

/* ── Types ───────────────────────────────────────── */
type OnboardingData = {
  displayName: string;
  experienceLevel: string;
  // Psychology assessment responses
  fomoRevengeResponses: Record<string, number>;
  emotionalRegResponses: Record<string, string>;
  riskResponses: Record<string, number>;
  lossAversionResponses: Record<string, number>;
  decisionResponses: Record<string, string>;
  disciplineResponses: Record<string, number>;
  stressResponse: string;
  selfConceptIdentity: SelfConceptIdentity | null;
};

type IntroPhase = "dark" | "portal-opening" | "eye-arriving" | "greeting" | "ready";

/* ── Psychology questions for onboarding (cherry-picked) ── */
const ONBOARDING_FOMO_QUESTIONS = FOMO_REVENGE_QUESTIONS;
const ONBOARDING_EMOTIONAL_REG = EMOTIONAL_REGULATION_QUESTIONS.filter(q => q.id === "er_1");
const ONBOARDING_RISK = RISK_SCENARIOS.filter(q => q.id === "risk_2" || q.id === "risk_3");
const ONBOARDING_LOSS_AVERSION = LOSS_AVERSION_SCENARIOS.filter(q => q.id === "la_2");
const ONBOARDING_DECISION = DECISION_STYLE_QUESTIONS.filter(q => q.id === "ds_1");
const ONBOARDING_DISCIPLINE = DISCIPLINE_QUESTIONS.filter(q => q.id === "td_1");
const ONBOARDING_STRESS = STRESS_RESPONSE_QUESTION;

/* ── SVG Icons for Referral ────────────────────────── */

/* ── Typewriter Text Component ────────────────────── */
function TypewriterText({
  text,
  speed = 30,
  delay = 0,
  className = "",
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setStarted(false);
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timer);
  }, [displayed, started, text, speed]);

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && started && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[2px] h-[0.9em] bg-accent ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

/* ── Animated Portal Opening SVG ──────────────────── */
const CHEVRON_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function AnimatedPortalOpening({ phase }: { phase: IntroPhase }) {
  const isOpening = phase !== "dark";
  const showCenter = phase === "eye-arriving" || phase === "greeting" || phase === "ready";

  return (
    <svg width={160} height={160} viewBox="0 0 40 40" fill="none" className="overflow-visible">
      <defs>
        <radialGradient id="introPortalGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-hover)" stopOpacity="0.8" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer dashed ring */}
      <motion.circle
        cx="20" cy="20" r="18"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={isOpening ? { scale: 1, opacity: 1, rotate: 360 } : {}}
        transition={{
          scale: { duration: 0.8, type: "spring" as const, damping: 20 },
          opacity: { duration: 0.4 },
          rotate: { duration: 30, repeat: Infinity, ease: "linear" as const },
        }}
        style={{ transformOrigin: "20px 20px" }}
      />

      {/* Middle ring */}
      <motion.circle
        cx="20" cy="20" r="13"
        stroke="var(--accent)"
        strokeWidth="1"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={isOpening ? { scale: 1, opacity: 0.6 } : {}}
        transition={{ duration: 0.7, delay: 0.2, type: "spring" as const, damping: 20 }}
        style={{ transformOrigin: "20px 20px" }}
      />

      {/* Inner ring */}
      <motion.circle
        cx="20" cy="20" r="8"
        stroke="var(--accent)"
        strokeWidth="0.8"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={isOpening ? { scale: 1, opacity: 0.4 } : {}}
        transition={{ duration: 0.6, delay: 0.4, type: "spring" as const, damping: 20 }}
        style={{ transformOrigin: "20px 20px" }}
      />

      {/* Portal glow center */}
      <motion.circle
        cx="20" cy="20" r="5"
        fill="url(#introPortalGlow)"
        initial={{ scale: 0 }}
        animate={showCenter ? { scale: [0, 1.5, 1] } : isOpening ? { scale: [0, 0.5] } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
        style={{ transformOrigin: "20px 20px" }}
      />

      {/* 8 chevron dots fly in from edges */}
      {CHEVRON_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const finalX = 20 + 18 * Math.cos(rad);
        const finalY = 20 + 18 * Math.sin(rad);
        const offsetX = 62 * Math.cos(rad); // start 80 units out, offset = (80-18)*cos
        const offsetY = 62 * Math.sin(rad);
        return (
          <motion.circle
            key={angle}
            cx={finalX}
            cy={finalY}
            r="1.5"
            fill="var(--accent)"
            initial={{ x: offsetX, y: offsetY, opacity: 0 }}
            animate={isOpening ? { x: 0, y: 0, opacity: 0.8 } : {}}
            transition={{
              type: "spring" as const,
              damping: 15,
              stiffness: 80,
              delay: 0.3 + i * 0.08,
            }}
          />
        );
      })}
    </svg>
  );
}

/* ── Enhanced Animation Variants ──────────────────── */
const staggerContainer = {
  center: {
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const staggerItem = {
  enter: { opacity: 0, y: 18, scale: 0.9, filter: "blur(4px)" },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
};

/* ── Referral sources ───────────────────────────── */

/* ── Guide speech per step ── */
const GUIDE_SPEECHES = [
  "", // step 0 — uses i18n key
  "", // step 1 — dynamic, uses name
  "Let's find out what's really going on. Be honest — there are no wrong answers.",
  "How do you handle risk and loss? This reveals your blind spots.",
  "One more — how do you make decisions under pressure?",
  "Almost there. Which trader identity resonates most with you?",
  "", // step 6 — result reveal, no speech
];

/* ── Main Component ─────────────────────────────── */
export function GuideOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [introPhase, setIntroPhase] = useState<IntroPhase>("dark");
  const [data, setData] = useState<OnboardingData>({
    displayName: "",
    experienceLevel: "",
    fomoRevengeResponses: {},
    emotionalRegResponses: {},
    riskResponses: {},
    lossAversionResponses: {},
    decisionResponses: {},
    disciplineResponses: {},
    stressResponse: "",
    selfConceptIdentity: null,
  });
  const [computedArchetype, setComputedArchetype] = useState<TradingArchetype | null>(null);
  const { t, locale, setLocale } = useI18n();
  const [langOpen, setLangOpen] = useState(false);

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const TOTAL_STEPS = 7;
  const isLast = step === TOTAL_STEPS - 1;

  // Intro phase sequencer
  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase("portal-opening"), 200);
    const t2 = setTimeout(() => setIntroPhase("eye-arriving"), 600);
    const t3 = setTimeout(() => setIntroPhase("greeting"), 1000);
    const t4 = setTimeout(() => setIntroPhase("ready"), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const skipIntro = useCallback(() => {
    setIntroPhase("ready");
  }, []);

  function canProceed(): boolean {
    switch (step) {
      case 0: return true;
      case 1: return data.displayName.trim() !== "" && data.experienceLevel !== "";
      case 2: return Object.keys(data.fomoRevengeResponses).length >= 2 && Object.keys(data.emotionalRegResponses).length >= 1;
      case 3: return Object.keys(data.riskResponses).length >= 1 && Object.keys(data.lossAversionResponses).length >= 1;
      case 4: return Object.keys(data.decisionResponses).length >= 1 && (data.stressResponse !== "" || Object.keys(data.disciplineResponses).length >= 1);
      case 5: return data.selfConceptIdentity !== null;
      case 6: return true; // result reveal — always can proceed
      default: return false;
    }
  }

  function computeArchetypeFromData(): TradingArchetype {
    const riskPersonality = Object.keys(data.riskResponses).length > 0
      ? computeRiskPersonality(data.riskResponses) : undefined;
    const decisionStyle = Object.keys(data.decisionResponses).length > 0
      ? computeDecisionStyle(data.decisionResponses) : undefined;
    const lossAversion = Object.keys(data.lossAversionResponses).length > 0
      ? computeLossAversion(data.lossAversionResponses) : undefined;
    const disciplineScore = Object.keys(data.disciplineResponses).length > 0
      ? computeDisciplineScore(data.disciplineResponses) : undefined;
    const emotionalRegulation = Object.keys(data.emotionalRegResponses).length > 0
      ? computeEmotionalRegulation(data.emotionalRegResponses) : undefined;
    const fomoRevengeScore = Object.keys(data.fomoRevengeResponses).length > 0
      ? computeFomoRevengeScore(data.fomoRevengeResponses) : undefined;
    const stressResp = data.stressResponse
      ? computeStressResponse({ sr_1: data.stressResponse }) : undefined;

    return computeTradingArchetype({
      riskPersonality,
      decisionStyle,
      lossAversion,
      disciplineScore,
      emotionalRegulation,
      fomoRevengeScore,
      stressResponse: stressResp,
    });
  }

  async function saveData() {
    // Save basic info to localStorage
    if (data.displayName.trim()) localStorage.setItem("stargate-display-name", data.displayName.trim());
    if (data.experienceLevel) localStorage.setItem("stargate-experience-level", data.experienceLevel);

    // Auto-set view mode based on experience level
    const modeMap: Record<string, string> = {
      beginner: "beginner",
      intermediate: "advanced",
      advanced: "expert",
      professional: "expert",
    };
    localStorage.setItem("stargate-mode", modeMap[data.experienceLevel] || "advanced");
    localStorage.setItem("stargate-mode-override", "true");
    if (data.experienceLevel !== "beginner") {
      localStorage.setItem("stargate-level-bypass", "true");
    }
    localStorage.setItem("stargate-cookie-consent", "all");

    // Save archetype to localStorage for dashboard use
    const archetype = computedArchetype || computeArchetypeFromData();
    localStorage.setItem("stargate-trading-archetype", archetype);
    localStorage.setItem("stargate-psychology-completed-onboarding", "true");

    // Persist to Supabase
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        // Save onboarding basics
        await supabase.from("user_onboarding").upsert({
          user_id: userData.user.id,
          display_name: data.displayName.trim(),
          experience_level: data.experienceLevel,
        });

        // Save condensed psychology profile
        const riskPersonality = Object.keys(data.riskResponses).length > 0
          ? computeRiskPersonality(data.riskResponses) : null;
        const decisionStyle = Object.keys(data.decisionResponses).length > 0
          ? computeDecisionStyle(data.decisionResponses) : null;
        const lossAversion = Object.keys(data.lossAversionResponses).length > 0
          ? computeLossAversion(data.lossAversionResponses) : null;
        const disciplineScore = Object.keys(data.disciplineResponses).length > 0
          ? computeDisciplineScore(data.disciplineResponses) : null;
        const emotionalReg = Object.keys(data.emotionalRegResponses).length > 0
          ? computeEmotionalRegulation(data.emotionalRegResponses) : null;
        const fomoRevenge = Object.keys(data.fomoRevengeResponses).length > 0
          ? computeFomoRevengeScore(data.fomoRevengeResponses) : null;
        const stressResp = data.stressResponse
          ? computeStressResponse({ sr_1: data.stressResponse }) : null;

        const reassessDate = new Date();
        reassessDate.setDate(reassessDate.getDate() + 90);

        await supabase.from("psychology_profiles").insert({
          risk_personality: riskPersonality,
          risk_scenario_responses: data.riskResponses,
          decision_style: decisionStyle,
          decision_style_responses: data.decisionResponses,
          loss_aversion_coefficient: lossAversion,
          loss_aversion_responses: data.lossAversionResponses,
          discipline_score: disciplineScore,
          discipline_responses: data.disciplineResponses,
          emotional_regulation: emotionalReg,
          emotional_regulation_responses: data.emotionalRegResponses,
          fomo_revenge_score: fomoRevenge,
          fomo_revenge_responses: data.fomoRevengeResponses,
          stress_response: stressResp,
          stress_response_responses: data.stressResponse ? { sr_1: data.stressResponse } : {},
          self_concept_identity: data.selfConceptIdentity,
          source: "onboarding",
          completed_at: new Date().toISOString(),
          reassess_after: reassessDate.toISOString().split("T")[0],
        });

        // Award XP based on experience level
        const xpLevelMap: Record<string, number> = {
          intermediate: 10,
          advanced: 25,
          professional: 25,
        };
        const targetLevel = xpLevelMap[data.experienceLevel];
        if (targetLevel) {
          const targetXP = xpForLevel(targetLevel) + 1;
          await awardXP(supabase, userData.user.id, "onboarding_bonus", "onboarding", targetXP);
          window.dispatchEvent(new Event("stargate-xp-refresh"));
        }
      }
    } catch {
      // Non-critical — onboarding still works via localStorage
    }
  }

  async function handleNext() {
    if (isLast) {
      await saveData();
      localStorage.setItem("stargate-onboarded", "true");
      localStorage.setItem("stargate-onboarding-version", "3");
      localStorage.setItem("stargate-sidebar-mode", "advanced");
      window.dispatchEvent(new CustomEvent("stargate-onboarding-complete"));
      onComplete();
    } else {
      // Compute archetype before showing result reveal (step 6)
      if (step === 5) {
        setComputedArchetype(computeArchetypeFromData());
      }
      setDirection(1);
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function getSpeech(): string {
    if (step === 0) return t("onboarding.speech0");
    if (step === 1) {
      return data.displayName.trim()
        ? t("onboarding.speech1WithName", { name: data.displayName.trim() })
        : t("onboarding.speech1NoName");
    }
    return GUIDE_SPEECHES[step] || "";
  }

  /* ── Step content (inside the speech bubble) ──── */
  function renderStepContent() {
    switch (step) {
      /* ── 0: Welcome + Language ─────────────────── */
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-2 font-medium">
                {t("onboarding.language")}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen(!langOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs focus:border-accent focus:outline-none transition-colors"
                >
                  <span>
                    {currentLocale.flag} {currentLocale.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-muted transition-transform ${langOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {langOpen && (
                  <div className="absolute z-50 w-full mt-1 py-1 rounded-xl border border-border bg-surface shadow-lg max-h-48 overflow-y-auto">
                    {LOCALES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLocale(l.code);
                          setLangOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-accent/10 transition-colors ${
                          locale === l.code
                            ? "text-accent font-semibold"
                            : "text-foreground"
                        }`}
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      /* ── 1: Name + Experience ──────────────────── */
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">
                {t("onboarding.yourName")}
              </label>
              <div className="relative">
                <UserCircle
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  value={data.displayName}
                  onChange={(e) =>
                    setData({ ...data, displayName: e.target.value })
                  }
                  placeholder={t("onboarding.namePlaceholder")}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs placeholder-muted focus:border-accent focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
            </div>
            {data.displayName.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-xs text-muted mb-1.5 font-medium">
                  {t("onboarding.experienceLevel")}
                </label>
                <motion.div
                  className="grid grid-cols-2 gap-2"
                  variants={staggerContainer}
                  initial="enter"
                  animate="center"
                >
                  {[
                    { value: "beginner", label: t("onboarding.newbie"), desc: t("onboarding.newbieDesc"), icon: Sprout },
                    { value: "intermediate", label: t("onboarding.climbing"), desc: t("onboarding.climbingDesc"), icon: Mountain },
                    { value: "advanced", label: t("onboarding.ninja"), desc: t("onboarding.ninjaDesc"), icon: Swords },
                    { value: "professional", label: t("onboarding.monk"), desc: t("onboarding.monkDesc"), icon: Brain },
                  ].map((opt) => (
                    <motion.button
                      key={opt.value}
                      variants={staggerItem}
                      whileTap={{ scale: 0.93 }}
                      whileHover={{ scale: 1.03, boxShadow: "0 0 16px var(--accent-glow)" }}
                      onClick={() =>
                        setData({ ...data, experienceLevel: opt.value })
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        data.experienceLevel === opt.value
                          ? "border-accent bg-accent/10 shadow-[0_0_12px_var(--accent-glow)]"
                          : "border-border bg-surface hover:border-accent/30"
                      }`}
                    >
                      <opt.icon
                        size={16}
                        className={
                          data.experienceLevel === opt.value
                            ? "text-accent"
                            : "text-muted"
                        }
                      />
                      <p className="text-xs font-semibold text-foreground mt-1.5">
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-muted">{opt.desc}</p>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </div>
        );

      /* ── 2: FOMO, Revenge Trading & Emotional Regulation ── */
      case 2:
        return (
          <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
            {/* FOMO & Revenge Likert questions */}
            {ONBOARDING_FOMO_QUESTIONS.map((q) => (
              <div key={q.id}>
                <p className="text-xs text-foreground font-medium mb-2">{q.text}</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <motion.button
                      key={val}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setData({ ...data, fomoRevengeResponses: { ...data.fomoRevengeResponses, [q.id]: val } })}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                        data.fomoRevengeResponses[q.id] === val
                          ? "border-accent bg-accent/10 text-accent shadow-[0_0_8px_var(--accent-glow)]"
                          : "border-border bg-surface text-muted hover:border-accent/30"
                      }`}
                    >
                      {val === 1 ? "Never" : val === 2 ? "Rarely" : val === 3 ? "Sometimes" : val === 4 ? "Often" : "Always"}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
            {/* Emotional Regulation scenario */}
            {ONBOARDING_EMOTIONAL_REG.map((q) => (
              <div key={q.id}>
                <p className="text-xs text-foreground font-medium mb-2">{q.question}</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {q.options.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setData({ ...data, emotionalRegResponses: { ...data.emotionalRegResponses, [q.id]: opt.value } })}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        data.emotionalRegResponses[q.id] === opt.value
                          ? "border-accent bg-accent/10 shadow-[0_0_10px_var(--accent-glow)]"
                          : "border-border bg-surface hover:border-accent/30"
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      /* ── 3: Risk & Loss Aversion ────────────────── */
      case 3:
        return (
          <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
            {/* Risk scenarios */}
            {ONBOARDING_RISK.map((q) => (
              <div key={q.id}>
                <p className="text-xs text-foreground font-medium mb-2">{q.question}</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {q.options.map((opt, idx) => (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setData({ ...data, riskResponses: { ...data.riskResponses, [q.id]: idx } })}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        data.riskResponses[q.id] === idx
                          ? "border-accent bg-accent/10 shadow-[0_0_10px_var(--accent-glow)]"
                          : "border-border bg-surface hover:border-accent/30"
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
            {/* Loss aversion */}
            {ONBOARDING_LOSS_AVERSION.map((q) => (
              <div key={q.id}>
                <p className="text-xs text-foreground font-medium mb-2">{q.question}</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {q.options.map((opt, idx) => (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setData({ ...data, lossAversionResponses: { ...data.lossAversionResponses, [q.id]: idx } })}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        data.lossAversionResponses[q.id] === idx
                          ? "border-accent bg-accent/10 shadow-[0_0_10px_var(--accent-glow)]"
                          : "border-border bg-surface hover:border-accent/30"
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      /* ── 4: Decision Style, Discipline & Stress ── */
      case 4:
        return (
          <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
            {/* Decision style */}
            {ONBOARDING_DECISION.map((q) => (
              <div key={q.id}>
                <p className="text-xs text-foreground font-medium mb-2">{q.text}</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {q.options.map((opt) => (
                    <motion.button
                      key={opt.score}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setData({ ...data, decisionResponses: { ...data.decisionResponses, [q.id]: opt.score } })}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        data.decisionResponses[q.id] === opt.score
                          ? "border-accent bg-accent/10 shadow-[0_0_10px_var(--accent-glow)]"
                          : "border-border bg-surface hover:border-accent/30"
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
            {/* Discipline Likert */}
            {ONBOARDING_DISCIPLINE.map((q) => (
              <div key={q.id}>
                <p className="text-xs text-foreground font-medium mb-2">{q.text}</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <motion.button
                      key={val}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setData({ ...data, disciplineResponses: { ...data.disciplineResponses, [q.id]: val } })}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                        data.disciplineResponses[q.id] === val
                          ? "border-accent bg-accent/10 text-accent shadow-[0_0_8px_var(--accent-glow)]"
                          : "border-border bg-surface text-muted hover:border-accent/30"
                      }`}
                    >
                      {val === 1 ? "Never" : val === 2 ? "Rarely" : val === 3 ? "Sometimes" : val === 4 ? "Often" : "Always"}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
            {/* Stress response */}
            <div>
              <p className="text-xs text-foreground font-medium mb-2">{ONBOARDING_STRESS.question}</p>
              <div className="grid grid-cols-1 gap-1.5">
                {ONBOARDING_STRESS.options.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setData({ ...data, stressResponse: opt.value })}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      data.stressResponse === opt.value
                        ? "border-accent bg-accent/10 shadow-[0_0_10px_var(--accent-glow)]"
                        : "border-border bg-surface hover:border-accent/30"
                    }`}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        );

      /* ── 5: Self-Concept Identity ───────────────── */
      case 5:
        return (
          <motion.div
            className="grid grid-cols-1 gap-2"
            variants={staggerContainer}
            initial="enter"
            animate="center"
          >
            {SELF_CONCEPT_IDENTITIES.map((identity) => (
              <motion.button
                key={identity.id}
                variants={staggerItem}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02, boxShadow: "0 0 16px var(--accent-glow)" }}
                onClick={() => setData({ ...data, selfConceptIdentity: identity.id as SelfConceptIdentity })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  data.selfConceptIdentity === identity.id
                    ? "border-accent bg-accent/10 shadow-[0_0_12px_var(--accent-glow)]"
                    : "border-border bg-surface hover:border-accent/30"
                }`}
              >
                <p className="text-xs font-semibold text-foreground">{identity.label}</p>
                <p className="text-[10px] text-muted mt-0.5">{identity.description}</p>
              </motion.button>
            ))}
          </motion.div>
        );

      /* ── 6: Psychology Profile Reveal ────────────── */
      case 6: {
        const archetype = computedArchetype ? ARCHETYPES[computedArchetype] : null;
        return archetype ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", damping: 20 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TradingCard
                archetypeInfo={archetype}
                topStrength={archetype.strengths[0]}
                topBlindSpot={archetype.blindSpots[0]}
                size="compact"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full space-y-3"
            >
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-accent mb-1.5">What Nova will watch for</p>
                <ul className="space-y-1">
                  {archetype.blindSpots.slice(0, 2).map((spot, i) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                      <span className="text-accent mt-0.5">&#x2022;</span>
                      {spot}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[10px] text-muted text-center italic">{archetype.recommendation}</p>
            </motion.div>
          </motion.div>
        ) : null;
      }

      default:
        return null;
    }
  }

  /* ── Slide variants with blur + zoom ─────────── */
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.92,
      filter: "blur(8px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.92,
      filter: "blur(8px)",
    }),
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-hidden">
      {/* Radial glow behind everything */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: introPhase !== "dark" ? 0.15 : 0 }}
        transition={{ duration: 1.5 }}
        style={{
          background: "radial-gradient(circle at 50% 40%, var(--accent-glow) 0%, transparent 50%)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center h-full p-6">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {introPhase !== "ready" ? (
              /* ── Cinematic Intro Sequence ───────────── */
              <motion.div
                key="intro"
                className="flex flex-col items-center justify-center min-h-[400px] cursor-pointer"
                exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                transition={{ duration: 0.4 }}
                onClick={skipIntro}
              >
                {/* Portal opening SVG */}
                <motion.div
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={
                    introPhase === "eye-arriving" || introPhase === "greeting"
                      ? { scale: 1, opacity: 1 }
                      : introPhase === "portal-opening"
                        ? { scale: 0.6, opacity: 0.8 }
                        : { scale: 0.3, opacity: 0 }
                  }
                  transition={{
                    type: "spring" as const,
                    stiffness: 120,
                    damping: 12,
                  }}
                >
                  <AnimatedPortalOpening phase={introPhase} />
                </motion.div>

                {/* Expansion wave pulse during eye-arriving */}
                {introPhase === "eye-arriving" && (
                  <motion.div
                    className="absolute w-32 h-32 rounded-full border border-accent/30"
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" as const }}
                  />
                )}

                {/* Glow trails during eye-arriving */}
                {introPhase === "eye-arriving" && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={`trail-${i}`}
                        className="absolute rounded-full"
                        style={{
                          width: 80,
                          height: 80,
                          background: "radial-gradient(circle, var(--accent-glow), transparent)",
                        }}
                        initial={{ scale: 2 - i * 0.3, opacity: 0.4 - i * 0.1 }}
                        animate={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.8, delay: i * 0.15 }}
                      />
                    ))}
                  </>
                )}

                {/* Greeting typewriter text */}
                {introPhase === "greeting" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-8"
                  >
                    <TypewriterText
                      text={t("onboarding.welcomeTitle")}
                      speed={50}
                      className="text-2xl font-bold text-foreground text-center block"
                    />
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      transition={{ delay: 1.5 }}
                      className="text-xs text-muted text-center mt-3"
                    >
                      {t("onboarding.tapToSkip")}
                    </motion.p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* ── Step Flow ─────────────────────────── */
              <motion.div
                key="steps"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Progress bar with glow */}
                <div className="flex items-center gap-1.5 mb-8">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full bg-border overflow-hidden">
                      <motion.div
                        className="h-full bg-accent rounded-full"
                        initial={false}
                        animate={{
                          width: i <= step ? "100%" : "0%",
                          boxShadow: i === step ? "0 0 8px var(--accent-glow)" : "none",
                        }}
                        transition={{ duration: 0.4, ease: "easeInOut" as const }}
                      />
                    </div>
                  ))}
                </div>

                {/* Step indicator */}
                <motion.p
                  key={`step-${step}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-muted/50 text-center mb-4 uppercase tracking-wider font-semibold"
                >
                  {t("onboarding.stepOf", { current: String(step + 1), total: String(TOTAL_STEPS) })}
                </motion.p>

                {/* Guide character — lively layered animations */}
                <div className="flex justify-center mb-4">
                  {/* Breathing glow pulse */}
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 20px var(--accent-glow)",
                        "0 0 36px var(--accent-glow), 0 0 64px var(--accent-glow)",
                        "0 0 20px var(--accent-glow)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
                    className="rounded-full"
                  >
                    {/* Scale breathing */}
                    <motion.div
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }}
                    >
                      {/* Vertical float */}
                      <motion.div
                        animate={{ y: [0, -12, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" as const }}
                      >
                        {/* Rotation wobble */}
                        <motion.div
                          animate={{ rotate: [0, 6, -4, 0] }}
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut" as const,
                            times: [0, 0.3, 0.7, 1],
                          }}
                        >
                          {/* Step-change glow burst */}
                          <motion.div
                            key={`glow-${step}`}
                            animate={{
                              boxShadow: [
                                "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
                                "0 0 48px var(--accent-glow), 0 0 96px var(--accent-glow)",
                                "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
                              ],
                            }}
                            transition={{ duration: 1.2, times: [0, 0.3, 1] }}
                            className="rounded-full"
                          >
                            <TraverseLogo size={72} />
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Guide speech text — typewriter */}
                <div className="text-lg text-foreground font-medium text-center mb-6 leading-relaxed min-h-[2em]">
                  <TypewriterText
                    text={getSpeech()}
                    speed={25}
                    className=""
                  />
                </div>

                {/* Step content (animated with blur + zoom) */}
                <div className="min-h-[200px]">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={step}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ willChange: "transform, opacity, filter" }}
                    >
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  {step > 0 ? (
                    <motion.button
                      onClick={handleBack}
                      whileHover={{ x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
                    >
                      <ArrowLeft size={16} />
                      {t("onboarding.navBack")}
                    </motion.button>
                  ) : (
                    <div />
                  )}

                  <motion.button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{
                      scale: 1.04,
                      boxShadow: "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isLast ? (
                      <>
                        <CheckCircle2 size={16} />
                        {t("onboarding.letsGoFinal")}
                      </>
                    ) : (
                      <>
                        {step === 0 ? t("onboarding.letsGo") : t("onboarding.navContinue")}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Skip */}
                {!isLast && step > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => {
                      saveData();
                      localStorage.setItem("stargate-onboarded", "true");
                      localStorage.setItem("stargate-onboarding-version", "3");
                      window.dispatchEvent(new CustomEvent("stargate-onboarding-complete"));
                      onComplete();
                    }}
                    className="block mx-auto mt-6 text-xs text-muted/60 hover:text-muted transition-colors"
                  >
                    {t("onboarding.skipOnboarding")}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
