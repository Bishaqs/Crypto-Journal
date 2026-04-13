"use client";

import Link from "next/link";
import { TraverseLogo } from "@/components/traverse-logo";
import { PricingSection } from "@/components/landing/pricing-section";
import { PricingPreview } from "@/components/pricing/pricing-preview";
import { CandleBackground } from "@/components/candle-background";
import { ArrowLeft, Shield, Zap, Clock } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <CandleBackground />
        <div className="stars-small" />
        <div className="stars-medium" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <TraverseLogo size={28} />
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-accent via-accent-hover to-accent bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite] bg-clip-text text-transparent">
            Traverse
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-muted text-sm md:text-base max-w-lg mx-auto">
            Start free. Upgrade when you&apos;re ready to get serious about your edge.
          </p>
        </div>

        {/* Two-column layout: pricing left, preview right */}
        <div className="flex gap-10 items-start">
          {/* Pricing cards */}
          <div className="flex-1 min-w-0">
            <PricingSection />
          </div>

          {/* Animated preview (desktop only) */}
          <div className="hidden lg:block w-[400px] shrink-0 sticky top-8">
            <PricingPreview />
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="flex items-start gap-3 text-center md:text-left">
            <div className="p-2 rounded-lg bg-accent/10 shrink-0">
              <Clock size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">14-day free trial</p>
              <p className="text-xs text-muted mt-0.5">Full Pro access, no card required</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-center md:text-left">
            <div className="p-2 rounded-lg bg-accent/10 shrink-0">
              <Shield size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Cancel anytime</p>
              <p className="text-xs text-muted mt-0.5">No lock-in, no hidden fees</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-center md:text-left">
            <div className="p-2 rounded-lg bg-accent/10 shrink-0">
              <Zap size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Instant access</p>
              <p className="text-xs text-muted mt-0.5">Start tracking in under 60 seconds</p>
            </div>
          </div>
        </div>

        {/* FAQ-like section */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted">
            Questions? Email us at{" "}
            <a href="mailto:support@traversejournal.com" className="text-accent hover:text-accent-hover transition-colors">
              support@traversejournal.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
