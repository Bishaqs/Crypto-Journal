"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { SELF_CONCEPT_IDENTITIES } from "@/lib/validators";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import type { SelfConceptIdentity } from "@/lib/types";

import {
  RISK_SCENARIOS,
  MONEY_SCRIPT_QUESTIONS,
  DECISION_STYLE_QUESTIONS,
  ATTACHMENT_QUESTIONS,
  LOSS_AVERSION_SCENARIOS,
  DISCIPLINE_QUESTIONS,
  EMOTIONAL_REGULATION_QUESTIONS,
  BIAS_AWARENESS_QUESTIONS,
  FOMO_REVENGE_QUESTIONS,
  JOURNALING_QUESTION,
  STRESS_RESPONSE_QUESTION,
  KICKSTART_STEPS,
} from "@/lib/psychology-questions";

import {
  computeRiskPersonality,
  computeMoneyScripts,
  computeDecisionStyle,
  computeAttachmentScore,
  computeLossAversion,
  computeDisciplineScore,
  computeEmotionalRegulation,
  computeBiasAwareness,
  computeFomoRevengeScore,
  computeStressResponse,
} from "@/lib/psychology-scoring";

// ─── Wizard Component ────────────────────────────────────────────────────────

type Props = {
  variant: "kickstart" | "settings";
  onComplete: () => void;
  onCancel: () => void;
};

