import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ARCHETYPES, type TradingArchetype } from "@/lib/psychology-scoring";

export const runtime = "edge";

// PUBLIC ENDPOINT (intentional) — generates OG social sharing image for quiz results.
// No auth required: users share their card URL on social media. Only exposes
// archetype name, tagline, top strength, and top blind spot (designed for sharing).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: result } = await supabase
    .from("quiz_results")
    .select("archetype, protocol")
    .eq("id", id)
    .single();

  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  const archetype = result.archetype as TradingArchetype;
  const info = ARCHETYPES[archetype];
  const protocol = result.protocol as {
    tradingCard?: { tagline?: string; topStrength?: string; topBlindSpot?: string };
  } | null;

  const tagline = protocol?.tradingCard?.tagline ?? "";
  const topStrength = protocol?.tradingCard?.topStrength ?? info?.strengths[0] ?? "";
  const topBlindSpot = protocol?.tradingCard?.topBlindSpot ?? info?.blindSpots[0] ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #0f172a 0%, #0a0f1e 50%, #0c1425 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#67e8f9",
              opacity: 0.7,
            }}
          >
            Trading Psychology Profile
          </div>
        </div>

        {/* Archetype name */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: "12px",
          }}
        >
          {info?.name ?? archetype}
        </div>

        {/* Tagline */}
        {tagline && (
          <div
            style={{
              fontSize: "22px",
              color: "#67e8f9",
              fontStyle: "italic",
              marginBottom: "32px",
            }}
          >
            &ldquo;{tagline}&rdquo;
          </div>
        )}

        {/* Strength & Blind Spot boxes */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#4ade80",
                opacity: 0.8,
                marginBottom: "8px",
              }}
            >
              Top Strength
            </div>
            <div style={{ fontSize: "18px", fontWeight: 500 }}>{topStrength}</div>
          </div>
          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#fbbf24",
                opacity: 0.8,
                marginBottom: "8px",
              }}
            >
              Top Blind Spot
            </div>
            <div style={{ fontSize: "18px", fontWeight: 500 }}>{topBlindSpot}</div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "20px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            Traverse Journal
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#67e8f9",
              opacity: 0.5,
            }}
          >
            traversejournal.com/quiz
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
}
