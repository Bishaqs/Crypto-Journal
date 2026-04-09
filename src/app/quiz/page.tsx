"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Brain, Loader2, CheckCircle2, Lock, Sparkles,
  BarChart3, Search, Zap, Scale, TrendingDown, Target, Flame, Smartphone,
  Moon, Settings, TrendingUp, Newspaper, Rocket, Shield, VolumeX, PenLine,
  Eye, Skull, Clock, Megaphone,
} from "lucide-react";
import {
  QUIZ_STEPS, QUIZ_QUESTIONS, TOTAL_STEPS, TOTAL_QUESTIONS,
  type QuizStep, type QuizQuestion, type InterstitialStep,
} from "@/lib/mini-quiz-questions";
import { computeMiniArchetype } from "@/lib/mini-quiz-archetypes";
import { getQuizSessionId, trackFunnelEvent } from "@/lib/quiz-analytics";

// ─── Icon Map ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BarChart3, Search, Zap, Scale, TrendingDown, Target, Flame, Smartphone,
  Moon, Settings, TrendingUp, Newspaper, Brain, Rocket, Shield, VolumeX,
  PenLine, Eye, Skull, Clock, Megaphone, Sparkles,
};

function LucideIcon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}

// ─── Page Wrapper ───────────────────────────────────────────────────────────

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      }
    >
      <MiniQuizContent />
    </Suspense>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

type Phase = "intro" | "steps" | "processing" | "email-gate";

// ─── Processing Messages ────────────────────────────────────────────────────

const PROCESSING_MESSAGES = [
  "Mapping your decision patterns...",
  "Analyzing risk profile...",
  "Identifying emotional triggers...",
  "Cross-referencing behavioral patterns...",
  "Building your profile...",
];

// ─── Main Quiz Component ────────────────────────────────────────────────────

function MiniQuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      router.replace(`/quiz/deep?token=${token}`);
      return;
    }
    const retake = searchParams.get("retake");
    if (!retake) {
      const savedArchetype = localStorage.getItem("mini_quiz_archetype");
      if (savedArchetype) {
        router.replace(`/quiz/result/${savedArchetype}`);
      }
    }
  }, [searchParams, router]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [direction, setDirection] = useState(1);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMsg, setProcessingMsg] = useState(0);
  const [computedArchetype, setComputedArchetype] = useState<string | null>(null);

  // Email gate state
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [signupStatus, setSignupStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const sessionId = typeof window !== "undefined" ? getQuizSessionId() : "";

  function handleStart() {
    setPhase("steps");
    trackFunnelEvent(sessionId, "mini_quiz_start");
  }

  // Single-select answer
  const handleAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }, []);

  // Multi-select toggle
  const handleToggle = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      const arr = Array.isArray(current) ? [...current] : [];
      const idx = arr.indexOf(optionId);
      if (idx >= 0) {
        arr.splice(idx, 1);
      } else {
        arr.push(optionId);
      }
      return { ...prev, [questionId]: arr };
    });
  }, []);

  function handleNext() {
    setDirection(1);
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }

  function handleComplete() {
    const { archetype, dimensions } = computeMiniArchetype(answers, QUIZ_QUESTIONS);
    setComputedArchetype(archetype);
    localStorage.setItem("mini_quiz_archetype", archetype);
    trackFunnelEvent(sessionId, "mini_quiz_complete", archetype);

    // Flatten multi-select for API (serialize arrays as comma-separated)
    const flatAnswers: Record<string, string> = {};
    for (const [k, v] of Object.entries(answers)) {
      flatAnswers[k] = Array.isArray(v) ? v.join(",") : v;
    }

    fetch("/api/quiz/mini/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, answers: flatAnswers, archetype, dimensionScores: dimensions }),
    }).catch(() => {});

    setPhase("processing");
    setProcessingProgress(0);
    setProcessingMsg(0);
  }

  // Processing animation
  useEffect(() => {
    if (phase !== "processing") return;
    const duration = 6000;
    const startTime = Date.now();
    let frame: number;

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setProcessingProgress(Math.round(eased * 100));
      const msgIndex = Math.min(Math.floor(progress * PROCESSING_MESSAGES.length), PROCESSING_MESSAGES.length - 1);
      setProcessingMsg(msgIndex);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setPhase("email-gate"), 400);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // Email gate submit
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || signupStatus === "loading") return;
    setSignupStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          miniArchetype: computedArchetype,
          sessionId,
        }),
      });
      const data = await res.json();
      if (data.success || data.position) {
        setSignupStatus("success");
        trackFunnelEvent(sessionId, "waitlist_signup_from_quiz", computedArchetype ?? "");
        setTimeout(() => router.push(`/quiz/result/${computedArchetype}?sid=${sessionId}`), 800);
      } else {
        setSignupStatus("error");
        setErrorMsg(data.error || "Something went wrong");
      }
    } catch {
      setSignupStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  // Computed values
  const step: QuizStep | undefined = QUIZ_STEPS[currentStep];
  const isQuestion = step?.type === "question";
  const currentQ = isQuestion ? (step as QuizQuestion) : null;

  const isAnswered = (() => {
    if (!isQuestion || !currentQ) return true; // interstitials are always "answered"
    const ans = answers[currentQ.id];
    if (currentQ.multiSelect) {
      return Array.isArray(ans) && ans.length > 0;
    }
    return ans !== undefined;
  })();

  const questionsAnsweredSoFar = QUIZ_STEPS.slice(0, currentStep + 1).filter((s) => s.type === "question").length;
  const progressPercent = Math.round((questionsAnsweredSoFar / TOTAL_QUESTIONS) * 100);

  if (searchParams.get("token")) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const showTopBar = phase === "steps";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.02] blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />

      {/* Top progress bar (GutFix style) */}
      {showTopBar && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-cyan-400" />
              <span className="text-xs font-medium text-gray-400">Traverse</span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500">
              {questionsAnsweredSoFar} OF {TOTAL_QUESTIONS}
            </span>
          </div>
          <div className="h-[3px] bg-gray-800/50">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-r-full"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`relative z-10 flex items-center justify-center min-h-screen p-4 ${showTopBar ? "pt-16" : ""}`}>
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {phase === "intro" && <IntroScreen key="intro" onStart={handleStart} />}

            {phase === "steps" && step && (
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, x: direction * 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {step.type === "question" ? (
                  <QuestionRenderer
                    question={step}
                    selectedOption={answers[step.id]}
                    onSelect={(optionId) => handleAnswer(step.id, optionId)}
                    onToggle={(optionId) => handleToggle(step.id, optionId)}
                  />
                ) : (
                  <InterstitialRenderer interstitial={step} />
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="flex items-center gap-1 px-4 py-2 text-xs text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!isAnswered}
                    className="flex items-center gap-1 px-6 py-2.5 rounded-xl text-sm font-semibold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {currentStep < TOTAL_STEPS - 1 ? (
                      step.type === "interstitial" ? <>Continue <ArrowRight size={14} /></> : <>Next <ArrowRight size={14} /></>
                    ) : (
                      <>Get My Results <ArrowRight size={14} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {phase === "processing" && (
              <ProcessingScreen key="processing" progress={processingProgress} message={PROCESSING_MESSAGES[processingMsg]} />
            )}

            {phase === "email-gate" && (
              <EmailGateScreen
                key="email-gate"
                firstName={firstName}
                email={email}
                status={signupStatus}
                errorMsg={errorMsg}
                onFirstNameChange={setFirstName}
                onEmailChange={(val) => { setEmail(val); if (signupStatus === "error") setSignupStatus("idle"); }}
                onSubmit={handleEmailSubmit}
                onSkip={() => router.push(`/quiz/result/${computedArchetype}?sid=${sessionId}`)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Intro Screen ───────────────────────────────────────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      key="intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6"
    >
      <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
        <Brain className="w-8 h-8 text-cyan-400" />
      </div>
      <h1 className="text-3xl font-bold">What&apos;s Your Trading Archetype?</h1>
      <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
        9 quick questions to discover which of the 8 trader minds you are.
        Get a free personalized profile, plus lock in founding member pricing.
      </p>
      <p className="text-gray-500 text-xs">Takes about 2 minutes</p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-all"
      >
        Start Quiz <ArrowRight size={16} />
      </button>
      <p className="text-gray-600 text-[10px]">
        Free &bull; No credit card required &bull; Based on Behavioral Finance research
      </p>
    </motion.div>
  );
}

// ─── Question Renderer ──────────────────────────────────────────────────────

function QuestionRenderer({
  question,
  selectedOption,
  onSelect,
  onToggle,
}: {
  question: QuizQuestion;
  selectedOption: string | string[] | undefined;
  onSelect: (optionId: string) => void;
  onToggle: (optionId: string) => void;
}) {
  const isMulti = question.multiSelect;
  const selectedArr = isMulti
    ? (Array.isArray(selectedOption) ? selectedOption : [])
    : [];
  const selectedSingle = !isMulti && typeof selectedOption === "string" ? selectedOption : undefined;
  const selectionCount = isMulti ? selectedArr.length : (selectedSingle ? 1 : 0);

  return (
    <div>
      {/* Question icon */}
      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
        <LucideIcon name={question.icon} size={20} className="text-cyan-400" />
      </div>

      <h2 className="text-xl font-bold leading-snug mb-1">{question.question}</h2>
      {question.subtitle && <p className="text-gray-500 text-xs mb-5">{question.subtitle}</p>}
      {!question.subtitle && <div className="mb-5" />}

      {/* Options */}
      {question.variant === "icon-grid" ? (
        <IconGridOptions
          options={question.options}
          selected={isMulti ? selectedArr : selectedSingle}
          isMulti={!!isMulti}
          onSelect={isMulti ? onToggle : onSelect}
        />
      ) : (
        <ScenarioCardOptions
          options={question.options}
          selected={selectedSingle}
          onSelect={onSelect}
        />
      )}

      {/* Selection count */}
      {selectionCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mt-4">
          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1">
            {selectionCount} selected
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ─── Icon Grid (2-column, staggered) ────────────────────────────────────────

function IconGridOptions({
  options,
  selected,
  isMulti,
  onSelect,
}: {
  options: QuizQuestion["options"];
  selected: string | string[] | undefined;
  isMulti: boolean;
  onSelect: (id: string) => void;
}) {
  const isSelected = (id: string) =>
    isMulti ? (Array.isArray(selected) && selected.includes(id)) : selected === id;

  return (
    <div className={`grid gap-3 ${options.length > 4 ? "grid-cols-3" : "grid-cols-2"}`}>
      {options.map((opt, i) => {
        const active = isSelected(opt.id);
        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 30 }}
            onClick={() => onSelect(opt.id)}
            className={`relative flex flex-col items-center gap-2.5 px-3 py-5 rounded-xl border text-sm transition-all ${
              active
                ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                : "bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {active && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                <CheckCircle2 size={14} className="text-cyan-400" />
              </motion.div>
            )}
            {opt.icon && (
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-cyan-500/20" : "bg-white/5"}`}>
                <LucideIcon name={opt.icon} size={18} className={active ? "text-cyan-400" : "text-gray-500"} />
              </div>
            )}
            <span className="font-medium text-center leading-tight text-xs">{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Scenario Cards (staggered) ─────────────────────────────────────────────

function ScenarioCardOptions({
  options,
  selected,
  onSelect,
}: {
  options: QuizQuestion["options"];
  selected: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt, i) => {
        const isActive = selected === opt.id;
        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 30 }}
            onClick={() => onSelect(opt.id)}
            className={`w-full text-left px-5 py-4 rounded-xl text-sm border transition-all flex items-center gap-3 ${
              isActive
                ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                : "bg-white/[0.03] border-white/10 text-gray-300 hover:border-white/20 hover:text-white"
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              isActive ? "border-cyan-400 bg-cyan-400" : "border-gray-600"
            }`}>
              {isActive && <div className="w-2 h-2 rounded-full bg-black" />}
            </div>
            <span>{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Interstitial Screen ────────────────────────────────────────────────────

function InterstitialRenderer({ interstitial }: { interstitial: InterstitialStep }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 py-8"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
        <LucideIcon name={interstitial.icon} size={28} className="text-cyan-400" />
      </div>

      <div>
        <CountUpStat value={interstitial.stat} />
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 mt-1">
          {interstitial.statLabel}
        </p>
      </div>

      <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
        {interstitial.description}
      </p>
    </motion.div>
  );
}

// ─── Count-up stat animation ────────────────────────────────────────────────

function CountUpStat({ value }: { value: string }) {
  const numericPart = value.replace(/[^0-9]/g, "");
  const suffix = value.replace(/[0-9]/g, "");
  const target = parseInt(numericPart, 10);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isNaN(target)) return;
    const duration = 1200;
    const startTime = Date.now();
    let frame: number;

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <p className="text-4xl font-bold text-cyan-400">
      {isNaN(target) ? value : `${count}${suffix}`}
    </p>
  );
}

// ─── Processing Screen ──────────────────────────────────────────────────────

function ProcessingScreen({ progress, message }: { progress: number; message: string }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6 py-16">
      <div className="relative w-28 h-28 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-200" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-cyan-400">{progress}%</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p key={message} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }} className="text-gray-500 text-sm">{message}</motion.p>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-2">
        {PROCESSING_MESSAGES.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
            i <= Math.floor((progress / 100) * (PROCESSING_MESSAGES.length - 1)) ? "w-8 bg-cyan-500" : "w-4 bg-gray-700"
          }`} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Email Gate Screen ──────────────────────────────────────────────────────

function EmailGateScreen({
  firstName, email, status, errorMsg, onFirstNameChange, onEmailChange, onSubmit, onSkip,
}: {
  firstName: string; email: string; status: "idle" | "loading" | "success" | "error"; errorMsg: string;
  onFirstNameChange: (val: string) => void; onEmailChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void; onSkip: () => void;
}) {
  return (
    <motion.div key="email-gate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-4">
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="mx-auto w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">Where should we send your profile?</h2>
          <p className="text-gray-400 text-sm">Your personalized profile is ready. Enter your details and we&apos;ll deliver it instantly.</p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-400">
          {["Your archetype profile", "Top 3 blind spots", "Personalized action plan", "Priority waitlist position"].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-cyan-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {status === "success" ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 text-cyan-400 py-4">
            <CheckCircle2 size={20} />
            <span className="text-sm font-medium">Loading your results...</span>
          </motion.div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500 mb-1 block">First Name</label>
              <input type="text" placeholder="Your first name" value={firstName} onChange={(e) => onFirstNameChange(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500/50 transition-colors placeholder:text-white/20" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500 mb-1 block">Email</label>
              <input type="email" placeholder="you@email.com" required value={email} onChange={(e) => onEmailChange(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500/50 transition-colors placeholder:text-white/20" />
            </div>
            <button type="submit" disabled={status === "loading"}
              className="w-full bg-cyan-500 text-black font-semibold rounded-xl px-6 py-3.5 text-sm hover:bg-cyan-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {status === "loading" ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <>Send My Profile <ArrowRight size={14} /></>}
            </button>
            {status === "error" && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
            <div className="flex items-center justify-center gap-1.5 text-gray-600 text-[10px]">
              <Lock size={10} /><span>No spam &bull; Free &amp; private</span>
            </div>
          </form>
        )}
      </div>
      <div className="text-center mt-4">
        <button onClick={onSkip} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
          Skip for now
        </button>
      </div>
    </motion.div>
  );
}
