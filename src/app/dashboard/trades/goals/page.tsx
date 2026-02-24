"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TradesGoalsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/goals");
  }, [router]);
  return null;
}
