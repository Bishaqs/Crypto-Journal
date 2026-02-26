"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Coins,
  BookOpen,
  Sparkles,
  CheckCircle2,
  UserCircle,
} from "lucide-react";

type OnboardingData = {
  displayName: string;
  experienceLevel: string;
  tradeType: string;
  inputMethod: string;
};

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    displayName: "",
    experienceLevel: "",
    tradeType: "",
    inputMethod: "",
  });

  const steps = [
    {
      title: "Let's get to know you",
      subtitle: "This helps us personalize your experience",
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-xs text-muted mb-2 font-medium">Your name</label>
            <div className="relative">
              <UserCircle size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={data.displayName}
                onChange={(e) => setData({ ...data, displayName: e.target.value })}
                placeholder="What should we call you?"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-surface text-foreground text-sm placeholder-muted focus:border-accent focus:outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-2 font-medium">Trading experience</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "beginner", label: "Beginner", desc: "Just getting started" },
                { value: "intermediate", label: "Intermediate", desc: "1-3 years trading" },
                { value: "advanced", label: "Advanced", desc: "3+ years, consistent" },
                { value: "professional", label: "Professional", desc: "Full-time trader" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setData({ ...data, experienceLevel: opt.value })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    data.experienceLevel === opt.value
                      ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,180,216,0.1)]"
                      : "border-border bg-surface hover:border-accent/30"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
      canProceed: data.displayName.trim() !== "" && data.experienceLevel !== "",
    },
    {
      title: "What do you trade?",
      subtitle: "We'll customize your experience",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: "crypto", label: "Crypto", desc: "BTC, ETH, alts" },
            { value: "stocks", label: "Stocks", desc: "Equities, options" },
            { value: "both", label: "Both", desc: "Multi-asset" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setData({ ...data, tradeType: opt.value })}
              className={`p-5 rounded-2xl border text-left transition-all ${
                data.tradeType === opt.value
                  ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,180,216,0.1)]"
                  : "border-border bg-surface hover:border-accent/30"
              }`}
            >
              <Coins
                size={20}
                className={
                  data.tradeType === opt.value ? "text-accent" : "text-muted"
                }
              />
              <p className="text-sm font-semibold text-foreground mt-3">
                {opt.label}
              </p>
              <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      ),
      canProceed: data.tradeType !== "",
    },
    {
      title: "How will you log trades?",
      subtitle: "You can always change this later",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              value: "manual",
              label: "Log Manually",
              desc: "Enter trades yourself — full control over every field",
              icon: BookOpen,
            },
            {
              value: "csv",
              label: "Import CSV",
              desc: "Upload trades from your exchange or another journal",
              icon: Sparkles,
            },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setData({ ...data, inputMethod: opt.value })}
              className={`p-6 rounded-2xl border text-left transition-all ${
                data.inputMethod === opt.value
                  ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,180,216,0.1)]"
                  : "border-border bg-surface hover:border-accent/30"
              }`}
            >
              <opt.icon
                size={22}
                className={
                  data.inputMethod === opt.value ? "text-accent" : "text-muted"
                }
              />
              <p className="text-sm font-semibold text-foreground mt-3">
                {opt.label}
              </p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      ),
      canProceed: data.inputMethod !== "",
    },
    {
      title: "You're all set!",
      subtitle: "Here's what to do first",
      content: (
        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Log your first trade",
              desc: "Click 'Log Trade' on the dashboard. It takes 30 seconds.",
            },
            {
              step: "2",
              title: "Tag your emotions",
              desc: "Were you calm, anxious, or FOMOing? Be honest — the data helps.",
            },
            {
              step: "3",
              title: "Rate your process",
              desc: "After closing, score your execution 1-10. This is your real edge metric.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-accent">
                  {item.step}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="text-xs text-muted mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
      canProceed: true,
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  function saveData() {
    if (data.displayName.trim()) {
      localStorage.setItem("stargate-display-name", data.displayName.trim());
    }
    if (data.experienceLevel) {
      localStorage.setItem("stargate-experience-level", data.experienceLevel);
    }
  }

  function handleNext() {
    if (isLast) {
      saveData();
      localStorage.setItem("stargate-onboarded", "true");
      onComplete();
    } else {
      setStep(step + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">
            {currentStep.title}
          </h2>
          <p className="text-sm text-muted mt-1">{currentStep.subtitle}</p>
        </div>

        <div className="mb-8">{currentStep.content}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={!currentStep.canProceed}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLast ? (
              <>
                <CheckCircle2 size={16} />
                Go to Dashboard
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={() => {
              saveData();
              localStorage.setItem("stargate-onboarded", "true");
              onComplete();
            }}
            className="block mx-auto mt-6 text-xs text-muted/60 hover:text-muted transition-colors"
          >
            Skip onboarding
          </button>
        )}
      </div>
    </div>
  );
}
