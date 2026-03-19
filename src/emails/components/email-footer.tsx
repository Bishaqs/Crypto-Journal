import { Hr, Link, Text } from "@react-email/components";
import * as React from "react";
import { type Theme, THEMES } from "./base-layout";

interface EmailFooterProps {
  theme?: Theme;
  unsubscribeUrl?: string;
}

export function EmailFooter({ theme = "dark", unsubscribeUrl }: EmailFooterProps) {
  const mutedColor = theme === "dark" ? "rgba(244,244,245,0.3)" : "#999";

  return (
    <>
      <Hr
        style={{
          border: "none",
          borderTop: `1px solid ${THEMES[theme].border}`,
          margin: "24px 0",
        }}
      />
      <Text
        style={{
          fontSize: "12px",
          color: mutedColor,
          margin: "0 0 8px 0",
          lineHeight: "1.5",
        }}
      >
        Traverse Journal — The trading journal that connects your psychology to
        your P&L.
      </Text>
      <Text
        style={{
          fontSize: "11px",
          color: mutedColor,
          margin: "0 0 8px 0",
          lineHeight: "1.5",
        }}
      >
        Traverse Journal | support@traversejournal.com
        <br />
        <Link
          href="https://traversejournal.com/impressum"
          style={{ color: mutedColor, textDecoration: "underline" }}
        >
          Impressum
        </Link>
        {" | "}
        <Link
          href="https://traversejournal.com/privacy"
          style={{ color: mutedColor, textDecoration: "underline" }}
        >
          Privacy Policy
        </Link>
        {unsubscribeUrl && (
          <>
            {" | "}
            <Link
              href={unsubscribeUrl}
              style={{ color: mutedColor, textDecoration: "underline" }}
            >
              Unsubscribe
            </Link>
          </>
        )}
      </Text>
    </>
  );
}
