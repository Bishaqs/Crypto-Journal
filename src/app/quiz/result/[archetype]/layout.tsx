import type { Metadata } from "next";
import { MINI_ARCHETYPES, ALL_ARCHETYPES, isValidArchetype } from "@/lib/mini-quiz-archetypes";

export async function generateStaticParams() {
  return ALL_ARCHETYPES.map((archetype) => ({ archetype }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ archetype: string }>;
}): Promise<Metadata> {
  const { archetype } = await params;
  if (!isValidArchetype(archetype)) {
    return { title: "Unknown Archetype | Traverse Journal" };
  }

  const info = MINI_ARCHETYPES[archetype];
  return {
    title: `You're ${info.name} | Traverse Journal`,
    description: info.shareDescription,
    openGraph: {
      title: `I'm ${info.name} — ${info.tagline}`,
      description: info.shareDescription,
      url: `https://traversejournal.com/quiz/result/${archetype}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `I'm ${info.name} — ${info.tagline}`,
      description: info.shareDescription,
    },
  };
}

export default function ArchetypeResultLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
