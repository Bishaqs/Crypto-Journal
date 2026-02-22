"use client";

import { useEffect } from "react";
import Link from "next/link";
import { StargateLogo } from "@/components/stargate-logo";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ThemeShowcase } from "@/components/landing/theme-showcase";
import { PricingSection } from "@/components/landing/pricing-section";
import { CandleBackground } from "@/components/candle-background";
import { RealisticBlackHole } from "@/components/realistic-black-hole";
import { useTheme, THEMES } from "@/lib/theme-context";
import {
  BarChart3,
  Brain,
  BookOpen,
  Target,
  Shield,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Zap,
  CalendarDays,
  FileBarChart,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Win rate, profit factor, Sharpe ratio, max drawdown, expectancy — every metric that matters.",
  },
  {
    icon: Brain,
    title: "Psychology Engine",
    description:
      "Tag emotions, rate your process, track confidence. See how your mental state affects your P&L.",
  },
  {
    icon: Sparkles,
    title: "AI Trading Coach",
    description:
      "Ask Claude about your patterns. Get insights like 'Your FOMO trades cost you $2,400 this month.'",
  },
  {
    icon: Target,
    title: "Pre-Trade Checklist",
    description:
      "Enforce your rules before every entry. Is it on plan? What's the stop? What makes this wrong?",
  },
  {
    icon: Shield,
    title: "Tilt Detection",
    description:
      "Automatic warnings when you're revenge trading — 3+ trades after a loss, oversizing, re-entries.",
  },
  {
    icon: CalendarDays,
    title: "Calendar View",
    description:
      "See your green and red days at a glance. Click any day to review trades and emotions.",
  },
  {
    icon: BookOpen,
    title: "Rich Journal",
    description:
      "Write daily notes, tag them, link them to trades. Build a searchable library of lessons.",
  },
  {
    icon: FileBarChart,
    title: "Weekly Reports",
    description:
      "Auto-generated performance reviews. Best trade, worst trade, discipline score, emotional patterns.",
  },
  {
    icon: TrendingUp,
    title: "Streak System",
    description:
      "Duolingo-style journaling streaks. Gamify consistency, not profitability. Grace days included.",
  },
];


