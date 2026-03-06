"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCircle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useCosmetics } from "@/lib/cosmetics";
import type { CosmeticType } from "@/lib/cosmetics";
import { ProfileCard } from "@/components/profile/profile-card";
import { CosmeticSlot } from "@/components/profile/cosmetic-slot";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { NextUnlocks } from "@/components/profile/next-unlocks";
import { UnlockRoadmap } from "@/components/profile/unlock-roadmap";

const COSMETIC_SLOTS: CosmeticType[] = [
  "avatar_frame",
  "banner",
  "title_badge",
  "sidebar_flair",
  "avatar_icon",
  "theme_accent",
];

type ProfileData = {
  display_name: string;
  is_public: boolean;
  show_level: boolean;
  show_achievements: boolean;
  show_streak: boolean;
};

export default function ProfilePage() {
  const { equipped, loading: cosmeticsLoading } = useCosmetics();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const fetchProfile = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("user_profiles")
      .select("display_name, is_public, show_level, show_achievements, show_streak")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    } else {
      setProfile({
        display_name: userData.user.email?.split("@")[0] ?? "Trader",
        is_public: false,
        show_level: true,
        show_achievements: true,
        show_streak: true,
      });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSaveProfile(data: ProfileData) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    await supabase.from("user_profiles").upsert(
      {
        user_id: userData.user.id,
        ...data,
      },
      { onConflict: "user_id" },
    );
    setProfile(data);
  }

  if (loading || cosmeticsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-accent">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <UserCircle size={24} className="text-accent" />
          Profile
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Customize your look and manage your identity
        </p>
      </div>

      {/* Character Card Preview */}
      <div className="mb-6">
        <ProfileCard displayName={profile?.display_name ?? "Trader"} />
      </div>

      {/* Equip Slots */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          Cosmetic Loadout
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {COSMETIC_SLOTS.map((type) => (
            <CosmeticSlot key={type} type={type} />
          ))}
        </div>
      </div>

      {/* Next Unlocks + Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <NextUnlocks onViewRoadmap={() => setShowRoadmap(true)} />
        {profile && (
          <ProfileSettings
            displayName={profile.display_name}
            isPublic={profile.is_public}
            showLevel={profile.show_level}
            showAchievements={profile.show_achievements}
            showStreak={profile.show_streak}
            onSave={handleSaveProfile}
          />
        )}
      </div>

      {/* Full Roadmap (expandable) */}
      {showRoadmap && (
        <div className="mb-6">
          <UnlockRoadmap onClose={() => setShowRoadmap(false)} />
        </div>
      )}
    </div>
  );
}
