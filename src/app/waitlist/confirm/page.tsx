"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ConfirmContent() {
  const params = useSearchParams();
  const status = params.get("status");
  const position = params.get("position");
  const tier = params.get("tier");

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-zinc-100">Email confirmed!</h1>
        <p className="max-w-md text-lg text-zinc-400">
          You&apos;re <span className="font-mono text-cyan-400">#{position}</span>
          {tier && <> &mdash; <span className="text-zinc-200">{tier}</span></>}.
          Check your inbox for your welcome email with your discount code and referral link.
        </p>
        <Link
          href="/"
          className="mt-4 rounded-full bg-cyan-400 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-cyan-300"
        >
          Back to Traverse
        </Link>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-100">Already confirmed</h1>
        <p className="max-w-md text-zinc-400">
          Your email is already verified.
          {position && <> You&apos;re #{position} on the waitlist.</>}
        </p>
        <Link
          href="/"
          className="mt-4 rounded-full bg-zinc-700 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-600"
        >
          Back to Traverse
        </Link>
      </div>
    );
  }

  // invalid or missing status
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-zinc-100">Invalid or expired link</h1>
      <p className="max-w-md text-zinc-400">
        This confirmation link is invalid or has expired. Please try signing up again.
      </p>
      <Link
        href="/#waitlist"
        className="mt-4 rounded-full bg-zinc-700 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-600"
      >
        Sign up again
      </Link>
    </div>
  );
}

export default function WaitlistConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c] px-4">
      <Suspense
        fallback={
          <div className="text-zinc-500">Loading...</div>
        }
      >
        <ConfirmContent />
      </Suspense>
    </div>
  );
}
