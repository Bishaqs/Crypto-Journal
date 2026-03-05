import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Paper Trading — Stargate",
};

export default async function SimulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a0f] text-white flex flex-col">
      {children}
    </div>
  );
}