const THEME_TO_COLOR: Record<string, "purple" | "orange" | "blue" | "green" | "neutral"> = {
  dark: "purple",
  volcano: "orange",
  ocean: "blue",
  matrix: "green",
  light: "neutral",
  "dark-simple": "neutral",
};

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const bhColor = THEME_TO_COLOR[theme] ?? "purple";

  // Randomize theme on each landing page visit
  useEffect(() => {
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)].value;
    setTheme(randomTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <StargateLogo size={32} />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#8B5CF6] bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite] bg-clip-text text-transparent">
              Stargate
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with Black Hole */}
      <section className="relative min-h-[90vh] flex items-center justify-center">
        {/* Animated candle background — subtle behind everything */}
        <div className="absolute inset-0 overflow-hidden opacity-60">
          <CandleBackground sentiment="bullish" colorScheme="brand" />
        </div>
        {/* Starfield behind the black hole */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="stars-small" />
          <div className="stars-medium" />
          {/* Purple shooting stars */}
          <div className="shooting-star" style={{ top: "12%", left: "20%" }} />
          <div className="shooting-star" style={{ top: "30%", left: "60%", animationDelay: "4s" }} />
          <div className="shooting-star" style={{ top: "65%", left: "35%", animationDelay: "7s" }} />
        </div>

        {/* Black hole — realistic accretion disk with gravitational lensing */}
        <RealisticBlackHole size="large" color={bhColor} />

        {/* Hero ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none" style={{
          background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
        }} />

        {/* Content overlay */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 glass text-accent text-xs font-medium mb-8">
            <Zap size={12} />
            The trading journal that knows your psychology
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight max-w-4xl mx-auto drop-shadow-[0_0_30px_rgba(139,92,246,0.15)]">
            Your edge starts with{" "}
            <span className="text-accent">knowing yourself</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/80 mt-6 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            The trading journal for crypto &amp; stocks that tracks your psychology, enforces your rules, and uses AI to reveal the patterns costing you money.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-background font-semibold text-base hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-300 animate-[cosmic-pulse_3s_ease-in-out_infinite]"
            >
              Start Free <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 rounded-xl glass border border-border/50 text-muted font-medium text-base hover:text-foreground hover:border-accent/30 transition-all"
            >
              See Features
            </a>
          </div>

          <p className="text-xs text-muted/60 mt-4">
            No credit card required. Free plan available.
          </p>
        </div>
      </section>

      {/* Social proof bar */}
      <ScrollReveal>
        <section className="glass border-y border-border/50 py-8 relative z-10">
          <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">Process</p>
              <p className="text-xs text-muted mt-0.5">over outcome</p>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div>
              <p className="text-2xl font-bold text-foreground">30 sec</p>
              <p className="text-xs text-muted mt-0.5">to log a trade</p>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div>
              <p className="text-2xl font-bold text-foreground">AI-Powered</p>
              <p className="text-xs text-muted mt-0.5">behavioral insights</p>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div>
              <p className="text-2xl font-bold text-accent">Crypto-Native</p>
              <p className="text-xs text-muted mt-0.5">built for serious traders</p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Theme Showcase */}
      <ScrollReveal>
        <section className="py-20 relative z-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground heading-glow">
                Your command center, your style
              </h2>
              <p className="text-muted mt-3 max-w-lg mx-auto">
                Five unique themes — click to preview and set your default.
              </p>
            </div>
            <ThemeShowcase />
          </div>
        </section>
      </ScrollReveal>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      {/* Problem → Solution */}
      <ScrollReveal>
        <section className="py-20 max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4 heading-glow">
                Most traders know <span className="text-loss">what</span> went wrong.
                <br />
                Few understand <span className="text-accent">why</span>.
              </h2>
              <p className="text-muted leading-relaxed">
                You review your trades. You see the losses. But you keep making the same mistakes — because the problem isn&apos;t your strategy, it&apos;s your psychology.
              </p>
              <p className="text-muted leading-relaxed mt-3">
                Stargate connects the dots between your emotional state, your process discipline, and your results. When you can see that FOMO trades cost you $2,400 last month, you stop FOMOing.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Track emotions", desc: "Tag every trade with your mental state" },
                { label: "Rate your process", desc: "1-10 score: did you follow rules?" },
                { label: "Spot patterns", desc: "See which emotions cost you money" },
                { label: "Break the cycle", desc: "Data-driven behavioral change" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="glass rounded-2xl border border-border/50 p-5 hover:border-accent/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all duration-300"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <CheckCircle2 size={16} className="text-accent mb-2" />
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      {/* Features grid */}
      <section id="features" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground heading-glow">
                Everything you need to trade better
              </h2>
              <p className="text-muted mt-3 max-w-lg mx-auto">
                Not just another spreadsheet. A complete system for improving your trading through self-awareness.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <div
                  className="feature-card glass rounded-2xl border border-border/50 p-6 hover:border-accent/20 transition-all duration-300 group h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <f.icon size={20} className="text-accent" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2">
                    {f.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      {/* Pricing */}
      <section id="pricing" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground heading-glow">
                Simple, honest pricing
              </h2>
              <p className="text-muted mt-3">
                Start free. Upgrade when you&apos;re ready to get serious.
              </p>
            </div>
          </ScrollReveal>

          <PricingSection />
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      {/* CTA */}
      <ScrollReveal>
        <section className="py-20 relative z-10">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="glass rounded-3xl border border-border/50 p-12 md:p-16 relative overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
              {/* Subtle glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-accent/5 rounded-full blur-3xl" />
              <div className="relative">
                <h2 className="text-3xl font-bold text-foreground">
                  Stop guessing. Start journaling.
                </h2>
                <p className="text-muted mt-3 max-w-lg mx-auto">
                  The best traders are the most self-aware. Stargate gives you the data to become one of them.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 rounded-xl bg-accent text-background font-semibold text-base hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-300 animate-[cosmic-pulse_3s_ease-in-out_infinite]"
                >
                  Create Free Account <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <StargateLogo size={20} />
            <span className="text-sm font-semibold text-muted">Stargate</span>
          </div>
          <p className="text-xs text-muted/50">
            Built for crypto &amp; stock traders who want to improve.
          </p>
        </div>
      </footer>
    </div>
  );
}
