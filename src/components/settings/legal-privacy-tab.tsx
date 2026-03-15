"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  AlertTriangle,
  Trash2,
  Loader2,
} from "lucide-react";
import { TermsContent } from "@/components/legal/terms-content";
import { PrivacyContent } from "@/components/legal/privacy-content";
import { createClient } from "@/lib/supabase/client";

/* ================================================================
   TYPES & HELPERS
   ================================================================ */

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  danger,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`glass rounded-2xl border p-6 space-y-5 ${
        danger ? "border-loss/30" : "border-border/50"
      }`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${danger ? "bg-loss/10" : "bg-accent/10"}`}>
          <Icon size={18} className={danger ? "text-loss" : "text-accent"} />
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

function Toggle({
  enabled,
  onToggle,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-all shrink-0 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${enabled ? "bg-accent" : "bg-border"}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

/* ================================================================
   LEGAL DOCUMENTS SECTION
   ================================================================ */

function LegalDocSection({
  title,
  lastUpdated,
  href,
  children,
}: {
  title: string;
  lastUpdated: string;
  href: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass rounded-2xl border border-border/50 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <FileText size={18} className="text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-[10px] text-muted">Last updated: {lastUpdated}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-all"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-5 pt-5 border-t border-border/30">
          {children}
        </div>
      )}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 text-xs text-accent hover:underline"
        >
          Read full document
        </button>
      )}
    </div>
  );
}

/* ================================================================
   DELETE ACCOUNT DIALOG
   ================================================================ */

function DeleteAccountDialog({
  userEmail,
  isOwner,
  onClose,
}: {
  userEmail: string;
  isOwner: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"confirm" | "email">("confirm");
  const [typedEmail, setTypedEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setDeleting(true);

    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: typedEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete account");
        setDeleting(false);
        return;
      }

      // Clear all stargate localStorage keys
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("stargate-")) keys.push(key);
      }
      keys.forEach((k) => localStorage.removeItem(k));

      // Redirect to login
      window.location.href = "/login?deleted=1";
    } catch {
      setError("Network error. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl border border-loss/30 p-6 max-w-md w-full mx-4 space-y-4" style={{ boxShadow: "0 0 40px rgba(239,68,68,0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-loss/10">
            <AlertTriangle size={20} className="text-loss" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Delete Account</h3>
        </div>

        {isOwner ? (
          <>
            <p className="text-sm text-muted">
              Owner accounts cannot be self-deleted. Contact support if you need to transfer or close the owner account.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-surface-hover border border-border text-sm font-medium text-foreground hover:bg-border transition-all"
            >
              Close
            </button>
          </>
        ) : step === "confirm" ? (
          <>
            <p className="text-sm text-muted leading-relaxed">
              This will <strong className="text-loss">permanently delete</strong> your account and all associated data:
            </p>
            <ul className="text-xs text-muted space-y-1.5 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-loss mt-0.5">-</span>
                All trade logs (crypto, stocks, commodities, forex)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-loss mt-0.5">-</span>
                Journal entries, notes, and behavioral logs
              </li>
              <li className="flex items-start gap-2">
                <span className="text-loss mt-0.5">-</span>
                Exchange API connections
              </li>
              <li className="flex items-start gap-2">
                <span className="text-loss mt-0.5">-</span>
                AI preferences and history
              </li>
              <li className="flex items-start gap-2">
                <span className="text-loss mt-0.5">-</span>
                Achievements, cosmetics, and XP
              </li>
              <li className="flex items-start gap-2">
                <span className="text-loss mt-0.5">-</span>
                Subscription and referral data
              </li>
            </ul>
            <p className="text-xs text-loss font-medium">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-surface-hover border border-border text-sm font-medium text-foreground hover:bg-border transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("email")}
                className="flex-1 py-3 rounded-xl bg-loss/10 border border-loss/30 text-sm font-medium text-loss hover:bg-loss/20 transition-all"
              >
                I understand, continue
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              Type your email address to confirm deletion:
            </p>
            <p className="text-xs text-foreground font-mono bg-background rounded-lg px-3 py-2 border border-border">
              {userEmail}
            </p>
            <input
              type="email"
              value={typedEmail}
              onChange={(e) => setTypedEmail(e.target.value)}
              placeholder="Type your email to confirm"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-loss/50 transition-all placeholder-muted/50"
              autoFocus
            />
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-loss/5 border border-loss/20">
                <AlertTriangle size={14} className="text-loss mt-0.5 shrink-0" />
                <p className="text-xs text-loss">{error}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setStep("confirm"); setTypedEmail(""); setError(""); }}
                className="flex-1 py-3 rounded-xl bg-surface-hover border border-border text-sm font-medium text-foreground hover:bg-border transition-all"
                disabled={deleting}
              >
                Back
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || typedEmail.toLowerCase() !== userEmail.toLowerCase()}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  typedEmail.toLowerCase() === userEmail.toLowerCase() && !deleting
                    ? "bg-loss text-white hover:bg-loss/90"
                    : "bg-loss/20 text-loss/50 cursor-not-allowed"
                }`}
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete My Account"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export function LegalPrivacyTab({
  userEmail,
  isOwner,
}: {
  userEmail: string;
  isOwner: boolean;
}) {
  const [aiConsent, setAiConsent] = useState(true);
  const [anonUsage, setAnonUsage] = useState(true);
  const [privacySaved, setPrivacySaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load saved privacy preferences from database (GDPR Art. 7 compliant)
  useEffect(() => {
    async function loadConsents() {
      try {
        const res = await fetch("/api/consent");
        if (res.ok) {
          const { consents } = await res.json();
          const ai = consents.find(
            (c: { consent_type: string; granted: boolean }) =>
              c.consent_type === "ai_data_processing"
          );
          if (ai) setAiConsent(ai.granted);
        }
      } catch {
        // Fall back to localStorage
        const savedAiConsent = localStorage.getItem("stargate-privacy-ai-consent");
        if (savedAiConsent === "false") setAiConsent(false);
      }
      const savedAnonUsage = localStorage.getItem("stargate-privacy-anon-usage");
      if (savedAnonUsage === "false") setAnonUsage(false);
    }
    loadConsents();
  }, []);

  async function savePrivacy() {
    // Save AI consent to database (GDPR-compliant: timestamped, versioned, server-side)
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent_type: "ai_data_processing",
          granted: aiConsent,
        }),
      });
    } catch {
      // Fallback to localStorage if API fails
    }
    localStorage.setItem("stargate-privacy-ai-consent", String(aiConsent));
    localStorage.setItem("stargate-privacy-anon-usage", String(anonUsage));
    setPrivacySaved(true);
    setTimeout(() => setPrivacySaved(false), 2000);
  }

  async function downloadAllData() {
    setDownloading(true);
    try {
      const supabase = createClient();
      const tables = [
        "trades",
        "stock_trades",
        "commodity_trades",
        "forex_trades",
        "journal_notes",
        "behavioral_logs",
        "daily_checkins",
        "daily_plans",
        "account_snapshots",
      ];

      const allData: Record<string, unknown> = {};

      for (const table of tables) {
        const { data } = await supabase.from(table).select("*");
        if (data?.length) {
          // Strip user_id from export for privacy
          allData[table] = data.map(({ user_id, ...rest }: Record<string, unknown>) => rest);
        }
      }

      // Include localStorage settings
      const settings: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("stargate-")) {
          try {
            settings[key] = JSON.parse(localStorage.getItem(key)!);
          } catch {
            settings[key] = localStorage.getItem(key);
          }
        }
      }
      allData._settings = settings;

      const blob = new Blob([JSON.stringify(allData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stargate-complete-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ============ LEGAL DOCUMENTS ============ */}
      <LegalDocSection title="Terms of Service" lastUpdated="March 12, 2026" href="/terms">
        <TermsContent />
      </LegalDocSection>

      <LegalDocSection title="Privacy Policy" lastUpdated="March 12, 2026" href="/privacy">
        <PrivacyContent />
      </LegalDocSection>

      {/* ============ PRIVACY CONTROLS ============ */}
      <SectionCard
        icon={Shield}
        title="Privacy Controls"
        description="Manage how your data is used."
      >
        <div className="space-y-5">
          {/* AI Data Processing */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">AI Data Processing</p>
              <p className="text-xs text-muted leading-relaxed">
                Allow your trade data to be sent to AI providers (Anthropic, OpenAI, Google)
                for AI Coach, Enhanced Insights, and Behavioral Analysis. Disabling this
                turns off all AI features.
              </p>
            </div>
            <Toggle enabled={aiConsent} onToggle={() => setAiConsent(!aiConsent)} />
          </div>

          {!aiConsent && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-muted leading-relaxed">
                AI features are disabled. The AI Coach, Enhanced Insights, and Behavioral Analysis will not function until you re-enable AI data processing.
              </p>
            </div>
          )}

          <div className="border-t border-border/30" />

          {/* Anonymized Usage */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Anonymized Usage Data</p>
              <p className="text-xs text-muted leading-relaxed">
                Allow anonymized, aggregated data to be used for product improvement.
                Your individual trades are never shared or sold.
              </p>
            </div>
            <Toggle enabled={anonUsage} onToggle={() => setAnonUsage(!anonUsage)} />
          </div>
        </div>

        <button
          onClick={savePrivacy}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
            privacySaved
              ? "bg-win text-background"
              : "bg-accent text-background hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)]"
          }`}
        >
          <Shield size={16} />
          {privacySaved ? "Saved!" : "Save Privacy Preferences"}
        </button>
      </SectionCard>

      {/* ============ YOUR DATA ============ */}
      <SectionCard
        icon={Download}
        title="Your Data"
        description="Download or manage your data."
      >
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background border border-border">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Download All My Data</p>
            <p className="text-xs text-muted leading-relaxed">
              Export a complete copy of all your data — trades, journal entries,
              settings, and more — as a single JSON file.
            </p>
          </div>
          <button
            onClick={downloadAllData}
            disabled={downloading}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-sm font-medium text-accent hover:bg-accent/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {downloading ? "Exporting..." : "Download"}
          </button>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/5 border border-accent/10">
          <Shield size={14} className="text-accent mt-0.5 shrink-0" />
          <p className="text-xs text-muted leading-relaxed">
            Exports contain all your trading data. Handle with care and store securely.
            You can also use the Export Data tab for format-specific exports (CSV, JSON).
          </p>
        </div>
      </SectionCard>

      {/* ============ DANGER ZONE ============ */}
      <SectionCard
        icon={Trash2}
        title="Danger Zone"
        description="Irreversible actions."
        danger
      >
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-loss/5 border border-loss/20">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Delete My Account</p>
            <p className="text-xs text-muted leading-relaxed">
              Permanently delete your account and all associated data.
              This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-loss/10 border border-loss/30 text-sm font-medium text-loss hover:bg-loss/20 transition-all"
          >
            Delete Account
          </button>
        </div>
      </SectionCard>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <DeleteAccountDialog
          userEmail={userEmail}
          isOwner={isOwner}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
}
