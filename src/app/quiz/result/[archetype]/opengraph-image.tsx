import { ImageResponse } from "next/og";
import { MINI_ARCHETYPES, isValidArchetype } from "@/lib/mini-quiz-archetypes";

export const alt = "Your Trading Archetype";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ARCHETYPE_COLORS: Record<string, string> = {
  architect: "#67e8f9",
  tilt: "#f87171",
  librarian: "#a78bfa",
  paper_hand: "#fbbf24",
  chameleon: "#34d399",
  degen: "#fb923c",
  diamond_hand: "#60a5fa",
  lurker: "#94a3b8",
};

export default async function OGImage({ params }: { params: { archetype: string } }) {
  const { archetype } = params;
  if (!isValidArchetype(archetype)) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: "#0a0a0f", color: "white", alignItems: "center", justifyContent: "center" }}>
          <span>Traverse Journal</span>
        </div>
      ),
      { ...size },
    );
  }

  const info = MINI_ARCHETYPES[archetype];
  const accentColor = ARCHETYPE_COLORS[archetype] ?? "#67e8f9";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#0a0a0f",
          color: "white",
          padding: "60px 80px",
          justifyContent: "space-between",
        }}
      >
        {/* Top: Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px", color: "#ffffff80", letterSpacing: "0.1em" }}>
            TRAVERSE JOURNAL
          </span>
        </div>

        {/* Center: Archetype */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ fontSize: "24px", color: accentColor, textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Your Trading Archetype
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <span style={{ fontSize: "72px" }}>{info.emoji}</span>
            <span style={{ fontSize: "72px", fontWeight: "bold" }}>{info.name}</span>
          </div>
          <span style={{ fontSize: "28px", color: "#ffffff80", fontStyle: "italic", maxWidth: "900px" }}>
            &ldquo;{info.tagline}&rdquo;
          </span>
        </div>

        {/* Bottom: CTA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "20px", color: "#ffffff50" }}>
            traversejournal.com/quiz
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: accentColor,
              color: "#0a0a0f",
              padding: "12px 24px",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            Discover yours — Free 2-min quiz
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
