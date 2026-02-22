"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Crown, Star, TrendingUp, BarChart3 } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";

type PricingTier = {
  price: string;
  period: string;
  savings?: string;
};

type PricingPlan = {
  name: string;
  monthly: PricingTier;
  yearly: PricingTier;
  description: string;
  features: string[];
  excluded: string[];
  cta: string;
  highlight: boolean;
  badge: string | null;
};

const CRYPTO_PLANS: PricingPlan[] = [
  {
    name: "Free",
    monthly: { price: "$0", period: "forever" },
    yearly: { price: "$0", period: "forever" },
    description: "Get started — see if journaling changes your trading",
    features: [
      "2 trade logs per week",
      "Basic analytics (win rate, P&L)",
      "Calendar heatmap",
      "Journal (text only)",
      "Light + Dark themes",
      "Single exchange CSV import",
      "DEX trade logging",
    ],
    excluded: [
      "Advanced analytics & statistics",
      "AI Coach + simulations",
      "Weekly reports",
      "Playbook & risk calculator",
    ],
    cta: "Get Started",
    highlight: false,
    badge: null,
  },
  {
    name: "Pro",
    monthly: { price: "$19", period: "/month" },
    yearly: { price: "$149", period: "/year", savings: "Save 35%" },
    description: "Full-featured journal for serious traders",
    features: [
      "Unlimited trade logging",
      "Full analytics & statistics (50+ metrics)",
      "Psychology engine & tilt detection",
      "Weekly performance reports",
      "Calendar + behavioral insights",
      "5 premium themes",
      "Playbook & risk calculator",
      "CSV import/export",
      "Unlimited exchange API connections",
      "Multi-chain analytics & DEX support",
    ],
    excluded: [],
    cta: "Start Pro",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Max",
    monthly: { price: "$39", period: "/month" },
    yearly: { price: "$279", period: "/year", savings: "Save 40%" },
    description: "Professional edge — AI, advanced analytics & psychology tools",
    features: [
      "Everything in Pro",
      "AI Trading Coach — ask AI about your trades",
      "Monte Carlo simulations & what-if scenarios",
      "Prop Firm Tracker — FTMO, TopStep & more",
      "Heat Maps & overtrading detection",
      "R-Multiple & MAE/MFE risk analysis",
      "Execution quality scoring",
      "Rule violation cost tracker",
      "Psychology tools — breathing, CBT, Fear-Greed Index",
      "Crypto tax reports — Form 8949",
      "Priority support",
      "Stock trading included",
    ],
    excluded: [],
    cta: "Go Max",
    highlight: false,
    badge: "Power User",
  },
];

const STOCK_PLANS: PricingPlan[] = [
  {
    name: "Free",
    monthly: { price: "$0", period: "forever" },
    yearly: { price: "$0", period: "forever" },
    description: "Get started — see if journaling changes your stock trading",
    features: [
      "2 trade logs per week",
      "Basic analytics (win rate, P&L)",
      "Calendar heatmap",
      "Journal (text only)",
      "Light + Dark themes",
      "Single broker CSV import",
      "Options trade logging",
    ],
    excluded: [
      "Advanced analytics & statistics",
      "AI Coach + simulations",
      "Weekly reports",
      "Playbook & risk calculator",
    ],
    cta: "Get Started",
    highlight: false,
    badge: null,
  },
  {
    name: "Pro",
    monthly: { price: "$19", period: "/month" },
    yearly: { price: "$149", period: "/year", savings: "Save 35%" },
    description: "Full-featured journal for serious stock traders",
    features: [
      "Unlimited trade logging",
      "Full analytics & statistics (50+ metrics)",
      "Psychology engine & tilt detection",
      "Weekly performance reports",
      "Calendar + behavioral insights",
      "5 premium themes",
      "Playbook & risk calculator",
      "CSV import/export",
      "Unlimited broker connections",
      "Sector analytics & session tracking",
    ],
    excluded: [],
    cta: "Start Pro",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Max",
    monthly: { price: "$39", period: "/month" },
    yearly: { price: "$279", period: "/year", savings: "Save 40%" },
    description: "Professional edge — AI, advanced analytics & psychology tools",
    features: [
      "Everything in Pro",
      "AI Trading Coach — ask AI about your trades",
      "Monte Carlo simulations & what-if scenarios",
      "Prop Firm Tracker — FTMO, TopStep & more",
      "Heat Maps & overtrading detection",
      "R-Multiple & MAE/MFE risk analysis",
      "Execution quality scoring",
      "Rule violation cost tracker",
      "Psychology tools — breathing, CBT, Fear-Greed Index",
      "Stock tax reports — Form 8949",
      "Priority support",
      "Crypto trading included",
    ],
    excluded: [],
    cta: "Go Max",
    highlight: false,
    badge: "Power User",
  },
];

