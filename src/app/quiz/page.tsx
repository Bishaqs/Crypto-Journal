"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Brain, Check, Loader2 } from "lucide-react";
import {
  FQ_RISK_SCENARIOS,
  FQ_MONEY_QUESTIONS,
  FQ_DECISION_STYLE_QUESTIONS,
  FQ_LOSS_AVERSION_SCENARIOS,
  FQ_FOMO_QUESTIONS,
  FQ_EMOTIONAL_REGULATION_QUESTIONS,
  FQ_BIAS_AWARENESS_QUESTIONS,
  FQ_DISCIPLINE_QUESTIONS,
  FQ_STRESS_RESPONSE_QUESTION,
  FQ_SELF_AWARENESS_QUESTIONS,
} from "@/lib/psychology-questions";
import type { ArchetypeInfo } from "@/lib/psychology-scoring";

// ─── Quiz questions (only quizEligible) ─────────────────────────────────────

type QuizQuestion =
  | { type: "scenario"; id: string; question: string; options: { label: string; value: string | number }[] }
  | { type: "likert"; id: string; text: string };

function buildQuizQuestions(): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const s of FQ_RISK_SCENARIOS) {
    questions.push({ type: "scenario", id: s.id, question: s.question, options: s.options.map((o, i) => ({ label: o.label, value: i })) });
  }
  for (const q of FQ_MONEY_QUESTIONS) {
    questions.push({ type: "likert", id: q.id, text: q.text });
  }
  for (const q of FQ_DECISION_STYLE_QUESTIONS) {
    questions.push({ type: "scenario", id: q.id, question: q.text, options: q.options.map((o) => ({ label: o.label, value: o.score })) });
  }
  for (const s of FQ_LOSS_AVERSION_SCENARIOS) {
    questions.push({ type: "scenario", id: s.id, question: s.question, options: s.options.map((o, i) => ({ label: o.label, value: i })) });
  }
  for (const q of FQ_FOMO_QUESTIONS) {
    questions.push({ type: "likert", id: q.id, text: q.text });
  }
  for (const q of FQ_EMOTIONAL_REGULATION_QUESTIONS) {
    questions.push({ type: "scenario", id: q.id, question: q.question, options: q.options.map((o) => ({ label: o.label, value: o.value })) });
  }
  for (const q of FQ_BIAS_AWARENESS_QUESTIONS) {
    questions.push({ type: "scenario", id: q.id, question: q.question, options: q.options.map((o) => ({ label: o.label, value: o.value })) });
  }
  for (const q of FQ_DISCIPLINE_QUESTIONS) {
    questions.push({ type: "likert", id: q.id, text: q.text });
  }
  questions.push({ type: "scenario", id: FQ_STRESS_RESPONSE_QUESTION.id, question: FQ_STRESS_RESPONSE_QUESTION.question, options: FQ_STRESS_RESPONSE_QUESTION.options.map((o) => ({ label: o.label, value: o.value })) });
  for (const q of FQ_SELF_AWARENESS_QUESTIONS) {
    questions.push({ type: "likert", id: q.id, text: q.text });
  }

  return questions;
}

const QUIZ_QUESTIONS = buildQuizQuestions();

// ─── Component ──────────────────────────────────────────────────────────────

type Phase = "intro" | "questions" | "email" | "submitting" | "results";

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}

