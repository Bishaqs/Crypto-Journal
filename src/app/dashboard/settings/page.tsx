"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Key,
  Shield,
  Save,
  User,
  Lock,
  Globe,
  CreditCard,
  Gift,
  Download,
  Copy,
  CheckCircle2,
  Star,
  Crown,
  FileText,
  Database,
  Mail,
  X,
  TrendingUp,
  Brain,
  Eye,
  EyeOff,
  AlertTriangle,
  Sparkles,
  Zap,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ScrollText,
} from "lucide-react";
import { useTheme, type ViewMode } from "@/lib/theme-context";
import { useLevel } from "@/lib/xp";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/lib/use-subscription";
import { useReferral } from "@/lib/use-referral";
import { RedeemCodeSection } from "@/components/settings/redeem-code-section";
import { LegalPrivacyTab } from "@/components/settings/legal-privacy-tab";
import { useI18n, LOCALES } from "@/lib/i18n";

/* ================================================================
   TYPES
   ================================================================ */

type GlobalSettings = {
  timezone: string;
  currency: string;
  dateRange: string;
  costBasis: string;
  maxDailyLoss: string;
  maxDrawdown: string;
  maxPositionSize: string;
};

const DEFAULT_GLOBAL: GlobalSettings = {
  timezone: "America/New_York",
  currency: "USD",
  dateRange: "30d",
  costBasis: "fifo",
  maxDailyLoss: "500",
  maxDrawdown: "10",
  maxPositionSize: "5",
};

type SettingsTab =
  | "account"
  | "global"
  | "ai"
  | "subscription"
  | "referrals"
  | "export"
  | "legal";

const TABS: { value: SettingsTab; label: string; icon: React.ElementType; ownerOnly?: boolean }[] = [
  { value: "account", label: "Account", icon: User },
  { value: "global", label: "Global Settings", icon: Globe },
  { value: "ai", label: "Nova", icon: Brain },
  { value: "subscription", label: "Subscription", icon: CreditCard },
  { value: "referrals", label: "Referrals", icon: Gift },
  { value: "export", label: "Export Data", icon: Download },
  { value: "legal", label: "Legal & Privacy", icon: Shield },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Australia/Sydney",
];

/* ================================================================
   SHARED COMPONENTS
   ================================================================ */

