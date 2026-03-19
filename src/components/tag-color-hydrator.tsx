"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadTagColorsFromDB } from "@/lib/tag-colors";

/** Hydrates tag colors from DB into localStorage on mount. Renders nothing. */
export function TagColorHydrator() {
  useEffect(() => {
    const supabase = createClient();
    loadTagColorsFromDB(supabase);
  }, []);

  return null;
}
