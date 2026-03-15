"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { RISK_PERSONALITIES, SELF_CONCEPT_IDENTITIES } from "@/lib/validators";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import type { RiskPersonality, DecisionStyle, SelfConceptIdentity } from "@/lib/types";

// ─── Assessment Questions ────────────────────────────────────────────────────

const RISK_SCENARIOS = [
  {
    id: "risk_1",
    question: "You're in a trade that's up 2R. The setup suggests it could go to 5R, but there's a clear resistance level. You:",
    options: [
      { label: "Take profit now — 2R is 2R", score: { conservative_guardian: 3, calculated_risk_taker: 1, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "Close half, trail stop on the rest", score: { conservative_guardian: 1, calculated_risk_taker: 3, aggressive_hunter: 1, adaptive_chameleon: 2 } },
      { label: "Hold the full position with a breakeven stop", score: { conservative_guardian: 0, calculated_risk_taker: 2, aggressive_hunter: 3, adaptive_chameleon: 1 } },
      { label: "Depends on market conditions today", score: { conservative_guardian: 0, calculated_risk_taker: 1, aggressive_hunter: 1, adaptive_chameleon: 3 } },
    ],
  },
  {
    id: "risk_2",
    question: "You've had 3 consecutive losses. Your next A+ setup appears. You:",
    options: [
      { label: "Skip it — wait until tomorrow for a fresh start", score: { conservative_guardian: 3, calculated_risk_taker: 1, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "Take it at reduced size (half normal)", score: { conservative_guardian: 2, calculated_risk_taker: 3, aggressive_hunter: 0, adaptive_chameleon: 2 } },
      { label: "Take it at full size — each trade is independent", score: { conservative_guardian: 0, calculated_risk_taker: 1, aggressive_hunter: 3, adaptive_chameleon: 1 } },
      { label: "Check my emotional state first, then decide", score: { conservative_guardian: 1, calculated_risk_taker: 1, aggressive_hunter: 0, adaptive_chameleon: 3 } },
    ],
  },
  {
    id: "risk_3",
    question: "A trade you didn't take would have been a 10R winner. You feel:",
    options: [
      { label: "Relieved I stuck to my rules — that wasn't my setup", score: { conservative_guardian: 3, calculated_risk_taker: 2, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "I analyze what I missed to improve my system", score: { conservative_guardian: 1, calculated_risk_taker: 3, aggressive_hunter: 1, adaptive_chameleon: 2 } },
      { label: "Frustrated — I need to be more aggressive", score: { conservative_guardian: 0, calculated_risk_taker: 0, aggressive_hunter: 3, adaptive_chameleon: 1 } },
      { label: "Curious — maybe I should widen my criteria sometimes", score: { conservative_guardian: 0, calculated_risk_taker: 1, aggressive_hunter: 1, adaptive_chameleon: 3 } },
    ],
  },
  {
    id: "risk_4",
    question: "Your maximum acceptable drawdown before you stop trading is:",
    options: [
      { label: "5% of account — preserve capital above all", score: { conservative_guardian: 3, calculated_risk_taker: 1, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "10-15% — standard risk management", score: { conservative_guardian: 1, calculated_risk_taker: 3, aggressive_hunter: 1, adaptive_chameleon: 2 } },
      { label: "20%+ — big drawdowns are part of big returns", score: { conservative_guardian: 0, calculated_risk_taker: 0, aggressive_hunter: 3, adaptive_chameleon: 0 } },
      { label: "It depends on current market volatility", score: { conservative_guardian: 0, calculated_risk_taker: 1, aggressive_hunter: 1, adaptive_chameleon: 3 } },
    ],
  },
  {
    id: "risk_5",
    question: "Before entering a trade, you spend the most time on:",
    options: [
      { label: "Risk management — where's my stop, what's my max loss", score: { conservative_guardian: 3, calculated_risk_taker: 2, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "The math — R:R ratio, probability, expected value", score: { conservative_guardian: 1, calculated_risk_taker: 3, aggressive_hunter: 1, adaptive_chameleon: 1 } },
      { label: "The opportunity — how much I could make", score: { conservative_guardian: 0, calculated_risk_taker: 0, aggressive_hunter: 3, adaptive_chameleon: 1 } },
      { label: "Context — what's the market doing, what's the setup quality", score: { conservative_guardian: 0, calculated_risk_taker: 1, aggressive_hunter: 1, adaptive_chameleon: 3 } },
    ],
  },
  {
    id: "risk_6",
    question: "If you could describe your ideal trading style in one word:",
    options: [
      { label: "Safe", score: { conservative_guardian: 3, calculated_risk_taker: 0, aggressive_hunter: 0, adaptive_chameleon: 0 } },
      { label: "Systematic", score: { conservative_guardian: 1, calculated_risk_taker: 3, aggressive_hunter: 0, adaptive_chameleon: 1 } },
      { label: "Bold", score: { conservative_guardian: 0, calculated_risk_taker: 0, aggressive_hunter: 3, adaptive_chameleon: 0 } },
      { label: "Flexible", score: { conservative_guardian: 0, calculated_risk_taker: 0, aggressive_hunter: 0, adaptive_chameleon: 3 } },
    ],
  },
];

const MONEY_SCRIPT_QUESTIONS = [
  // Avoidance
  { id: "ma_1", category: "avoidance" as const, text: "I feel guilty when I have a profitable trading day" },
  { id: "ma_2", category: "avoidance" as const, text: "Taking money from the market feels wrong somehow" },
  { id: "ma_3", category: "avoidance" as const, text: "I don't deserve to make money this easily" },
  // Worship
  { id: "mw_1", category: "worship" as const, text: "If I could just hit my P&L target, all my problems would be solved" },
  { id: "mw_2", category: "worship" as const, text: "I think about potential trading profits constantly" },
  { id: "mw_3", category: "worship" as const, text: "More money from trading would make me happier" },
  // Status
  { id: "ms_1", category: "status" as const, text: "My P&L defines my worth as a trader and as a person" },
  { id: "ms_2", category: "status" as const, text: "I compare my returns to other traders frequently" },
  { id: "ms_3", category: "status" as const, text: "I feel embarrassed about my losses" },
  // Vigilance
  { id: "mv_1", category: "vigilance" as const, text: "I must never have a red day" },
  { id: "mv_2", category: "vigilance" as const, text: "I check my P&L obsessively throughout the day" },
  { id: "mv_3", category: "vigilance" as const, text: "I worry about my open positions even when not trading" },
];

const DECISION_STYLE_QUESTIONS = [
  { id: "ds_1", text: "When I see a trade setup, my first reaction is:", options: [
    { label: "A gut feeling about direction", score: "intuitive" },
    { label: "Opening charts and checking indicators", score: "analytical" },
    { label: "It depends on the situation", score: "hybrid" },
  ]},
  { id: "ds_2", text: "I make my best trades when:", options: [
    { label: "I trust my instincts and act quickly", score: "intuitive" },
    { label: "I follow my rules exactly", score: "analytical" },
    { label: "I balance my gut with the data", score: "hybrid" },
  ]},
  { id: "ds_3", text: "Before entering a trade, I need:", options: [
    { label: "A strong conviction — I feel it in my body", score: "intuitive" },
    { label: "All criteria met — checklist complete", score: "analytical" },
    { label: "A mix of good data and good feeling", score: "hybrid" },
  ]},
  { id: "ds_4", text: "When a trade goes against me, I:", options: [
    { label: "Know instinctively when to cut", score: "intuitive" },
    { label: "Hit my stop loss no matter what", score: "analytical" },
    { label: "Reassess based on what's changed", score: "hybrid" },
  ]},
];

const ATTACHMENT_QUESTIONS = [
  { id: "at_1", text: "When a trade is in profit, I find it hard to close it because it might go higher" },
  { id: "at_2", text: "I feel physically uncomfortable closing a losing position" },
  { id: "at_3", text: "Once I enter a trade, I feel like it's 'mine' and I'm attached to the outcome" },
];

const LOSS_AVERSION_SCENARIOS = [
  {
    id: "la_1",
    question: "Which would you prefer?",
    options: [
      { label: "Guaranteed $500 profit", multiplier: 1.0 },
      { label: "50% chance of $1,100 profit, 50% chance of nothing", multiplier: 2.2 },
    ],
  },
  {
    id: "la_2",
    question: "Which bothers you more?",
    options: [
      { label: "Losing $100 bothers me about as much as gaining $100 pleases me", multiplier: 1.0 },
      { label: "Losing $100 bothers me about as much as gaining $200 pleases me", multiplier: 2.0 },
      { label: "Losing $100 bothers me about as much as gaining $300 pleases me", multiplier: 3.0 },
    ],
  },
  {
    id: "la_3",
    question: "You have two open trades. Trade A is up $200, Trade B is down $200. You must close one. You:",
    options: [
      { label: "Close the winner — lock in the profit", multiplier: 2.5 },
      { label: "Close the loser — cut the loss", multiplier: 1.5 },
      { label: "Check which has the better risk/reward going forward", multiplier: 1.0 },
    ],
  },
];

// ─── Wizard Component ────────────────────────────────────────────────────────

const STEPS = ["Risk Personality", "Money Scripts", "Decision Style", "Position Attachment", "Loss Aversion", "Self-Concept"];

type Props = {
  onComplete: () => void;
  onCancel: () => void;
};

export function PsychologyProfileWizard({ onComplete, onCancel }: Props) {
  const { setTier, refreshProfile } = usePsychologyTier();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Risk scenarios
  const [riskResponses, setRiskResponses] = useState<Record<string, number>>({});

  // Step 2: Money scripts
  const [moneyResponses, setMoneyResponses] = useState<Record<string, number>>({});

  // Step 3: Decision style
  const [decisionResponses, setDecisionResponses] = useState<Record<string, string>>({});

  // Step 4: Attachment
  const [attachmentResponses, setAttachmentResponses] = useState<Record<string, number>>({});

  // Step 5: Loss aversion
  const [lossAversionResponses, setLossAversionResponses] = useState<Record<string, number>>({});

  // Step 6: Self-concept
  const [selfConceptText, setSelfConceptText] = useState("");
  const [selfConceptIdentity, setSelfConceptIdentity] = useState<SelfConceptIdentity | null>(null);

  function canProceed(): boolean {
    switch (step) {
      case 0: return Object.keys(riskResponses).length === RISK_SCENARIOS.length;
      case 1: return Object.keys(moneyResponses).length === MONEY_SCRIPT_QUESTIONS.length;
      case 2: return Object.keys(decisionResponses).length === DECISION_STYLE_QUESTIONS.length;
      case 3: return Object.keys(attachmentResponses).length === ATTACHMENT_QUESTIONS.length;
      case 4: return Object.keys(lossAversionResponses).length === LOSS_AVERSION_SCENARIOS.length;
      case 5: return selfConceptIdentity !== null;
      default: return false;
    }
  }

  function computeRiskPersonality(): RiskPersonality {
    const scores: Record<string, number> = { conservative_guardian: 0, calculated_risk_taker: 0, aggressive_hunter: 0, adaptive_chameleon: 0 };
    for (const [qId, optIdx] of Object.entries(riskResponses)) {
      const scenario = RISK_SCENARIOS.find((s) => s.id === qId);
      if (scenario) {
        const option = scenario.options[optIdx];
        for (const [key, val] of Object.entries(option.score)) {
          scores[key] += val;
        }
      }
    }
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as RiskPersonality;
  }

  function computeMoneyScripts(): { avoidance: number; worship: number; status: number; vigilance: number } {
    const sums: Record<string, number[]> = { avoidance: [], worship: [], status: [], vigilance: [] };
    for (const q of MONEY_SCRIPT_QUESTIONS) {
      const val = moneyResponses[q.id];
      if (val !== undefined) sums[q.category].push(val);
    }
    return {
      avoidance: avg(sums.avoidance),
      worship: avg(sums.worship),
      status: avg(sums.status),
      vigilance: avg(sums.vigilance),
    };
  }

  function computeDecisionStyle(): DecisionStyle {
    const counts: Record<string, number> = { intuitive: 0, analytical: 0, hybrid: 0 };
    for (const val of Object.values(decisionResponses)) {
      counts[val] = (counts[val] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as DecisionStyle;
  }

  function computeAttachmentScore(): number {
    const vals = Object.values(attachmentResponses);
    return vals.length > 0 ? Math.round(avg(vals) * 10) / 10 : 3;
  }

  function computeLossAversion(): number {
    const vals = Object.values(lossAversionResponses);
    if (vals.length === 0) return 2.0;
    const multipliers = vals.map((idx, i) => LOSS_AVERSION_SCENARIOS[i].options[idx].multiplier);
    return Math.round(avg(multipliers) * 100) / 100;
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const supabase = createClient();
      const riskPersonality = computeRiskPersonality();
      const moneyScripts = computeMoneyScripts();
      const decisionStyle = computeDecisionStyle();
      const attachmentScore = computeAttachmentScore();
      const lossAversion = computeLossAversion();

      const reassessDate = new Date();
      reassessDate.setDate(reassessDate.getDate() + 90);

      await supabase.from("psychology_profiles").insert({
        risk_personality: riskPersonality,
        risk_scenario_responses: riskResponses,
        money_avoidance: moneyScripts.avoidance,
        money_worship: moneyScripts.worship,
        money_status: moneyScripts.status,
        money_vigilance: moneyScripts.vigilance,
        money_script_responses: moneyResponses,
        decision_style: decisionStyle,
        decision_style_responses: decisionResponses,
        position_attachment_score: attachmentScore,
        attachment_responses: attachmentResponses,
        self_concept_text: selfConceptText.trim() || null,
        self_concept_identity: selfConceptIdentity,
        loss_aversion_coefficient: lossAversion,
        loss_aversion_responses: lossAversionResponses,
        completed_at: new Date().toISOString(),
        reassess_after: reassessDate.toISOString().split("T")[0],
      });

      await setTier("expert");
      await refreshProfile();
      onComplete();
    } catch {
      // Profile save failed — stay on wizard
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="glass border border-accent/20 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        style={{ boxShadow: "0 0 60px rgba(0,180,216,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">🔬 Psychology Profile</h2>
            <p className="text-xs text-muted mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-border/30">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 0 && <RiskStep responses={riskResponses} setResponses={setRiskResponses} />}
          {step === 1 && <MoneyScriptStep responses={moneyResponses} setResponses={setMoneyResponses} />}
          {step === 2 && <DecisionStyleStep responses={decisionResponses} setResponses={setDecisionResponses} />}
          {step === 3 && <AttachmentStep responses={attachmentResponses} setResponses={setAttachmentResponses} />}
          {step === 4 && <LossAversionStep responses={lossAversionResponses} setResponses={setLossAversionResponses} />}
          {step === 5 && (
            <SelfConceptStep
              text={selfConceptText}
              setText={setSelfConceptText}
              identity={selfConceptIdentity}
              setIdentity={setSelfConceptIdentity}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-5 border-t border-border/50">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent text-background hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed() || saving}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent text-background hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? "Saving..." : <><Check size={14} /> Complete Profile</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ─────────────────────────────────────────────────────────

function RiskStep({ responses, setResponses }: { responses: Record<string, number>; setResponses: (r: Record<string, number>) => void }) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">Answer honestly — there are no right or wrong answers. This helps your AI coach adapt to your natural trading style.</p>
      {RISK_SCENARIOS.map((scenario) => (
        <div key={scenario.id} className="space-y-2">
          <p className="text-sm text-foreground font-medium">{scenario.question}</p>
          <div className="space-y-1.5">
            {scenario.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setResponses({ ...responses, [scenario.id]: idx })}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs border transition-all ${
                  responses[scenario.id] === idx
                    ? "bg-accent/10 border-accent/30 text-accent"
                    : "bg-background border-border text-muted hover:text-foreground hover:border-accent/20"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MoneyScriptStep({ responses, setResponses }: { responses: Record<string, number>; setResponses: (r: Record<string, number>) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted">Rate how much you agree with each statement (1 = Strongly Disagree, 5 = Strongly Agree).</p>
      {MONEY_SCRIPT_QUESTIONS.map((q) => (
        <div key={q.id} className="space-y-1.5">
          <p className="text-xs text-foreground">{q.text}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setResponses({ ...responses, [q.id]: n })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                  responses[q.id] === n
                    ? "bg-accent/15 border-accent/30 text-accent"
                    : "bg-background border-border text-muted hover:border-accent/20"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-muted/50 px-1">
            <span>Disagree</span>
            <span>Agree</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DecisionStyleStep({ responses, setResponses }: { responses: Record<string, string>; setResponses: (r: Record<string, string>) => void }) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">How do you actually make trading decisions? Not how you think you should — how you really do.</p>
      {DECISION_STYLE_QUESTIONS.map((q) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm text-foreground font-medium">{q.text}</p>
          <div className="space-y-1.5">
            {q.options.map((opt) => (
              <button
                key={opt.score}
                type="button"
                onClick={() => setResponses({ ...responses, [q.id]: opt.score })}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs border transition-all ${
                  responses[q.id] === opt.score
                    ? "bg-accent/10 border-accent/30 text-accent"
                    : "bg-background border-border text-muted hover:text-foreground hover:border-accent/20"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttachmentStep({ responses, setResponses }: { responses: Record<string, number>; setResponses: (r: Record<string, number>) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted">How strongly do you relate to each statement? (1 = Not at all, 5 = Very much)</p>
      {ATTACHMENT_QUESTIONS.map((q) => (
        <div key={q.id} className="space-y-1.5">
          <p className="text-xs text-foreground">{q.text}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setResponses({ ...responses, [q.id]: n })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                  responses[q.id] === n
                    ? "bg-accent/15 border-accent/30 text-accent"
                    : "bg-background border-border text-muted hover:border-accent/20"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-muted/50 px-1">
            <span>Not at all</span>
            <span>Very much</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LossAversionStep({ responses, setResponses }: { responses: Record<string, number>; setResponses: (r: Record<string, number>) => void }) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">These questions measure how differently you experience gains vs losses. Most people feel losses 2-2.5x more intensely than equivalent gains.</p>
      {LOSS_AVERSION_SCENARIOS.map((scenario, sIdx) => (
        <div key={scenario.id} className="space-y-2">
          <p className="text-sm text-foreground font-medium">{scenario.question}</p>
          <div className="space-y-1.5">
            {scenario.options.map((opt, oIdx) => (
              <button
                key={oIdx}
                type="button"
                onClick={() => setResponses({ ...responses, [scenario.id]: oIdx })}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs border transition-all ${
                  responses[scenario.id] === oIdx
                    ? "bg-accent/10 border-accent/30 text-accent"
                    : "bg-background border-border text-muted hover:text-foreground hover:border-accent/20"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SelfConceptStep({
  text,
  setText,
  identity,
  setIdentity,
}: {
  text: string;
  setText: (t: string) => void;
  identity: SelfConceptIdentity | null;
  setIdentity: (i: SelfConceptIdentity) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">This is the foundation of your trading identity. Your AI coach will reference this to help you stay aligned with who you want to be.</p>

      {/* Free text */}
      <div>
        <label className="block text-sm text-foreground font-medium mb-2">
          Complete this sentence: &quot;As a trader, I am...&quot;
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g., 'a disciplined trend follower who respects risk above all else'"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 resize-none"
        />
      </div>

      {/* Identity pick */}
      <div>
        <label className="block text-sm text-foreground font-medium mb-2">
          Which trader archetype resonates most?
        </label>
        <div className="space-y-2">
          {SELF_CONCEPT_IDENTITIES.map((id) => (
            <button
              key={id.id}
              type="button"
              onClick={() => setIdentity(id.id as SelfConceptIdentity)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                identity === id.id
                  ? "bg-accent/10 border-accent/30"
                  : "bg-background border-border hover:border-accent/20"
              }`}
            >
              <div className="text-sm font-semibold text-foreground">{id.label}</div>
              <div className="text-xs text-muted mt-0.5">{id.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
