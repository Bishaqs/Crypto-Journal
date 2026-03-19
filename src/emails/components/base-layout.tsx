import {
  Html,
  Head,
  Body,
  Container,
  Preview,
} from "@react-email/components";
import * as React from "react";

export type Theme = "dark" | "light";

export const THEMES = {
  dark: {
    background: "#0a0a0c",
    text: "#f4f4f5",
    textMuted: "rgba(244,244,245,0.5)",
    accent: "#67e8f9",
    accentBg: "rgba(103,232,249,0.1)",
    accentBorder: "rgba(103,232,249,0.2)",
    border: "rgba(244,244,245,0.08)",
    surface: "rgba(244,244,245,0.03)",
  },
  light: {
    background: "#ffffff",
    text: "#1a1a2e",
    textMuted: "#666666",
    accent: "#6c63ff",
    accentBg: "rgba(108,99,255,0.08)",
    accentBorder: "rgba(108,99,255,0.2)",
    border: "#eeeeee",
    surface: "#f8f8fc",
  },
} as const;

interface BaseLayoutProps {
  theme?: Theme;
  preview: string;
  children: React.ReactNode;
}

export function BaseLayout({
  theme = "dark",
  preview,
  children,
}: BaseLayoutProps) {
  const t = THEMES[theme];

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: t.background,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "48px 32px",
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}
