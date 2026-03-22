"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Share2, ChevronDown } from "lucide-react";
import { TradingCard } from "@/components/trading-card";
import { ARCHETYPES, type TradingArchetype } from "@/lib/psychology-scoring";

export const dynamic = "force-dynamic";

interface ProtocolSlide {
  title: string;
  subtitle: string;
  content: string;
  highlights?: string[];
  techniques?: { name: string; description: string; frequency: string }[];
}

interface Protocol {
  slides: ProtocolSlide[];
  tradingCard: {
    tagline: string;
    topStrength: string;
    topBlindSpot: string;
  };
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [archetype, setArchetype] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!id || !token) {
      setError("Invalid link. Please check your email for the correct link.");
      setLoading(false);
      return;
    }

    // Fetch archetype from quiz result
    fetch(`/api/quiz/protocol?id=${id}&token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to load protocol");
        }
        return res.json();
      })
      .then((data) => {
        setProtocol(data.protocol);
        // Extract archetype from the first slide title or fallback
        setArchetype(data.archetype ?? null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, token]);

  // Also fetch the archetype separately for the trading card
  useEffect(() => {
    if (!id) return;
    // The protocol API doesn't return archetype directly, so we infer from the card data
    // or fetch it. For now, try to match from the protocol's first slide title.
    if (protocol?.slides[0]?.title) {
      const match = protocol.slides[0].title.match(/:\s*(.+)/);
      if (match) {
        const name = match[1].trim();
        const entry = Object.entries(ARCHETYPES).find(
          ([, info]) => info.name === name || info.name === `The ${name}`
        );
        if (entry) setArchetype(entry[0]);
      }
    }
  }, [protocol, id]);

  async function handleShare() {
    const url = window.location.href;
    const title = protocol?.tradingCard?.tagline ?? "My Trading Psychology Profile";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-gray-400 text-sm">Generating your personalized protocol...</p>
        <p className="text-gray-600 text-xs">This may take a moment on first load</p>
      </div>
    );
  }

  if (error || !protocol) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-400 text-sm">{error ?? "Something went wrong"}</p>
        <a
          href="https://traversejournal.com"
          className="text-cyan-400 text-sm underline"
        >
          Back to Traverse Journal
        </a>
      </div>
    );
  }

  const archetypeInfo = archetype
    ? ARCHETYPES[archetype as TradingArchetype]
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Slide Navigation */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2">
        {protocol.slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentSlide
                ? "bg-cyan-400 w-8"
                : "bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
        <button
          onClick={() => setCurrentSlide(3)}
          className={`ml-2 text-[10px] font-mono uppercase tracking-wider transition-all px-2 py-0.5 rounded-full ${
            currentSlide === 3
              ? "bg-cyan-400/20 text-cyan-400"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          Card
        </button>
      </div>

      {/* Slides */}
      <AnimatePresence mode="wait">
        {currentSlide < protocol.slides.length && (
          <motion.div
            key={`slide-${currentSlide}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12"
          >
            <div className="w-full max-w-2xl space-y-8">
              {/* Slide number */}
              <p className="text-xs font-mono uppercase tracking-widest text-cyan-400/50">
                Slide {currentSlide + 1} of {protocol.slides.length}
              </p>

              {/* Title */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {protocol.slides[currentSlide].title}
                </h1>
                <p className="text-lg text-cyan-400/80">
                  {protocol.slides[currentSlide].subtitle}
                </p>
              </div>

              {/* Content */}
              <div className="text-white/70 text-sm md:text-base leading-relaxed whitespace-pre-line">
                {protocol.slides[currentSlide].content}
              </div>

              {/* Highlights */}
              {protocol.slides[currentSlide].highlights && (
                <div className="space-y-3">
                  {protocol.slides[currentSlide].highlights!.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-4"
                    >
                      <span className="text-cyan-400 font-bold text-lg shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-sm text-white/80">{h}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Techniques (Slide 3) */}
              {protocol.slides[currentSlide].techniques && (
                <div className="space-y-4">
                  {protocol.slides[currentSlide].techniques!.map((t, i) => (
                    <div
                      key={i}
                      className="bg-white/[0.03] border border-white/5 rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-white">
                          {t.name}
                        </h3>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/60 bg-cyan-400/10 px-2 py-0.5 rounded-full">
                          {t.frequency}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Next button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() =>
                    setCurrentSlide((s) =>
                      s < protocol.slides.length ? s + 1 : s
                    )
                  }
                  className="flex items-center gap-2 text-sm text-white/40 hover:text-cyan-400 transition-colors"
                >
                  {currentSlide < protocol.slides.length - 1
                    ? "Next Slide"
                    : "View Your Trading Card"}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Trading Card slide */}
        {currentSlide === 3 && archetypeInfo && (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 gap-8"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400/50">
              Your Trading Card
            </p>

            <TradingCard
              archetypeInfo={archetypeInfo}
              tagline={protocol.tradingCard.tagline}
              topStrength={protocol.tradingCard.topStrength}
              topBlindSpot={protocol.tradingCard.topBlindSpot}
              size="full"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
              >
                <Share2 size={16} /> Share Your Archetype
              </button>
              <a
                href="https://traversejournal.com/#waitlist"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-all"
              >
                Join the Waitlist <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