export function PsychologyProfileWizard({ variant, onComplete, onCancel }: Props) {
  const { refreshProfile } = usePsychologyTier();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category responses
  const [riskResponses, setRiskResponses] = useState<Record<string, number>>({});
  const [moneyResponses, setMoneyResponses] = useState<Record<string, number>>({});
  const [decisionResponses, setDecisionResponses] = useState<Record<string, string>>({});
  const [attachmentResponses, setAttachmentResponses] = useState<Record<string, number>>({});
  const [lossAversionResponses, setLossAversionResponses] = useState<Record<string, number>>({});
  const [disciplineResponses, setDisciplineResponses] = useState<Record<string, number>>({});
  const [emotionalRegResponses, setEmotionalRegResponses] = useState<Record<string, string>>({});
  const [biasResponses, setBiasResponses] = useState<Record<string, string>>({});
  const [fomoRevengeResponses, setFomoRevengeResponses] = useState<Record<string, number>>({});
  const [journalingResponse, setJournalingResponse] = useState<string | null>(null);
  const [stressResponse, setStressResponse] = useState<string | null>(null);
  const [selfConceptText, setSelfConceptText] = useState("");
  const [selfConceptIdentity, setSelfConceptIdentity] = useState<SelfConceptIdentity | null>(null);

  const STEPS = KICKSTART_STEPS;
  const totalSteps = STEPS.length;

  function canProceed(): boolean {
    switch (step) {
      case 0: return Object.keys(riskResponses).length >= 3; // Risk A (first 3)
      case 1: return Object.keys(riskResponses).length >= 6; // Risk B (last 3)
      case 2: return Object.keys(moneyResponses).length >= 6; // Money Scripts A (first 6)
      case 3: return Object.keys(moneyResponses).length >= 12; // Money Scripts B (last 6)
      case 4: return Object.keys(decisionResponses).length >= 4 && journalingResponse !== null; // Decision + Journaling
      case 5: return Object.keys(attachmentResponses).length >= 3 && Object.keys(fomoRevengeResponses).length >= 2; // Attachment + FOMO
      case 6: return Object.keys(lossAversionResponses).length >= 3; // Loss Aversion
      case 7: return Object.keys(emotionalRegResponses).length >= 2 && stressResponse !== null; // Emotional Reg + Stress
      case 8: return Object.keys(biasResponses).length >= 2 && Object.keys(disciplineResponses).length >= 2; // Biases + Discipline
      case 9: return selfConceptIdentity !== null; // Self-Concept
      default: return false;
    }
  }

  async function handleComplete() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const riskPersonality = computeRiskPersonality(riskResponses);
      const moneyScripts = computeMoneyScripts(moneyResponses);
      const decisionStyle = computeDecisionStyle(decisionResponses);
      const attachmentScore = computeAttachmentScore(attachmentResponses);
      const lossAversion = computeLossAversion(lossAversionResponses);
      const disciplineScore = computeDisciplineScore(disciplineResponses);
      const emotionalReg = computeEmotionalRegulation(emotionalRegResponses);
      const biasAwareness = computeBiasAwareness(biasResponses);
      const fomoRevenge = computeFomoRevengeScore(fomoRevengeResponses);
      const stressResp = computeStressResponse(stressResponse ? { sr_1: stressResponse } : {});

      const reassessDate = new Date();
      reassessDate.setDate(reassessDate.getDate() + 90);

      const { error: dbError } = await supabase.from("psychology_profiles").insert({
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
        discipline_score: disciplineScore,
        discipline_responses: disciplineResponses,
        emotional_regulation: emotionalReg,
        emotional_regulation_responses: emotionalRegResponses,
        bias_awareness_score: biasAwareness,
        bias_awareness_responses: biasResponses,
        fomo_revenge_score: fomoRevenge,
        fomo_revenge_responses: fomoRevengeResponses,
        journaling_style: journalingResponse,
        stress_response: stressResp,
        stress_response_responses: stressResponse ? { sr_1: stressResponse } : {},
        source: variant === "kickstart" ? "kickstart" : "wizard",
        completed_at: new Date().toISOString(),
        reassess_after: reassessDate.toISOString().split("T")[0],
      });

      if (dbError) {
        console.error("[PsychologyWizard] Save failed:", dbError);
        setError("Failed to save your profile. Please try again.");
        return;
      }

      await refreshProfile();
      onComplete();
    } catch (err) {
      console.error("[PsychologyWizard] Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`fixed inset-0 ${variant === "kickstart" ? "z-[9999] bg-black" : "z-50 bg-black/70 backdrop-blur-sm"} flex items-center justify-center p-4`}>
      <div
        className="glass border border-accent/20 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        style={{ boxShadow: "0 0 60px rgba(0,180,216,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">Psychology Profile</h2>
            <p className="text-xs text-muted mt-0.5">Step {step + 1} of {totalSteps} — {STEPS[step]}</p>
          </div>
          {variant === "settings" && (
            <button onClick={onCancel} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-border/30">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 0 && <RiskStep scenarios={RISK_SCENARIOS.slice(0, 3)} responses={riskResponses} setResponses={setRiskResponses} />}
          {step === 1 && <RiskStep scenarios={RISK_SCENARIOS.slice(3, 6)} responses={riskResponses} setResponses={setRiskResponses} />}
          {step === 2 && <MoneyScriptStep questions={MONEY_SCRIPT_QUESTIONS.slice(0, 6)} responses={moneyResponses} setResponses={setMoneyResponses} />}
          {step === 3 && <MoneyScriptStep questions={MONEY_SCRIPT_QUESTIONS.slice(6, 12)} responses={moneyResponses} setResponses={setMoneyResponses} />}
          {step === 4 && (
            <CombinedStep>
              <DecisionStyleStep responses={decisionResponses} setResponses={setDecisionResponses} />
              <ScenarioStep
                title="Journaling & Reflection"
                question={JOURNALING_QUESTION}
                selected={journalingResponse}
                onSelect={setJournalingResponse}
              />
            </CombinedStep>
          )}
          {step === 5 && (
            <CombinedStep>
              <AttachmentStep responses={attachmentResponses} setResponses={setAttachmentResponses} />
              <LikertStep
                title="FOMO & Revenge Trading"
                intro="Rate how much you agree with each statement."
                questions={FOMO_REVENGE_QUESTIONS}
                responses={fomoRevengeResponses}
                setResponses={setFomoRevengeResponses}
              />
            </CombinedStep>
          )}
          {step === 6 && <LossAversionStep responses={lossAversionResponses} setResponses={setLossAversionResponses} />}
          {step === 7 && (
            <CombinedStep>
              <MultiScenarioStep
                title="Emotional Regulation"
                intro="How do you handle emotions while trading?"
                questions={EMOTIONAL_REGULATION_QUESTIONS}
                responses={emotionalRegResponses}
                setResponses={setEmotionalRegResponses}
              />
              <ScenarioStep
                title="Stress Response"
                question={STRESS_RESPONSE_QUESTION}
                selected={stressResponse}
                onSelect={setStressResponse}
              />
            </CombinedStep>
          )}
          {step === 8 && (
            <CombinedStep>
              <MultiScenarioStep
                title="Cognitive Biases"
                intro="How aware are you of your trading biases?"
                questions={BIAS_AWARENESS_QUESTIONS}
                responses={biasResponses}
                setResponses={setBiasResponses}
              />
              <LikertStep
                title="Trading Discipline"
                intro="Rate how much you agree with each statement."
                questions={DISCIPLINE_QUESTIONS}
                responses={disciplineResponses}
                setResponses={setDisciplineResponses}
              />
            </CombinedStep>
          )}
          {step === 9 && (
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

          {step < totalSteps - 1 ? (
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

// ─── Reusable Step Components ───────────────────────────────────────────────

function CombinedStep({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8">{children}</div>;
}

function RiskStep({
  scenarios,
  responses,
  setResponses,
}: {
  scenarios: typeof RISK_SCENARIOS;
  responses: Record<string, number>;
  setResponses: (r: Record<string, number>) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">Answer honestly — there are no right or wrong answers. This helps your AI coach adapt to your natural trading style.</p>
      {scenarios.map((scenario) => (
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

function MoneyScriptStep({
  questions,
  responses,
  setResponses,
}: {
  questions: typeof MONEY_SCRIPT_QUESTIONS;
  responses: Record<string, number>;
  setResponses: (r: Record<string, number>) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted">Rate how much you agree with each statement (1 = Strongly Disagree, 5 = Strongly Agree).</p>
      {questions.map((q) => (
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

function DecisionStyleStep({
  responses,
  setResponses,
}: {
  responses: Record<string, string>;
  setResponses: (r: Record<string, string>) => void;
}) {
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

function AttachmentStep({
  responses,
  setResponses,
}: {
  responses: Record<string, number>;
  setResponses: (r: Record<string, number>) => void;
}) {
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

function LossAversionStep({
  responses,
  setResponses,
}: {
  responses: Record<string, number>;
  setResponses: (r: Record<string, number>) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted">These questions measure how differently you experience gains vs losses. Most people feel losses 2-2.5x more intensely than equivalent gains.</p>
      {LOSS_AVERSION_SCENARIOS.map((scenario) => (
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

function LikertStep({
  title,
  intro,
  questions,
  responses,
  setResponses,
}: {
  title: string;
  intro: string;
  questions: { id: string; text: string }[];
  responses: Record<string, number>;
  setResponses: (r: Record<string, number>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted">{intro}</p>
      </div>
      {questions.map((q) => (
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

function ScenarioStep({
  title,
  question,
  selected,
  onSelect,
}: {
  title: string;
  question: { id: string; question: string; options: { label: string; value: string }[] };
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-foreground font-medium">{question.question}</p>
      <div className="space-y-1.5">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs border transition-all ${
              selected === opt.value
                ? "bg-accent/10 border-accent/30 text-accent"
                : "bg-background border-border text-muted hover:text-foreground hover:border-accent/20"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiScenarioStep({
  title,
  intro,
  questions,
  responses,
  setResponses,
}: {
  title: string;
  intro: string;
  questions: { id: string; question: string; options: { label: string; value: string }[] }[];
  responses: Record<string, string>;
  setResponses: (r: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted">{intro}</p>
      </div>
      {questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm text-foreground font-medium">{q.question}</p>
          <div className="space-y-1.5">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setResponses({ ...responses, [q.id]: opt.value })}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs border transition-all ${
                  responses[q.id] === opt.value
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
