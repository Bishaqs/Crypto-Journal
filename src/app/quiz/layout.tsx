import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What's Your Trading Archetype? | Traverse Journal",
  description: "15 quick questions to discover which of the 8 trader minds you are. Based on Behavioral Finance, Neuroeconomics & Decision Science. No signup required.",
  openGraph: {
    title: "What's Your Trading Archetype?",
    description: "15 questions. 2 minutes. Discover if you're The Architect, The Degen, The Paper Hand, or one of 5 other trading archetypes.",
    url: "https://traversejournal.com/quiz",
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
