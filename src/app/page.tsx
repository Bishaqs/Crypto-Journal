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
  Star,
  ChevronDown,
  Quote,
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


const testimonials = [
  {
    quote: "I finally stopped revenge trading. Seeing my tilt patterns in data changed everything.",
    name: "Alex M.",
    role: "Crypto Day Trader",
    tag: "Psychology",
  },
  {
    quote: "The AI coach told me FOMO trades cost me $3,200 last month. That was the wake-up call.",
    name: "Sarah K.",
    role: "Swing Trader",
    tag: "AI Coach",
  },
  {
    quote: "30 seconds to log a trade. No excuses. My journaling streak is at 47 days.",
    name: "Marcus R.",
    role: "Futures Trader",
    tag: "Consistency",
  },
  {
    quote: "Best trading journal I've used. The psychology tracking is what makes it different.",
    name: "David L.",
    role: "Options Trader",
    tag: "Analytics",
  },
  {
    quote: "Went from 42% to 61% win rate in 3 months just by following my own rules.",
    name: "Priya N.",
    role: "Stock Trader",
    tag: "Process",
  },
  {
    quote: "The pre-trade checklist alone saved me from my worst habits.",
    name: "Jake T.",
    role: "Crypto Trader",
    tag: "Discipline",
  },
];

const faqItems = [
  {
    q: "Is my trading data secure?",
    a: "Your data is encrypted and stored securely. We never share or sell your information. You can export or delete everything at any time.",
  },
  {
    q: "Which exchanges and brokers are supported?",
    a: "We support CSV imports from all major crypto exchanges (Binance, Coinbase, Kraken, Bybit, etc.) and stock brokers. Manual entry is always available.",
  },
  {
    q: "What's the difference between Free and Pro?",
    a: "Free gives you 2 trades per week with basic analytics. Pro unlocks unlimited logging, 50+ advanced metrics, psychology engine, tilt detection, and weekly reports.",
  },
  {
    q: "How does the AI Trading Coach work?",
    a: "The AI analyzes your trade history, emotions, and patterns. Ask it anything — \"What's my worst habit?\" or \"How do I perform on Mondays?\" It gives personalized, data-backed answers.",
  },
  {
    q: "Can I use it for both crypto and stocks?",
    a: "Yes. Pick your primary asset when signing up. Add the other as an add-on ($29/year) or get both included with the Max plan.",
  },
  {
    q: "Is there a mobile app?",
    a: "The web app is fully responsive and works great on mobile browsers. A native app is on the roadmap.",
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
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-muted hover:text-foreground transition-colors">FAQ</a>
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
        <RealisticBlackHole size="medium" color={bhColor} opacity={theme === "light" ? 0.25 : 0.7} />

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

      {/* Testimonials */}
      <section className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-3">Testimonials</p>
              <h2 className="text-3xl font-bold text-foreground heading-glow">
                What traders are saying
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 80}>
                <div className="glass rounded-2xl border border-border/50 p-6 h-full flex flex-col feature-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={12} className="text-accent fill-accent" />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-muted px-2 py-0.5 rounded-full border border-border/50">
                      {t.tag}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Quote size={16} className="text-accent/30 mb-2" />
                    <p className="text-sm text-foreground/90 leading-relaxed italic">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border/30">
                    <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted">{t.role}</p>
                    </div>
                  </div>
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

      {/* FAQ */}
      <section id="faq" className="py-20 relative z-10">
        <div className="max-w-3xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-3">FAQ</p>
              <h2 className="text-3xl font-bold text-foreground heading-glow">
                Common Questions
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <details className="group glass rounded-2xl border border-border/50 faq-details">
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-sm font-semibold text-foreground list-none [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown size={16} className="text-muted shrink-0 ml-4 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-5 text-sm text-muted leading-relaxed">
                    {item.a}
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>
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
      <footer className="border-t border-border/50 relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <StargateLogo size={24} />
                <span className="text-base font-bold text-foreground">Stargate</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                The trading journal that tracks your psychology, enforces your rules, and helps you trade better.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5">
                <li><a href="#features" className="text-xs text-muted hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-xs text-muted hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#faq" className="text-xs text-muted hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2.5">
                <li><span className="text-xs text-muted/40">Blog (coming soon)</span></li>
                <li><span className="text-xs text-muted/40">Docs (coming soon)</span></li>
                <li><span className="text-xs text-muted/40">Changelog (coming soon)</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><span className="text-xs text-muted/40">Privacy Policy</span></li>
                <li><span className="text-xs text-muted/40">Terms of Service</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/30 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-muted/50">
              &copy; {new Date().getFullYear()} Stargate. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {/* Twitter/X */}
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-muted/40 hover:text-foreground transition-colors" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              {/* Discord */}
              <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="text-muted/40 hover:text-foreground transition-colors" aria-label="Discord">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
