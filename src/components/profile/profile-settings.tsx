"use client";

import { useState } from "react";
import { Save, Settings } from "lucide-react";
import Link from "next/link";

type ProfileSettingsProps = {
  displayName: string;
  isPublic: boolean;
  showLevel: boolean;
  showAchievements: boolean;
  showStreak: boolean;
  onSave: (data: {
    display_name: string;
    is_public: boolean;
    show_level: boolean;
    show_achievements: boolean;
    show_streak: boolean;
  }) => Promise<void>;
};

export function ProfileSettings({
  displayName: initialName,
  isPublic: initialPublic,
  showLevel: initialShowLevel,
  showAchievements: initialShowAchievements,
  showStreak: initialShowStreak,
  onSave,
}: ProfileSettingsProps) {
  const [name, setName] = useState(initialName);
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [showLevel, setShowLevel] = useState(initialShowLevel);
  const [showAchievements, setShowAchievements] = useState(initialShowAchievements);
  const [showStreak, setShowStreak] = useState(initialShowStreak);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges =
    name !== initialName ||
    isPublic !== initialPublic ||
    showLevel !== initialShowLevel ||
    showAchievements !== initialShowAchievements ||
    showStreak !== initialShowStreak;

  async function handleSave() {
    setSaving(true);
    await onSave({
      display_name: name.trim(),
      is_public: isPublic,
      show_level: showLevel,
      show_achievements: showAchievements,
      show_streak: showStreak,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div
      className="glass rounded-2xl border border-border/50 p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Profile Settings</h3>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-1 text-[10px] text-muted hover:text-accent transition-colors"
        >
          <Settings size={12} />
          App Settings
        </Link>
      </div>

      {/* Display Name */}
      <div className="mb-4">
        <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1.5 block">
          Display Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="Enter display name"
          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-muted/50"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3 mb-4">
        <Toggle
          label="Public Profile"
          description="Show on leaderboard"
          value={isPublic}
          onChange={setIsPublic}
        />
        <Toggle
          label="Show Level"
          description="Display your level publicly"
          value={showLevel}
          onChange={setShowLevel}
        />
        <Toggle
          label="Show Achievements"
          description="Display achievement count"
          value={showAchievements}
          onChange={setShowAchievements}
        />
        <Toggle
          label="Show Streak"
          description="Display your streak"
          value={showStreak}
          onChange={setShowStreak}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!hasChanges || saving || !name.trim()}
        className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
          saved
            ? "bg-win/20 text-win border border-win/30"
            : hasChanges
              ? "bg-accent text-background hover:bg-accent-hover"
              : "bg-surface-hover text-muted border border-border cursor-not-allowed"
        }`}
      >
        <Save size={14} />
        {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-colors relative ${
          value ? "bg-accent" : "bg-border"
        }`}
      >
        <div
          className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all ${
            value ? "left-[18px]" : "left-[3px]"
          }`}
        />
      </button>
    </div>
  );
}
