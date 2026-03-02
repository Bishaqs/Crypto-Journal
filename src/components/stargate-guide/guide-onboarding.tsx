"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  UserCircle,
  ChevronDown,
  Sprout,
  Mountain,
  Swords,
  Brain,
  User,
  Building,
  HelpCircle,
  BarChart3,
  BookOpen,
  Target,
  GraduationCap,
  Flame,
  Shield,
  Gauge,
  Users,
} from "lucide-react";
import { useI18n, LOCALES } from "@/lib/i18n";
import { StargateLogo } from "@/components/stargate-logo";
import { OnboardingParticles } from "./onboarding-particles";

/* ── Types ───────────────────────────────────────── */
type OnboardingData = {
  displayName: string;
  experienceLevel: string;
  accountType: string;
  broker: string;
  instruments: string[];
  goals: string[];
  riskTolerance: string;
  preferredAnalytics: string[];
  referral: string;
};

type IntroPhase = "dark" | "portal-opening" | "eye-arriving" | "greeting" | "ready";

/* ── Constants (reused from original onboarding) ── */
const BROKERS: Record<string, string[]> = {
  Crypto: [
    "Binance", "Coinbase", "Bybit", "OKX", "Kraken", "KuCoin", "Bitget",
    "Gate.io", "Huobi/HTX", "MEXC", "Phemex", "Deribit", "Bitfinex",
    "Gemini", "Crypto.com", "BitMEX",
  ],
  Stocks: [
    "TD Ameritrade", "Interactive Brokers", "Fidelity", "Robinhood", "Webull",
    "Charles Schwab", "E*TRADE", "Merrill Edge", "Ally Invest", "Tastytrade",
    "TradeZero", "Firstrade", "moomoo", "Public",
  ],
  Forex: [
    "OANDA", "Forex.com", "IG", "Pepperstone", "XM", "IC Markets",
  ],
  "Multi-Asset": [
    "TradeStation", "eToro", "Tradovate", "Alpaca", "NinjaTrader",
    "MetaTrader", "TradingView (Paper)",
  ],
};

const INSTRUMENTS = ["Stocks", "Options", "Forex", "Crypto", "Futures", "CFDs"];

const ANALYTICS_OPTIONS = [
  "Win Rate", "P&L Charts", "Equity Curve", "Risk/Reward",
  "Position Sizing", "Drawdown", "Expectancy", "Streaks",
];

/* ── SVG Icons for Referral ────────────────────────── */
function TwitterIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function RedditIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  );
}

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.16 15a6.34 6.34 0 0 0 10.86 4.46A6.27 6.27 0 0 0 15.82 15V8.56a8.32 8.32 0 0 0 4.18 1.13V6.09c-.14.02-.28.03-.41.03v.57z" />
    </svg>
  );
}

/* ── Typewriter Text Component ────────────────────── */
function TypewriterText({
  text,
  speed = 30,
  delay = 0,
  className = "",
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setStarted(false);
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timer);
  }, [displayed, started, text, speed]);

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && started && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[2px] h-[0.9em] bg-accent ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

