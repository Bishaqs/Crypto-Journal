"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, Lock, Brain } from "lucide-react";
import { MINI_ARCHETYPES, ALL_ARCHETYPES, isValidArchetype, type MiniArchetype } from "@/lib/mini-quiz-archetypes";
import { getDeepQuizQuestions, type DeepQuizQuestion } from "@/lib/deep-quiz-questions";
import { trackFunnelEvent } from "@/lib/quiz-analytics";

type Phase = "loading" | "error" | "pick_archetype" | "intro" | "questions" | "submitting";

export default function DeepQuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <DeepQuizContent />
    </Suspense>
  );
}

function DeepQuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [archetype, setArchetype] = useState<MiniArchetype | null>(null);
  const [email, setEmail] = useState("");
  const [waitlistSignupId, setWaitlistSignupId] = useState("");
  const [questions, setQuestions] = useState<DeepQuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [direction, setDirection] = useState(1);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setErrorMsg("No access token. Take the mini quiz first to get your archetype, then join the waitlist.");
      setPhase("error");
      return;
    }

    fetch(`/api/quiz/deep/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setErrorMsg(data.error ?? "Invalid token.");
          setPhase("error");
          return;
        }
        if (data.alreadyCompleted) {
          setErrorMsg("You've already completed the deep quiz! Check your email for results.");
          setPhase("error");
          return;
        }
        setEmail(data.email);
        setWaitlistSignupId(data.waitlistSignupId);

        if (isValidArchetype(data.archetype)) {
          const arch = data.archetype;
          setArchetype(arch);
          setQuestions(getDeepQuizQuestions(arch));
          setPhase("intro");
        } else {
          // No archetype stored — let user pick
          setPhase("pick_archetype");
        }
      })
      .catch(() => {
        setErrorMsg("Network error. Please try again.");
        setPhase("error");
      });
  }, [token]);

  const handleAnswer = useCallback((questionId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  }, []);

  function selectArchetype(arch: MiniArchetype) {
    setArchetype(arch);
    setQuestions(getDeepQuizQuestions(arch));
    setPhase("intro");
  }

  function handleStart() {
    setPhase("questions");
    if (token) trackFunnelEvent(token, "deep_quiz_start", archetype ?? undefined);
  }

  function handleNext() {
    setDirection(1);
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    if (currentQ > 0) {
      setDirection(-1);
      setCurrentQ((q) => q - 1);
    }
  }

  async function handleSubmit() {
    if (!token || !archetype) return;
    setPhase("submitting");

    try {
      const res = await fetch("/api/quiz/deep/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: token,
          answers,
          archetype,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setPhase("error");
        return;
      }

      // Cache profile for the results page to pick up instantly
      sessionStorage.setItem(`deep_quiz_result_${data.deepQuizResultId}`, JSON.stringify(data.profile));
      router.push(`/quiz/deep/results?id=${data.deepQuizResultId}&token=${token}`);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setPhase("error");
    }
  }

  const currentQuestion = questions[currentQ];
  const isAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;
  const archetypeInfo = archetype ? MINI_ARCHETYPES[archetype] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-gray-400 text-sm mt-4">Verifying your access...</p>
            </motion.div>
          )}

          {/* Error */}
          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-gray-300 text-sm leading-relaxed max-w-md mx-auto">{errorMsg}</p>
              <a
                href="/quiz"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-all"
              >
                Take the Mini Quiz <ArrowRight size={14} />
              </a>
            </motion.div>
          )}

          {/* Pick Archetype */}
          {phase === "pick_archetype" && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Brain className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold">Which archetype are you?</h1>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                Select your trading archetype to get personalized deep quiz questions.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ALL_ARCHETYPES.map((arch) => {
                  const info = MINI_ARCHETYPES[arch];
                  return (
                    <button
                      key={arch}
                      onClick={() => selectArchetype(arch)}
                      className="text-left px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
                    >
                      <span className="text-lg">{info.emoji}</span>
                      <p className="text-sm font-medium text-white mt-1">{info.name}</p>
                      <p className="text-[10px] text-gray-500 line-clamp-1">{info.tagline}</p>
                    </button>
                  );
                })}
              </div>
              <a href="/quiz?retake=1" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                Not sure? Take the mini quiz first
              </a>
            </motion.div>
          )}

          {/* Intro */}
          {phase === "intro" && archetypeInfo && (
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
              <div className="text-4xl">{archetypeInfo.emoji}</div>
              <h1 className="text-2xl font-bold">
                Deep Quiz for {archetypeInfo.name}
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                20 questions tailored to your archetype. This goes deeper into your specific triggers,
                coping patterns, and growth areas — with personalized advice at the end.
              </p>
              <p className="text-gray-500 text-xs">Takes about 5 minutes &middot; {email}</p>

              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-all"
              >
                Start Deep Quiz <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Questions */}
          {phase === "questions" && currentQuestion && (
            <motion.div
              key={`q-${currentQ}`}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.2 }}
            >
              {/* Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Question {currentQ + 1} of {questions.length}</span>
                  <span>{Math.round(((currentQ + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-cyan-500 rounded-full"
                    animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Category pill */}
              <div className="mb-4">
                <span className="text-[10px] uppercase tracking-wider text-cyan-400/60 font-medium">
                  {currentQuestion.category.replace("_", " ")}
                </span>
              </div>

              {/* Question */}
              <p className="text-lg font-medium leading-relaxed mb-6">{currentQuestion.question}</p>

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.score}
                    onClick={() => handleAnswer(currentQuestion.id, opt.score)}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm border transition-all ${
                      answers[currentQuestion.id] === opt.score
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                        : "bg-white/5 border-white/10 text-gray-300 hover:border-cyan-500/20 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={handleBack}
                  disabled={currentQ === 0}
                  className="flex items-center gap-1 px-4 py-2 text-xs text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isAnswered}
                  className="flex items-center gap-1 px-6 py-2.5 rounded-xl text-sm font-semibold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {currentQ < questions.length - 1 ? (
                    <>Next <ArrowRight size={14} /></>
                  ) : (
                    <>See My Results <ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Submitting */}
          {phase === "submitting" && (
            <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-16">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-gray-400 text-sm">Generating your personalized profile...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
