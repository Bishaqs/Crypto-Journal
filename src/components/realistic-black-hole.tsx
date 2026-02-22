"use client";

type BlackHoleSize = "small" | "medium" | "large";
type BlackHoleColor = "purple" | "orange" | "blue" | "green" | "neutral";

const COLOR_PALETTES: Record<BlackHoleColor, { primary: string; bright: string; mid: string; glow: string; dark: string }> = {
  purple: { primary: "139,92,246", bright: "221,214,254", mid: "167,139,250", glow: "196,181,253", dark: "91,33,182" },
  orange: { primary: "249,115,22", bright: "254,215,170", mid: "251,146,60", glow: "253,186,116", dark: "194,65,12" },
  blue: { primary: "14,165,233", bright: "186,230,253", mid: "56,189,248", glow: "125,211,252", dark: "3,105,161" },
  green: { primary: "34,197,94", bright: "187,247,208", mid: "74,222,128", glow: "134,239,172", dark: "21,128,61" },
  neutral: { primary: "161,161,170", bright: "228,228,231", mid: "212,212,216", glow: "244,244,245", dark: "82,82,91" },
};

const SIZE_MAP = {
  small: {
    horizon: 50,
    diskW: 180, diskH: 28,
    arcW: 90, arcTopH: 52, arcBottomH: 44,
    photonRing: 1.5,
    glowSpread: 15,
  },
  medium: {
    horizon: 160,
    diskW: 440, diskH: 60,
    arcW: 220, arcTopH: 110, arcBottomH: 90,
    photonRing: 2,
    glowSpread: 30,
  },
  large: {
    horizon: 200,
    diskW: 520, diskH: 70,
    arcW: 270, arcTopH: 130, arcBottomH: 105,
    photonRing: 2.5,
    glowSpread: 40,
  },
};

