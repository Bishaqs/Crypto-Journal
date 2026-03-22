import Link from "next/link";

export const metadata = {
  title: "Unsubscribed | Traverse Journal",
};

export default function UnsubscribedPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold">You&apos;ve been unsubscribed</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          You won&apos;t receive any more emails from this series. If this was a
          mistake, just retake the quiz and we&apos;ll restart.
        </p>
        <Link
          href="https://traversejournal.com"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-medium text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 transition-all"
        >
          Visit Traverse Journal
        </Link>
      </div>
    </div>
  );
}
