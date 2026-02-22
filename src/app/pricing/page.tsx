"use client";

import Link from "next/link";
import { StargateLogo } from "@/components/stargate-logo";
import { PricingSection } from "@/components/landing/pricing-section";
import { CandleBackground } from "@/components/candle-background";
import { ArrowLeft, Shield, Zap, Clock } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <CandleBackground colorScheme="brand" />
        <div className="stars-small" />
        <div className="stars-medium" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <StargateLogo size={28} />
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-accent via-[#48CAE4] to-accent bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite] bg-clip-text text-transparent">
            Stargate
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
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-8 pb-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-muted text-sm md:text-base max-w-lg mx-auto">
            Start free. Upgrade when you&apos;re ready to get serious about your edge.
          </p>
        </div>

        {/* Pricing cards (reused from landing) */}
        <PricingSection />

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
            <a href="mailto:support@stargate.trade" className="text-accent hover:text-accent-hover transition-colors">
              support@stargate.trade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
