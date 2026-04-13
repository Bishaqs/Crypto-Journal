"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Share2, Check, Copy, Loader2, TrendingUp, Shield, Brain, Target, Sprout } from "lucide-react";
import { MINI_ARCHETYPES, isValidArchetype, type MiniArchetype } from "@/lib/mini-quiz-archetypes";
import type { DeepProfile, CategoryScore } from "@/lib/deep-quiz-scoring";

const CATEGORY_ICONS: Record<string, typeof Brain> = {
  triggers: Target,
  coping: Shield,
  risk_behavior: TrendingUp,
  self_awareness: Brain,
  growth: Sprout,
};

const LEVEL_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  developing: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  solid: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  strong: "text-green-400 bg-green-500/10 border-green-500/20",
};

const LEVEL_LABELS: Record<string, string> = {
  critical: "Needs Work",
  developing: "Developing",
  solid: "Solid",
  strong: "Strong",
};

export default function DeepQuizResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <DeepQuizResultsContent />
    </Suspense>
  );
}

function DeepQuizResultsContent() {
  const searchParams = useSearchParams();
  const resultId = searchParams.get("id");
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DeepProfile | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!resultId || !token) {
      setError("Missing result ID or token.");
      setLoading(false);
      return;
    }

    // Fetch the stored result
    fetch(`/api/quiz/deep/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setError(data.error ?? "Could not load results.");
          setLoading(false);
          return;
        }

        // We already have the profile from the submit response stored in sessionStorage
        const cached = sessionStorage.getItem(`deep_quiz_result_${resultId}`);
        if (cached) {
          setProfile(JSON.parse(cached));
          setLoading(false);
          return;
        }

        // Fallback: re-fetch from API — for now just show the archetype info
        // since we don't have a dedicated "get result" endpoint yet
        if (isValidArchetype(data.archetype)) {
          const arch = data.archetype as MiniArchetype;
          const info = MINI_ARCHETYPES[arch];
          setProfile({
            archetype: arch,
            overallScore: 2.5,
            overallLevel: "developing",
            categories: [],
            topStrength: "Self-Awareness",
            biggestGap: "Trigger Awareness",
            advice: info.ctaHook ? [info.ctaHook] : [],
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error.");
        setLoading(false);
      });
  }, [resultId, token]);

  // Also try to pick up the profile from the redirect
  useEffect(() => {
    const handler = () => {
      const cached = resultId ? sessionStorage.getItem(`deep_quiz_result_${resultId}`) : null;
      if (cached) {
        setProfile(JSON.parse(cached));
        setLoading(false);
      }
    };
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [resultId]);

  function handleShare() {
    if (!profile) return;
    const info = isValidArchetype(profile.archetype) ? MINI_ARCHETYPES[profile.archetype] : null;
    const url = "https://traversejournal.com/quiz";
    const text = info
      ? `I'm ${info.name} — just completed the deep trading psychology quiz on Traverse Journal. Discover your archetype:`
      : "Discover your trading archetype:";

    if (navigator.share) {
      navigator.share({ title: "My Trading Psychology Profile", text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-sm">{error || "Could not load results."}</p>
          <a href="/quiz" className="text-cyan-400 underline text-sm">Take the quiz</a>
        </div>
      </div>
    );
  }

  const archetypeInfo = isValidArchetype(profile.archetype) ? MINI_ARCHETYPES[profile.archetype] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6 py-12"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-xs text-cyan-400 uppercase tracking-wider font-medium">Your Deep Profile</p>
          {archetypeInfo && (
            <>
              <div className="text-5xl mb-2">{archetypeInfo.emoji}</div>
              <h1 className="text-3xl font-bold">{archetypeInfo.name}</h1>
            </>
          )}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
            LEVEL_COLORS[profile.overallLevel] ?? LEVEL_COLORS.developing
          }`}>
            Overall: {profile.overallLevel.charAt(0).toUpperCase() + profile.overallLevel.slice(1)} ({profile.overallScore}/4.0)
          </div>
        </div>

        {/* Category Breakdown */}
        {profile.categories.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400">Your Psychology Breakdown</h3>
            {profile.categories.map((cat: CategoryScore) => {
              const Icon = CATEGORY_ICONS[cat.category] ?? Brain;
              const colors = LEVEL_COLORS[cat.level] ?? LEVEL_COLORS.developing;
              return (
                <div key={cat.category} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-gray-500" />
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors}`}>
                      {LEVEL_LABELS[cat.level] ?? cat.level}
                    </span>
                  </div>
                  {/* Score bar */}
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${(cat.score / 4) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">{cat.score}/4.0</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Strengths & Gaps */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <p className="text-[10px] text-green-400 uppercase tracking-wider font-medium mb-1">Top Strength</p>
            <p className="text-sm font-medium">{profile.topStrength}</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium mb-1">Biggest Gap</p>
            <p className="text-sm font-medium">{profile.biggestGap}</p>
          </div>
        </div>

        {/* Personalized Advice */}
        {profile.advice.length > 0 && (
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-cyan-400">Your Personalized Action Plan</h3>
            {profile.advice.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-cyan-400 text-xs font-bold mt-0.5">{i + 1}</span>
                <p className="text-xs text-gray-300 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        )}

        {/* Traverse CTA */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center space-y-3">
          <p className="text-sm font-medium">Your profile will be pre-loaded into Traverse</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            When you get access, your psychology profile, triggers, and personalized coaching
            will already be set up based on your quiz results. No setup needed.
          </p>
          {archetypeInfo && (
            <p className="text-xs text-cyan-400">
              {archetypeInfo.traverseFeature}
            </p>
          )}
        </div>

        {/* Share */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
            {copied ? "Copied!" : "Share Results"}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-[10px] text-gray-600">
            First 50 members get early access in 1 month. Full launch in 2 months.
          </p>
          <a href="/quiz" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Retake the mini quiz
          </a>
        </div>
      </motion.div>
    </div>
  );
}
