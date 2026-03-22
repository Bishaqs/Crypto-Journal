"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, CheckCircle2, TrendingUp, Users, Sparkles } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function WaitlistCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "full">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [position, setPosition] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [tierName, setTierName] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Fetch counter on mount
  const [tierRemaining, setTierRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/waitlist/count")
      .then((r) => r.json())
      .then((d) => {
        const rem = d.remaining ?? 2000;
        setRemaining(rem);
        setTierRemaining(d.tierRemaining ?? rem);
        setTierName(d.currentTierName ?? null);
        setDiscount(d.currentDiscount ?? null);
        if (rem <= 0) setStatus("full");
      })
      .catch(() => setRemaining(2000));
  }, []);

  // GSAP staggered reveal
  useGSAP(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      });
      tl.from(".wl-badge", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" })
        .from(".wl-title", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.1 }, "-=0.4")
        .from(".wl-form", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
        .from(".wl-pill", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.1 }, "-=0.6");
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Magnetic button effect
  useGSAP(() => {
    const btn = btnRef.current;
    if (!btn || status === "loading") return;
    const enter = () => gsap.to(btn, { scale: 1.03, duration: 0.3, ease: "power2.out" });
    const leave = () => gsap.to(btn, { scale: 1, duration: 0.3, ease: "power2.out" });
    btn.addEventListener("mouseenter", enter);
    btn.addEventListener("mouseleave", leave);
    return () => {
      btn.removeEventListener("mouseenter", enter);
      btn.removeEventListener("mouseleave", leave);
    };
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setPosition(data.position);
        setRemaining(data.remaining);
        if (data.tier) setTierName(data.tier);
        setStatus("success");
        // Animate success state
        gsap.fromTo(
          ".wl-success",
          { y: 20, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.5)" }
        );
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong");
        if (data.position) setPosition(data.position);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  return (
    <section
      ref={sectionRef}
      id="waitlist"
      className="relative min-h-screen py-32 flex items-center justify-center bg-[#0a0a0c] text-white overflow-hidden"
    >
      {/* Noise overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05]">
        <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* Cyan glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#67e8f9]/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 flex flex-col items-center text-center">
        {/* Counter badge */}
        {remaining !== null && (
          <div className="wl-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#67e8f9]/20 bg-[#67e8f9]/10 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#67e8f9] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#67e8f9]">
              {remaining > 0
                ? `${tierName ?? "Early Access"} — ${tierRemaining ?? remaining} spots left (${discount ?? 50}% off)`
                : "Early access is full"}
            </span>
          </div>
        )}

        {/* Headline */}
        <h2 className="wl-title text-5xl md:text-6xl lg:text-7xl font-sans tracking-tight font-medium mb-6 text-balance text-white">
          The Market Isn&apos;t Beating You.<br />
          <span className="text-white/60">Your Emotions Are.</span>
        </h2>

        {/* Subhead */}
        <p className="wl-title text-lg md:text-xl text-white/50 max-w-2xl mb-12 font-sans font-light leading-relaxed">
          Secure your spot and get a free AI-generated Trading Psychology Protocol — discover the hidden patterns costing you money.{" "}
          {tierName ? `${tierName} members lock in ${discount}% off forever.` : "Early members lock in their discount forever."}
        </p>

        {/* Form area */}
        <div className="wl-form w-full max-w-xl mx-auto mb-10 min-h-[70px] relative">
          {/* Idle / Error form */}
          {(status === "idle" || status === "error") && (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email address..."
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                className="flex-1 bg-white/[0.02] backdrop-blur-2xl border border-white/10 text-white rounded-[2rem] px-6 py-4 outline-none focus:border-[#67e8f9]/50 transition-colors font-sans w-full shadow-xl placeholder:text-white/30"
              />
              <button
                ref={btnRef}
                type="submit"
                className="relative overflow-hidden group bg-[#67e8f9] text-[#0a0a0c] font-medium rounded-[2rem] px-8 py-4 w-full sm:w-auto flex-shrink-0 shadow-lg"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Secure My Spot <ArrowRight className="w-4 h-4" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-0" />
              </button>
            </form>
          )}

          {/* Loading */}
          {status === "loading" && (
            <div className="flex items-center justify-center h-[70px]">
              <div className="w-6 h-6 border-2 border-[#67e8f9]/20 border-t-[#67e8f9] rounded-full animate-spin" />
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="wl-success flex items-center justify-center bg-white/[0.02] backdrop-blur-2xl border border-[#67e8f9]/30 rounded-[2rem] px-6 py-5 shadow-[0_0_30px_rgba(103,232,249,0.1)]">
              <div className="flex items-center gap-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-[#67e8f9] flex-shrink-0" />
                <span className="font-sans">
                  Spot Secured. You are <strong className="text-[#67e8f9]">#{position}</strong>{tierName ? ` — ${tierName}` : ""}.
                  <span className="block sm:inline sm:ml-2 text-white/60 text-sm">Check your email for your link.</span>
                </span>
              </div>
            </div>
          )}

          {/* Full */}
          {status === "full" && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center justify-center text-white/60 font-sans border border-white/10 bg-white/[0.02] backdrop-blur-2xl rounded-[2rem] px-6 py-4 shadow-xl">
                Early Access is Full.
              </div>
              <button
                type="button"
                className="bg-white/10 text-white border border-white/10 font-medium rounded-[2rem] px-8 py-4 w-full sm:w-auto hover:bg-white/20 transition-colors"
              >
                Join General Waitlist
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {status === "error" && (
          <p className="text-red-400 text-sm -mt-6 mb-4">{errorMsg}</p>
        )}

        {/* Value pills */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {[
            { icon: Users, text: "Free Psychology Protocol" },
            { icon: Sparkles, text: "Discover Your Trading Patterns" },
            { icon: TrendingUp, text: `Up to ${discount ?? 50}% Off Forever` },
          ].map((pill, i) => (
            <div
              key={i}
              className="wl-pill flex items-center gap-2 px-4 py-2 border border-white/10 rounded-[2rem] bg-white/[0.02] backdrop-blur-2xl transition-all hover:-translate-y-1 hover:border-white/20"
            >
              <pill.icon className="w-3.5 h-3.5 text-[#67e8f9] opacity-70" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">
                {pill.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