/* ── Animated Portal Opening SVG ──────────────────── */
const CHEVRON_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function AnimatedPortalOpening({ phase }: { phase: IntroPhase }) {
  const isOpening = phase !== "dark";
  const showCenter = phase === "eye-arriving" || phase === "greeting" || phase === "ready";

  return (
    <svg width={160} height={160} viewBox="0 0 40 40" fill="none" className="overflow-visible">
      <defs>
        <radialGradient id="introPortalGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-hover)" stopOpacity="0.8" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer dashed ring */}
      <motion.circle
        cx="20" cy="20" r="18"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={isOpening ? { scale: 1, opacity: 1, rotate: 360 } : {}}
        transition={{
          scale: { duration: 0.8, type: "spring" as const, damping: 20 },
          opacity: { duration: 0.4 },
          rotate: { duration: 30, repeat: Infinity, ease: "linear" as const },
        }}
        style={{ transformOrigin: "20px 20px" }}
      />

      {/* Middle ring */}
      <motion.circle
        cx="20" cy="20" r="13"
        stroke="var(--accent)"
        strokeWidth="1"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={isOpening ? { scale: 1, opacity: 0.6 } : {}}
        transition={{ duration: 0.7, delay: 0.2, type: "spring" as const, damping: 20 }}
        style={{ transformOrigin: "20px 20px" }}
      />

      {/* Inner ring */}
      <motion.circle
        cx="20" cy="20" r="8"
        stroke="var(--accent)"
        strokeWidth="0.8"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={isOpening ? { scale: 1, opacity: 0.4 } : {}}
        transition={{ duration: 0.6, delay: 0.4, type: "spring" as const, damping: 20 }}
        style={{ transformOrigin: "20px 20px" }}
      />

      {/* Portal glow center */}
      <motion.circle
        cx="20" cy="20" r="5"
        fill="url(#introPortalGlow)"
        initial={{ scale: 0 }}
        animate={showCenter ? { scale: [0, 1.5, 1] } : isOpening ? { scale: [0, 0.5] } : {}}
        transition={{ duration: 0.5, delay: 0.6 }}
        style={{ transformOrigin: "20px 20px" }}
      />

      {/* 8 chevron dots fly in from edges */}
      {CHEVRON_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const finalX = 20 + 18 * Math.cos(rad);
        const finalY = 20 + 18 * Math.sin(rad);
        const offsetX = 62 * Math.cos(rad); // start 80 units out, offset = (80-18)*cos
        const offsetY = 62 * Math.sin(rad);
        return (
          <motion.circle
            key={angle}
            cx={finalX}
            cy={finalY}
            r="1.5"
            fill="var(--accent)"
            initial={{ x: offsetX, y: offsetY, opacity: 0 }}
            animate={isOpening ? { x: 0, y: 0, opacity: 0.8 } : {}}
            transition={{
              type: "spring" as const,
              damping: 15,
              stiffness: 80,
              delay: 0.3 + i * 0.08,
            }}
          />
        );
      })}
    </svg>
  );
}

