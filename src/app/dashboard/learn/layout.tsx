import { requireUnreleasedAccess } from "@/lib/unreleased-gate";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUnreleasedAccess("education-platform");
  return <>{children}</>;
}