function PerformanceSection() {
  const { reducedMotion, setReducedMotion } = useTheme();
  return (
    <SectionCard icon={Zap} title="Performance" description="Control visual effects and animations.">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Reduce animations</p>
          <p className="text-xs text-muted leading-relaxed">
            Turns off background effects like the black hole, shooting stars, particles, and floating elements. Improves performance on older devices and reduces battery usage.
          </p>
        </div>
        <button
          onClick={() => setReducedMotion(!reducedMotion)}
          className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${
            reducedMotion ? "bg-accent" : "bg-border"
          }`}
          aria-label="Toggle reduced animations"
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
              reducedMotion ? "left-6" : "left-0.5"
            }`}
          />
        </button>
      </div>
    </SectionCard>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="glass rounded-2xl border border-border/50 p-6 space-y-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-accent/10">
          <Icon size={18} className="text-accent" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SystemPromptViewer() {
  const [expanded, setExpanded] = useState(false);
  const [promptText, setPromptText] = useState<string | null>(null);

  useEffect(() => {
    if (expanded && !promptText) {
      import("@/lib/ai-context").then((mod) => {
        setPromptText(mod.AI_CHAT_SYSTEM_PROMPT);
      });
    }
  }, [expanded, promptText]);

  return (
    <SectionCard icon={ScrollText} title="Nova's System Prompt" description="The full instructions that define Nova's personality, coaching style, and psychology knowledge.">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-all"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? "Hide prompt" : "View full system prompt"}
      </button>
      {expanded && (
        <div className="mt-3 max-h-[500px] overflow-y-auto rounded-xl bg-background border border-border p-4">
          {promptText ? (
            <pre className="text-xs text-muted leading-relaxed whitespace-pre-wrap font-mono">
              {promptText}
            </pre>
          ) : (
            <p className="text-xs text-muted animate-pulse">Loading...</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1.5 font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50 ${
          mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1.5 font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SaveButton({ saved, onClick, label = "Save" }: { saved: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
        saved ? "bg-win text-background" : "bg-accent text-background hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)]"
      }`}
    >
      <Save size={16} />
      {saved ? "Saved!" : label}
    </button>
  );
}

/* ================================================================
   MAIN SETTINGS PAGE
   ================================================================ */

const VALID_TABS = new Set<SettingsTab>(["account", "global", "ai", "subscription", "referrals", "export", "legal"]);

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = useMemo(() => {
    const param = searchParams.get("tab") as SettingsTab | null;
    return param && VALID_TABS.has(param) ? param : "account";
  }, [searchParams]);
  const { tier, isOwner, hasAccess, loading: subLoading } = useSubscription();
  const { code: referralCode, totalReferrals, converted: referralConverted, freeDaysEarned, loading: refLoading } = useReferral();
  const { viewMode, setViewModeTo } = useTheme();
  const { level } = useLevel();
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [displayName, setDisplayName] = useState("Trader");
  const [profileSaved, setProfileSaved] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Fetch user email on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { email?: string } | null } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  // Global settings state
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL);
  const [globalSaved, setGlobalSaved] = useState(false);

  // Referral state
  const [copied, setCopied] = useState(false);

  // Subscription state
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  // Language
  const { locale, setLocale } = useI18n();

  // AI provider state
  const [aiProvider, setAiProvider] = useState("google");
  const [aiModel, setAiModel] = useState("");
  const [aiProviders, setAiProviders] = useState<{ id: string; name: string; models: { id: string; label: string }[]; defaultModel: string }[]>([]);
  const [allAiProviders, setAllAiProviders] = useState<{ id: string; name: string; models: { id: string; label: string }[]; defaultModel: string }[]>([]);
  const [aiApiKey, setAiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiCustomInstructions, setAiCustomInstructions] = useState("");
  const [aiEnhancedInsights, setAiEnhancedInsights] = useState(false);
  const [aiBehavioralAnalysis, setAiBehavioralAnalysis] = useState(false);
  const [aiConsentDisabled, setAiConsentDisabled] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("stargate-display-name");
    if (name) setDisplayName(name);
    const global = localStorage.getItem("stargate-global-settings");
    if (global) setGlobalSettings(JSON.parse(global));

    // Load AI provider preference
    const savedProvider = localStorage.getItem("stargate-ai-provider");
    const savedModel = localStorage.getItem("stargate-ai-model");
    const savedApiKey = localStorage.getItem("stargate-ai-api-key");
    if (savedProvider) setAiProvider(savedProvider);
    if (savedModel) setAiModel(savedModel);
    if (savedApiKey) setAiApiKey(savedApiKey);
    const savedInstructions = localStorage.getItem("stargate-ai-custom-instructions");
    if (savedInstructions) setAiCustomInstructions(savedInstructions);
    const aiInsightsEnabled = localStorage.getItem("stargate-ai-enhanced-insights");
    if (aiInsightsEnabled === "true") setAiEnhancedInsights(true);
    const aiBehavioralEnabled = localStorage.getItem("stargate-ai-behavioral-analysis");
    if (aiBehavioralEnabled === "true") setAiBehavioralAnalysis(true);
    if (localStorage.getItem("stargate-privacy-ai-consent") === "false") setAiConsentDisabled(true);

    // Fetch available AI providers
    fetch("/api/ai/providers")
      .then((r) => r.json())
      .then((data) => {
        if (data.providers) setAiProviders(data.providers);
        if (data.allProviders) setAllAiProviders(data.allProviders);
      })
      .catch(() => {});
  }, []);

  function saveGlobal() {
    localStorage.setItem("stargate-global-settings", JSON.stringify(globalSettings));
    setGlobalSaved(true);
    setTimeout(() => setGlobalSaved(false), 2000);
  }

  const referralUrl = referralCode
    ? `https://traversejournal.com/login?ref=${referralCode}`
    : "";

  function copyReferralLink() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Settings</h2>
        <p className="text-sm text-muted mt-0.5">Manage your account and preferences.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.filter((t) => !t.ownerOnly || isOwner).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              tab === t.value
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ ACCOUNT TAB ============ */}
      {tab === "account" && (
        <div className="space-y-6">
          <SectionCard icon={User} title="Profile" description="Your account details.">
            <InputField label="Display Name" value={displayName} onChange={(v) => setDisplayName(v)} placeholder="Your name" />
            <InputField label="Email" value={userEmail} onChange={() => {}} placeholder="you@example.com" type="email" />
            <button
              onClick={() => {
                localStorage.setItem("stargate-display-name", displayName);
                setProfileSaved(true);
                setTimeout(() => setProfileSaved(false), 2000);
              }}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                profileSaved ? "bg-win text-background" : "bg-accent text-background hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)]"
              }`}
            >
              <Save size={16} />
              {profileSaved ? "Saved!" : "Save Profile"}
            </button>
          </SectionCard>
          <SectionCard icon={Lock} title="Password" description="Update your password.">
            <InputField label="Current Password" value="" onChange={() => {}} type="password" placeholder="Current password" />
            <InputField label="New Password" value="" onChange={() => {}} type="password" placeholder="New password" />
            <InputField label="Confirm Password" value="" onChange={() => {}} type="password" placeholder="Confirm new password" />
          </SectionCard>
        </div>
      )}

      {/* ============ GLOBAL SETTINGS TAB ============ */}
      {tab === "global" && (
        <div className="space-y-6">
          {/* Display Mode */}
          {(() => {
            const hasOverride = typeof window !== "undefined" && localStorage.getItem("stargate-mode-override") === "true";
            function canSelectMode(mode: ViewMode): boolean {
              if (hasOverride) return true;
              if (mode === "beginner") return true;
              if (mode === "advanced") return level >= 100;
              if (mode === "expert") return level >= 250;
              return false;
            }
            const modes: { mode: ViewMode; name: string; description: string; levelReq: string | null }[] = [
              {
                mode: "beginner",
                name: "Beginner",
                description: "Essential tools for new traders. Dashboard, Journal, Analytics, Intelligence, and Compete.",
                levelReq: null,
              },
              {
                mode: "advanced",
                name: "Advanced",
                description: "More analytics and market tools. Requires Level 100.",
                levelReq: "Level 100",
              },
              {
                mode: "expert",
                name: "Expert",
                description: "Everything unlocked. Full analytics suite. Requires Level 250.",
                levelReq: "Level 250",
              },
            ];
            return (
              <SectionCard icon={Eye} title="Display Mode" description="Controls which features are visible.">
                <div className="space-y-2">
                  {modes.map(({ mode, name, description, levelReq }) => {
                    const unlocked = canSelectMode(mode);
                    const isActive = viewMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => unlocked && setViewModeTo(mode)}
                        disabled={!unlocked}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          isActive
                            ? "bg-accent/10 border-accent/30"
                            : unlocked
                              ? "bg-background border-border hover:border-accent/20 hover:bg-surface-hover"
                              : "opacity-50 cursor-not-allowed bg-background border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{name}</span>
                              {levelReq && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  unlocked ? "bg-win/10 text-win" : "bg-muted/10 text-muted"
                                }`}>
                                  {levelReq}
                                </span>
                              )}
                              {!levelReq && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent">
                                  No level required
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted mt-1 leading-relaxed">{description}</p>
                          </div>
                          <div className="shrink-0">
                            {!unlocked ? (
                              <Lock size={16} className="text-muted" />
                            ) : isActive ? (
                              <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-background" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-border" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            );
          })()}

          <SectionCard icon={Globe} title="General" description="App-wide preferences.">
            <SelectField
              label="Timezone"
              value={globalSettings.timezone}
              onChange={(v) => setGlobalSettings({ ...globalSettings, timezone: v })}
              options={TIMEZONES.map((tz) => ({ value: tz, label: tz.replace(/_/g, " ") }))}
            />
            <SelectField
              label="Display Currency"
              value={globalSettings.currency}
              onChange={(v) => setGlobalSettings({ ...globalSettings, currency: v })}
              options={[
                { value: "USD", label: "USD ($)" },
                { value: "EUR", label: "EUR (€)" },
                { value: "GBP", label: "GBP (£)" },
                { value: "BTC", label: "BTC (₿)" },
              ]}
            />
            <SelectField
              label="Default Date Range"
              value={globalSettings.dateRange}
              onChange={(v) => setGlobalSettings({ ...globalSettings, dateRange: v })}
              options={[
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "90d", label: "Last 90 days" },
                { value: "1y", label: "Last year" },
                { value: "all", label: "All time" },
              ]}
            />
            <SelectField
              label="Language"
              value={locale}
              onChange={(v) => setLocale(v as typeof locale)}
              options={LOCALES.map((l) => ({ value: l.code, label: `${l.flag} ${l.label}` }))}
            />
          </SectionCard>

          <SectionCard icon={FileText} title="Tax & Accounting" description="Set your cost basis calculation method.">
            <SelectField
              label="Cost Basis Method"
              value={globalSettings.costBasis}
              onChange={(v) => setGlobalSettings({ ...globalSettings, costBasis: v })}
              options={[
                { value: "fifo", label: "FIFO — First In, First Out (IRS default)" },
                { value: "lifo", label: "LIFO — Last In, First Out" },
                { value: "hifo", label: "HIFO — Highest In, First Out" },
              ]}
            />
            <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/5 border border-accent/10">
              <Shield size={14} className="text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-muted leading-relaxed">
                LIFO and HIFO require a documented &ldquo;standing instruction&rdquo; before each tax year. FIFO is the safest default. Consult a CPA.
              </p>
            </div>
          </SectionCard>

          <SectionCard icon={Shield} title="Risk Management" description="Set trading limits and guardrails.">
            <InputField
              label="Max Daily Loss ($)"
              value={globalSettings.maxDailyLoss}
              onChange={(v) => setGlobalSettings({ ...globalSettings, maxDailyLoss: v })}
              placeholder="500"
              type="number"
            />
            <InputField
              label="Max Drawdown (%)"
              value={globalSettings.maxDrawdown}
              onChange={(v) => setGlobalSettings({ ...globalSettings, maxDrawdown: v })}
              placeholder="10"
              type="number"
            />
            <InputField
              label="Max Position Size (% of account)"
              value={globalSettings.maxPositionSize}
              onChange={(v) => setGlobalSettings({ ...globalSettings, maxPositionSize: v })}
              placeholder="5"
              type="number"
            />
          </SectionCard>

          <PerformanceSection />

          <SaveButton saved={globalSaved} onClick={saveGlobal} label="Save Global Settings" />
        </div>
      )}

      {/* ============ AI COACH TAB ============ */}
      {tab === "ai" && (
        <div className="space-y-6">
          {aiConsentDisabled && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <p className="text-xs text-muted flex-1">
                AI data processing is disabled in your Privacy settings. AI features will not function until re-enabled.
              </p>
              <button
                onClick={() => setTab("legal")}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-[11px] font-medium hover:bg-accent/20 transition-all"
              >
                Go to Legal &amp; Privacy
              </button>
            </div>
          )}
          <SectionCard icon={Brain} title="Nova" description="Choose your AI provider and model for Nova.">
            <SelectField
              label="AI Provider"
              value={aiProvider}
              onChange={(v) => {
                setAiProvider(v);
                localStorage.setItem("stargate-ai-provider", v);
                const prov = allAiProviders.find((p) => p.id === v);
                const defaultModel = prov?.defaultModel ?? "";
                setAiModel(defaultModel);
                localStorage.setItem("stargate-ai-model", defaultModel);
              }}
              options={allAiProviders.map((p) => {
                const available = aiProviders.some((ap) => ap.id === p.id);
                return { value: p.id, label: `${p.name}${available ? " (built-in)" : ""}` };
              })}
            />
            <SelectField
              label="Model"
              value={aiModel || (allAiProviders.find((p) => p.id === aiProvider)?.defaultModel ?? "")}
              onChange={(v) => {
                setAiModel(v);
                localStorage.setItem("stargate-ai-model", v);
              }}
              options={(allAiProviders.find((p) => p.id === aiProvider)?.models ?? []).map((m) => ({
                value: m.id,
                label: m.label,
              }))}
            />
            {aiProviders.some((p) => p.id === aiProvider) && !aiApiKey && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-win/5 border border-win/10">
                <CheckCircle2 size={14} className="text-win mt-0.5 shrink-0" />
                <p className="text-xs text-muted leading-relaxed">
                  Built-in AI is active — no API key needed.
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard icon={Key} title="Your API Key" description="Bring your own API key to use a different provider or unlock higher-quality models.">
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={aiApiKey}
                onChange={(e) => {
                  const v = e.target.value;
                  setAiApiKey(v);
                  if (v) {
                    localStorage.setItem("stargate-ai-api-key", v);
                  } else {
                    localStorage.removeItem("stargate-ai-api-key");
                  }
                }}
                placeholder={aiProvider === "anthropic" ? "sk-ant-..." : aiProvider === "openai" ? "sk-..." : "AIza..."}
                className="w-full px-4 py-3 pr-10 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {aiApiKey ? (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/5 border border-accent/10">
                <CheckCircle2 size={14} className="text-accent mt-0.5 shrink-0" />
                <p className="text-xs text-muted leading-relaxed">
                  Using your personal API key for <strong className="text-foreground">{allAiProviders.find((p) => p.id === aiProvider)?.name ?? aiProvider}</strong>. Your key is stored locally in your browser only — it is never saved on our servers.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted leading-relaxed">
                  Paste your API key above to use your own account. Keys are stored in your browser only.
                </p>
                <div className="text-[11px] text-muted/60 space-y-1">
                  <p><strong className="text-muted">Claude (Anthropic)</strong> — get a key at console.anthropic.com</p>
                  <p><strong className="text-muted">ChatGPT (OpenAI)</strong> — get a key at platform.openai.com</p>
                  <p><strong className="text-muted">Gemini (Google)</strong> — get a key at aistudio.google.com (free)</p>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Custom Coaching Instructions */}
          <SectionCard icon={MessageSquare} title="Custom Coach Instructions" description="Tell Nova how you want to be coached. These instructions are added to every conversation.">
            <textarea
              value={aiCustomInstructions}
              onChange={(e) => {
                const v = e.target.value.slice(0, 1000);
                setAiCustomInstructions(v);
                if (v) {
                  localStorage.setItem("stargate-ai-custom-instructions", v);
                } else {
                  localStorage.removeItem("stargate-ai-custom-instructions");
                }
              }}
              placeholder={"Examples:\n• Focus on my risk management and position sizing\n• Be very direct and critical — don't sugarcoat\n• I'm a beginner, explain concepts simply\n• Always compare my trades to my playbook rules\n• Focus on my crypto swing trades, ignore scalps"}
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/40 resize-none"
            />
            <p className="text-[11px] text-muted mt-1">
              {aiCustomInstructions.length}/1000 characters — stored locally in your browser
            </p>
          </SectionCard>

          {/* View System Prompt */}
          <SystemPromptViewer />

          {/* AI-Enhanced Dashboard Insights */}
          <SectionCard icon={Sparkles} title="AI-Enhanced Dashboard Insights" description="Get richer, AI-generated insights on your dashboard.">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground font-medium">Enable AI-Enhanced Insights</p>
                <p className="text-[11px] text-muted mt-0.5">
                  Appends AI-generated insights below your dashboard widgets
                </p>
              </div>
              <button
                onClick={() => {
                  const next = !aiEnhancedInsights;
                  setAiEnhancedInsights(next);
                  if (next) {
                    localStorage.setItem("stargate-ai-enhanced-insights", "true");
                  } else {
                    localStorage.removeItem("stargate-ai-enhanced-insights");
                  }
                }}
                className={`relative w-11 h-6 rounded-full transition-all shrink-0 cursor-pointer ${
                  aiEnhancedInsights ? "bg-accent" : "bg-border"
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  aiEnhancedInsights ? "left-6" : "left-1"
                }`} />
              </button>
            </div>

            {aiEnhancedInsights && (
              <div className={`mt-3 p-3 rounded-xl ${aiApiKey ? "bg-amber-500/5 border border-amber-500/20" : "bg-accent/5 border border-accent/20"}`}>
                <div className="flex items-start gap-2">
                  {aiApiKey ? (
                    <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  ) : (
                    <Sparkles size={14} className="text-accent mt-0.5 shrink-0" />
                  )}
                  <div className="text-[11px] text-muted leading-relaxed space-y-1">
                    {aiApiKey ? (
                      <>
                        <p className="font-semibold text-amber-400">Cost Notice</p>
                        <p>AI-Enhanced Insights uses your personal API key on each dashboard visit.</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-1">
                          <li>~500–1,000 tokens per request (input + output)</li>
                          <li>Estimated: $0.01–0.05/day with typical usage</li>
                          <li>Counts toward your daily AI request limit</li>
                          <li>Disable anytime — local insights always available</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-accent">Included with Max Plan</p>
                        <p>AI-Enhanced Insights are included with your plan — no API key needed.</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-1">
                          <li>Runs on each dashboard visit</li>
                          <li>Uses built-in AI — no additional cost to you</li>
                          <li>Disable anytime — local insights always available</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* AI Behavioral Analysis — Max tier only */}
          <SectionCard icon={Brain} title="AI Behavioral Analysis" description="AI-powered analysis of your emotion check-ins, triggers, and trading patterns.">
            {hasAccess("ai-behavioral-analysis") ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground font-medium">Enable AI Behavioral Analysis</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Nova analyzes your check-in patterns and correlates them with trade outcomes
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !aiBehavioralAnalysis;
                      setAiBehavioralAnalysis(next);
                      if (next) {
                        localStorage.setItem("stargate-ai-behavioral-analysis", "true");
                      } else {
                        localStorage.removeItem("stargate-ai-behavioral-analysis");
                      }
                    }}
                    className={`relative w-11 h-6 rounded-full transition-all shrink-0 cursor-pointer ${
                      aiBehavioralAnalysis ? "bg-accent" : "bg-border"
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      aiBehavioralAnalysis ? "left-6" : "left-1"
                    }`} />
                  </button>
                </div>

                {aiBehavioralAnalysis && (
                  <div className={`mt-3 p-3 rounded-xl ${aiApiKey ? "bg-amber-500/5 border border-amber-500/20" : "bg-accent/5 border border-accent/20"}`}>
                    <div className="flex items-start gap-2">
                      {aiApiKey ? (
                        <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                      ) : (
                        <Sparkles size={14} className="text-accent mt-0.5 shrink-0" />
                      )}
                      <div className="text-[11px] text-muted leading-relaxed space-y-1">
                        {aiApiKey ? (
                          <>
                            <p className="font-semibold text-amber-400">Cost Notice</p>
                            <p>AI Behavioral Analysis uses your API key when you click &quot;Generate Analysis&quot; on the Insights page.</p>
                            <ul className="list-disc list-inside space-y-0.5 ml-1">
                              <li>~600 tokens per analysis (input + output)</li>
                              <li>Only runs when you explicitly request it — not automatic</li>
                              <li>Results cached for 5 minutes</li>
                            </ul>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-accent">Included with Max Plan</p>
                            <p>AI Behavioral Analysis is included with your plan — no API key needed.</p>
                            <ul className="list-disc list-inside space-y-0.5 ml-1">
                              <li>Only runs when you explicitly request it — not automatic</li>
                              <li>Results cached for 5 minutes</li>
                              <li>Uses built-in AI — no additional cost to you</li>
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Lock size={18} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">Max Plan Required</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    AI Behavioral Analysis is available on the Max plan. Upgrade to unlock AI-powered insights into your trading psychology.
                  </p>
                </div>
                <button
                  onClick={() => setTab("subscription")}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-[11px] font-medium hover:bg-accent/20 transition-all"
                >
                  Upgrade
                </button>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ============ SUBSCRIPTION TAB ============ */}
      {tab === "subscription" && (
        <div className="space-y-6">
          {tier === "max" ? (
            /* Max plan banner — no upgrade options needed */
            <div className="glass rounded-2xl border border-accent/30 p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                  <Crown size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">You have the Max plan</h3>
                  <p className="text-xs text-muted">{isOwner ? "Owner account — lifetime access" : "Full access to every feature"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Unlimited trades", "Nova AI Coach", "Monte Carlo sims", "Crypto tax reports", "Stock trading included", "Custom dashboards", "Priority support", "All themes"].map((f) => (
                  <span key={f} className="text-[11px] font-medium bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* 14-day trial banner — only for free users */}
              {tier === "free" && (
                <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-accent/10 border border-accent/20">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Start your 14-day Pro trial</p>
                    <p className="text-xs text-muted mt-0.5">Full access to all Pro features. No credit card required.</p>
                  </div>
                  <button
                    onClick={() => alert("Coming soon! Trial system will be available with Stripe integration.")}
                    className="px-4 py-2 rounded-xl bg-accent text-background text-xs font-semibold hover:bg-accent-hover transition-all"
                  >
                    Start Free Trial
                  </button>
                </div>
              )}

              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-1">
                <div className="inline-flex items-center rounded-xl glass border border-border/50 p-1">
                  <button
                    onClick={() => setBilling("monthly")}
                    className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      billing === "monthly" ? "bg-accent/15 text-accent border border-accent/30" : "text-muted hover:text-foreground border border-transparent"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBilling("yearly")}
                    className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                      billing === "yearly" ? "bg-accent/15 text-accent border border-accent/30" : "text-muted hover:text-foreground border border-transparent"
                    }`}
                  >
                    Yearly
                    <span className="text-[9px] bg-win/15 text-win px-1.5 py-0.5 rounded-full font-bold">Save</span>
                  </button>
                </div>
              </div>

              {/* Plan cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    name: "Free",
                    price: "$0",
                    period: "forever",
                    badge: null,
                    highlight: false,
                    features: ["2 trade logs/week", "Basic analytics", "Calendar heatmap", "Solara + Obsidian themes", "CSV import"],
                    current: tier === "free",
                  },
                  {
                    name: "Pro",
                    price: billing === "monthly" ? "$19" : "$149",
                    period: billing === "monthly" ? "/month" : "/year",
                    badge: "Most Popular",
                    highlight: true,
                    features: ["Unlimited trades", "50+ metrics", "Psychology engine", "Weekly reports", "4 animated themes", "Playbook & risk calc", "DEX trade logging"],
                    current: tier === "pro",
                  },
                  {
                    name: "Max",
                    price: billing === "monthly" ? "$39" : "$279",
                    period: billing === "monthly" ? "/month" : "/year",
                    badge: "Power User",
                    highlight: false,
                    features: ["Everything in Pro", "Nova AI Coach", "Monte Carlo sims", "Crypto tax reports", "Stock trading included", "Custom dashboards", "Priority support"],
                    current: false,
                  },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className={`rounded-2xl border p-5 flex flex-col ${
                      plan.highlight ? "border-accent/40 glass" : plan.current ? "border-win/30 glass" : "glass border-border/50"
                    }`}
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    {plan.badge && (
                      <span className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${plan.highlight ? "text-accent" : "text-muted"}`}>
                        {plan.highlight ? <Star size={10} /> : <Crown size={10} />}
                        {plan.badge}
                      </span>
                    )}
                    {plan.current && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-win flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        Current Plan
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-foreground mt-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-xs text-muted">{plan.period}</span>
                    </div>
                    <ul className="mt-4 space-y-2 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 size={12} className={`shrink-0 mt-0.5 ${plan.highlight ? "text-accent" : "text-win/70"}`} />
                          <span className="text-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    {!plan.current && (
                      <button
                        onClick={() => alert("Coming soon! Stripe integration pending.")}
                        className={`mt-4 w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                          plan.highlight
                            ? "bg-accent text-background hover:bg-accent-hover"
                            : "bg-surface-hover text-foreground hover:bg-border"
                        }`}
                      >
                        Upgrade to {plan.name}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Stock Add-Ons */}
              <div className="glass rounded-2xl border border-border/50 p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp size={14} className="text-accent" />
                    Stock Trading Plans
                  </h3>
                  <p className="text-[10px] text-muted mt-0.5">Expand your journal to track equities and options</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Stock Add-On */}
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">For Crypto Traders</span>
                    <h4 className="text-base font-bold text-foreground">Stock Add-On</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">$29</span>
                      <span className="text-xs text-muted">/year</span>
                    </div>
                    <ul className="space-y-1.5">
                      {["Stock dashboard & analytics", "Position tracking", "Sector breakdown", "Session performance", "Integrated with your crypto data"].map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 size={12} className="text-accent shrink-0 mt-0.5" />
                          <span className="text-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => alert("Coming soon! Stripe integration pending.")}
                      className="w-full py-2.5 rounded-xl font-semibold text-sm bg-accent text-background hover:bg-accent-hover transition-all"
                    >
                      Add Stocks — $29/yr
                    </button>
                  </div>

                  {/* Stock-Only Plan */}
                  <div className="rounded-xl border border-border/50 bg-surface-hover/30 p-4 space-y-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Stocks Only</span>
                    <h4 className="text-base font-bold text-foreground">Stock Journal</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">$49</span>
                      <span className="text-xs text-muted">/year</span>
                    </div>
                    <ul className="space-y-1.5">
                      {["Stock dashboard & analytics", "Position tracking & trade log", "Journal, calendar & weekly reports", "Sector & session analysis", "No crypto features included"].map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 size={12} className="text-win/70 shrink-0 mt-0.5" />
                          <span className="text-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => alert("Coming soon! Stripe integration pending.")}
                      className="w-full py-2.5 rounded-xl font-semibold text-sm bg-surface-hover text-foreground hover:bg-border transition-all"
                    >
                      Get Stock Journal — $49/yr
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-muted text-center">Max plan users get stock trading included at no extra cost.</p>
              </div>
            </>
          )}

          {/* Redeem invite code */}
          <RedeemCodeSection />
        </div>
      )}

      {/* ============ REFERRALS TAB ============ */}
      {tab === "referrals" && (
        <div className="space-y-6">
          {/* How it works */}
          <div className="glass rounded-2xl border border-accent/20 p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-sm font-bold text-foreground">How It Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "1", title: "Share your link", desc: "Send your unique referral link to friends and fellow traders." },
                { step: "2", title: "Friend signs up", desc: "They create an account and upgrade to Pro within 90 days." },
                { step: "3", title: "You both win", desc: "You earn free Pro days. They get 20% off their first 3 months." },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-accent">{s.step}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{s.title}</p>
                    <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral link */}
          <SectionCard icon={Gift} title="Your Referral Link" description="Share with friends and earn free Pro days.">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={refLoading ? "Loading..." : referralUrl}
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none"
              />
              <button
                onClick={copyReferralLink}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  copied ? "bg-win text-background" : "bg-accent text-background hover:bg-accent-hover"
                }`}
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!referralUrl) return;
                  window.open(`https://twitter.com/intent/tweet?text=Check+out+Traverse+crypto+trading+journal!&url=${encodeURIComponent(referralUrl)}`, "_blank");
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-hover border border-border text-sm text-foreground hover:border-accent/30 transition-all"
              >
                <X size={14} />
                Share on X
              </button>
              <button
                onClick={copyReferralLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-hover border border-border text-sm text-foreground hover:border-accent/30 transition-all"
              >
                <Mail size={14} />
                Email
              </button>
            </div>
          </SectionCard>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Referrals", value: String(totalReferrals), color: "text-foreground" },
              { label: "Converted", value: String(referralConverted), color: "text-win" },
              { label: "Free Days Earned", value: String(freeDaysEarned), color: "text-accent" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl border border-border/50 p-5 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-2xl font-bold mb-1" style={{ color: `var(--${stat.color === "text-foreground" ? "foreground" : stat.color === "text-win" ? "win" : "accent"})` }}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* What your friend gets */}
          <div className="rounded-2xl border border-win/20 bg-win/5 p-5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-win/10 flex items-center justify-center shrink-0">
              <Gift size={16} className="text-win" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">What your friend gets</p>
              <p className="text-xs text-muted mt-0.5">Every friend who signs up through your link gets <span className="text-win font-semibold">20% off their first 3 months</span> of Pro. They save money, you earn free days.</p>
            </div>
          </div>

          {/* Reward tiers */}
          <SectionCard icon={Star} title="Your Reward Tiers" description="The more you share, the more you earn.">
            <div className="space-y-2">
              {[
                { referrals: "1", reward: "14 days Pro free", highlight: true },
                { referrals: "3", reward: "1 month Pro free", highlight: false },
                { referrals: "5", reward: "2 months Pro free", highlight: false },
                { referrals: "10", reward: "6 months Pro free", highlight: false },
                { referrals: "25", reward: "1 year Pro free", highlight: false },
                { referrals: "50", reward: "Lifetime Pro access", highlight: false },
              ].map((tier) => (
                <div key={tier.referrals} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${tier.highlight ? "bg-accent/5 border-accent/20" : "bg-background border-border"}`}>
                  <span className="text-sm text-foreground font-medium">{tier.referrals} referral{tier.referrals !== "1" ? "s" : ""}</span>
                  <span className={`text-xs font-semibold ${tier.highlight ? "text-accent" : "text-accent/70"}`}>{tier.reward}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted mt-3">Referrals count when your friend signs up and upgrades within 90 days.</p>
          </SectionCard>
        </div>
      )}

      {/* ============ EXPORT TAB ============ */}
      {tab === "export" && (
        <div className="space-y-4">
          {[
            {
              icon: Database,
              title: "Trades CSV",
              desc: "All your trades with full metadata — entries, exits, P&L, emotions, tags.",
              action: () => {
                const trades = JSON.parse(localStorage.getItem("stargate-trades") || "[]");
                const csv = "Symbol,Position,Entry Price,Exit Price,Quantity,P&L,Emotion,Date\n" +
                  trades.map((t: Record<string, unknown>) => `${t.symbol},${t.position},${t.entry_price},${t.exit_price},${t.quantity},${t.pnl},${t.emotion},${t.open_timestamp}`).join("\n");
                downloadFile("stargate-trades.csv", csv, "text/csv");
              },
            },
            {
              icon: FileText,
              title: "Journal Entries (JSON)",
              desc: "All journal notes, behavioral logs, and daily reflections.",
              action: () => {
                const notes = JSON.parse(localStorage.getItem("stargate-notes") || "[]");
                downloadFile("traverse-journal.json", JSON.stringify(notes, null, 2), "application/json");
              },
            },
            {
              icon: CreditCard,
              title: "Tax Report (Form 8949 CSV)",
              desc: "IRS-compliant format: property, dates, proceeds, cost basis, gain/loss, term code.",
              action: () => {
                downloadFile(
                  "stargate-form8949.csv",
                  "Description of Property,Date Acquired,Date Sold,Proceeds,Cost Basis,Gain or Loss,Code\nSample data — connect trades for real export",
                  "text/csv"
                );
              },
            },
            {
              icon: Download,
              title: "Full Backup (JSON)",
              desc: "Everything — trades, notes, settings, accounts. Use to restore or migrate.",
              action: () => {
                const backup: Record<string, unknown> = {};
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key?.startsWith("stargate-")) {
                    try { backup[key] = JSON.parse(localStorage.getItem(key)!); }
                    catch { backup[key] = localStorage.getItem(key); }
                  }
                }
                downloadFile("stargate-backup.json", JSON.stringify(backup, null, 2), "application/json");
              },
            },
          ].map((item) => (
            <div key={item.title} className="glass rounded-2xl border border-border/50 p-5 flex items-center gap-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="p-3 rounded-xl bg-accent/10 shrink-0">
                <item.icon size={20} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={item.action}
                className="px-4 py-2.5 rounded-xl bg-surface-hover border border-border text-sm font-medium text-foreground hover:border-accent/30 hover:bg-accent/5 transition-all shrink-0"
              >
                <Download size={14} />
              </button>
            </div>
          ))}

          <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/5 border border-accent/10 mt-4">
            <Shield size={14} className="text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-muted leading-relaxed">
              Your data is stored locally on your device. Exports contain all your trading data — handle with care and store securely.
            </p>
          </div>
        </div>
      )}

      {/* ============ LEGAL & PRIVACY TAB ============ */}
      {tab === "legal" && (
        <LegalPrivacyTab userEmail={userEmail} isOwner={isOwner} />
      )}
    </div>
  );
}
