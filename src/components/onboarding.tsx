"use client";

import { useState } from "react";
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
import { StargateLogo } from "./stargate-logo";

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

const BROKERS = {
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

const ANALYTICS_OPTIONS = ["Win Rate", "P&L Charts", "Equity Curve", "Risk/Reward", "Position Sizing", "Drawdown", "Expectancy", "Streaks"];

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

/* ── Animation variants ─────────────────────────── */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
};

const staggerContainer = {
  center: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const staggerItem = {
  enter: { opacity: 0, y: 12, scale: 0.95 },
  center: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const floatAnimation = {
  y: [0, -8, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
};

/* ── Referral sources with icons ───────────────── */
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

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
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

  function toggleChip(arr: string[], value: string): string[] {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
  }

  /* ── Step definitions ─────────────────────────── */
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
    saves.forEach(([key, val]) => { if (val) localStorage.setItem(key, val); });

    // Auto-set view mode based on experience level
    const modeMap: Record<string, string> = {
      beginner: "beginner",
      intermediate: "advanced",
      advanced: "expert",
      professional: "expert",
    };
    localStorage.setItem("stargate-mode", modeMap[data.experienceLevel] || "advanced");
    // Override level-gating for experienced users
    if (["intermediate", "advanced", "professional"].includes(data.experienceLevel)) {
      localStorage.setItem("stargate-mode-override", "true");
    }
  }

  function handleNext() {
    if (isLast) {
      saveData();
      localStorage.setItem("stargate-onboarded", "true");
      localStorage.setItem("stargate-onboarding-version", "3");
      onComplete();
    } else {
      setDirection(1);
      setStep(s => s + 1);
    }
  }

  function handleBack() {
    setDirection(-1);
    setStep(s => s - 1);
  }

  /* ── Eye companion (steps 1-7) ──────────────── */
  function renderCompanion() {
    if (step === 0) return null;
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
        transition={{
          scale: { type: "spring" as const, stiffness: 300, damping: 20 },
          y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const },
        }}
        className="flex justify-center mb-3"
      >
        <div className="drop-shadow-[0_0_8px_rgba(0,180,216,0.4)]">
          <StargateLogo size={32} collapsed={false} />
        </div>
      </motion.div>
    );
  }

  /* ── Step content ─────────────────────────────── */
  function renderStep() {
    switch (step) {
      /* ── 0: Welcome ──────────────────────────── */
      case 0:
        return (
          <div className="text-center space-y-6">
            <motion.div
              animate={floatAnimation}
              className="flex justify-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
              >
                <StargateLogo size={72} collapsed={false} />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-foreground">
                Welcome to Stargate
              </h2>
              <p className="text-muted mt-2">Your trading journal, reimagined. Let&apos;s set things up.</p>
            </motion.div>
            {/* Language selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-xs mx-auto text-left"
            >
              <label className="block text-xs text-muted mb-2 font-medium">{t("onboarding.language")}</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen(!langOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-border bg-surface text-foreground text-sm focus:border-accent focus:outline-none transition-colors"
                >
                  <span>{currentLocale.flag} {currentLocale.label}</span>
                  <ChevronDown size={16} className={`text-muted transition-transform ${langOpen ? "rotate-180" : ""}`} />
                </button>
                {langOpen && (
                  <div className="absolute z-50 w-full mt-1 py-1 rounded-xl border border-border bg-surface shadow-lg max-h-60 overflow-y-auto">
                    {LOCALES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLocale(l.code); setLangOpen(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-accent/10 transition-colors ${
                          locale === l.code ? "text-accent font-semibold" : "text-foreground"
                        }`}
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        );

      /* ── 1: Experience + Name ────────────────── */
      case 1:
        return (
          <div className="space-y-5">
            {renderCompanion()}
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-foreground">About You</h2>
              <p className="text-sm text-muted mt-1">Tell us a bit about yourself</p>
            </div>
            <div>
              <label className="block text-xs text-muted mb-2 font-medium">{t("onboarding.yourName")}</label>
              <div className="relative">
                <UserCircle size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={data.displayName}
                  onChange={(e) => setData({ ...data, displayName: e.target.value })}
                  placeholder={t("onboarding.namePlaceholder")}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-surface text-foreground text-sm placeholder-muted focus:border-accent focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-2 font-medium">Experience Level</label>
              <motion.div className="grid grid-cols-2 gap-3" variants={staggerContainer} initial="enter" animate="center">
                {[
                  { value: "beginner", label: "Newbie", desc: "Just getting started", icon: Sprout },
                  { value: "intermediate", label: "Climbing", desc: "1-2 years experience", icon: Mountain },
                  { value: "advanced", label: "Ninja", desc: "3-5 years, profitable", icon: Swords },
                  { value: "professional", label: "Monk", desc: "5+ years, professional", icon: Brain },
                ].map((opt) => (
                  <motion.button
                    key={opt.value}
                    variants={staggerItem}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setData({ ...data, experienceLevel: opt.value })}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      data.experienceLevel === opt.value
                        ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,180,216,0.15)]"
                        : "border-border bg-surface hover:border-accent/30"
                    }`}
                  >
                    <motion.div
                      animate={data.experienceLevel === opt.value ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      <opt.icon size={20} className={data.experienceLevel === opt.value ? "text-accent" : "text-muted"} />
                    </motion.div>
                    <p className="text-sm font-semibold text-foreground mt-2">{opt.label}</p>
                    <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </div>
        );

      /* ── 2: Account Type ─────────────────────── */
      case 2:
        return (
          <div className="space-y-5">
            {renderCompanion()}
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-foreground">Account Type</h2>
              <p className="text-sm text-muted mt-1">How do you trade?</p>
            </div>
            <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-3" variants={staggerContainer} initial="enter" animate="center">
              {[
                { value: "personal", label: "Personal", desc: "Trading with your own capital", icon: User },
                { value: "prop-firm", label: "Prop Firm", desc: "Trading a funded account", icon: Building },
                { value: "exploring", label: "Not Started", desc: "Still exploring trading", icon: HelpCircle },
              ].map((opt) => (
                <motion.button
                  key={opt.value}
                  variants={staggerItem}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setData({ ...data, accountType: opt.value })}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    data.accountType === opt.value
                      ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,180,216,0.15)]"
                      : "border-border bg-surface hover:border-accent/30"
                  }`}
                >
                  <motion.div
                    animate={data.accountType === opt.value ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <opt.icon size={22} className={data.accountType === opt.value ? "text-accent" : "text-muted"} />
                  </motion.div>
                  <p className="text-sm font-semibold text-foreground mt-3">{opt.label}</p>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </motion.button>
              ))}
            </motion.div>
          </div>
        );

      /* ── 3: Broker ───────────────────────────── */
      case 3:
        return (
          <div className="space-y-5">
            {renderCompanion()}
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-foreground">Your Broker</h2>
              <p className="text-sm text-muted mt-1">Where do you execute trades?</p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative max-w-sm mx-auto"
            >
              <button
                type="button"
                onClick={() => setBrokerOpen(!brokerOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-border bg-surface text-foreground text-sm focus:border-accent focus:outline-none transition-colors"
              >
                <span className={data.broker ? "text-foreground" : "text-muted"}>
                  {data.broker || "Select your broker"}
                </span>
                <ChevronDown size={16} className={`text-muted transition-transform ${brokerOpen ? "rotate-180" : ""}`} />
              </button>
              {brokerOpen && (
                <div className="absolute z-50 w-full mt-1 py-1 rounded-xl border border-border bg-surface shadow-lg max-h-60 overflow-y-auto">
                  {Object.entries(BROKERS).map(([group, brokers]) => (
                    <div key={group}>
                      <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted/60 font-semibold">{group}</div>
                      {brokers.map(b => (
                        <button
                          key={b}
                          onClick={() => { setData({ ...data, broker: b }); setBrokerOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent/10 transition-colors ${
                            data.broker === b ? "text-accent font-semibold" : "text-foreground"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  ))}
                  <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted/60 font-semibold">Other</div>
                  <button
                    onClick={() => { setData({ ...data, broker: "Other" }); setBrokerOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-accent/10 transition-colors"
                  >
                    Other / Not listed
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        );

      /* ── 4: Instruments ──────────────────────── */
      case 4:
        return (
          <div className="space-y-5">
            {renderCompanion()}
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-foreground">What Do You Trade?</h2>
              <p className="text-sm text-muted mt-1">Select all that apply</p>
            </div>
            <motion.div className="flex flex-wrap justify-center gap-3" variants={staggerContainer} initial="enter" animate="center">
              {INSTRUMENTS.map(inst => (
                <motion.button
                  key={inst}
                  variants={staggerItem}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setData({ ...data, instruments: toggleChip(data.instruments, inst) })}
                  className={`px-5 py-3 rounded-2xl border text-sm font-medium transition-all ${
                    data.instruments.includes(inst)
                      ? "border-accent bg-accent/10 text-accent shadow-[0_0_16px_rgba(0,180,216,0.12)]"
                      : "border-border bg-surface text-foreground hover:border-accent/30"
                  }`}
                >
                  {inst}
                </motion.button>
              ))}
            </motion.div>
          </div>
        );

      /* ── 5: Goals ────────────────────────────── */
      case 5:
        return (
          <div className="space-y-5">
            {renderCompanion()}
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-foreground">Your Goals</h2>
              <p className="text-sm text-muted mt-1">What do you want to achieve? Select all that apply.</p>
            </div>
            <motion.div className="grid grid-cols-2 gap-3" variants={staggerContainer} initial="enter" animate="center">
              {[
                { value: "journal", label: "Journal Trades", desc: "Track every trade with notes & emotions", icon: BookOpen },
                { value: "analyze", label: "Analyze Performance", desc: "Find patterns in your trading data", icon: BarChart3 },
                { value: "backtest", label: "Backtest Strategies", desc: "Test ideas against historical data", icon: Target },
                { value: "learn", label: "Learn & Improve", desc: "Build better trading habits", icon: GraduationCap },
              ].map(opt => (
                <motion.button
                  key={opt.value}
                  variants={staggerItem}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setData({ ...data, goals: toggleChip(data.goals, opt.value) })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    data.goals.includes(opt.value)
                      ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,180,216,0.15)]"
                      : "border-border bg-surface hover:border-accent/30"
                  }`}
                >
                  <motion.div
                    animate={data.goals.includes(opt.value) ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <opt.icon size={20} className={data.goals.includes(opt.value) ? "text-accent" : "text-muted"} />
                  </motion.div>
                  <p className="text-sm font-semibold text-foreground mt-2">{opt.label}</p>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </motion.button>
              ))}
            </motion.div>
          </div>
        );

      /* ── 6: Risk + Analytics ─────────────────── */
      case 6:
        return (
          <div className="space-y-6">
            {renderCompanion()}
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-foreground">Risk & Analytics</h2>
              <p className="text-sm text-muted mt-1">Help us personalize your experience</p>
            </div>
            {/* Risk tolerance */}
            <div>
              <label className="block text-xs text-muted mb-2 font-medium">Risk Tolerance</label>
              <motion.div className="grid grid-cols-3 gap-3" variants={staggerContainer} initial="enter" animate="center">
                {[
                  { value: "conservative", label: "Conservative", icon: Shield },
                  { value: "moderate", label: "Moderate", icon: Gauge },
                  { value: "aggressive", label: "Aggressive", icon: Flame },
                ].map(opt => (
                  <motion.button
                    key={opt.value}
                    variants={staggerItem}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setData({ ...data, riskTolerance: opt.value })}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      data.riskTolerance === opt.value
                        ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,180,216,0.15)]"
                        : "border-border bg-surface hover:border-accent/30"
                    }`}
                  >
                    <motion.div
                      animate={data.riskTolerance === opt.value ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <opt.icon size={20} className={`mx-auto ${data.riskTolerance === opt.value ? "text-accent" : "text-muted"}`} />
                    </motion.div>
                    <p className="text-sm font-semibold text-foreground mt-2">{opt.label}</p>
                  </motion.button>
                ))}
              </motion.div>
            </div>
            {/* Preferred analytics */}
            <div>
              <label className="block text-xs text-muted mb-2 font-medium">Preferred Analytics (optional)</label>
              <motion.div className="flex flex-wrap gap-2" variants={staggerContainer} initial="enter" animate="center">
                {ANALYTICS_OPTIONS.map(opt => (
                  <motion.button
                    key={opt}
                    variants={staggerItem}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setData({ ...data, preferredAnalytics: toggleChip(data.preferredAnalytics, opt) })}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                      data.preferredAnalytics.includes(opt)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-surface text-muted hover:border-accent/30 hover:text-foreground"
                    }`}
                  >
                    {opt}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </div>
        );

      /* ── 7: Referral ─────────────────────────── */
      case 7:
        return (
          <div className="space-y-5">
            {renderCompanion()}
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-foreground">One Last Thing</h2>
              <p className="text-sm text-muted mt-1">How did you hear about Stargate?</p>
            </div>
            <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto" variants={staggerContainer} initial="enter" animate="center">
              {REFERRAL_SOURCES.map(src => {
                const selected = data.referral === src.value;
                return (
                  <motion.button
                    key={src.value}
                    variants={staggerItem}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setData({ ...data, referral: src.value })}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border text-center transition-all ${
                      selected
                        ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,180,216,0.15)]"
                        : "border-border bg-surface hover:border-accent/30"
                    }`}
                  >
                    <motion.div
                      animate={selected ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className={selected ? "text-accent" : "text-muted"}
                    >
                      {"icon" in src ? (
                        <src.icon size={24} />
                      ) : (
                        <src.lucideIcon size={24} />
                      )}
                    </motion.div>
                    <span className={`text-xs font-medium ${selected ? "text-accent" : "text-foreground"}`}>
                      {src.value}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Animated progress bar */}
        <div className="flex items-center gap-1.5 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={false}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
          ))}
        </div>

        {/* Step indicator */}
        <p className="text-[10px] text-muted/50 text-center mb-4 uppercase tracking-wider font-semibold">
          Step {step + 1} of {TOTAL_STEPS}
        </p>

        {/* Animated step content */}
        <div className="min-h-[340px] relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              {t("common.back")}
            </button>
          ) : (
            <div />
          )}

          <motion.button
            onClick={handleNext}
            disabled={!canProceed()}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLast ? (
              <>
                <CheckCircle2 size={16} />
                {t("onboarding.goToDashboard")}
              </>
            ) : (
              <>
                {step === 0 ? "Let's Go" : t("common.continue")}
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </div>

        {/* Skip */}
        {!isLast && step > 0 && (
          <button
            onClick={() => {
              saveData();
              localStorage.setItem("stargate-onboarded", "true");
              localStorage.setItem("stargate-onboarding-version", "3");
              onComplete();
            }}
            className="block mx-auto mt-6 text-xs text-muted/60 hover:text-muted transition-colors"
          >
            {t("onboarding.skipOnboarding")}
          </button>
        )}
      </div>
    </div>
  );
}
