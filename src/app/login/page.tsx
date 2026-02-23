"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { clearSubscriptionCache } from "@/lib/use-subscription";
import {
  ArrowRight,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  CreditCard,
  Lock,
  Star,
  Crown,
  Zap,
} from "lucide-react";

type Step = 1 | 2 | 3;

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    yearlyPrice: "$0",
    yearlyPeriod: "forever",
    description: "Get started — see if journaling changes your trading",
    features: [
      "2 trade logs per week",
      "Basic analytics (win rate, P&L)",
      "Calendar heatmap",
      "Journal (text only)",
      "Light + Dark themes",
      "DEX trade logging",
    ],
    cta: "Start Free",
    highlight: false,
    badge: null,
    icon: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    yearlyPrice: "$149",
    yearlyPeriod: "/year",
    savings: "Save 35%",
    description: "Full-featured journal for serious traders",
    features: [
      "Unlimited trade logging",
      "50+ metrics & psychology engine",
      "Weekly reports & tilt detection",
      "5 premium themes",
      "Playbook & risk calculator",
      "Multi-chain DEX support",
    ],
    cta: "Start Pro Trial",
    highlight: true,
    badge: "Most Popular",
    icon: Star,
  },
  {
    id: "max",
    name: "Max",
    price: "$39",
    period: "/month",
    yearlyPrice: "$279",
    yearlyPeriod: "/year",
    savings: "Save 40%",
    description: "Professional edge — AI, advanced analytics & psychology tools",
    features: [
      "Everything in Pro",
      "AI Coach + Monte Carlo sims",
      "Prop Firm & execution tracking",
      "Heat maps & risk analysis",
      "Psychology tools & rule tracker",
      "Tax reports + priority support",
      "Stock trading included",
    ],
    cta: "Start Max Trial",
    highlight: false,
    badge: "Power User",
    icon: Crown,
  },
];

