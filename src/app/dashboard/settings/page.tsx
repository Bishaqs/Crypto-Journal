"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Key,
  RefreshCw,
  Clock,
  Shield,
  Save,
  User,
  Lock,
  Link2,
  Globe,
  Wallet,
  CreditCard,
  Gift,
  Download,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Star,
  Crown,
  FileText,
  Database,
  Mail,
  X,
  Info,
  TrendingUp,
} from "lucide-react";
import type { Chain, Wallet as WalletType } from "@/lib/types";
import { CHAINS } from "@/lib/types";
import { useSubscription } from "@/lib/use-subscription";
import { useReferral } from "@/lib/use-referral";
import { RedeemCodeSection } from "@/components/settings/redeem-code-section";

/* ================================================================
   TYPES
   ================================================================ */

type ExchangeConfig = {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  autoImport: boolean;
  importTime: string;
};

type TradingAccount = {
  id: string;
  name: string;
  exchange: string;
  balance: number;
  currency: string;
  active: boolean;
};

type GlobalSettings = {
  timezone: string;
  currency: string;
  dateRange: string;
  costBasis: string;
  maxDailyLoss: string;
  maxDrawdown: string;
  maxPositionSize: string;
};

const DEFAULT_CONFIG: ExchangeConfig = {
  exchange: "binance",
  apiKey: "",
  apiSecret: "",
  autoImport: false,
  importTime: "01:00",
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
  | "connections"
  | "trading-accounts"
  | "global"
  | "subscription"
  | "referrals"
  | "export";

const TABS: { value: SettingsTab; label: string; icon: React.ElementType; ownerOnly?: boolean }[] = [
  { value: "account", label: "Account", icon: User },
  { value: "connections", label: "Connected Accounts", icon: Link2 },
  { value: "trading-accounts", label: "Trading Accounts", icon: Wallet },
  { value: "global", label: "Global Settings", icon: Globe },
  { value: "subscription", label: "Subscription", icon: CreditCard },
  { value: "referrals", label: "Referrals", icon: Gift },
  { value: "export", label: "Export Data", icon: Download },
];

const EXCHANGES = ["Binance", "Bybit", "OKX", "Bitget", "Coinbase", "Kraken", "KuCoin", "Gate.io"];

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

const VALID_TABS = new Set<SettingsTab>(["account", "connections", "trading-accounts", "global", "subscription", "referrals", "export"]);

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
  const { tier, isOwner, loading: subLoading } = useSubscription();
  const { code: referralCode, totalReferrals, converted: referralConverted, freeDaysEarned, loading: refLoading } = useReferral();
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [config, setConfig] = useState<ExchangeConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [displayName, setDisplayName] = useState("Trader");
  const [profileSaved, setProfileSaved] = useState(false);

  // Trading accounts state
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: "", exchange: "Binance", balance: "", currency: "USD" });

  // Global settings state
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL);
  const [globalSaved, setGlobalSaved] = useState(false);

  // Referral state
  const [copied, setCopied] = useState(false);

  // Subscription state
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  // Wallet state
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [newWallet, setNewWallet] = useState({ address: "", chain: "ethereum" as Chain, label: "" });

  useEffect(() => {
    const stored = localStorage.getItem("stargate-exchange-config");
    if (stored) setConfig(JSON.parse(stored));
    const name = localStorage.getItem("stargate-display-name");
    if (name) setDisplayName(name);
    const accts = localStorage.getItem("stargate-trading-accounts");
    if (accts) setAccounts(JSON.parse(accts));
    const global = localStorage.getItem("stargate-global-settings");
    if (global) setGlobalSettings(JSON.parse(global));
    const storedWallets = localStorage.getItem("stargate-wallets");
    if (storedWallets) setWallets(JSON.parse(storedWallets));
  }, []);

  function saveConfig() {
    localStorage.setItem("stargate-exchange-config", JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function saveAccounts(updated: TradingAccount[]) {
    setAccounts(updated);
    localStorage.setItem("stargate-trading-accounts", JSON.stringify(updated));
  }

  function addAccount() {
    if (!newAccount.name.trim()) return;
    const acct: TradingAccount = {
      id: Date.now().toString(),
      name: newAccount.name,
      exchange: newAccount.exchange,
      balance: parseFloat(newAccount.balance) || 0,
      currency: newAccount.currency,
      active: true,
    };
    saveAccounts([...accounts, acct]);
    setNewAccount({ name: "", exchange: "Binance", balance: "", currency: "USD" });
    setShowAddAccount(false);
  }

  function saveGlobal() {
    localStorage.setItem("stargate-global-settings", JSON.stringify(globalSettings));
    setGlobalSaved(true);
    setTimeout(() => setGlobalSaved(false), 2000);
  }

  const referralUrl = referralCode
    ? `https://stargate-journal.vercel.app/login?ref=${referralCode}`
    : "";

  function copyReferralLink() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function saveWallets(updated: WalletType[]) {
    setWallets(updated);
    localStorage.setItem("stargate-wallets", JSON.stringify(updated));
  }

  function addWallet() {
    if (!newWallet.address.trim()) return;
    const w: WalletType = {
      id: Date.now().toString(),
      address: newWallet.address.trim(),
      chain: newWallet.chain,
      label: newWallet.label.trim() || "Untitled Wallet",
    };
    saveWallets([...wallets, w]);
    setNewWallet({ address: "", chain: "ethereum", label: "" });
  }

  function removeWallet(id: string) {
    saveWallets(wallets.filter((w) => w.id !== id));
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
            <InputField label="Email" value="" onChange={() => {}} placeholder="you@example.com" type="email" />
            <button
              onClick={() => {
                localStorage.setItem("stargate-display-name", displayName);
                setProfileSaved(true);
                setTimeout(() => setProfileSaved(false), 2000);
              }}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                profileSaved ? "bg-win text-background" : "bg-accent text-white hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(0,180,216,0.3)]"
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

      {/* ============ CONNECTED ACCOUNTS TAB ============ */}
      {tab === "connections" && (
        <div className="space-y-6">
          {config.apiKey && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              config.apiKey.length > 10
                ? "bg-win/5 border-win/20"
                : "bg-amber-500/5 border-amber-500/20"
            }`}>
              <div className={`w-2 h-2 rounded-full ${config.apiKey.length > 10 ? "bg-win animate-pulse" : "bg-amber-500"}`} />
              <span className={`text-xs font-medium ${config.apiKey.length > 10 ? "text-win" : "text-amber-500"}`}>
                {config.exchange.charAt(0).toUpperCase() + config.exchange.slice(1)} — {config.apiKey.length > 10 ? "Connected" : "Key looks incomplete"}
              </span>
              <span className="text-[10px] text-muted/60 ml-auto">
                Key: ...{config.apiKey.slice(-6)}
              </span>
            </div>
          )}

          <SectionCard icon={Key} title="Exchange API Keys" description="Connect your exchange to auto-import trades.">
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">Exchange</label>
              <select
                value={config.exchange}
                onChange={(e) => setConfig({ ...config, exchange: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
              >
                {EXCHANGES.map((ex) => (
                  <option key={ex} value={ex.toLowerCase()}>{ex}</option>
                ))}
              </select>
            </div>
            <InputField label="API Key" value={config.apiKey} onChange={(v) => setConfig({ ...config, apiKey: v })} placeholder="Enter your API key" mono />
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">API Secret</label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={config.apiSecret}
                  onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
                  placeholder="Enter your API secret"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground transition-colors"
                >
                  {showSecret ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/5 border border-accent/10">
              <Shield size={14} className="text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-muted leading-relaxed">
                API keys are stored locally on your machine only. Use <strong className="text-foreground">read-only</strong> API keys for safety.
              </p>
            </div>
          </SectionCard>
          <SectionCard icon={Clock} title="Auto Import" description="Automatically fetch new trades on a schedule.">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Enable auto-import</p>
                <p className="text-xs text-muted">Fetches trades daily at the scheduled time.</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, autoImport: !config.autoImport })}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${config.autoImport ? "bg-accent" : "bg-border"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${config.autoImport ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            {config.autoImport && (
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">Import Time (Detroit / EST)</label>
                <input
                  type="time"
                  value={config.importTime}
                  onChange={(e) => setConfig({ ...config, importTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>
            )}
            <button
              onClick={() => alert("Manual import coming soon!")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-hover border border-border text-sm text-foreground hover:border-accent/30 transition-all"
            >
              <RefreshCw size={14} />
              Import Now
            </button>
          </SectionCard>
          {/* Wallets Section */}
          <SectionCard icon={Wallet} title="Wallets" description="Track your on-chain wallets for DEX trade logging.">
            {/* Add wallet form */}
            <div className="space-y-3">
              <InputField
                label="Wallet Address"
                value={newWallet.address}
                onChange={(v) => setNewWallet({ ...newWallet, address: v })}
                placeholder="0x... or So1..."
                mono
              />
              <SelectField
                label="Chain"
                value={newWallet.chain}
                onChange={(v) => setNewWallet({ ...newWallet, chain: v as Chain })}
                options={CHAINS.map((c) => ({ value: c.id, label: c.label }))}
              />
              <InputField
                label="Label"
                value={newWallet.label}
                onChange={(v) => setNewWallet({ ...newWallet, label: v })}
                placeholder="Main Trading Wallet"
              />
              <button
                onClick={addWallet}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all"
              >
                <Plus size={14} />
                Add Wallet
              </button>
            </div>

            {/* Saved wallets list */}
            {wallets.length > 0 && (
              <div className="space-y-2 mt-4">
                {wallets.map((w) => (
                  <div key={w.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-background border border-border">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{w.label}</p>
                      <p className="text-[10px] text-muted font-mono truncate">{w.address}</p>
                      <p className="text-[10px] text-accent">{CHAINS.find((c) => c.id === w.chain)?.label ?? w.chain}</p>
                    </div>
                    <button
                      onClick={() => removeWallet(w.id)}
                      className="ml-3 p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-all shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Info message */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/5 border border-accent/10 mt-3">
              <Info size={14} className="text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-muted leading-relaxed">
                Wallet scanning coming soon — for now, log DEX trades manually with the CEX/DEX toggle.
              </p>
            </div>
          </SectionCard>

          <SaveButton saved={saved} onClick={saveConfig} label="Save Settings" />
        </div>
      )}

      {/* ============ TRADING ACCOUNTS TAB ============ */}
      {tab === "trading-accounts" && (
        <div className="space-y-6">
          <SectionCard icon={Wallet} title="Trading Accounts" description="Manage multiple trading accounts and portfolios.">
            {accounts.length === 0 && !showAddAccount && (
              <div className="py-6 text-center">
                <p className="text-sm text-muted mb-4">No trading accounts added yet.</p>
              </div>
            )}

            {accounts.map((acct) => (
              <div key={acct.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-background border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${acct.active ? "bg-win" : "bg-muted/30"}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{acct.name}</p>
                    <p className="text-[10px] text-muted">{acct.exchange} · {acct.currency} {acct.balance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updated = accounts.map((a) => a.id === acct.id ? { ...a, active: !a.active } : a);
                      saveAccounts(updated);
                    }}
                    className="text-[10px] px-2 py-1 rounded-lg bg-surface-hover text-muted hover:text-foreground transition-all"
                  >
                    {acct.active ? "Active" : "Paused"}
                  </button>
                  <button
                    onClick={() => saveAccounts(accounts.filter((a) => a.id !== acct.id))}
                    className="p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {showAddAccount && (
              <div className="space-y-3 p-4 rounded-xl border border-accent/20 bg-accent/5">
                <InputField label="Account Name" value={newAccount.name} onChange={(v) => setNewAccount({ ...newAccount, name: v })} placeholder="e.g., Main Trading" />
                <SelectField
                  label="Exchange"
                  value={newAccount.exchange}
                  onChange={(v) => setNewAccount({ ...newAccount, exchange: v })}
                  options={EXCHANGES.map((e) => ({ value: e, label: e }))}
                />
                <InputField label="Starting Balance" value={newAccount.balance} onChange={(v) => setNewAccount({ ...newAccount, balance: v })} placeholder="10000" type="number" />
                <SelectField
                  label="Currency"
                  value={newAccount.currency}
                  onChange={(v) => setNewAccount({ ...newAccount, currency: v })}
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                    { value: "GBP", label: "GBP" },
                    { value: "BTC", label: "BTC" },
                    { value: "USDT", label: "USDT" },
                  ]}
                />
                <div className="flex gap-2">
                  <button onClick={addAccount} className="flex-1 py-2.5 rounded-xl bg-accent text-background text-sm font-semibold hover:bg-accent-hover transition-all">
                    Add Account
                  </button>
                  <button onClick={() => setShowAddAccount(false)} className="px-4 py-2.5 rounded-xl bg-surface-hover border border-border text-sm text-muted hover:text-foreground transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!showAddAccount && (
              <button
                onClick={() => setShowAddAccount(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted hover:text-accent hover:border-accent/30 transition-all"
              >
                <Plus size={16} />
                Add Trading Account
              </button>
            )}
          </SectionCard>
        </div>
      )}

      {/* ============ GLOBAL SETTINGS TAB ============ */}
      {tab === "global" && (
        <div className="space-y-6">
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

          <SaveButton saved={globalSaved} onClick={saveGlobal} label="Save Global Settings" />
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
                {["Unlimited trades", "AI Trading Coach", "Monte Carlo sims", "Crypto tax reports", "Stock trading included", "Custom dashboards", "Priority support", "All themes"].map((f) => (
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
                    features: ["2 trade logs/week", "Basic analytics", "Calendar heatmap", "Light + Dark Simple themes", "CSV import"],
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
                    features: ["Everything in Pro", "AI Trading Coach", "Monte Carlo sims", "Crypto tax reports", "Stock trading included", "Custom dashboards", "Priority support"],
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
                  window.open(`https://twitter.com/intent/tweet?text=Check+out+Stargate+crypto+trading+journal!&url=${encodeURIComponent(referralUrl)}`, "_blank");
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
                downloadFile("stargate-journal.json", JSON.stringify(notes, null, 2), "application/json");
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
    </div>
  );
}
