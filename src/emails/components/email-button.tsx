import { Button } from "@react-email/components";
import * as React from "react";
import { type Theme, THEMES } from "./base-layout";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  theme?: Theme;
}

export function EmailButton({
  href,
  children,
  theme = "dark",
}: EmailButtonProps) {
  const t = THEMES[theme];
  const isDark = theme === "dark";

  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        background: t.accent,
        color: isDark ? "#0a0a0c" : "#ffffff",
        fontSize: "14px",
        fontWeight: 700,
        padding: "12px 24px",
        borderRadius: "999px",
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
}