export default function LoginPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const inviteCodeRef = useRef<string | null>(null);
  const refCodeRef = useRef<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Clear stale subscription cache on login page load
    clearSubscriptionCache();

    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "oauth_failed") {
      setError("Google sign-in failed. Please try again.");
    }
    // Capture invite and referral codes from URL
    const invite = params.get("invite");
    if (invite) inviteCodeRef.current = invite;
    const ref = params.get("ref");
    if (ref) refCodeRef.current = ref;
  }, []);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords don't match.");
      setLoading(false);
      return;
    }

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (isSignUp) {
      setSuccess(
        "Check your email for a confirmation link, then come back to sign in."
      );
      setLoading(false);
      setIsSignUp(false);
      return;
    }

    // Sign in success → handle invite/referral codes, then navigate
    clearSubscriptionCache();
    await handlePostAuth();
  }

  async function handlePostAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); setStep(2); return; }

    // Auto-redeem invite code if present
    if (inviteCodeRef.current) {
      try {
        const { data: result } = await supabase.rpc("redeem_invite_code", {
          p_code: inviteCodeRef.current,
          p_user_id: user.id,
        });
        if (result?.success) {
          clearSubscriptionCache();
          setSuccess(`Invite code applied! You now have ${result.tier} access.`);
          setLoading(false);
          setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 1500);
          return;
        }
      } catch {}
    }

    // Track referral signup if present
    if (refCodeRef.current) {
      try {
        await supabase.rpc("track_referral_signup", {
          p_code: refCodeRef.current,
          p_new_user_id: user.id,
        });
      } catch {}
    }

    setLoading(false);
    setStep(2);
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email first, then click Forgot password.");
      return;
    }
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  }

  function handlePlanSelect(planId: string) {
    if (planId === "free") {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setSelectedPlan(planId);
    setStep(3);
  }

  function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Visual only — no real payment
    router.push("/dashboard");
    router.refresh();
  }

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  const plan = PLANS.find((p) => p.id === selectedPlan);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background to-background" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="stars-small" />
          <div className="stars-medium" />
          <div
            className="shooting-star"
            style={{ top: "15%", left: "25%" }}
          />
          <div
            className="shooting-star"
            style={{ top: "45%", left: "55%", animationDelay: "5s" }}
          />
        </div>
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <h1 className="text-4xl font-bold text-foreground mb-3">Stargate</h1>
          <p className="text-lg text-muted mb-12">
            Your edge starts with knowing yourself.
          </p>

          <div className="space-y-6">
            {[
              {
                icon: BarChart3,
                title: "Track Every Trade",
                desc: "Win rate, profit factor, P&L curves — see where your money goes.",
              },
              {
                icon: BookOpen,
                title: "Journal Your Process",
                desc: "Tag, search, and filter your notes. Build a library of lessons.",
              },
              {
                icon: Brain,
                title: "AI-Powered Insights",
                desc: "Let AI find patterns you can't see. Know your strengths and blind spots.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-accent/10 shrink-0">
                  <item.icon size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — step content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    s === step
                      ? "bg-accent text-background scale-110"
                      : s < step
                        ? "bg-accent/20 text-accent"
                        : "bg-surface border border-border text-muted"
                  }`}
                >
                  {s < step ? <CheckCircle2 size={14} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-0.5 transition-colors duration-300 ${
                      s < step ? "bg-accent/40" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step labels */}
          <div className="flex justify-between text-[10px] text-muted mb-6 px-1">
            <span className={step === 1 ? "text-accent font-medium" : ""}>
              Account
            </span>
            <span className={step === 2 ? "text-accent font-medium" : ""}>
              Choose Plan
            </span>
            <span className={step === 3 ? "text-accent font-medium" : ""}>
              Payment
            </span>
          </div>

          {/* ═══════════ STEP 1: AUTH ═══════════ */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8 lg:text-left">
                <h2 className="text-2xl font-bold text-foreground">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h2>
                <p className="text-muted mt-2 text-sm">
                  {isSignUp
                    ? "Start tracking your trades in under a minute."
                    : "Sign in to your Stargate dashboard."}
                </p>
              </div>

              {/* Google OAuth */}
              <button
                onClick={async () => {
                  setError(null);
                  try {
                    // Pass invite/ref codes through OAuth callback
                    let nextUrl = "/dashboard";
                    const params = new URLSearchParams();
                    if (inviteCodeRef.current) params.set("invite", inviteCodeRef.current);
                    if (refCodeRef.current) params.set("ref", refCodeRef.current);
                    if (params.toString()) nextUrl += `?${params.toString()}`;

                    const { error: oauthError } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
                      },
                    });
                    if (oauthError) {
                      setError("Google sign-in is not available yet. Please use email/password.");
                    }
                  } catch {
                    setError("Google sign-in is not available yet. Please use email/password.");
                  }
                }}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg bg-surface border border-border text-foreground font-medium hover:bg-surface-hover hover:border-accent/30 transition-all mb-6"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm text-muted mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm text-muted mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors"
                    placeholder="Min 6 characters"
                  />
                </div>

                {!isSignUp && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] text-muted hover:text-accent transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {isSignUp && (
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm text-muted mb-1"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors"
                      placeholder="Repeat your password"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-loss bg-loss/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="text-sm text-accent bg-accent/10 px-3 py-2.5 rounded-lg">
                    {success}
                  </p>
                )}

                {resetSent && (
                  <p className="text-sm text-accent bg-accent/10 px-3 py-2.5 rounded-lg">
                    Password reset email sent! Check your inbox.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-background font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    "..."
                  ) : isSignUp ? (
                    <>
                      Get Started <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-muted mt-6 lg:text-left">
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setSuccess(null);
                    setConfirmPassword("");
                  }}
                  className="text-accent hover:text-accent-hover transition-colors"
                >
                  {isSignUp ? "Sign in" : "Start 14-day free trial"}
                </button>
              </p>

              {!isSignUp && (
                <p className="text-center text-[11px] text-muted/50 mt-3 lg:text-left">
                  No credit card required. Free plan available forever.
                </p>
              )}

            </div>
          )}

          {/* ═══════════ STEP 2: CHOOSE PLAN ═══════════ */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Choose your plan
                </h2>
                <p className="text-muted mt-2 text-sm">
                  Start free or unlock everything with a 14-day trial.
                </p>
              </div>

              {/* Billing toggle */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center rounded-xl bg-surface border border-border/50 p-1">
                  <button
                    onClick={() => setBilling("monthly")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      billing === "monthly"
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "text-muted hover:text-foreground border border-transparent"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBilling("yearly")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      billing === "yearly"
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "text-muted hover:text-foreground border border-transparent"
                    }`}
                  >
                    Yearly
                    <span className="text-[9px] bg-win/15 text-win px-1.5 py-0.5 rounded-full font-bold">
                      Save
                    </span>
                  </button>
                </div>
              </div>

              {/* Plan cards */}
              <div className="space-y-3">
                {PLANS.map((p) => {
                  const price =
                    billing === "monthly" ? p.price : p.yearlyPrice;
                  const period =
                    billing === "monthly" ? p.period : p.yearlyPeriod;

                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePlanSelect(p.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all hover:border-accent/40 hover:bg-accent/5 ${
                        p.highlight
                          ? "border-accent/30 bg-accent/5"
                          : "border-border bg-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              p.highlight
                                ? "bg-accent/15"
                                : "bg-surface-hover"
                            }`}
                          >
                            {p.icon ? (
                              <p.icon
                                size={18}
                                className={
                                  p.highlight ? "text-accent" : "text-muted"
                                }
                              />
                            ) : (
                              <Zap
                                size={18}
                                className="text-muted"
                              />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground text-sm">
                                {p.name}
                              </span>
                              {p.badge && (
                                <span
                                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                    p.highlight
                                      ? "bg-accent/15 text-accent"
                                      : "bg-surface-hover text-muted"
                                  }`}
                                >
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted mt-0.5">
                              {p.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-lg font-bold text-foreground">
                            {price}
                          </span>
                          <span className="text-xs text-muted">{period}</span>
                          {p.savings && billing === "yearly" && (
                            <p className="text-[9px] text-win font-medium">
                              {p.savings}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {p.features.map((f) => (
                          <span
                            key={f}
                            className="text-[10px] text-muted bg-background/50 px-2 py-0.5 rounded-full border border-border/50"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  router.push("/dashboard");
                  router.refresh();
                }}
                className="w-full text-center text-xs text-muted mt-4 hover:text-accent transition-colors"
              >
                Skip — start with Free plan
              </button>
            </div>
          )}

          {/* ═══════════ STEP 3: PAYMENT ═══════════ */}
          {step === 3 && plan && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-sm text-muted hover:text-accent transition-colors mb-6"
              >
                <ArrowLeft size={14} /> Change plan
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Start your free trial
                </h2>
                <p className="text-muted mt-2 text-sm">
                  14 days free. Cancel anytime. No charge today.
                </p>
              </div>

              {/* Plan summary */}
              <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground text-sm">
                      {plan.name} Plan
                    </span>
                    <p className="text-xs text-muted mt-0.5">
                      {billing === "yearly" ? "Billed annually" : "Billed monthly"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-foreground">
                      {billing === "monthly" ? plan.price : plan.yearlyPrice}
                    </span>
                    <span className="text-xs text-muted">
                      {billing === "monthly" ? plan.period : plan.yearlyPeriod}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-accent/10">
                  <p className="text-[11px] text-win font-medium flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    14-day free trial — you won&apos;t be charged until{" "}
                    {new Date(
                      Date.now() + 14 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Payment form */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-1">
                    Card number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(formatCardNumber(e.target.value))
                      }
                      placeholder="1234 5678 9012 3456"
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors pr-20"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <div className="w-7 h-5 rounded bg-[#1A1F71] flex items-center justify-center">
                        <span className="text-[6px] text-white font-bold italic">
                          VISA
                        </span>
                      </div>
                      <div className="w-7 h-5 rounded bg-[#252525] flex items-center justify-center">
                        <div className="flex">
                          <div className="w-2 h-2 rounded-full bg-[#EB001B] -mr-0.5" />
                          <div className="w-2 h-2 rounded-full bg-[#F79E1B] opacity-80" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-muted mb-1">
                      Expiry
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) =>
                        setCardExpiry(formatExpiry(e.target.value))
                      }
                      placeholder="MM/YY"
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1">
                      CVC
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) =>
                          setCardCvc(
                            e.target.value.replace(/\D/g, "").slice(0, 4)
                          )
                        }
                        placeholder="123"
                        required
                        className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors"
                      />
                      <Lock
                        size={12}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-muted mb-1">
                    Name on card
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-accent text-background font-semibold hover:bg-accent-hover transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  <CreditCard size={16} />
                  Start 14-Day Free Trial
                </button>
              </form>

              <div className="mt-4 space-y-2">
                <p className="text-center text-[10px] text-muted/50">
                  You won&apos;t be charged today. Cancel anytime during your
                  trial.
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted/40">
                  <Lock size={9} />
                  <span>Secured by</span>
                  <span className="font-semibold text-muted/60">Stripe</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
