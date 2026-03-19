"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronUp, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Proposal = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  vote_count: number;
  hasVoted: boolean;
};

const CATEGORIES = ["all", "psychology", "analytics", "automation", "social", "general"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  analytics: "Analytics",
  psychology: "Psychology",
  automation: "Automation",
  social: "Social",
  general: "General",
};

export default function VotePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-[#67e8f9]" size={32} />
        </div>
      }
    >
      <VotePageContent />
    </Suspense>
  );
}

function VotePageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [position, setPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Suggestion form
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestTitle, setSuggestTitle] = useState("");
  const [suggestDesc, setSuggestDesc] = useState("");
  const [suggestCategory, setSuggestCategory] = useState("general");
  const [suggestStatus, setSuggestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [suggestError, setSuggestError] = useState("");

  const fetchProposals = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/waitlist/vote?token=${token}`);
      const data = await res.json();
      if (res.ok) {
        setProposals(data.proposals);
        setPosition(data.position);
        setError(null);
      } else {
        setError(data.error || "Invalid token");
      }
    } catch {
      setError("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  async function handleVote(proposalId: string, action: "vote" | "unvote") {
    if (!token || votingId) return;
    setVotingId(proposalId);

    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? { ...p, hasVoted: action === "vote", vote_count: p.vote_count + (action === "vote" ? 1 : -1) }
          : p
      )
    );

    try {
      const res = await fetch("/api/waitlist/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, proposalId, action }),
      });
      const data = await res.json();
      if (!data.success) fetchProposals();
    } catch {
      fetchProposals();
    } finally {
      setVotingId(null);
    }
  }

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!token || suggestStatus === "loading") return;
    setSuggestStatus("loading");
    setSuggestError("");

    try {
      const res = await fetch("/api/waitlist/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          title: suggestTitle.trim(),
          description: suggestDesc.trim() || undefined,
          category: suggestCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestStatus("success");
        setSuggestTitle("");
        setSuggestDesc("");
        setSuggestCategory("general");
        setTimeout(() => setSuggestStatus("idle"), 3000);
      } else {
        setSuggestStatus("error");
        setSuggestError(data.error || "Failed to submit");
      }
    } catch {
      setSuggestStatus("error");
      setSuggestError("Network error");
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-white/90 mb-4">Missing access token</h1>
          <p className="text-white/50 mb-8">This link may be incomplete. Check your email for the full voting link.</p>
          <Link href="/" className="text-[#67e8f9] hover:underline">Back to Traverse</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#67e8f9]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-white/90 mb-4">Invalid or expired token</h1>
          <p className="text-white/50 mb-8">{error}</p>
          <Link href="/" className="text-[#67e8f9] hover:underline">Back to Traverse</Link>
        </div>
      </div>
    );
  }

  const filtered = activeCategory === "all"
    ? proposals
    : proposals.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors">
            <ArrowLeft size={16} />
            <span className="text-sm">Traverse</span>
          </Link>
          {position && (
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-[#67e8f9]/20 bg-[#67e8f9]/10 text-[#67e8f9] tracking-wider">
              Early Access #{position}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-3">
            Feature Roadmap
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            Allocate your votes to the features you need most to stop bleeding P&L.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors ${
                activeCategory === cat
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Proposal cards */}
        <div className="flex flex-col gap-4">
          {filtered.map((proposal) => (
            <div
              key={proposal.id}
              className="group flex items-start gap-4 bg-white/[0.02] border border-white/10 rounded-xl p-5 hover:border-white/20 hover:-translate-y-[1px] transition-all"
            >
              {/* Vote column */}
              <button
                onClick={() => handleVote(proposal.id, proposal.hasVoted ? "unvote" : "vote")}
                disabled={votingId === proposal.id}
                className={`flex flex-col items-center gap-0.5 pt-0.5 min-w-[48px] transition-colors ${
                  proposal.hasVoted ? "text-[#67e8f9]" : "text-white/30 hover:text-[#67e8f9]"
                }`}
              >
                <ChevronUp size={20} />
                <span className="text-sm font-mono font-medium">{proposal.vote_count}</span>
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                  {CATEGORY_LABELS[proposal.category] ?? proposal.category}
                </span>
                <h3 className="text-base font-medium text-white mt-1 mb-1">{proposal.title}</h3>
                {proposal.description && (
                  <p className="text-sm text-white/60 leading-relaxed">{proposal.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Suggest a feature */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <h3 className="text-lg font-medium text-white mb-4">Propose a Feature</h3>

          {!showSuggest ? (
            <button
              onClick={() => setShowSuggest(true)}
              className="text-[#67e8f9] text-sm font-medium hover:underline"
            >
              Have an idea? Submit a proposal.
            </button>
          ) : (
            <form onSubmit={handleSuggest} className="flex flex-col gap-4 max-w-lg">
              <input
                type="text"
                value={suggestTitle}
                onChange={(e) => setSuggestTitle(e.target.value)}
                placeholder="Feature title"
                required
                maxLength={100}
                className="bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#67e8f9]/50 text-sm"
              />
              <textarea
                value={suggestDesc}
                onChange={(e) => setSuggestDesc(e.target.value)}
                placeholder="Detailed description"
                maxLength={500}
                rows={3}
                className="bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#67e8f9]/50 text-sm resize-none"
              />
              <select
                value={suggestCategory}
                onChange={(e) => setSuggestCategory(e.target.value)}
                className="bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#67e8f9]/50 appearance-none"
              >
                <option value="general">General</option>
                <option value="analytics">Analytics</option>
                <option value="psychology">Psychology</option>
                <option value="automation">Automation</option>
                <option value="social">Social</option>
              </select>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={suggestStatus === "loading" || !suggestTitle.trim()}
                  className="bg-[#67e8f9] text-[#0a0a0c] font-medium rounded-full px-6 py-3 text-sm hover:scale-[1.03] transition-transform disabled:opacity-40"
                >
                  {suggestStatus === "loading" ? "Submitting..." : "Submit Proposal"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuggest(false)}
                  className="text-white/40 text-sm hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {suggestStatus === "success" && (
                <p className="text-emerald-400 text-sm">Proposal submitted! It will appear after review.</p>
              )}
              {suggestStatus === "error" && (
                <p className="text-red-400 text-sm">{suggestError}</p>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
