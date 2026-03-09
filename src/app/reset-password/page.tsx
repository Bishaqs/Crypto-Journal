"use client";

import { Suspense, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import type { AuthChangeEvent } from "@supabase/supabase-js";

function ResetPasswordForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [exchanging, setExchanging] = useState(true);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      (async () => {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeErr) {
          setError("This reset link has expired or is invalid. Please request a new one.");
        } else {
          setReady(true);
        }
        setExchanging(false);
      })();
    } else {
      // Fallback: check if session was established via hash fragment
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
          setExchanging(false);
        }
      });
      // Give it a moment, then show error if no recovery event
      const timeout = setTimeout(() => {
        setError("No reset token found. Please request a new password reset from the login page.");
        setExchanging(false);
      }, 3000);
      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(updateErr.message);
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {exchanging && (
        <div className="text-center text-muted text-sm py-8">Verifying reset link...</div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-3 rounded-lg text-sm mb-4">
          <CheckCircle2 size={16} />
          Password updated! Redirecting to login...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-loss/10 text-loss px-4 py-3 rounded-lg text-sm mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {ready && !success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm text-muted mb-1">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm text-muted mb-1">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="Repeat your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Updating..." : "Set New Password"}
          </button>
        </form>
      )}

      {!exchanging && !ready && (
        <div className="text-center mt-4">
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-accent hover:underline"
          >
            Back to login
          </button>
        </div>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-4">
            <Lock size={20} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="text-muted mt-2 text-sm">Enter your new password below.</p>
        </div>

        <Suspense fallback={<div className="text-center text-muted text-sm py-8">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
