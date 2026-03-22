import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trading Psychology Quiz | Traverse Journal",
  description: "Discover your trading psychology pattern in 3 minutes. Find out if you're a Disciplined Strategist, Emotional Reactor, or one of 6 other archetypes — and get personalized insights.",
  openGraph: {
    title: "What's Your Trading Psychology Pattern?",
    description: "Take a 3-minute quiz to discover your trading archetype and get personalized insights from an AI trading coach.",
    url: "https://traversejournal.com/quiz",
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