/* ── Enhanced Animation Variants ──────────────────── */
const staggerContainer = {
  center: {
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const staggerItem = {
  enter: { opacity: 0, y: 18, scale: 0.9, filter: "blur(4px)" },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
};

/* ── Referral sources ───────────────────────────── */
const REFERRAL_SOURCES = [
  { value: "Twitter/X", icon: TwitterIcon },
  { value: "YouTube", icon: YouTubeIcon },
  { value: "TikTok", icon: TikTokIcon },
  { value: "Reddit", icon: RedditIcon },
  { value: "Google", icon: GoogleIcon },
  { value: "Discord", icon: DiscordIcon },
  { value: "A Friend", lucideIcon: Users },
  { value: "Other", lucideIcon: HelpCircle },
] as const;

/* ── Guide speech lines per step ────────────────── */
const GUIDE_SPEECH = [
  "Welcome to Stargate! I'll be your trading companion. Let's get you set up.",
  "", // dynamic — uses name
  "How do you trade?",
  "Where do you execute your trades?",
  "What instruments do you trade?",
  "What do you want to achieve with Stargate?",
  "Almost done! Let's personalize your experience.",
  "Last one — how did you find us?",
];

/* ── Main Component ─────────────────────────────── */
export function GuideOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [introPhase, setIntroPhase] = useState<IntroPhase>("dark");
  const [data, setData] = useState<OnboardingData>({
    displayName: "",
    experienceLevel: "",
    accountType: "",
    broker: "",
    instruments: [],
    goals: [],
    riskTolerance: "",
    preferredAnalytics: [],
    referral: "",
  });
  const { t, locale, setLocale } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const [brokerOpen, setBrokerOpen] = useState(false);

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const TOTAL_STEPS = 8;
  const isLast = step === TOTAL_STEPS - 1;

  // Intro phase sequencer
  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase("portal-opening"), 500);
    const t2 = setTimeout(() => setIntroPhase("eye-arriving"), 2000);
    const t3 = setTimeout(() => setIntroPhase("greeting"), 3500);
    const t4 = setTimeout(() => setIntroPhase("ready"), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const skipIntro = useCallback(() => {
    setIntroPhase("ready");
  }, []);

  function toggleChip(arr: string[], value: string): string[] {
    return arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return true;
      case 1: return data.displayName.trim() !== "" && data.experienceLevel !== "";
      case 2: return data.accountType !== "";
      case 3: return data.broker !== "";
      case 4: return data.instruments.length > 0;
      case 5: return data.goals.length > 0;
      case 6: return data.riskTolerance !== "";
      case 7: return true;
      default: return false;
    }
  }

  function saveData() {
    const saves: [string, string][] = [
      ["stargate-display-name", data.displayName.trim()],
      ["stargate-experience-level", data.experienceLevel],
      ["stargate-account-type", data.accountType],
      ["stargate-broker", data.broker],
      ["stargate-instruments", JSON.stringify(data.instruments)],
      ["stargate-goals", JSON.stringify(data.goals)],
      ["stargate-risk-tolerance", data.riskTolerance],
      ["stargate-preferred-analytics", JSON.stringify(data.preferredAnalytics)],
      ["stargate-referral", data.referral],
    ];
    saves.forEach(([key, val]) => {
      if (val) localStorage.setItem(key, val);
    });
  }

  function handleNext() {
    if (isLast) {
      saveData();
      localStorage.setItem("stargate-onboarded", "true");
      localStorage.setItem("stargate-onboarding-version", "3");
      window.dispatchEvent(new CustomEvent("stargate-onboarding-complete"));
      onComplete();
    } else {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function getSpeech(): string {
    if (step === 1) {
      return data.displayName.trim()
        ? `Nice to meet you, ${data.displayName.trim()}! How long have you been trading?`
        : "What should I call you?";
    }
    return GUIDE_SPEECH[step];
  }

  /* ── Step content (inside the speech bubble) ──── */
  function renderStepContent() {
    switch (step) {
      /* ── 0: Welcome + Language ─────────────────── */
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-2 font-medium">
                {t("onboarding.language")}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen(!langOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs focus:border-accent focus:outline-none transition-colors"
                >
                  <span>
                    {currentLocale.flag} {currentLocale.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-muted transition-transform ${langOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {langOpen && (
                  <div className="absolute z-50 w-full mt-1 py-1 rounded-xl border border-border bg-surface shadow-lg max-h-48 overflow-y-auto">
                    {LOCALES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLocale(l.code);
                          setLangOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-accent/10 transition-colors ${
                          locale === l.code
                            ? "text-accent font-semibold"
                            : "text-foreground"
                        }`}
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      /* ── 1: Name + Experience ──────────────────── */
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">
                {t("onboarding.yourName")}
              </label>
              <div className="relative">
                <UserCircle
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  value={data.displayName}
                  onChange={(e) =>
                    setData({ ...data, displayName: e.target.value })
                  }
                  placeholder={t("onboarding.namePlaceholder")}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs placeholder-muted focus:border-accent focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
            </div>
            {data.displayName.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-xs text-muted mb-1.5 font-medium">
                  Experience Level
                </label>
                <motion.div
                  className="grid grid-cols-2 gap-2"
                  variants={staggerContainer}
                  initial="enter"
                  animate="center"
                >
                  {[
                    { value: "beginner", label: "Newbie", desc: "Just starting", icon: Sprout },
                    { value: "intermediate", label: "Climbing", desc: "1-2 years", icon: Mountain },
                    { value: "advanced", label: "Ninja", desc: "3-5 years", icon: Swords },
                    { value: "professional", label: "Monk", desc: "5+ years", icon: Brain },
                  ].map((opt) => (
                    <motion.button
                      key={opt.value}
                      variants={staggerItem}
                      whileTap={{ scale: 0.93 }}
                      whileHover={{ scale: 1.03, boxShadow: "0 0 16px var(--accent-glow)" }}
                      onClick={() =>
                        setData({ ...data, experienceLevel: opt.value })
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        data.experienceLevel === opt.value
                          ? "border-accent bg-accent/10 shadow-[0_0_12px_var(--accent-glow)]"
                          : "border-border bg-surface hover:border-accent/30"
                      }`}
                    >
                      <opt.icon
                        size={16}
                        className={
                          data.experienceLevel === opt.value
                            ? "text-accent"
                            : "text-muted"
                        }
                      />
                      <p className="text-xs font-semibold text-foreground mt-1.5">
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-muted">{opt.desc}</p>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </div>
        );

      /* ── 2: Account Type ───────────────────────── */
      case 2:
        return (
          <motion.div
            className="grid grid-cols-1 gap-2"
            variants={staggerContainer}
            initial="enter"
            animate="center"
          >
            {[
              { value: "personal", label: "Personal", desc: "Trading with your own capital", icon: User },
              { value: "prop-firm", label: "Prop Firm", desc: "Trading a funded account", icon: Building },
              { value: "exploring", label: "Not Started", desc: "Still exploring trading", icon: HelpCircle },
            ].map((opt) => (
              <motion.button
                key={opt.value}
                variants={staggerItem}
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.02, boxShadow: "0 0 16px var(--accent-glow)" }}
                onClick={() => setData({ ...data, accountType: opt.value })}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  data.accountType === opt.value
                    ? "border-accent bg-accent/10 shadow-[0_0_12px_var(--accent-glow)]"
                    : "border-border bg-surface hover:border-accent/30"
                }`}
              >
                <opt.icon
                  size={18}
                  className={
                    data.accountType === opt.value ? "text-accent" : "text-muted"
                  }
                />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-muted">{opt.desc}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        );

      /* ── 3: Broker ─────────────────────────────── */
      case 3:
        return (
          <div className="relative">
            <button
              type="button"
              onClick={() => setBrokerOpen(!brokerOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs focus:border-accent focus:outline-none transition-colors"
            >
              <span className={data.broker ? "text-foreground" : "text-muted"}>
                {data.broker || "Select your broker"}
              </span>
              <ChevronDown
                size={14}
                className={`text-muted transition-transform ${brokerOpen ? "rotate-180" : ""}`}
              />
            </button>
            {brokerOpen && (
              <div className="absolute z-50 w-full mt-1 py-1 rounded-xl border border-border bg-surface shadow-lg max-h-48 overflow-y-auto">
                {Object.entries(BROKERS).map(([group, brokers]) => (
                  <div key={group}>
                    <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                      {group}
                    </div>
                    {brokers.map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          setData({ ...data, broker: b });
                          setBrokerOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-accent/10 transition-colors ${
                          data.broker === b
                            ? "text-accent font-semibold"
                            : "text-foreground"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted/60 font-semibold">
                  Other
                </div>
                <button
                  onClick={() => {
                    setData({ ...data, broker: "Other" });
                    setBrokerOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-accent/10 transition-colors"
                >
                  Other / Not listed
                </button>
              </div>
            )}
          </div>
        );

      /* ── 4: Instruments ────────────────────────── */
      case 4:
        return (
          <motion.div
            className="flex flex-wrap gap-2"
            variants={staggerContainer}
            initial="enter"
            animate="center"
          >
            {INSTRUMENTS.map((inst) => (
              <motion.button
                key={inst}
                variants={staggerItem}
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 12px var(--accent-glow)" }}
                onClick={() =>
                  setData({
                    ...data,
                    instruments: toggleChip(data.instruments, inst),
                  })
                }
                className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all ${
                  data.instruments.includes(inst)
                    ? "border-accent bg-accent/10 text-accent shadow-[0_0_10px_var(--accent-glow)]"
                    : "border-border bg-surface text-foreground hover:border-accent/30"
                }`}
              >
                {inst}
              </motion.button>
            ))}
          </motion.div>
        );

      /* ── 5: Goals ──────────────────────────────── */
      case 5:
        return (
          <motion.div
            className="grid grid-cols-2 gap-2"
            variants={staggerContainer}
            initial="enter"
            animate="center"
          >
            {[
              { value: "journal", label: "Journal Trades", icon: BookOpen },
              { value: "analyze", label: "Analyze", icon: BarChart3 },
              { value: "backtest", label: "Backtest", icon: Target },
              { value: "learn", label: "Learn", icon: GraduationCap },
            ].map((opt) => (
              <motion.button
                key={opt.value}
                variants={staggerItem}
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.03, boxShadow: "0 0 16px var(--accent-glow)" }}
                onClick={() =>
                  setData({
                    ...data,
                    goals: toggleChip(data.goals, opt.value),
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all ${
                  data.goals.includes(opt.value)
                    ? "border-accent bg-accent/10 shadow-[0_0_12px_var(--accent-glow)]"
                    : "border-border bg-surface hover:border-accent/30"
                }`}
              >
                <opt.icon
                  size={16}
                  className={
                    data.goals.includes(opt.value) ? "text-accent" : "text-muted"
                  }
                />
                <p className="text-xs font-semibold text-foreground mt-1.5">
                  {opt.label}
                </p>
              </motion.button>
            ))}
          </motion.div>
        );

      /* ── 6: Risk + Analytics ───────────────────── */
      case 6:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">
                Risk Tolerance
              </label>
              <motion.div
                className="grid grid-cols-3 gap-2"
                variants={staggerContainer}
                initial="enter"
                animate="center"
              >
                {[
                  { value: "conservative", label: "Safe", icon: Shield },
                  { value: "moderate", label: "Moderate", icon: Gauge },
                  { value: "aggressive", label: "Aggressive", icon: Flame },
                ].map((opt) => (
                  <motion.button
                    key={opt.value}
                    variants={staggerItem}
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.03, boxShadow: "0 0 16px var(--accent-glow)" }}
                    onClick={() =>
                      setData({ ...data, riskTolerance: opt.value })
                    }
                    className={`p-3 rounded-xl border text-center transition-all ${
                      data.riskTolerance === opt.value
                        ? "border-accent bg-accent/10 shadow-[0_0_12px_var(--accent-glow)]"
                        : "border-border bg-surface hover:border-accent/30"
                    }`}
                  >
                    <opt.icon
                      size={16}
                      className={`mx-auto ${
                        data.riskTolerance === opt.value
                          ? "text-accent"
                          : "text-muted"
                      }`}
                    />
                    <p className="text-[10px] font-semibold text-foreground mt-1">
                      {opt.label}
                    </p>
                  </motion.button>
                ))}
              </motion.div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">
                Preferred Analytics (optional)
              </label>
              <motion.div
                className="flex flex-wrap gap-1.5"
                variants={staggerContainer}
                initial="enter"
                animate="center"
              >
                {ANALYTICS_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt}
                    variants={staggerItem}
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() =>
                      setData({
                        ...data,
                        preferredAnalytics: toggleChip(
                          data.preferredAnalytics,
                          opt,
                        ),
                      })
                    }
                    className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                      data.preferredAnalytics.includes(opt)
                        ? "border-accent bg-accent/10 text-accent shadow-[0_0_8px_var(--accent-glow)]"
                        : "border-border bg-surface text-muted hover:border-accent/30"
                    }`}
                  >
                    {opt}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </div>
        );

      /* ── 7: Referral ───────────────────────────── */
      case 7:
        return (
          <motion.div
            className="grid grid-cols-4 gap-2"
            variants={staggerContainer}
            initial="enter"
            animate="center"
          >
            {REFERRAL_SOURCES.map((src) => {
              const selected = data.referral === src.value;
              return (
                <motion.button
                  key={src.value}
                  variants={staggerItem}
                  whileTap={{ scale: 0.93 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 12px var(--accent-glow)" }}
                  onClick={() => setData({ ...data, referral: src.value })}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                    selected
                      ? "border-accent bg-accent/10 shadow-[0_0_10px_var(--accent-glow)]"
                      : "border-border bg-surface hover:border-accent/30"
                  }`}
                >
                  <div className={selected ? "text-accent" : "text-muted"}>
                    {"icon" in src ? (
                      <src.icon size={18} />
                    ) : (
                      <src.lucideIcon size={18} />
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-medium leading-tight ${
                      selected ? "text-accent" : "text-foreground"
                    }`}
                  >
                    {src.value}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        );

      default:
        return null;
    }
  }

  /* ── Slide variants with blur + zoom ─────────── */
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.92,
      filter: "blur(8px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.92,
      filter: "blur(8px)",
    }),
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-hidden">
      {/* Particle canvas background */}
      <OnboardingParticles />

      {/* Radial glow behind everything */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: introPhase !== "dark" ? 0.15 : 0 }}
        transition={{ duration: 1.5 }}
        style={{
          background: "radial-gradient(circle at 50% 40%, var(--accent-glow) 0%, transparent 50%)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center h-full p-6">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {introPhase !== "ready" ? (
              /* ── Cinematic Intro Sequence ───────────── */
              <motion.div
                key="intro"
                className="flex flex-col items-center justify-center min-h-[400px] cursor-pointer"
                exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                transition={{ duration: 0.4 }}
                onClick={skipIntro}
              >
                {/* Portal opening SVG */}
                <motion.div
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={
                    introPhase === "eye-arriving" || introPhase === "greeting"
                      ? { scale: 1, opacity: 1 }
                      : introPhase === "portal-opening"
                        ? { scale: 0.6, opacity: 0.8 }
                        : { scale: 0.3, opacity: 0 }
                  }
                  transition={{
                    type: "spring" as const,
                    stiffness: 120,
                    damping: 12,
                  }}
                >
                  <AnimatedPortalOpening phase={introPhase} />
                </motion.div>

                {/* Expansion wave pulse during eye-arriving */}
                {introPhase === "eye-arriving" && (
                  <motion.div
                    className="absolute w-32 h-32 rounded-full border border-accent/30"
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" as const }}
                  />
                )}

                {/* Glow trails during eye-arriving */}
                {introPhase === "eye-arriving" && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={`trail-${i}`}
                        className="absolute rounded-full"
                        style={{
                          width: 80,
                          height: 80,
                          background: "radial-gradient(circle, var(--accent-glow), transparent)",
                        }}
                        initial={{ scale: 2 - i * 0.3, opacity: 0.4 - i * 0.1 }}
                        animate={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.8, delay: i * 0.15 }}
                      />
                    ))}
                  </>
                )}

                {/* Greeting typewriter text */}
                {introPhase === "greeting" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-8"
                  >
                    <TypewriterText
                      text="Welcome to Stargate"
                      speed={50}
                      className="text-2xl font-bold text-foreground text-center block"
                    />
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      transition={{ delay: 1.5 }}
                      className="text-xs text-muted text-center mt-3"
                    >
                      tap to skip
                    </motion.p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* ── Step Flow ─────────────────────────── */
              <motion.div
                key="steps"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Progress bar with glow */}
                <div className="flex items-center gap-1.5 mb-8">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full bg-border overflow-hidden">
                      <motion.div
                        className="h-full bg-accent rounded-full"
                        initial={false}
                        animate={{
                          width: i <= step ? "100%" : "0%",
                          boxShadow: i === step ? "0 0 8px var(--accent-glow)" : "none",
                        }}
                        transition={{ duration: 0.4, ease: "easeInOut" as const }}
                      />
                    </div>
                  ))}
                </div>

                {/* Step indicator */}
                <motion.p
                  key={`step-${step}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-muted/50 text-center mb-4 uppercase tracking-wider font-semibold"
                >
                  Step {step + 1} of {TOTAL_STEPS}
                </motion.p>

                {/* Guide character — lively layered animations */}
                <div className="flex justify-center mb-4">
                  {/* Breathing glow pulse */}
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 20px var(--accent-glow)",
                        "0 0 36px var(--accent-glow), 0 0 64px var(--accent-glow)",
                        "0 0 20px var(--accent-glow)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
                    className="rounded-full"
                  >
                    {/* Scale breathing */}
                    <motion.div
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }}
                    >
                      {/* Vertical float */}
                      <motion.div
                        animate={{ y: [0, -12, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" as const }}
                      >
                        {/* Rotation wobble */}
                        <motion.div
                          animate={{ rotate: [0, 6, -4, 0] }}
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut" as const,
                            times: [0, 0.3, 0.7, 1],
                          }}
                        >
                          {/* Step-change glow burst */}
                          <motion.div
                            key={`glow-${step}`}
                            animate={{
                              boxShadow: [
                                "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
                                "0 0 48px var(--accent-glow), 0 0 96px var(--accent-glow)",
                                "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
                              ],
                            }}
                            transition={{ duration: 1.2, times: [0, 0.3, 1] }}
                            className="rounded-full"
                          >
                            <StargateLogo size={72} />
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Guide speech text — typewriter */}
                <div className="text-lg text-foreground font-medium text-center mb-6 leading-relaxed min-h-[2em]">
                  <TypewriterText
                    text={getSpeech()}
                    speed={25}
                    className=""
                  />
                </div>

                {/* Step content (animated with blur + zoom) */}
                <div className="min-h-[200px]">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={step}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ willChange: "transform, opacity, filter" }}
                    >
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  {step > 0 ? (
                    <motion.button
                      onClick={handleBack}
                      whileHover={{ x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Back
                    </motion.button>
                  ) : (
                    <div />
                  )}

                  <motion.button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{
                      scale: 1.04,
                      boxShadow: "0 0 24px var(--accent-glow), 0 0 48px var(--accent-glow)",
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isLast ? (
                      <>
                        <CheckCircle2 size={16} />
                        Let&apos;s Go!
                      </>
                    ) : (
                      <>
                        {step === 0 ? "Let's Go" : "Continue"}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Skip */}
                {!isLast && step > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => {
                      saveData();
                      localStorage.setItem("stargate-onboarded", "true");
                      localStorage.setItem("stargate-onboarding-version", "3");
                      window.dispatchEvent(new CustomEvent("stargate-onboarding-complete"));
                      onComplete();
                    }}
                    className="block mx-auto mt-6 text-xs text-muted/60 hover:text-muted transition-colors"
                  >
                    {t("onboarding.skipOnboarding")}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