export function RealisticBlackHole({
  size = "large",
  opacity = 1,
  color = "purple",
}: {
  size?: BlackHoleSize;
  opacity?: number;
  color?: BlackHoleColor;
}) {
  const s = SIZE_MAP[size];
  const c = COLOR_PALETTES[color];
  const half = s.horizon / 2;

  return (
    <div
      className="absolute top-1/2 left-1/2"
      style={{
        width: s.diskW,
        height: s.diskW,
        marginLeft: -s.diskW / 2,
        marginTop: -s.diskW / 2,
        opacity,
      }}
    >
      {/* === LAYER 1 (back): Outer diffuse glow === */}
      <div
        className="absolute rounded-full black-hole-glow"
        style={{
          top: "50%",
          left: "50%",
          width: s.diskW * 1.3,
          height: s.diskW * 1.3,
          marginLeft: -(s.diskW * 1.3) / 2,
          marginTop: -(s.diskW * 1.3) / 2,
          background: `radial-gradient(ellipse at center, rgba(${c.primary},0.12) 10%, rgba(${c.mid},0.06) 35%, transparent 55%)`,
          filter: `blur(${s.glowSpread}px)`,
          zIndex: 1,
        }}
      />

      {/* === LAYER 2: Accretion Disk — Bright horizontal ellipse === */}
      {/* This is the flat disk viewed slightly edge-on — a wide, thin glowing band */}
      <div
        className="absolute animate-[portal-spin_80s_linear_infinite]"
        style={{
          top: "50%",
          left: "50%",
          width: s.diskW,
          height: s.diskH,
          marginLeft: -s.diskW / 2,
          marginTop: -s.diskH / 2,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center,
            rgba(${c.bright},0.95) 0%,
            rgba(${c.glow},0.85) 15%,
            rgba(${c.mid},0.7) 30%,
            rgba(${c.primary},0.5) 50%,
            rgba(${c.dark},0.25) 70%,
            transparent 90%
          )`,
          boxShadow: `
            0 0 ${s.glowSpread * 0.5}px ${s.glowSpread * 0.3}px rgba(${c.mid},0.3),
            0 0 ${s.glowSpread}px ${s.glowSpread * 0.5}px rgba(${c.primary},0.15)
          `,
          zIndex: 2,
        }}
      />

      {/* Doppler beaming — left side brighter (approaching viewer) */}
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          width: s.diskW,
          height: s.diskH,
          marginLeft: -s.diskW / 2,
          marginTop: -s.diskH / 2,
          borderRadius: "50%",
          background: `linear-gradient(90deg, rgba(${c.bright},0.35) 0%, rgba(${c.glow},0.15) 25%, transparent 55%, rgba(${c.dark},0.1) 100%)`,
          zIndex: 3,
        }}
      />

      {/* Inner hot ring of the disk — thinner, brighter band near the event horizon */}
      <div
        className="absolute animate-[portal-spin_50s_linear_infinite] [animation-direction:reverse]"
        style={{
          top: "50%",
          left: "50%",
          width: s.diskW * 0.7,
          height: s.diskH * 0.55,
          marginLeft: -(s.diskW * 0.7) / 2,
          marginTop: -(s.diskH * 0.55) / 2,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center,
            rgba(255,255,255,0.9) 0%,
            rgba(${c.bright},0.95) 20%,
            rgba(${c.glow},0.7) 45%,
            rgba(${c.mid},0.3) 70%,
            transparent 90%
          )`,
          zIndex: 4,
        }}
      />

      {/* === LAYER 3: Einstein Ring — TOP ARC === */}
      {/* Light from the far side of the disk bends OVER the top of the black hole */}
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: s.arcW,
          height: s.arcTopH,
          marginLeft: -s.arcW / 2,
          marginTop: -half - s.arcTopH + 8,
          borderRadius: "50% 50% 0 0",
          background: `radial-gradient(ellipse 100% 80% at 50% 100%,
            rgba(${c.bright},0.85) 0%,
            rgba(${c.glow},0.6) 25%,
            rgba(${c.mid},0.35) 50%,
            rgba(${c.primary},0.15) 75%,
            transparent 100%
          )`,
          boxShadow: `0 0 20px 5px rgba(${c.mid},0.25)`,
          zIndex: 5,
        }}
      />

      {/* === LAYER 4: Einstein Ring — BOTTOM ARC (dimmer) === */}
      {/* Same effect but under the black hole — fainter due to redshift */}
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: s.arcW * 0.9,
          height: s.arcBottomH,
          marginLeft: -(s.arcW * 0.9) / 2,
          marginTop: half - 8,
          borderRadius: "0 0 50% 50%",
          background: `radial-gradient(ellipse 100% 80% at 50% 0%,
            rgba(${c.glow},0.55) 0%,
            rgba(${c.mid},0.35) 30%,
            rgba(${c.primary},0.15) 60%,
            transparent 100%
          )`,
          boxShadow: `0 0 15px 3px rgba(${c.primary},0.15)`,
          zIndex: 5,
        }}
      />

      {/* === LAYER 5: Event Horizon — The absolute void === */}
      <div
        className="absolute rounded-full"
        style={{
          top: "50%",
          left: "50%",
          width: s.horizon,
          height: s.horizon,
          marginLeft: -half,
          marginTop: -half,
          background: "radial-gradient(circle, #000 0%, #000 65%, #010005 80%, #020010 95%)",
          boxShadow: `inset 0 0 ${half}px rgba(0,0,0,0.99)`,
          zIndex: 6,
        }}
      >
        {/* PHOTON RING — razor-thin, extremely bright at the shadow edge */}
        <div
          className="absolute inset-[-2px] rounded-full"
          style={{
            border: `${s.photonRing}px solid rgba(${c.bright},0.95)`,
            boxShadow: `
              0 0 4px 1px rgba(${c.bright},0.7),
              0 0 12px 3px rgba(${c.glow},0.5),
              0 0 30px 6px rgba(${c.mid},0.3),
              0 0 60px 12px rgba(${c.primary},0.15),
              inset 0 0 ${half}px rgba(0,0,0,0.98)
            `,
          }}
        />

        {/* Deep inner void */}
        <div
          className="absolute inset-[3px] rounded-full"
          style={{
            background: "#000",
            boxShadow: `inset 0 0 ${half * 0.8}px rgba(0,0,0,0.99)`,
          }}
        />

        {/* Subtle Doppler highlight on horizon edge — left side slightly brighter */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(100deg, rgba(${c.mid},0.06) 0%, transparent 40%, rgba(${c.dark},0.03) 100%)`,
          }}
        />
      </div>

      {/* Disk glow that passes IN FRONT of event horizon (left + right sides) */}
      {/* This creates the visual of the disk wrapping around */}
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          width: s.diskW * 0.85,
          height: s.diskH * 0.4,
          marginLeft: -(s.diskW * 0.85) / 2,
          marginTop: -(s.diskH * 0.4) / 2,
          borderRadius: "50%",
          background: `linear-gradient(90deg,
            rgba(${c.bright},0.5) 0%,
            rgba(${c.glow},0.3) 10%,
            transparent 25%,
            transparent 75%,
            rgba(${c.primary},0.15) 90%,
            rgba(${c.dark},0.1) 100%
          )`,
          zIndex: 7,
        }}
      />
    </div>
  );
}