function QuizContent() {
  const searchParams = useSearchParams();
  const waitlistToken = searchParams.get("token") ?? undefined;

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ archetype: string; archetypeInfo: ArchetypeInfo; quizResultId?: string; unsubscribeToken?: string } | null>(null);

  function handleAnswer(questionId: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  const hasToken = !!waitlistToken;

  function handleNext() {
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ((q) => q + 1);
    } else if (hasToken && consent) {
      // Token users already gave consent on intro — submit directly
      doSubmit();
    } else {
      setPhase("email");
    }
  }

  async function handleSubmit() {
    if (!email || !consent) return;
    doSubmit();
  }

  async function doSubmit() {
    setPhase("submitting");
    setError(null);

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          answers,
          waitlistToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setPhase(hasToken ? "questions" : "email");
        return;
      }

      setResult({ archetype: data.archetype, archetypeInfo: data.archetypeInfo, quizResultId: data.quizResultId, unsubscribeToken: data.unsubscribeToken });
      setPhase("results");
    } catch {
      setError("Network error. Please try again.");
      setPhase(hasToken ? "questions" : "email");
    }
  }

  const currentQuestion = QUIZ_QUESTIONS[currentQ];
  const isAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {/* ─── Intro ─────────────────────────────────── */}
          {phase === "intro" && (
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
              <h1 className="text-3xl font-bold">
                What&apos;s Your Trading Psychology Pattern?
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                Answer 20 questions to discover your trading archetype — and get
                a personalized AI-generated protocol with your strengths, blind spots,
                and actionable techniques to improve immediately.
              </p>
              <p className="text-gray-500 text-xs">Takes about 5 minutes</p>

              {hasToken && (
                <label className="flex items-start gap-2 cursor-pointer text-left max-w-md mx-auto">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 accent-cyan-500"
                  />
                  <span className="text-xs text-gray-400 leading-relaxed">
                    I agree to receive my quiz results and a short email series
                    about trading psychology (5 emails over 15 days).
                    Unsubscribe anytime.
                  </span>
                </label>
              )}

              <button
                onClick={() => setPhase("questions")}
                disabled={hasToken && !consent}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Start Quiz <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ─── Questions ─────────────────────────────── */}
          {phase === "questions" && currentQuestion && (
            <motion.div
              key={`q-${currentQ}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Question {currentQ + 1} of {QUIZ_QUESTIONS.length}</span>
                  <span>{Math.round(((currentQ + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQ + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              {currentQuestion.type === "scenario" ? (
                <div className="space-y-4">
                  <p className="text-base font-medium leading-relaxed">{currentQuestion.question}</p>
                  <div className="space-y-2">
                    {currentQuestion.options.map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                          answers[currentQuestion.id] === opt.value
                            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                            : "bg-white/5 border-white/10 text-gray-300 hover:border-cyan-500/20 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-base font-medium leading-relaxed">{currentQuestion.text}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => handleAnswer(currentQuestion.id, n)}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                          answers[currentQuestion.id] === n
                            ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                            : "bg-white/5 border-white/10 text-gray-400 hover:border-cyan-500/20"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-600 px-1">
                    <span>Strongly Disagree</span>
                    <span>Strongly Agree</span>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setCurrentQ((q) => q - 1)}
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
                  {currentQ < QUIZ_QUESTIONS.length - 1 ? (
                    <>Next <ArrowRight size={14} /></>
                  ) : (
                    <>See Results <ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Email Capture ─────────────────────────── */}
          {phase === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold">Your results are ready!</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Enter your email to get your full Trading Psychology Profile
                with personalized insights and actionable techniques.
              </p>

              {error && (
                <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3 text-left">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 placeholder-gray-600 transition-all"
                />

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 accent-cyan-500"
                  />
                  <span className="text-xs text-gray-400 leading-relaxed">
                    I agree to receive my quiz results and a short email series
                    about trading psychology (5 emails over 15 days).
                    Unsubscribe anytime.
                  </span>
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!email || !consent}
                className="w-full px-6 py-3 rounded-xl text-sm font-semibold bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Get My Results
              </button>
            </motion.div>
          )}

          {/* ─── Submitting ────────────────────────────── */}
          {phase === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4 py-16"
            >
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-gray-400 text-sm">Analyzing your trading psychology...</p>
            </motion.div>
          )}

          {/* ─── Results ───────────────────────────────── */}
          {phase === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <p className="text-xs text-cyan-400 uppercase tracking-wider font-medium">Your Trading Archetype</p>
                <h2 className="text-3xl font-bold">{result.archetypeInfo.name}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {result.archetypeInfo.description}
                </p>
              </div>

              {/* Strengths */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-cyan-400">Your Strengths</h3>
                {result.archetypeInfo.strengths.map((s, i) => (
                  <p key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
                    <span className="text-green-400 shrink-0">&#10003;</span> {s}
                  </p>
                ))}
              </div>

              {/* Blind Spots */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-amber-400">Your Blind Spots</h3>
                {result.archetypeInfo.blindSpots.map((s, i) => (
                  <p key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
                    <span className="text-amber-400 shrink-0">&#9888;</span> {s}
                  </p>
                ))}
              </div>

              {/* Recommendation */}
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-cyan-400 mb-2">Your Action Step</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {result.archetypeInfo.recommendation}
                </p>
              </div>

              <div className="text-center space-y-3 pt-4">
                {result.quizResultId && result.unsubscribeToken ? (
                  <>
                    <p className="text-xs text-gray-500">
                      Your AI-generated psychology protocol will be ready within 24 hours.
                    </p>
                    <a
                      href={`/quiz/results?id=${result.quizResultId}&token=${result.unsubscribeToken}`}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-all"
                    >
                      View Your Protocol <ArrowRight size={16} />
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">
                      Check your email for your full psychology report.
                    </p>
                    <a
                      href="https://traversejournal.com"
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-all"
                    >
                      Explore Traverse Journal <ArrowRight size={16} />
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
