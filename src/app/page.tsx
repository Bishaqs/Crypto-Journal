"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StargateLogo } from "@/components/stargate-logo";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ThemeShowcase } from "@/components/landing/theme-showcase";
import { RealisticBlackHole } from "@/components/realistic-black-hole";
import { useTheme, THEMES } from "@/lib/theme-context";
import {
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const psoBlocks = [
  {
    problem: "You know you revenge trade. You just can\u2019t see it happening in real time.",
    solution: "Stargate flags when you enter multiple trades after a loss, detects oversizing, and shows you the pattern before you blow your week.",
    outcome: "You stop the bleed before it starts.",
  },
  {
    problem: "You have rules. You just don\u2019t follow them when it matters.",
    solution: "Every trade gets a process score. Did you follow your entry criteria? Your position sizing? Your stop loss? Stargate tracks it so you can\u2019t lie to yourself.",
    outcome: "Your win rate goes up because you finally trade your own system.",
  },
  {
    problem: "You journal for three days, then stop. Every time.",
    solution: "Logging a trade takes 30 seconds. Pick your emotion, rate your process, done. Stargate does the analysis. You just show up.",
    outcome: "You actually stick with it because it\u2019s not another chore.",
  },
];

const protocolTrades = [
  { t: "09:41:22", pair: "BTC-PERP", side: "LONG" as const, size: "2.5", emotion: "Confident", process: "9/10", pnl: "+14.2%" },
  { t: "10:15:04", pair: "ETH-PERP", side: "SHORT" as const, size: "15.0", emotion: "Revenge", process: "3/10", pnl: "-2.1%" },
  { t: "11:30:45", pair: "SOL-PERP", side: "LONG" as const, size: "150", emotion: "FOMO", process: "5/10", pnl: "+8.4%" },
  { t: "14:22:10", pair: "AVAX-PERP", side: "LONG" as const, size: "450", emotion: "Confident", process: "8/10", pnl: "+22.5%" },
  { t: "15:45:33", pair: "BTC-PERP", side: "SHORT" as const, size: "1.2", emotion: "Anxious", process: "6/10", pnl: "+5.1%" },
];

const THEME_TO_COLOR: Record<
  string,
  "purple" | "orange" | "blue" | "green" | "neutral"
> = {
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
  const [navScrolled, setNavScrolled] = useState(false);

  // Lock landing page to purple (Space Purple) theme
  useEffect(() => {
    setTheme("dark");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll detection for navbar
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="dark min-h-screen bg-background overflow-hidden">
      {/* ─── Navbar — Floating Pill ─── */}
      <nav
        className={`fixed left-1/2 top-6 z-50 flex w-[92%] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full px-6 py-3.5 transition-all duration-300 ease-out border border-transparent text-foreground ${
          navScrolled ? "nav-scrolled" : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <StargateLogo size={28} />
          <span className="nav-logo-text text-lg font-bold tracking-tight bg-gradient-to-r from-accent via-accent/80 to-accent bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite] bg-clip-text text-transparent">
            Stargate
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
          >
            Features
          </a>
          <a
            href="#protocol"
            className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
          >
            Protocol
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="nav-cta px-4 py-2 text-sm rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* ─── Hero — Black hole RIGHT, text LEFT-bottom ─── */}
      <section className="relative min-h-screen flex items-end pb-24 px-6 md:px-16 overflow-hidden">
        {/* Black hole — offset right */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 lg:left-[20%] opacity-60">
            <RealisticBlackHole
              size="large"
              color={bhColor}
              opacity={theme === "light" ? 0.3 : 0.7}
            />
          </div>
        </div>

        {/* Gradient overlays for text readability */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(to top, var(--background), rgba(8,12,20,0.6), transparent)",
          }}
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(to right, var(--background), rgba(8,12,20,0.4), transparent)",
          }}
        />

        {/* Hero content — bottom-left */}
        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-start gap-6 pb-12">
          <h1 className="flex flex-col gap-2">
            <span className="text-lg md:text-2xl font-bold uppercase tracking-widest text-foreground/70">
              See exactly which emotions cost you money.
            </span>
            <span className="text-5xl md:text-6xl leading-tight text-accent tracking-tighter font-bold pr-4">
              Then stop repeating them.
            </span>
          </h1>
          <p
            className="max-w-lg text-lg text-foreground/50 mt-4 leading-relaxed"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Log any trade in 30 seconds. Stargate tracks your emotional state
            alongside every entry and shows you the behavioral patterns that are
            bleeding your account.
          </p>
          <div className="mt-8 flex gap-4 flex-wrap">
            <Link
              href="/login"
              className="px-10 py-5 text-lg font-medium rounded-full bg-accent text-white relative overflow-hidden hover:scale-105 transition-transform"
              style={{
                boxShadow: `0 0 40px rgba(var(--accent-rgb), 0.4)`,
              }}
            >
              Start journaling free
            </Link>
            <a
              href="#features"
              className="px-10 py-5 text-lg font-medium rounded-full text-foreground/70 hover:bg-foreground/10 transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ─── Social Proof Bar ─── */}
      <ScrollReveal>
        <section className="glass border-y border-border/50 py-8 relative z-10">
          <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">P&L + Psychology</p>
              <p className="text-xs text-muted mt-0.5">connected in every trade</p>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div>
              <p className="text-2xl font-bold text-foreground">30 sec</p>
              <p className="text-xs text-muted mt-0.5">to log a trade</p>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div>
              <p className="text-2xl font-bold text-foreground">Data-driven</p>
              <p className="text-xs text-muted mt-0.5">pattern detection</p>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div>
              <p className="text-2xl font-bold text-accent">Automatic</p>
              <p className="text-xs text-muted mt-0.5">
                patterns detected for you
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ─── Theme Showcase ─── */}
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

      {/* ─── Philosophy — Contrast Word Reveal ─── */}
      <ScrollReveal>
        <section className="relative py-32 md:py-40 px-6 md:px-16 overflow-hidden min-h-[70vh] flex items-center">
          {/* Subtle background overlay */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(var(--accent-rgb), 0.04) 0%, transparent 60%)",
            }}
          />
          <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-12">
            <h2 className="text-xl md:text-3xl text-muted tracking-tight leading-relaxed max-w-2xl">
              Most traders: check P&L obsessively, revenge trade after a loss, size up when emotional, skip their own rules, journal for two days then quit.
            </h2>
            <h2 className="text-4xl md:text-6xl lg:text-[5.5rem] tracking-tight leading-[1.1] font-bold max-w-5xl text-foreground/90">
              Stargate connects your{" "}
              <span className="text-accent">emotional state</span> to your{" "}
              <span className="text-accent">P&L</span> so you see the{" "}
              <span className="text-accent">pattern,</span> not just the loss.
            </h2>
          </div>
        </section>
      </ScrollReveal>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      {/* ─── Features — 3 Problem-Solution-Outcome Blocks ─── */}
      <section
        id="features"
        className="py-24 md:py-32 relative z-10"
      >
        <div className="max-w-5xl mx-auto px-6">
          <ScrollReveal>
            <div className="mb-16">
              <h2
                className="text-4xl md:text-5xl font-bold tracking-tight text-foreground"
              >
                Three problems. Three solutions.
              </h2>
            </div>
          </ScrollReveal>

          <div className="flex flex-col gap-6">
            {psoBlocks.map((block, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div
                  className="rounded-[2rem] border border-white/10 p-8 md:p-10"
                  style={{ background: "rgba(10,10,20,0.95)", color: "#e0eaf4" }}
                >
                  <p className="text-purple-400 text-sm font-semibold uppercase tracking-wider mb-3">
                    The problem
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-white/90 mb-6">
                    {block.problem}
                  </p>
                  <p className="text-white/50 leading-relaxed mb-6">
                    {block.solution}
                  </p>
                  <div className="flex items-center gap-2">
                    <ArrowRight size={16} className="text-accent" />
                    <p className="text-accent font-semibold">
                      {block.outcome}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Psychology ─── */}
      <ScrollReveal>
        <section className="py-20 max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4 heading-glow">
                You already know what you&apos;re doing wrong.
              </h2>
              <p className="text-muted leading-relaxed">
                You&apos;ve said it out loud. &ldquo;I knew I shouldn&apos;t have taken
                that trade.&rdquo; The problem isn&apos;t knowledge. It&apos;s that you
                can&apos;t see the pattern while you&apos;re inside it.
              </p>
              <p className="text-muted leading-relaxed mt-3">
                Stargate shows you the data so your brain can&apos;t ignore it
                anymore.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Track emotions",
                  desc: "Tag every trade with how you felt. Confident, anxious, revenge, FOMO. Takes one tap.",
                },
                {
                  label: "Rate your process",
                  desc: "Did you follow your rules? Yes or no. No essays. Just honesty.",
                },
                {
                  label: "Spot patterns",
                  desc: "Stargate shows you: \u2018You lose 73% of trades taken when anxious.\u2019 Hard to argue with a number.",
                },
                {
                  label: "Break the cycle",
                  desc: "Next time you feel anxious and reach for the buy button, you\u2019ll remember that number.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="glass rounded-2xl border border-border/50 p-5 hover:border-accent/20 hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.08)] transition-all duration-300"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <CheckCircle2 size={16} className="text-accent mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      {/* ─── Protocol — Trade Log ─── */}
      <section id="protocol" className="py-24 md:py-32 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 md:px-16 mb-20 text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
              Your trade log
            </h2>
            <p
              className="text-muted text-lg max-w-2xl mx-auto"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Every trade logged with your entry reason, emotional state, and
              process score. One glance tells you if you traded your plan or
              traded your feelings.
            </p>
          </ScrollReveal>
        </div>
        <ScrollReveal>
          <div
            className="max-w-6xl mx-auto px-6 relative z-10"
            style={{ perspective: "1000px" }}
          >
            <div
              className="relative w-full rounded-2xl border p-8 backdrop-blur-md"
              style={{
                borderColor: "rgba(var(--accent-rgb), 0.2)",
                background: "rgba(10,10,20,0.8)",
                boxShadow: `0 0 80px rgba(var(--accent-rgb), 0.1)`,
                transform: "rotateX(15deg)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Scanline */}
              <div
                className="absolute top-0 left-0 w-full h-[2px] z-20 pointer-events-none"
                style={{
                  background: `rgba(var(--accent-rgb), 0.5)`,
                  boxShadow: `0 0 20px 2px rgba(var(--accent-rgb), 0.8)`,
                  animation: "scanline-move 3s linear infinite",
                }}
              />
              {/* Headers */}
              <div
                className="grid grid-cols-7 gap-4 mb-6 border-b border-white/10 pb-4 text-xs uppercase tracking-[0.2em] text-accent font-bold"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                <div>Timestamp</div>
                <div>Asset</div>
                <div>Direction</div>
                <div>Size</div>
                <div>Emotion</div>
                <div>Process</div>
                <div className="text-right">PnL</div>
              </div>
              {/* Rows */}
              <div className="flex flex-col gap-3">
                {protocolTrades.map((tr) => (
                  <div
                    key={tr.t}
                    className="protocol-row grid grid-cols-7 gap-4 items-center p-4 rounded-lg bg-white/5 border border-white/5 text-sm relative overflow-hidden group"
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    <div
                      className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                      style={{
                        background: `linear-gradient(to right, transparent, rgba(var(--accent-rgb), 0.05), transparent)`,
                      }}
                    />
                    <div className="text-white/50 rounded px-2 py-1 w-fit">
                      {tr.t}
                    </div>
                    <div className="text-white font-bold">{tr.pair}</div>
                    <div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          tr.side === "LONG"
                            ? "text-purple-300 border border-purple-300/20"
                            : "text-purple-500 border border-purple-500/20"
                        }`}
                        style={{
                          background:
                            tr.side === "LONG"
                              ? "rgba(139,92,246,0.15)"
                              : "rgba(139,92,246,0.08)",
                        }}
                      >
                        {tr.side}
                      </span>
                    </div>
                    <div className="text-white/70">{tr.size}</div>
                    <div className="text-purple-300/80">{tr.emotion}</div>
                    <div className="text-white/60">{tr.process}</div>
                    <div
                      className={`text-right font-bold ${
                        tr.pnl.startsWith("+")
                          ? "text-purple-300"
                          : "text-purple-500/70"
                      }`}
                    >
                      {tr.pnl}
                    </div>
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div
                className="mt-8 flex justify-between items-center border-t border-white/10 pt-4 text-xs text-white/30"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Live sync
                </div>
                <div>All data encrypted</div>
              </div>
            </div>
          </div>
        </ScrollReveal>
        {/* Ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, rgba(var(--accent-rgb), 0.05) 0%, transparent 70%)`,
          }}
        />
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

      {/* ─── GetStarted CTA — Gemini style ─── */}
      <ScrollReveal>
        <section
          className="py-32 px-6 md:px-16 relative overflow-hidden flex flex-col items-center justify-center text-center"
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background: `rgba(var(--accent-rgb), 0.2)`,
              filter: "blur(120px)",
            }}
          />
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8">
            <span
              className="text-sm uppercase font-bold tracking-[0.2em] px-4 py-2 rounded-full"
              style={{
                color: "var(--accent)",
                border: "1px solid rgba(var(--accent-rgb), 0.3)",
                background: "rgba(var(--accent-rgb), 0.1)",
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            >
              Early Access
            </span>
            <h2
              className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground"
            >
              Free while we build this with you.
            </h2>
            <p
              className="text-xl max-w-2xl mt-4 mb-8 text-foreground/70"
            >
              We&apos;re looking for serious traders to shape the product. You
              get full access to everything. We get your honest feedback. No
              credit card. No catch.
            </p>
            <Link
              href="/login"
              className="px-12 py-6 text-xl rounded-full bg-accent text-white font-medium relative overflow-hidden hover:scale-105 transition-transform"
              style={{
                boxShadow: `0 0 40px rgba(var(--accent-rgb), 0.4)`,
              }}
            >
              Get free access
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {/* ─── Footer — Gemini style ─── */}
      <footer className="rounded-t-[4rem] px-8 md:px-16 pt-24 pb-8 overflow-hidden relative border-t border-border/50">
        <div
          className="absolute inset-0 z-0"
          style={{ background: "rgba(var(--accent-rgb), 0.03)" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-border/30 pb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <StargateLogo size={28} />
              <span className="text-2xl font-bold tracking-tight text-foreground">
                STARGATE
              </span>
            </div>
            <p
              className="text-muted max-w-sm text-sm leading-relaxed"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              The trading journal that connects your psychology to your P&L.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-muted/40 mb-6">
              Product
            </h4>
            <ul className="space-y-4 text-foreground/70">
              <li>
                <a
                  href="#features"
                  className="hover:text-accent transition-colors"
                >
                  Journal
                </a>
              </li>
              <li>
                <a
                  href="#protocol"
                  className="hover:text-accent transition-colors"
                >
                  Analytics
                </a>
              </li>
              <li>
                <span className="text-muted/40">Simulator</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-muted/40 mb-6">
              Company
            </h4>
            <ul className="space-y-4 text-foreground/70">
              <li>
                <span className="text-muted/40">About</span>
              </li>
              <li>
                <span className="text-muted/40">Feedback</span>
              </li>
              <li>
                <span className="text-muted/40">Twitter/X</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-foreground/5 px-4 py-2 rounded-full border border-border/50">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
            </span>
            <span
              className="text-xs uppercase tracking-wider text-foreground/70"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Systems online
            </span>
          </div>
          <p className="text-muted/50 text-sm">
            &copy; {new Date().getFullYear()} Stargate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