type AssetType = "crypto" | "stocks";

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [asset, setAsset] = useState<AssetType>("crypto");

  const plans = asset === "crypto" ? CRYPTO_PLANS : STOCK_PLANS;

  return (
    <>
      {/* Asset toggle */}
      <div className="flex items-center justify-center gap-1 mb-4">
        <div className="inline-flex items-center rounded-xl glass border border-border/50 p-1">
          <button
            onClick={() => setAsset("crypto")}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
              asset === "crypto"
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-muted hover:text-foreground border border-transparent"
            }`}
          >
            <TrendingUp size={12} />
            Crypto
          </button>
          <button
            onClick={() => setAsset("stocks")}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
              asset === "stocks"
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-muted hover:text-foreground border border-transparent"
            }`}
          >
            <BarChart3 size={12} />
            Stocks
          </button>
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-1 mb-10">
        <div className="inline-flex items-center rounded-xl glass border border-border/50 p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              billing === "monthly"
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-muted hover:text-foreground border border-transparent"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
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

      {/* Pricing cards */}
      <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {plans.map((plan, i) => {
          const tier = billing === "monthly" ? plan.monthly : plan.yearly;

          return (
            <ScrollReveal key={`${asset}-${plan.name}`} delay={i * 100}>
              <div
                className={`rounded-2xl border p-6 md:p-7 h-full flex flex-col feature-card ${
                  plan.highlight
                    ? "border-accent/40 glass pricing-card-highlight relative"
                    : "glass border-border/50"
                }`}
              >
                {plan.badge && (
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                      plan.highlight ? "text-accent" : "text-muted"
                    }`}
                  >
                    {plan.highlight ? <Star size={10} /> : <Crown size={10} />}
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold text-foreground mt-1">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-foreground">
                    {tier.price}
                  </span>
                  <span className="text-sm text-muted">{tier.period}</span>
                </div>
                {tier.savings && (
                  <p className="text-[10px] text-win font-medium mt-1">
                    {tier.savings}
                  </p>
                )}
                <p className="text-xs text-muted mt-2">{plan.description}</p>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <CheckCircle2
                        size={13}
                        className={`shrink-0 mt-0.5 ${
                          plan.highlight ? "text-accent" : "text-win/70"
                        }`}
                      />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                  {plan.excluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <span className="shrink-0 mt-0.5 w-[13px] h-[13px] flex items-center justify-center text-muted/30 text-[10px]">
                        —
                      </span>
                      <span className="text-muted/40 line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`mt-6 block text-center py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? "bg-accent text-background hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                      : "bg-surface-hover text-foreground hover:bg-border"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Add-On card — switches based on asset context */}
      <div className="mt-8 max-w-md mx-auto">
        <div className="glass border border-border/50 rounded-2xl p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-1">Add-On</p>
          <h3 className="text-lg font-bold text-foreground">
            {asset === "crypto" ? "Stock Trading" : "Crypto Trading"}
          </h3>
          <div className="flex items-baseline justify-center gap-1 mt-1">
            <span className="text-2xl font-bold text-foreground">$29</span>
            <span className="text-sm text-muted">/year</span>
          </div>
          <p className="text-xs text-muted mt-2">
            {asset === "crypto"
              ? "Track stocks & options alongside crypto. Sector analytics, PDT tracking, market session insights."
              : "Track crypto alongside stocks. DEX analytics, multi-chain support, on-chain trade logging."}
          </p>
          <p className="text-[10px] text-win mt-1">Included free with Max</p>
        </div>
      </div>
    </>
  );
}
