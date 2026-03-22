"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { TraverseLogo } from "@/components/traverse-logo";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ThemeShowcase } from "@/components/landing/theme-showcase";
import { WaitlistCTA } from "@/components/landing/waitlist-cta";
import { useTheme } from "@/lib/theme-context";
import { RealisticBlackHole } from "@/components/realistic-black-hole";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPage() {
  const { setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme("obsidian");
  }, [setTheme]);

  useGSAP(() => {
    // Reveal animations for hero text
    gsap.from(".hero-text-line", {
      y: 60,
      opacity: 0,
      duration: 1.2,
      stagger: 0.15,
      ease: "power3.out",
      delay: 0.2,
      onComplete: () => {
        document.querySelectorAll("h1 .hero-text-line").forEach((el) => {
          (el as HTMLElement).style.overflow = "visible";
        });
      },
    });

    gsap.from(".hero-cta", {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      delay: 0.6,
    });

    // Parallax on the black hole background
    gsap.to(".hero-video", {
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    // Social proof bar fade in
    gsap.from(".social-proof-item", {
      y: 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".social-proof-bar",
        start: "top 90%",
      },
    });
    
    // Philosophy section parallax text
    gsap.from(".philosophy-text", {
      y: 100,
      opacity: 0,
      duration: 1.5,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".philosophy-section",
        start: "top 75%",
      },
    });

    // Features alternating reveal
    const featureBlocks = gsap.utils.toArray<HTMLElement>(".feature-block");
    featureBlocks.forEach((block, i) => {
      gsap.from(block, {
        x: i % 2 === 0 ? -50 : 50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: block,
          start: "top 80%",
        },
      });
    });

    // Protocol table tilt effect
    gsap.from(".protocol-table-container", {
      rotateX: 15,
      y: 100,
      opacity: 0,
      duration: 1.5,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".protocol-section",
        start: "top 75%",
      },
    });

    // Add magnetic hover interactions to buttons
    const magneticBtns = document.querySelectorAll(".magnetic-btn");
    magneticBtns.forEach((btn) => {
      // Use cubic-bezier as requested in DESIGN SYSTEM 1
      const enter = () => gsap.to(btn, { scale: 1.03, duration: 0.4, ease: "cubic-bezier(0.32, 0.72, 0, 1)" });
      const leave = () => gsap.to(btn, { scale: 1, duration: 0.4, ease: "cubic-bezier(0.32, 0.72, 0, 1)" });
      const down = () => gsap.to(btn, { scale: 0.98, duration: 0.2, ease: "power2.out" });
      const up = () => gsap.to(btn, { scale: 1.03, duration: 0.4, ease: "cubic-bezier(0.32, 0.72, 0, 1)" });
      
      btn.addEventListener("mouseenter", enter);
      btn.addEventListener("mouseleave", leave);
      btn.addEventListener("mousedown", down);
      btn.addEventListener("mouseup", up);
      
      // Cleanup happens via useGSAP
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-[#0a0a0c] text-[#f4f4f5] font-sans selection:bg-[#67e8f9]/30 selection:text-[#67e8f9] overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-6 px-4 md:px-12 flex items-center justify-between mix-blend-difference pointer-events-none">
        <Link href="/" className="flex items-center gap-3 group pointer-events-auto">
          <div className="hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(103,232,249,0.5)] transition-all duration-300">
            <TraverseLogo size={32} />
          </div>
          <span className="font-mono text-sm tracking-widest uppercase opacity-90 group-hover:opacity-100 transition-opacity">Traverse</span>
        </Link>
        <div className="flex items-center gap-6 pointer-events-auto">
          <Link href="/login" className="hidden md:block text-sm font-medium hover:text-[#67e8f9] transition-colors duration-300">
            Sign In
          </Link>
          <a href="#waitlist" className="magnetic-btn rounded-full bg-[#f4f4f5] text-[#0a0a0c] px-6 py-3 text-sm font-bold flex items-center gap-2 hover:bg-[#67e8f9] transition-colors duration-300">
            Early Access
          </a>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main>
        <section className="hero-section relative w-full min-h-[100dvh] flex flex-col justify-end pb-24 md:pb-32 px-4 md:px-24">
          {/* Black Hole Background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="hero-video absolute inset-0 flex items-center justify-end pr-[5%]">
              <RealisticBlackHole size="large" opacity={0.5} color="purple" />
            </div>
            {/* Gradients for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/40 via-transparent to-[#0a0a0c] mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-tr from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent"></div>
          </div>

          {/* Hero Content (Left-aligned asymmetric) */}
          <div className="relative z-10 max-w-[85ch] flex flex-col items-start gap-8">
            <div className="hero-text-line rounded-full px-3 py-1 bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#67e8f9]">
                Trading Psychology Engine
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[6.5rem] leading-[0.9] tracking-tighter font-medium text-balance">
              <div className="hero-text-line overflow-hidden">
                <span className="block">See exactly which</span>
              </div>
              <div className="hero-text-line overflow-hidden text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70">
                <span className="block">emotions cost you money.</span>
              </div>
              <div className="hero-text-line overflow-hidden">
                <span className="block font-drama italic text-white/80">Then stop repeating them.</span>
              </div>
            </h1>

            <p className="hero-text-line text-lg md:text-xl text-white/70 leading-relaxed max-w-[50ch] font-light">
              Log any trade in 30 seconds. Traverse tracks your emotional state alongside every entry and shows you the behavioral patterns that are bleeding your account.
            </p>

            <div className="hero-cta flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-4">
              <a
                href="#waitlist"
                className="magnetic-btn group relative overflow-hidden rounded-full bg-[#f4f4f5] text-[#0a0a0c] pl-8 pr-4 py-3 font-medium flex items-center gap-6 transition-all"
              >
                <div className="absolute inset-0 bg-[#67e8f9] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-full"></div>
                <span className="relative z-10">Join the Waitlist</span>
                <div className="relative z-10 bg-[#0a0a0c]/10 rounded-full w-10 h-10 flex items-center justify-center group-hover:bg-[#0a0a0c]/20 transition-colors">
                  <ArrowRight size={18} />
                </div>
              </a>
              <a 
                href="#features" 
                className="magnetic-btn flex items-center gap-3 text-white/70 hover:text-white transition-colors py-4 group"
              >
                <span className="text-sm font-medium border-b border-white/20 pb-0.5 group-hover:border-white/60 transition-colors">See how it works</span>
                <ChevronDown size={16} className="opacity-50 group-hover:opacity-100 group-hover:translate-y-1 transition-all" />
              </a>
            </div>
          </div>
        </section>

        {/* --- SOCIAL PROOF BAR --- */}
        <section className="social-proof-bar relative z-20 border-y border-white/5 bg-[#080c14] py-8 md:py-12 overflow-hidden">
          <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-8 md:gap-4 px-4 md:px-24">
            {[
              { label: "P&L + Psychology", desc: "connected in every trade" },
              { label: "30 sec", desc: "to log a trade" },
              { label: "Data-driven", desc: "pattern detection" },
              { label: "Automatic", desc: "patterns detected for you" }
            ].map((item, i) => (
              <div key={i} className="social-proof-item flex flex-col gap-1.5 w-[45%] md:w-auto">
                <span className="font-mono text-[#67e8f9] text-lg md:text-xl font-medium tracking-tight">{item.label}</span>
                <span className="text-[10px] md:text-xs text-white/50 uppercase tracking-widest">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* --- THEME SHOWCASE --- */}
        <section className="py-24 md:py-40 px-4 md:px-24">
          <ScrollReveal delay={100}>
            <div className="flex flex-col gap-16">
              <div className="flex flex-col gap-4 text-left max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-medium tracking-tight">Your command center, your style</h2>
                <p className="text-white/50 text-xl font-light">Five unique themes — click to preview and set your default.</p>
              </div>
              <ThemeShowcase />
            </div>
          </ScrollReveal>
        </section>

        {/* --- PHILOSOPHY --- */}
        <section className="philosophy-section py-24 md:py-40 px-4 md:px-24 flex justify-center border-y border-white/5 relative min-h-[80vh] items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.03)_0%,transparent_70%)] pointer-events-none"></div>
          <div className="max-w-[70ch] text-center flex flex-col gap-12 philosophy-text">
            <p className="text-xl md:text-3xl font-light leading-snug text-white/50 text-balance">
              Most traders: check P&L obsessively, revenge trade after a loss, size up when emotional, skip their own rules, journal for two days then quit.
            </p>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#67e8f9]/50 to-transparent mx-auto"></div>
            <p className="text-2xl md:text-4xl lg:text-5xl font-medium leading-[1.15] tracking-tight text-white/90 text-balance">
              Traverse connects your <span className="text-[#67e8f9] font-drama italic">emotional state</span> to your <span className="text-[#67e8f9] font-drama italic">P&L</span> so you see the <span className="text-[#67e8f9] font-drama italic">pattern</span>, not just the loss.
            </p>
          </div>
        </section>

        {/* --- FEATURES (Asymmetric Layout) --- */}
        <section id="features" className="py-32 md:py-48 px-4 md:px-24 flex flex-col gap-32 md:gap-40 overflow-hidden">
          
          {/* Block 1 */}
          <article className="feature-block flex flex-col md:flex-row gap-12 md:gap-16 items-center">
            <div className="w-full md:w-5/12 flex flex-col gap-8 order-2 md:order-1">
              <div className="rounded-full px-3 py-1 bg-[#67e8f9]/10 text-[#67e8f9] border border-[#67e8f9]/20 self-start">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Pattern Recognition</span>
              </div>
              <h3 className="text-4xl md:text-5xl leading-[1.1] font-medium tracking-tighter text-balance">
                You know you revenge trade. You just can't see it happening in real time.
              </h3>
              <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-[65ch]">
                Traverse flags when you enter multiple trades after a loss, detects oversizing, and shows you the pattern before you blow your week.
              </p>
              <div className="pt-6 border-t border-white/10 mt-2">
                <p className="font-mono text-sm text-[#67e8f9]">Outcome: <span className="text-white">You stop the bleed before it starts.</span></p>
              </div>
            </div>
            
            <div className="w-full md:w-7/12 order-1 md:order-2">
              <div className="w-full aspect-[4/3] rounded-[2rem] ring-1 ring-white/5 p-1.5 bg-[#0a0a0c] shadow-[0_0_80px_-20px_rgba(103,232,249,0.15)] relative overflow-hidden group">
                {/* Double bezel inner core */}
                <div className="w-full h-full rounded-[1.5rem] bg-[#0c121e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 relative overflow-hidden flex items-center justify-center p-8">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#67e8f9] via-transparent to-transparent group-hover:opacity-40 transition-opacity duration-1000"></div>
                  
                  {/* Abstract UI representation */}
                  <div className="relative z-10 w-full max-w-sm flex flex-col gap-4">
                    <div className="w-full h-12 rounded-xl bg-white/5 border border-white/10 flex items-center px-4 shadow-sm">
                      <div className="w-8 h-2 rounded-full bg-red-400"></div>
                      <div className="ml-4 w-24 h-2 rounded-full bg-white/20"></div>
                    </div>
                    <div className="w-full h-24 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center justify-between px-6 shadow-[0_4px_30px_rgba(239,68,68,0.15)] backdrop-blur-md">
                      <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-mono text-red-400 uppercase tracking-[0.1em]">Warning</div>
                        <div className="text-white text-sm font-medium">Revenge trade pattern detected</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-medium">!</div>
                    </div>
                    <div className="w-full h-12 rounded-xl bg-white/5 border border-white/10 flex items-center px-4 opacity-40 shadow-sm">
                      <div className="w-12 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Block 2 (Flipped) */}
          <article className="feature-block flex flex-col md:flex-row gap-12 md:gap-16 items-center">
            <div className="w-full md:w-7/12">
              <div className="w-full aspect-[4/3] rounded-[2rem] ring-1 ring-white/5 p-1.5 bg-[#0a0a0c] shadow-[0_0_80px_-20px_rgba(103,232,249,0.1)] relative overflow-hidden group">
                <div className="w-full h-full rounded-[1.5rem] bg-[#0c121e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 relative overflow-hidden flex items-center justify-center p-8">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent group-hover:opacity-40 transition-opacity duration-1000"></div>
                  
                  {/* Abstract UI representation */}
                  <div className="relative z-10 w-full max-w-sm flex flex-col gap-4 justify-center">
                    {[10, 8, 4, 9, 2].map((score, idx) => (
                      <div key={idx} className="w-full flex items-center gap-4">
                        <div className="w-20 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">Trade {idx+1}</div>
                        <div className="flex-1 h-8 bg-[#0a0a0c] rounded border border-white/5 overflow-hidden flex items-center p-1">
                          <div 
                            className={`h-full rounded-sm transition-all duration-1000 ${score >= 8 ? 'bg-[#67e8f9] shadow-[0_0_10px_rgba(103,232,249,0.5)]' : score >= 5 ? 'bg-white/40' : 'bg-white/10'}`}
                            style={{ width: `${score * 10}%` }}
                          ></div>
                        </div>
                        <div className={`w-8 font-mono text-sm ${score >= 8 ? 'text-[#67e8f9]' : 'text-white/40'}`}>{score}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-5/12 flex flex-col gap-8">
              <div className="rounded-full px-3 py-1 bg-white/5 text-white/70 border border-white/10 self-start">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Process Scoring</span>
              </div>
              <h3 className="text-4xl md:text-5xl leading-[1.1] font-medium tracking-tighter text-balance">
                You have rules. You just don't follow them when it matters.
              </h3>
              <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-[65ch]">
                Every trade gets a process score. Did you follow your entry criteria? Your position sizing? Your stop loss? Traverse tracks it so you can't lie to yourself.
              </p>
              <div className="pt-6 border-t border-white/10 mt-2">
                <p className="font-mono text-sm text-[#67e8f9]">Outcome: <span className="text-white">Your win rate goes up because you finally trade your own system.</span></p>
              </div>
            </div>
          </article>

          {/* Block 3 */}
          <article className="feature-block flex flex-col md:flex-row gap-12 md:gap-16 items-center">
            <div className="w-full md:w-5/12 flex flex-col gap-8 order-2 md:order-1">
              <div className="rounded-full px-3 py-1 bg-white/5 text-white/70 border border-white/10 self-start">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Frictionless</span>
              </div>
              <h3 className="text-4xl md:text-5xl leading-[1.1] font-medium tracking-tighter text-balance">
                You journal for three days, then stop. Every time.
              </h3>
              <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-[65ch]">
                Logging a trade takes 30 seconds. Pick your emotion, rate your process, done. Traverse does the analysis. You just show up.
              </p>
              <div className="pt-6 border-t border-white/10 mt-2">
                <p className="font-mono text-sm text-[#67e8f9]">Outcome: <span className="text-white">You actually stick with it because it's not another chore.</span></p>
              </div>
            </div>
            
            <div className="w-full md:w-7/12 order-1 md:order-2">
              <div className="w-full aspect-[4/3] rounded-[2rem] ring-1 ring-white/5 p-1.5 bg-[#0a0a0c] shadow-[0_0_80px_-20px_rgba(255,255,255,0.05)] relative overflow-hidden group">
                <div className="w-full h-full rounded-[1.5rem] bg-[#0c121e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-8">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#67e8f9]/20 blur-[100px] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                  
                  {/* Abstract UI representation */}
                  <div className="relative z-10 w-full max-w-sm bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col gap-8">
                    <div className="flex flex-wrap gap-3">
                      {["FOMO", "Anxious", "Confident", "Revenge"].map((em, i) => (
                        <div key={i} className={`px-4 py-2 rounded-full text-xs font-mono tracking-wide ${i === 2 ? 'bg-[#67e8f9]/10 text-[#67e8f9] border border-[#67e8f9]/30 shadow-[0_0_15px_rgba(103,232,249,0.15)]' : 'bg-[#0a0a0c] text-white/40 border border-white/5'}`}>
                          {em}
                        </div>
                      ))}
                    </div>
                    <div className="h-12 w-full bg-[#67e8f9] text-[#0a0a0c] font-medium text-sm rounded-xl flex items-center justify-center group-hover:bg-white transition-colors duration-500 cursor-default shadow-[0_4px_20px_rgba(103,232,249,0.3)]">
                      Log Trade (⌘ Enter)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        {/* --- PSYCHOLOGY SECTION (Masonry/Asymmetric Grid) --- */}
        <section className="py-32 md:py-48 px-4 md:px-24 bg-[#05070a] border-y border-white/5">
          <div className="max-w-7xl mx-auto flex flex-col gap-24">
            <div className="flex flex-col md:flex-row gap-12 md:gap-24 justify-between items-end">
              <div className="flex flex-col gap-8 max-w-2xl">
                <h2 className="text-5xl md:text-6xl font-medium tracking-tighter text-balance leading-[0.95]">
                  You already know what you're doing wrong.
                </h2>
                <p className="text-xl md:text-2xl text-white/50 leading-relaxed font-light">
                  You've said it out loud. "I knew I shouldn't have taken that trade." The problem isn't knowledge. It's that you can't see the pattern while you're inside it. Traverse shows you the data so your brain can't ignore it anymore.
                </p>
              </div>
            </div>

            {/* Asymmetric Masonry-style Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-7 rounded-[2rem] ring-1 ring-white/5 p-1.5 bg-[#0a0a0c]">
                <div className="h-full min-h-[350px] rounded-[1.5rem] bg-[#0c121e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-10 flex flex-col justify-end relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#67e8f9]/10 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-[2000ms]"></div>
                  <h4 className="text-3xl font-medium mb-4 relative z-10 tracking-tight">Track emotions</h4>
                  <p className="text-lg text-white/50 relative z-10 max-w-[45ch] leading-relaxed">Logging a trade takes 30 seconds. Pick your emotion, rate your process, done.</p>
                </div>
              </div>
              
              <div className="md:col-span-5 rounded-[2rem] ring-1 ring-white/5 p-1.5 bg-[#0a0a0c]">
                <div className="h-full min-h-[350px] rounded-[1.5rem] bg-[#0c121e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-10 flex flex-col justify-end group">
                  <h4 className="text-3xl font-medium mb-4 tracking-tight group-hover:text-[#67e8f9] transition-colors duration-500">Rate your process</h4>
                  <p className="text-lg text-white/50 leading-relaxed">Did you follow your entry criteria? Traverse tracks it.</p>
                </div>
              </div>

              <div className="md:col-span-4 rounded-[2rem] ring-1 ring-white/5 p-1.5 bg-[#0a0a0c]">
                <div className="h-full min-h-[350px] rounded-[1.5rem] bg-[#0c121e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-10 flex flex-col justify-end group">
                  <h4 className="text-3xl font-medium mb-4 tracking-tight group-hover:text-[#67e8f9] transition-colors duration-500">Spot patterns</h4>
                  <p className="text-lg text-white/50 leading-relaxed">Traverse flags when you enter multiple trades after a loss.</p>
                </div>
              </div>

              <div className="md:col-span-8 rounded-[2rem] ring-1 ring-white/5 p-1.5 bg-[#0a0a0c]">
                <div className="h-full min-h-[350px] rounded-[1.5rem] p-10 bg-gradient-to-tr from-[#0c121e] via-[#0c121e] to-[#121a2a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col justify-end relative overflow-hidden group">
                  <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#67e8f9]/[0.05] blur-[80px] rounded-full group-hover:bg-[#67e8f9]/[0.08] transition-colors duration-1000"></div>
                  <h4 className="text-3xl font-medium mb-4 tracking-tight">Break the cycle</h4>
                  <p className="text-lg text-white/50 text-balance leading-relaxed max-w-[50ch]">The data makes it impossible to hide from your own habits. Stop the bleed.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- PROTOCOL (Trade Log Table) --- */}
        <section className="protocol-section py-32 md:py-48 px-4 overflow-hidden relative border-y border-white/5 bg-[#080a0f] [perspective:1500px]">
          
          {/* Decorative Grid BG */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none"></div>

          <div className="max-w-6xl mx-auto flex flex-col gap-16 relative z-10">
            <div className="flex flex-col gap-8 items-center text-center max-w-2xl mx-auto">
              <div className="rounded-full px-3 py-1 bg-white/5 text-white/50 border border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em]">The Hub</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-medium tracking-tighter leading-[0.9]">Your trade log</h2>
              <p className="text-xl text-white/60 font-light leading-relaxed">
                Every trade logged with your entry reason, emotional state, and process score. One glance tells you if you traded your plan or traded your feelings.
              </p>
            </div>

            <div className="protocol-table-container w-full mx-auto relative [transform-style:preserve-3d]">
              {/* Holographic Scanline */}
              <div className="absolute inset-0 h-24 w-full bg-gradient-to-b from-transparent via-[#67e8f9]/10 to-transparent -translate-y-full opacity-60 z-20 pointer-events-none animate-[scan_6s_ease-in-out_infinite]" style={{ boxShadow: '0 0 30px rgba(103,232,249,0.15)' }}></div>
              
              
              <div className="w-full rounded-[2.5rem] ring-1 ring-white/10 p-2 bg-[#05070a]/90 backdrop-blur-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8),0_0_80px_-20px_rgba(103,232,249,0.15)]">
                <div className="w-full rounded-[2rem] bg-[#0c121e]/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap lg:whitespace-normal">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#67e8f9] py-6 px-8 font-normal">Time</th>
                          <th className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#67e8f9] py-6 px-8 font-normal">Asset</th>
                          <th className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#67e8f9] py-6 px-8 font-normal">Side</th>
                          <th className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#67e8f9] py-6 px-8 font-normal text-right">Size</th>
                          <th className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#67e8f9] py-6 px-8 font-normal">Emotion</th>
                          <th className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#67e8f9] py-6 px-8 font-normal text-center">Process</th>
                          <th className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#67e8f9] py-6 px-8 font-normal text-right">P&L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-sm text-white/80">
                        <tr className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-5 px-8 text-white/50">09:41:22</td>
                          <td className="py-5 px-8 font-medium">BTC-PERP</td>
                          <td className="py-5 px-8 text-emerald-400">LONG</td>
                          <td className="py-5 px-8 text-right text-white/60">2.5</td>
                          <td className="py-5 px-8"><span className="px-3 py-1.5 rounded bg-white/5 text-white/70 border border-white/5 inline-block text-xs">Confident</span></td>
                          <td className="py-5 px-8 text-center text-[#67e8f9]">9/10</td>
                          <td className="py-5 px-8 text-emerald-400 text-right font-medium group-hover:drop-shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all">+14.2%</td>
                        </tr>
                        <tr className="hover:bg-rose-500/[0.02] bg-rose-500/[0.01] transition-colors group">
                          <td className="py-5 px-8 text-white/50">10:15:04</td>
                          <td className="py-5 px-8 font-medium">ETH-PERP</td>
                          <td className="py-5 px-8 text-rose-400">SHORT</td>
                          <td className="py-5 px-8 text-right text-white/60">15.0</td>
                          <td className="py-5 px-8"><span className="px-3 py-1.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-block text-xs">Revenge</span></td>
                          <td className="py-5 px-8 text-center text-rose-400">3/10</td>
                          <td className="py-5 px-8 text-rose-400 text-right font-medium group-hover:drop-shadow-[0_0_12px_rgba(251,113,133,0.5)] transition-all">-2.1%</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-5 px-8 text-white/50">11:30:45</td>
                          <td className="py-5 px-8 font-medium">SOL-PERP</td>
                          <td className="py-5 px-8 text-emerald-400">LONG</td>
                          <td className="py-5 px-8 text-right text-white/60">150</td>
                          <td className="py-5 px-8"><span className="px-3 py-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block text-xs">FOMO</span></td>
                          <td className="py-5 px-8 text-center text-amber-400">5/10</td>
                          <td className="py-5 px-8 text-emerald-400 text-right font-medium group-hover:drop-shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all">+8.4%</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-5 px-8 text-white/50">14:22:10</td>
                          <td className="py-5 px-8 font-medium">AVAX-PERP</td>
                          <td className="py-5 px-8 text-emerald-400">LONG</td>
                          <td className="py-5 px-8 text-right text-white/60">450</td>
                          <td className="py-5 px-8"><span className="px-3 py-1.5 rounded bg-white/5 text-white/70 border border-white/5 inline-block text-xs">Confident</span></td>
                          <td className="py-5 px-8 text-center text-[#67e8f9]">8/10</td>
                          <td className="py-5 px-8 text-emerald-400 text-right font-medium group-hover:drop-shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all">+22.5%</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-5 px-8 text-white/50">15:45:33</td>
                          <td className="py-5 px-8 font-medium">BTC-PERP</td>
                          <td className="py-5 px-8 text-rose-400">SHORT</td>
                          <td className="py-5 px-8 text-right text-white/60">1.2</td>
                          <td className="py-5 px-8"><span className="px-3 py-1.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 inline-block text-xs">Anxious</span></td>
                          <td className="py-5 px-8 text-center text-white/60">6/10</td>
                          <td className="py-5 px-8 text-emerald-400 text-right font-medium group-hover:drop-shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all">+5.1%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- WAITLIST CTA SECTION --- */}
        <WaitlistCTA />
      </main>

      {/* --- FOOTER --- */}
      <footer className="py-16 md:py-24 px-4 md:px-24 bg-[#05070a] border-t border-white/5 rounded-t-[3rem] -mt-8 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-16 lg:gap-8">
          
          <div className="flex flex-col gap-8 max-w-[320px]">
             <div className="flex items-center gap-3">
               <TraverseLogo size={28} />
               <span className="font-mono text-sm tracking-widest uppercase text-white font-semibold">Traverse</span>
             </div>
             <p className="text-white/40 text-sm md:text-base leading-relaxed">
               The trading journal that connects your psychology to your P&L.
             </p>
          </div>

          <div className="flex flex-wrap gap-16 md:gap-24">
            <nav className="flex flex-col gap-6">
              <span className="text-white font-medium text-sm tracking-wide">Product</span>
              <ul className="flex flex-col gap-4">
                <li><Link href="/login" className="text-white/40 hover:text-white transition-colors text-sm">Journal</Link></li>
                <li><Link href="/login" className="text-white/40 hover:text-white transition-colors text-sm">Analytics</Link></li>
                <li><span className="text-white/20 text-sm cursor-not-allowed flex items-center gap-2">Simulator <span className="text-[10px] uppercase tracking-[0.1em] bg-white/5 px-2 py-0.5 rounded font-mono border border-white/5">Soon</span></span></li>
              </ul>
            </nav>
            
            <nav className="flex flex-col gap-6">
              <span className="text-white font-medium text-sm tracking-wide">Legal</span>
              <ul className="flex flex-col gap-4">
                <li><Link href="/impressum" className="text-white/40 hover:text-white transition-colors text-sm">Impressum</Link></li>
                <li><Link href="/privacy" className="text-white/40 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white/40 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/30 text-xs md:text-sm">© 2026 Traverse. All rights reserved.</p>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-white/50 text-xs font-mono uppercase tracking-[0.1em]">Systems online</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
