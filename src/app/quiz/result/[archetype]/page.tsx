"use client";

import { use, Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Share2, CheckCircle2, Copy, Check, Loader2,
  ChevronDown, ChevronUp, Gift, MessageCircle, Link2, XCircle,
} from "lucide-react";
import { MINI_ARCHETYPES, isValidArchetype, type MiniArchetype } from "@/lib/mini-quiz-archetypes";
import { trackFunnelEvent, getQuizSessionId } from "@/lib/quiz-analytics";

export default function ArchetypeResultPage({
  params,
}: {
  params: Promise<{ archetype: string }>;
}) {
  const { archetype } = use(params);

  if (!isValidArchetype(archetype)) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-gray-400">Unknown archetype.</p>
          <a href="/quiz" className="text-cyan-400 underline text-sm">Take the quiz</a>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <ResultContent archetype={archetype} />
    </Suspense>
  );
}

// ─── Tier data for price escalation visual ──────────────────────────────────

const PRICE_TIERS = [
  { label: "50% off", discount: 50, tier: "Founding 100" },
  { label: "40% off", discount: 40, tier: "Pioneer" },
  { label: "30% off", discount: 30, tier: "Early Adopter" },
  { label: "20% off", discount: 20, tier: "Vanguard" },
  { label: "10% off", discount: 10, tier: "Trailblazer" },
];

