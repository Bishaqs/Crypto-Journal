"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trade, PsychologyProfile, BehavioralLog, DailyCheckin } from "@/lib/types";
import { DEMO_TRADES } from "@/lib/demo-data";
import { DemoBanner } from "@/components/demo-banner";
import { usePsychologyTier } from "@/lib/psychology-tier-context";
import { PsychologyTierToggle } from "@/components/psychology-tier-toggle";
import { PsychologyProfileWizard } from "@/components/psychology-profile-wizard";
import { EmotionCheckIn } from "@/components/emotion-checkin";
import { EMOTION_CONFIG } from "@/components/psychology-inputs";
import { RISK_PERSONALITIES, SELF_CONCEPT_IDENTITIES, COGNITIVE_DISTORTIONS } from "@/lib/validators";
import {
  generateBehavioralInsights,
  getEmotionPnlData,
  getConfidencePnlData,
  getProcessScorePnlData,
  calculateTradePnl,
} from "@/lib/calculations";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useTheme } from "@/lib/theme-context";
import { getChartColors } from "@/lib/chart-colors";
import {
  Brain,
  Shield,
  Target,
  Flame,
  Sparkles,
  TrendingUp,
  Activity,
  Eye,
} from "lucide-react";

export default function PsychologyPage() {
  const { tier, isAdvanced, isExpert, profile, profileLoading, refreshProfile } = usePsychologyTier();
  const { theme } = useTheme();
  const colors = getChartColors(theme);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [behavioralLogs, setBehavioralLogs] = useState<BehavioralLog[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch trades
    const { data: tradeData } = await supabase
      .from("trades")
      .select("*")
      .order("open_timestamp", { ascending: false })
      .limit(500);

    if (tradeData && tradeData.length > 0) {
      setTrades(tradeData as Trade[]);
    } else {
      setTrades(DEMO_TRADES as Trade[]);
      setIsDemo(true);
    }

    // Fetch behavioral logs
    const { data: logs } = await supabase
      .from("behavioral_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (logs) setBehavioralLogs(logs as BehavioralLog[]);

    // Fetch daily checkins
    const { data: cData } = await supabase
      .from("daily_checkins")
      .select("*")
      .order("date", { ascending: false })
      .limit(30);
    if (cData) setCheckins(cData as DailyCheckin[]);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const closedTrades = trades.filter((t) => t.close_timestamp && t.pnl !== null);
  const emotionPnlData = getEmotionPnlData(closedTrades);
  const confidencePnlData = getConfidencePnlData(closedTrades);
  const processScorePnlData = getProcessScorePnlData(closedTrades);
  const insights = generateBehavioralInsights(closedTrades);

  // Money script radar data (Expert)
  const moneyScriptData = profile ? [
    { subject: "Avoidance", value: profile.money_avoidance ?? 0, fullMark: 5 },
    { subject: "Worship", value: profile.money_worship ?? 0, fullMark: 5 },
    { subject: "Status", value: profile.money_status ?? 0, fullMark: 5 },
    { subject: "Vigilance", value: profile.money_vigilance ?? 0, fullMark: 5 },
  ] : [];

  const riskInfo = profile ? RISK_PERSONALITIES.find((r) => r.id === profile.risk_personality) : null;
  const identityInfo = profile ? SELF_CONCEPT_IDENTITIES.find((i) => i.id === profile.self_concept_identity) : null;

  // Cognitive distortion frequency from expert session logs
  const distortionFrequency = behavioralLogs.reduce<Record<string, number>>((acc, _log) => {
    // This would come from expert_session_logs in a full implementation
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-20">
      {isDemo && <DemoBanner />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="text-accent" size={24} />
            Trading Psychology
          </h1>
          <p className="text-xs text-muted mt-1">
            {tier === "simple" && "Track emotions and their impact on your trading"}
            {tier === "advanced" && "Deep mind-body awareness for better decisions"}
            {tier === "expert" && "Complete psychological analysis and growth tracking"}
          </p>
        </div>
        <PsychologyTierToggle onExpertFirstTime={() => setShowWizard(true)} />
      </div>

      {/* Expert Profile Wizard Modal */}
      {showWizard && (
        <PsychologyProfileWizard
          onComplete={() => { setShowWizard(false); refreshProfile(); }}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: EMOTION CENTER (All tiers) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity size={16} className="text-accent" />
          Emotion Center
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Emotion Check-In */}
          <EmotionCheckIn mode="auto" context="standalone" embedded={false} />

          {/* P&L by Emotion */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-xs font-semibold text-muted mb-3">P&L by Emotion</h3>
            {emotionPnlData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={emotionPnlData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis type="number" tick={{ fill: colors.tick, fontSize: 10 }} />
                  <YAxis dataKey="emotion" type="category" tick={{ fill: colors.tick, fontSize: 10 }} width={80} />
                  <Tooltip
                    contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.grid}`, borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: colors.tick }}
                  />
                  <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                    {emotionPnlData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.pnl >= 0 ? colors.win : colors.loss} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted text-center py-12">Log emotions with your trades to see correlations</p>
            )}
          </div>

          {/* Confidence vs P&L */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-xs font-semibold text-muted mb-3">Confidence vs P&L</h3>
            {confidencePnlData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="confidence" name="Confidence" tick={{ fill: colors.tick, fontSize: 10 }} />
                  <YAxis dataKey="pnl" name="P&L" tick={{ fill: colors.tick, fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.grid}`, borderRadius: 8, fontSize: 11 }}
                  />
                  <Scatter data={confidencePnlData} fill={colors.accent} fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted text-center py-12">Track confidence on trades to see the pattern</p>
            )}
          </div>

          {/* Process Score vs P&L */}
          <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-xs font-semibold text-muted mb-3">Process Score vs Avg P&L</h3>
            {processScorePnlData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={processScorePnlData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="score" tick={{ fill: colors.tick, fontSize: 10 }} />
                  <YAxis tick={{ fill: colors.tick, fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: colors.tooltipBg, border: `1px solid ${colors.grid}`, borderRadius: 8, fontSize: 11 }}
                  />
                  <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]}>
                    {processScorePnlData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.avgPnl >= 0 ? colors.win : colors.loss} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted text-center py-12">Rate your process to see how discipline impacts outcomes</p>
            )}
          </div>
        </div>

        {/* Behavioral Insight Cards */}
        {insights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`glass rounded-xl border p-4 ${
                  insight.sentiment === "positive" ? "border-win/20" : insight.sentiment === "negative" ? "border-loss/20" : "border-border/50"
                }`}
              >
                <div className="text-xs font-semibold text-foreground">{insight.label}</div>
                <div className="text-[10px] text-muted mt-1">{insight.description}</div>
                <div className={`text-sm font-bold mt-2 ${
                  insight.sentiment === "positive" ? "text-win" : insight.sentiment === "negative" ? "text-loss" : "text-foreground"
                }`}>
                  {insight.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: MIND-BODY LAB (Advanced+) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isAdvanced && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Eye size={16} className="text-accent" />
            Mind-Body Lab
            <span className="text-[10px] text-accent/50 font-normal">Advanced</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sleep Quality Impact */}
            <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-xs font-semibold text-muted mb-3">Sleep Quality Impact</h3>
              {checkins.filter((c) => c.sleep_quality).length > 3 ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const daysWithSleep = checkins.filter((c) => c.sleep_quality === level);
                    return (
                      <div key={level} className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-muted">Sleep {level}/5</span>
                        <div className="flex-1 h-2 bg-border/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent/60 rounded-full"
                            style={{ width: `${(daysWithSleep.length / checkins.length) * 100}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-muted">{daysWithSleep.length}d</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-12">Log sleep quality in daily check-ins to see impact</p>
              )}
            </div>

            {/* Bias Cost Calculator */}
            <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-xs font-semibold text-muted mb-3">Bias Cost Calculator</h3>
              {behavioralLogs.length > 0 ? (
                <div className="space-y-2">
                  {(() => {
                    const biasCounts = behavioralLogs.reduce<Record<string, number>>((acc, log) => {
                      for (const bias of log.biases) {
                        acc[bias] = (acc[bias] || 0) + 1;
                      }
                      return acc;
                    }, {});
                    return Object.entries(biasCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([bias, count]) => (
                        <div key={bias} className="flex items-center justify-between text-xs">
                          <span className="text-loss">{bias}</span>
                          <span className="text-muted">{count} occurrences</span>
                        </div>
                      ));
                  })()}
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-12">Track biases in emotion check-ins to see their frequency</p>
              )}
            </div>

            {/* Daily Check-In Trend */}
            <div className="glass rounded-2xl border border-border/50 p-5 lg:col-span-2" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-xs font-semibold text-muted mb-3">Daily Check-In Trend (Last 14 Days)</h3>
              {checkins.length > 3 ? (
                <div className="flex gap-1.5 overflow-x-auto pb-2">
                  {checkins.slice(0, 14).reverse().map((c) => (
                    <div key={c.id} className="flex flex-col items-center gap-1 min-w-[44px]">
                      <div className={`w-3 h-3 rounded-full ${
                        c.traffic_light === "green" ? "bg-win" : c.traffic_light === "yellow" ? "bg-yellow-400" : "bg-loss"
                      }`} />
                      <div className="text-[9px] text-muted">M{c.mood}</div>
                      {c.energy && <div className="text-[9px] text-muted">E{c.energy}</div>}
                      <div className="text-[8px] text-muted/50">{new Date(c.date).getDate()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-8">Complete daily check-ins to see trends</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: DEEP PSYCHOLOGY (Expert) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isExpert && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            Deep Psychology
            <span className="text-[10px] text-accent/50 font-normal">Expert</span>
          </h2>

          {/* Profile Card */}
          {profile ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Risk Personality */}
              <div className="glass rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-muted mb-3 flex items-center gap-1.5">
                  <Shield size={14} className="text-accent" /> Risk Personality
                </h3>
                {riskInfo && (
                  <div>
                    <div className="text-2xl mb-1">{riskInfo.emoji}</div>
                    <div className="text-sm font-bold text-foreground">{riskInfo.label}</div>
                    <div className="text-[10px] text-muted mt-1">{riskInfo.description}</div>
                  </div>
                )}
              </div>

              {/* Self-Concept */}
              <div className="glass rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-muted mb-3 flex items-center gap-1.5">
                  <Target size={14} className="text-accent" /> Trading Identity
                </h3>
                {identityInfo && (
                  <div>
                    <div className="text-sm font-bold text-foreground">{identityInfo.label}</div>
                    <div className="text-[10px] text-muted mt-1">{identityInfo.description}</div>
                  </div>
                )}
                {profile.self_concept_text && (
                  <div className="mt-3 p-2 rounded-lg bg-accent/5 border border-accent/10">
                    <p className="text-[10px] text-accent/80 italic">&quot;As a trader, I am {profile.self_concept_text}&quot;</p>
                  </div>
                )}
              </div>

              {/* Loss Aversion */}
              <div className="glass rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-muted mb-3 flex items-center gap-1.5">
                  <Flame size={14} className="text-accent" /> Loss Aversion
                </h3>
                <div className="text-3xl font-bold text-foreground">
                  {profile.loss_aversion_coefficient?.toFixed(1) ?? "—"}x
                </div>
                <div className="text-[10px] text-muted mt-1">
                  Losses feel {profile.loss_aversion_coefficient?.toFixed(1) ?? "—"}x more painful than equivalent gains
                </div>
                <div className="text-[9px] text-muted/50 mt-2">
                  Average: 2.0x | Your position attachment: {profile.position_attachment_score?.toFixed(1) ?? "—"}/5
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl border border-accent/20 p-8 text-center">
              <Sparkles className="mx-auto text-accent mb-3" size={32} />
              <h3 className="text-sm font-bold text-foreground mb-1">Complete Your Psychology Profile</h3>
              <p className="text-xs text-muted mb-4">A 5-minute assessment to unlock personalized AI coaching and deep pattern detection.</p>
              <button
                onClick={() => setShowWizard(true)}
                className="px-6 py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all"
              >
                Start Assessment
              </button>
            </div>
          )}

          {/* Money Script Radar */}
          {profile && moneyScriptData.length > 0 && (
            <div className="glass rounded-2xl border border-accent/20 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-xs font-semibold text-muted mb-3">Money Script Profile</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={moneyScriptData}>
                  <PolarGrid stroke={colors.grid} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: colors.tick, fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fill: colors.tick, fontSize: 9 }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke={colors.accent}
                    fill={colors.accent}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {moneyScriptData.map((d) => (
                  <div key={d.subject} className="flex items-center justify-between text-xs">
                    <span className="text-muted">{d.subject}</span>
                    <span className={`font-bold ${d.value > 3.5 ? "text-loss" : d.value > 2.5 ? "text-yellow-400" : "text-win"}`}>
                      {d.value.toFixed(1)}/5
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Style + Reassessment */}
          {profile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-muted mb-3">Decision Style</h3>
                <div className="text-lg font-bold text-foreground capitalize">{profile.decision_style ?? "Unknown"}</div>
                <div className="text-[10px] text-muted mt-1">
                  {profile.decision_style === "intuitive" && "You rely on gut feelings and pattern recognition"}
                  {profile.decision_style === "analytical" && "You prefer data-driven, rule-based decisions"}
                  {profile.decision_style === "hybrid" && "You balance intuition with systematic analysis"}
                </div>
              </div>

              <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-xs font-semibold text-muted mb-3">Profile Health</h3>
                {profile.reassess_after && (
                  <div>
                    <div className="text-xs text-foreground">
                      Reassessment: <span className="font-bold">{new Date(profile.reassess_after).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[10px] text-muted mt-1">
                      Quarterly reassessment tracks your psychological growth
                    </div>
                    {new Date(profile.reassess_after) <= new Date() && (
                      <button
                        onClick={() => setShowWizard(true)}
                        className="mt-3 px-4 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-medium hover:bg-accent/20 transition-all"
                      >
                        Retake Assessment
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tier upgrade prompts */}
      {tier === "simple" && (
        <div className="glass rounded-2xl border border-border/30 p-5 text-center">
          <p className="text-xs text-muted">
            Switch to <span className="text-accent font-semibold">Advanced</span> to track sleep, cognitive load, expanded biases, and 20+ trigger types.
          </p>
        </div>
      )}
      {tier === "advanced" && (
        <div className="glass rounded-2xl border border-accent/10 p-5 text-center">
          <p className="text-xs text-muted">
            Switch to <span className="text-accent font-semibold">Expert</span> for psychological profiling, cognitive distortion tracking, somatic body mapping, and AI-adapted coaching.
          </p>
        </div>
      )}
    </div>
  );
}
