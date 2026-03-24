/**
 * Unreleased feature registry.
 *
 * Features in this set are hidden from all users except the owner and beta testers.
 * To release a feature: remove its key from this set and deploy.
 * If the feature should also be tier-gated, add it to FEATURE_TIERS in use-subscription.ts.
 */
export const UNRELEASED_FEATURES = new Set<string>([
  "education-platform",
]);

export function isUnreleasedFeature(feature: string): boolean {
  return UNRELEASED_FEATURES.has(feature);
}
