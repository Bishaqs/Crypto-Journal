import Link from "next/link";
import { PrivacyContent } from "@/components/legal/privacy-content";

export const metadata = {
  title: "Privacy Policy — Traverse",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/login"
          className="text-sm text-muted hover:text-accent transition-colors"
        >
          &larr; Back to login
        </Link>

        <h1 className="text-3xl font-bold mt-8 mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted mb-10">
          Last updated: March 14, 2026
        </p>

        <PrivacyContent />
      </div>
    </div>
  );
}