function ResultContent({ archetype }: { archetype: MiniArchetype }) {
  const searchParams = useSearchParams();
  const info = MINI_ARCHETYPES[archetype];
  const sessionId = searchParams.get("sid") ?? getQuizSessionId();

  // Track view
  useEffect(() => {
    trackFunnelEvent(sessionId, "archetype_reveal_view", archetype);
  }, [sessionId, archetype]);

  // Waitlist data
  const [waitlistData, setWaitlistData] = useState<{
    total: number;
    tierRemaining: number;
    currentTierName: string;
    currentDiscount: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/waitlist/count")
      .then((r) => r.json())
      .then(setWaitlistData)
      .catch(() => {});
  }, []);

  // Accordion state
  const [recsOpen, setRecsOpen] = useState(true);
  const [avoidOpen, setAvoidOpen] = useState(false);

  // Share state
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = `https://traversejournal.com/quiz/result/${archetype}`;
  const shareText = `I'm ${info.name} — ${info.tagline}\n\nDiscover your trading archetype:`;

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: `I'm ${info.name}`, text: shareText, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    trackFunnelEvent(sessionId, "archetype_share", archetype);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`https://traversejournal.com/quiz?ref=share`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  // Current tier index for price visual
  const currentTierIndex = waitlistData
    ? PRICE_TIERS.findIndex((t) => t.discount === waitlistData.currentDiscount)
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto space-y-6 pt-8"
      >
        {/* ─── Archetype Header ──────────────────────────────────── */}
        <div className="text-center space-y-3">
          <p className="text-xs text-cyan-400 uppercase tracking-wider font-medium">Your Trading Archetype</p>
          <div className="text-5xl mb-2">{info.emoji}</div>
          <h1 className="text-3xl font-bold">{info.name}</h1>
          <p className="text-gray-500 text-sm italic">&ldquo;{info.tagline}&rdquo;</p>
        </div>

        {/* ─── Core Pattern ──────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-sm text-gray-300 leading-relaxed">{info.corePattern}</p>
        </div>

        {/* ─── How They Trade ────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sound familiar?</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{info.howTheyTrade}</p>
        </div>

        {/* ─── Strengths ─────────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-cyan-400">Your Strengths</h3>
          {info.strengths.map((s, i) => (
            <p key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
              <span className="text-green-400 shrink-0 mt-0.5">&#10003;</span> {s}
            </p>
          ))}
        </div>

        {/* ─── Blind Spots ───────────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-amber-400">Your Blind Spots</h3>
          {info.blindSpots.map((s, i) => (
            <p key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
              <span className="text-amber-400 shrink-0 mt-0.5">&#9888;</span> {s}
            </p>
          ))}
        </div>

        {/* ─── Recommendations (Accordion) ───────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => setRecsOpen(!recsOpen)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <h3 className="text-sm font-semibold text-white">Top Recommendations</h3>
            {recsOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </button>
          <AnimatePresence>
            {recsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-3">
                  {info.recommendations.map((r, i) => (
                    <p key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-green-400 shrink-0 mt-0.5" />
                      {r}
                    </p>
                  ))}
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-xs font-medium text-red-400 mb-2">Avoid</p>
                    {info.avoid.map((a, i) => (
                      <p key={i} className="text-xs text-gray-400 leading-relaxed flex items-start gap-2 mb-1.5">
                        <XCircle size={14} className="text-red-400/60 shrink-0 mt-0.5" />
                        {a}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Self-Talk ─────────────────────────────────────────── */}
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-cyan-400 mb-2">Your Inner Voice</h3>
          <p className="text-sm text-gray-300 italic">&ldquo;{info.selfTalk}&rdquo;</p>
        </div>

        {/* ─── Share Button ──────────────────────────────────────── */}
        <div className="flex justify-center">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
            {copied ? "Copied!" : `Share "I'm ${info.name}"`}
          </button>
        </div>

        {/* ─── Price Escalation Visual ───────────────────────────── */}
        {waitlistData && (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-gray-500">Waitlist Position</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Only <strong className="text-cyan-400">{waitlistData.tierRemaining}</strong> {waitlistData.currentTierName} spots remaining
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{waitlistData.currentTierName}</p>
                <p className="text-xs text-cyan-400">{waitlistData.currentDiscount}% off forever</p>
              </div>
            </div>

            {/* Price tier visual */}
            <div className="flex items-center gap-1.5">
              {PRICE_TIERS.map((tier, i) => (
                <div key={tier.discount} className="flex items-center gap-1.5">
                  <div
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                      i === currentTierIndex
                        ? "bg-cyan-500 text-black"
                        : i < currentTierIndex
                          ? "bg-gray-700 text-gray-500 line-through"
                          : "bg-white/5 text-gray-500"
                    }`}
                  >
                    {tier.label}
                  </div>
                  {i < PRICE_TIERS.length - 1 && (
                    <ArrowRight size={10} className="text-gray-600" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-gray-600 text-center">
              {waitlistData.currentDiscount}% off disappears after {waitlistData.tierRemaining} more signups — then drops to {waitlistData.currentDiscount - 10}%
            </p>
          </div>
        )}

        {/* ─── Share & Move Up ───────────────────────────────────── */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Share & Move Up</h3>
          </div>
          <p className="text-xs text-gray-400">
            Every friend who takes the quiz through your link moves you <strong className="text-cyan-400">3 spots up</strong> the waitlist. 1 referral = Jump 3 Spots!
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all"
            >
              <Share2 size={14} /> Share
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center px-3 py-2.5 rounded-xl text-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
            >
              {linkCopied ? <Check size={14} className="text-green-400" /> : <Link2 size={14} />}
            </button>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
            <p className="text-[10px] text-gray-600 font-mono truncate">
              https://traversejournal.com/quiz?ref=share
            </p>
          </div>
        </div>

        {/* ─── Deep Quiz CTA ──────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-cyan-500/5 to-transparent border border-cyan-500/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowRight size={14} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Go Deeper</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {info.ctaHook}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Take the personalized 20-question deep assessment. Tailored specifically to your archetype with actionable advice.
          </p>
          <a
            href="/quiz/deep"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all"
          >
            Take the Deep Quiz <ArrowRight size={14} />
          </a>
        </div>

        {/* ─── Your Full Profile is Coming ───────────────────────── */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Coming Soon</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            The full Traverse experience: AI coaching personalized to your psychology, P&L tracking connected to your emotional patterns, and ongoing profile refinement as you trade.
          </p>
        </div>

        {/* ─── Disclaimer ────────────────────────────────────────── */}
        <p className="text-[10px] text-gray-600 leading-relaxed text-center px-4">
          This information is for educational purposes only and is not a substitute for professional financial advice. Always do your own research before making trading decisions.
        </p>

        {/* Back to quiz */}
        <div className="text-center pt-2 pb-4">
          <a href="/quiz?retake=1" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Retake the quiz
          </a>
        </div>
      </motion.div>
    </div>
  );
}
