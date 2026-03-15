"use client";

import { useTheme } from "@/lib/theme-context";
import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CandleBackground } from "./candle-background";
import { RealisticBlackHole } from "./realistic-black-hole";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SatoshiBackground } from "./satoshi-background";
import { SynthwaveBackground } from "./synthwave-background";
import { JungleBackground } from "./jungle-background";

/* ================================================================
   MATRIX — Dense binary rain covering the entire screen
   ================================================================ */

const MATRIX_COLUMNS = 70;
const MATRIX_CHARS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

function MatrixRain() {
  const [columns, setColumns] = useState<{ speed: number; charCount: number; fontSize: number; opacity: number; left: number; chars: string[]; rainDelay: number }[]>([]);

  useEffect(() => {
    setColumns(
      Array.from({ length: MATRIX_COLUMNS }).map((_, i) => {
        const speed = 4 + Math.random() * 10;
        const charCount = 25 + Math.floor(Math.random() * 25);
        const fontSize = 11 + Math.random() * 5;
        const opacity = 0.3 + Math.random() * 0.5;
        const left = (i / MATRIX_COLUMNS) * 100;
        const chars = Array.from({ length: charCount }).map(() =>
          MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
        );
        const rainDelay = Math.random() * -15;
        return { speed, charCount, fontSize, opacity, left, chars, rainDelay };
      })
    );
  }, []);

  return (
    <>
      {columns.map((col, i) => (
        <div
          key={i}
          className="cipher-column"
          style={{
            left: `${col.left}%`,
            "--rain-duration": `${col.speed}s`,
            "--rain-delay": `${col.rainDelay}s`,
            fontSize: `${col.fontSize}px`,
          } as React.CSSProperties}
        >
          {col.chars.map((char, j) => {
            // First char is bright white-green "head", rest fade to green
            const isHead = j === 0;
            const brightness = isHead ? 1 : Math.max(0.15, 1 - (j / col.chars.length) * 1.2);
            return (
              <span
                key={j}
                style={{
                  color: isHead
                    ? "#ffffff"
                    : `rgba(34, 197, 94, ${brightness})`,
                  textShadow: isHead
                    ? "0 0 6px #4ade80, 0 0 12px #22c55e"
                    : `0 0 ${3 * brightness}px rgba(34, 197, 94, ${brightness * 0.5})`,
                  opacity: col.opacity,
                }}
              >
                {char}{"\n"}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
}

/* ================================================================
   VOLCANO — Cinematic volcanic mountains matching reference image:
   Multi-peak silhouette, branching lava veins to base, thick right
   river, thin left lightning veins, crater glows, smoke, embers
   ================================================================ */

/*
  Mountain silhouette — matches reference: left smaller peak, prominent
  center-left peak, saddle, prominent right peak, slopes to edges.
  viewBox 0 0 1600 700 — fills bottom ~50% of screen.
*/
const MOUNTAIN_PATH =
  // Start bottom-left, climb left foothills
  "M0,700 L0,520 L50,510 L100,490 L140,470 L180,440 L210,410 " +
  // Small far-left peak
  "L240,380 L265,355 L280,340 L290,330 L300,335 L315,350 " +
  // Valley between far-left and main left peak
  "L340,370 L360,365 L380,350 L395,330 " +
  // Rise to main left peak — jagged sub-ridges for clustered peaks feel
  "L420,290 L438,258 L448,265 L458,240 L468,222 L478,198 " +
  "L488,168 L496,150 L502,140 L508,128 L510,125 " +
  "L513,128 L516,138 L520,145 L524,152 L530,155 " +
  // Descend from left peak into saddle
  "L545,180 L565,210 L590,240 L620,268 L655,290 " +
  "L690,305 L720,312 L745,310 L768,302 " +
  // Rise to right peak — steeper cone shape
  "L790,285 L815,255 L838,225 L858,195 " +
  "L876,165 L890,142 L900,128 L906,115 L910,112 " +
  "L914,115 L920,130 L930,148 " +
  // Descend from right peak — steeper
  "L942,172 L958,205 L976,240 L998,278 " +
  "L1022,315 L1050,350 L1085,385 L1125,415 " +
  // Slope to right edge — steepened so mountain extends further
  "L1175,445 L1240,472 L1320,498 L1420,518 " +
  "L1510,530 L1600,535 L1600,700 Z";

/*
  Lava veins — always visible (static strokes), glow pulses via GSAP.
  Left peak: many thin branching veins like lightning/cracks.
  Right peak: one dominant thick river + a couple branches.
  ALL veins reach the mountain base (y=700).
*/
/*
  Main right-peak lava river — rendered separately with 4 layers
  (xxl-bloom, lg-glow, md-core, sm-hotcore) for the white-hot center effect.
*/
/*
  Main right-peak lava river — TAPERED filled polygon.
  Left edge traces from crater (narrow) to base (wide).
  Right edge traces back up. Fill gives natural width tapering.
  Centerline is a thin stroked path on top for white-hot core.
*/
const MAIN_LAVA_RIVER_FILL =
  // Narrower taper: ~4px at crater, ~28px at base
  "M908,112 " +
  "C910,145 914,190 920,240 " +
  "C924,275 926,310 927,350 " +
  "C928,395 925,440 922,490 " +
  "C919,535 920,580 926,630 " +
  "C933,665 944,690 955,700 " +
  "L983,700 " +
  "C975,690 966,665 961,630 " +
  "C956,580 954,535 957,490 " +
  "C960,440 963,395 962,350 " +
  "C961,310 959,275 955,240 " +
  "C949,190 944,145 912,112 " +
  "Z";

const MAIN_LAVA_RIVER_CENTER =
  "M910,112 C913,145 920,190 928,240 C930,275 932,310 932,350 C933,395 930,440 927,490 C924,535 926,580 934,630 C940,665 952,690 968,700";

const LAVA_VEINS = [
  // ===== LEFT PEAK — dense terrain-following crack network (13 veins) =====
  // L1: Ridge crack — traces actual peak-to-saddle descent path
  { d: "M510,125 C515,140 520,155 530,175 C545,205 570,238 600,265 C630,288 660,300 700,310 L720,312", w: 1.2, color: "#FF8800", opacity: 0.70 },
  // L2: Left slope crack — follows left face contour toward far-left valley
  { d: "M510,125 C502,142 490,165 478,195 C462,232 440,268 420,295 C402,322 388,345 368,368", w: 1.0, color: "#FF9500", opacity: 0.62 },
  // L3: Branch from L2 at y≈232 — continues down left slope to base
  { d: "M462,232 C448,268 432,305 415,345 C395,392 370,440 340,495 L305,565 L270,700", w: 0.8, color: "#FFAA00", opacity: 0.50 },
  // L4: Branch from L1 at saddle — drops from saddle floor to base
  { d: "M660,300 C658,338 654,380 648,428 C640,485 635,548 630,620 L628,700", w: 0.6, color: "#FF7700", opacity: 0.38 },
  // L5: Sub-ridge crack — traces the jagged (438,258) notch on ascent
  { d: "M478,195 C468,218 454,245 438,258 L420,290", w: 0.7, color: "#FFCC33", opacity: 0.50 },
  // L6: From L2 terminus through far-left peak area to base
  { d: "M368,368 C345,388 318,400 295,335 C285,355 268,380 250,415 C230,455 215,505 200,570 L185,700", w: 0.6, color: "#FFAA00", opacity: 0.35 },
  // L7: Short rightward crack near summit
  { d: "M510,125 C518,135 528,150 540,172 C555,198 572,228 590,255", w: 0.8, color: "#FFBB00", opacity: 0.55 },
  // L8: Second branch from L2 at y≈268 — between L3 and L6
  { d: "M440,268 C425,298 408,332 388,370 C368,412 345,462 318,520 L288,600 L260,700", w: 0.6, color: "#FF9500", opacity: 0.40 },
  // L9: Far-left sub-peak crack from (290,330) to base
  { d: "M290,330 C280,358 268,388 255,420 C238,462 220,510 200,565 L178,640 L165,700", w: 0.5, color: "#FFAA00", opacity: 0.32 },
  // L10: Cross-slope connector L1↔L2 at mid-height
  { d: "M530,175 C518,195 505,218 490,240 C475,265 458,288 440,310", w: 0.5, color: "#FFBB00", opacity: 0.38 },
  // L11: Thin capillary branching left from L3 at y≈305
  { d: "M432,305 C415,330 395,358 372,392 C348,430 322,475 295,530 L268,600 L245,700", w: 0.4, color: "#FFAA00", opacity: 0.30 },
  // L12: Branch from L1 at (600,265) down through saddle area
  { d: "M600,265 C595,305 588,350 580,400 C572,455 565,520 558,595 L552,700", w: 0.5, color: "#FF8800", opacity: 0.35 },
  // L13: Near-peak short crack going left from summit
  { d: "M510,125 C500,138 488,155 475,175 C460,200 445,228 428,260", w: 0.6, color: "#FFCC33", opacity: 0.42 },

  // ===== SADDLE VEINS (between peaks) =====
  { d: "M598,500 C628,535 658,568 688,600 C718,640 742,672 758,700", w: 0.6, color: "#FF6600", opacity: 0.34 },
  { d: "M830,400 C815,432 798,468 778,505 C758,545 738,592 722,700", w: 0.6, color: "#FF5500", opacity: 0.32 },
  { d: "M720,312 C718,348 714,395 708,448 C702,508 698,580 695,700", w: 0.5, color: "#FF7700", opacity: 0.30 },

  // ===== RIGHT PEAK (910,112) — secondary branches =====
  // Secondary right branch — organic winding
  { d: "M910,112 C916,145 928,185 938,228 C950,278 960,325 972,378 C985,435 1000,498 1018,568 C1035,635 1055,678 1080,700", w: 1.8, color: "#FF4500", opacity: 0.65 },
  // Left branch from right peak — irregular
  { d: "M910,112 C906,142 898,178 888,218 C876,265 862,312 845,365 C828,418 810,478 790,545 C772,615 758,665 748,700", w: 1.3, color: "#FF5500", opacity: 0.55 },
  // Thin capillary off right river
  { d: "M938,228 C950,272 965,318 982,370 C1000,428 1020,492 1042,562 L1068,700", w: 0.7, color: "#FF6B00", opacity: 0.42 },
  // Short crack near right peak
  { d: "M910,112 C918,138 928,162 936,192", w: 0.8, color: "#FFBB00", opacity: 0.52 },
  // Extra crack on right flank
  { d: "M942,172 C955,215 972,265 992,322 C1015,385 1042,458 1072,540 L1098,700", w: 0.6, color: "#FF7700", opacity: 0.40 },
  // New: Right slope capillary branching from secondary
  { d: "M972,378 C988,425 1008,478 1030,538 C1052,598 1072,655 1095,700", w: 0.5, color: "#FF6600", opacity: 0.35 },
  // New: Left-side crack from right peak mid-slope
  { d: "M888,218 C872,258 855,302 835,352 C815,408 798,472 782,545 L768,700", w: 0.5, color: "#FF6600", opacity: 0.32 },
];

type VolcanoParticle = {
  x: number;
  y: number;
  vy: number;
  vx: number;
  vxPhase: number;
  vxAmp: number;
  size: number;
  opacity: number;
  maxOpacity: number;
  hue: number;
  life: number;
  lifeSpeed: number;
  kind: "ember" | "smoke" | "ash" | "ballistic";
  gravity?: number;
  trail?: { x: number; y: number }[];
};

type Lightning = {
  path: Path2D;
  glow: Path2D;
  forks: Path2D;
  life: number;
};

type Bubble = {
  x: number;
  y: number;
  r: number;
  maxR: number;
  opacity: number;
  life: number;
  lifeSpeed: number;
};

function VolcanoBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<VolcanoParticle[]>([]);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const lightningRef = useRef<Lightning | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const eruptionActiveRef = useRef(false);
  const isReducedMotion = useReducedMotion();

  // GSAP: gentle glow pulse on veins + crater glow breathing
  useGSAP(
    () => {
      if (!containerRef.current) return;

      // Gentle glow pulse on vein outer glow layer
      gsap.utils.toArray<SVGPathElement>(".lava-glow-layer").forEach((el, i) => {
        gsap.to(el, {
          strokeOpacity: Number(el.getAttribute("stroke-opacity") || 0.3) * 1.3,
          duration: 3 + (i % 4),
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: i * 0.3,
        });
      });

      // River fill glow pulse
      gsap.utils.toArray<SVGPathElement>(".lava-river-glow").forEach((el) => {
        gsap.to(el, {
          attr: { "fill-opacity": 0.30 },
          duration: 4,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      });

      // Crater glow pulse — gentle breathing
      gsap.utils.toArray<HTMLElement>(".crater-glow").forEach((el, i) => {
        gsap.to(el, {
          scale: 1.15 + i * 0.05,
          opacity: 0.9,
          duration: 3.0 + i * 0.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      });

      if (!isReducedMotion) {
        // Eruptions
        const triggerEruption = () => {
          if (pausedRef.current || !containerRef.current) {
            gsap.delayedCall(5, triggerEruption);
            return;
          }
          eruptionActiveRef.current = true;
          // Flash
          gsap.to(".eruption-flash", {
            opacity: 0.08,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: "sine.out"
          });
          // Crater intense glow
          gsap.to(".crater-glow", {
            scale: 2,
            opacity: 1,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            onComplete: () => { eruptionActiveRef.current = false; }
          });

          const w = window.innerWidth;
          const h = window.innerHeight;
          const peakX = w * (910 / 1600);
          const peakY = h * 0.52;
          const count = w < 768 ? 10 : 20;
          const newParticles: VolcanoParticle[] = [];

          for (let i = 0; i < count; i++) {
            newParticles.push({
              x: peakX + (Math.random() - 0.5) * 20,
              y: peakY,
              vy: -4 - Math.random() * 4,
              vx: -3 + Math.random() * 6,
              vxPhase: 0,
              vxAmp: 0,
              size: 2 + Math.random() * 3,
              opacity: 1,
              maxOpacity: 1,
              hue: 30 + Math.random() * 20,
              life: 0,
              lifeSpeed: 0.015,
              kind: "ballistic",
              gravity: 0.04,
              trail: []
            });
          }
          particlesRef.current.push(...newParticles);

          gsap.delayedCall(15 + Math.random() * 15, triggerEruption);
        };
        gsap.delayedCall(5, triggerEruption);

        // Lightning
        const triggerLightning = () => {
          if (pausedRef.current || !containerRef.current || !canvasRef.current) {
            gsap.delayedCall(5, triggerLightning);
            return;
          }
          const w = canvasRef.current.width;
          const h = canvasRef.current.height;
          const startX = w * (910 / 1600) + (Math.random() - 0.5) * 60;
          const startY = h * 0.50;

          const path = new Path2D();
          const forks = new Path2D();
          path.moveTo(startX, startY);

          let cx = startX;
          let cy = startY;
          for (let i = 0; i < 8; i++) {
            cy -= 30 + Math.random() * 40;
            cx += (Math.random() - 0.5) * 80;
            path.lineTo(cx, cy);
            if (Math.random() > 0.5) {
              forks.moveTo(cx, cy);
              forks.lineTo(cx + (Math.random() - 0.5) * 60, cy - 20 - Math.random() * 40);
            }
          }

          lightningRef.current = { path, glow: path, forks, life: 1.0 };
          gsap.delayedCall(30 + Math.random() * 30, triggerLightning);
        };
        gsap.delayedCall(15, triggerLightning);

        // Heat distortion oscillation
        gsap.to("#heat-turb", {
          attr: { baseFrequency: "0.015 0.05" },
          duration: 4,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut"
        });

        // Lava animated gradients
        gsap.to(".lava-grad-stop-1", { attr: { offset: "20%" }, duration: 2.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
        gsap.to(".lava-grad-stop-2", { attr: { offset: "60%" }, duration: 3.5, yoyo: true, repeat: -1, ease: "sine.inOut" });

        // Lava vein flow
        gsap.utils.toArray<SVGPathElement>(".lava-vein-flow").forEach((el) => {
          const len = el.getTotalLength() || 1000;
          el.style.strokeDasharray = `${len * 0.3} ${len * 0.7}`;
          gsap.fromTo(el,
            { strokeDashoffset: len },
            { strokeDashoffset: -len, duration: 4 + Math.random() * 4, repeat: -1, ease: "none" }
          );
        });
      }
    },
    { scope: containerRef },
  );

  // Canvas particles: embers + smoke + ash
  const initParticles = useCallback((w: number, h: number) => {
    const isMobile = window.innerWidth < 768;
    const emberCount = isMobile ? 70 : 130;
    const smokeCount = isMobile ? 20 : 35;
    const ashCount = isMobile ? 10 : 20;

    // Peak positions mapped from SVG coords (1600 wide) to screen
    const leftPeakX = w * (510 / 1600);
    const rightPeakX = w * (910 / 1600);
    const peakY = h * 0.52;

    const embers: VolcanoParticle[] = Array.from({ length: emberCount }).map(() => {
      const fromRight = Math.random() > 0.35;
      const isSkyEmber = Math.random() < 0.20; // 20% spawn across full sky
      const spawnX = isSkyEmber
        ? w * (0.1 + Math.random() * 0.8)
        : fromRight
          ? rightPeakX + (Math.random() - 0.5) * w * 0.50
          : leftPeakX + (Math.random() - 0.5) * w * 0.50;
      return {
        x: spawnX,
        y: isSkyEmber
          ? h * (0.15 + Math.random() * 0.35)
          : peakY + (Math.random() - 0.3) * h * 0.12,
        vy: -(0.15 + Math.random() * 0.45),
        vx: (Math.random() - 0.5) * 0.3,
        vxPhase: Math.random() * Math.PI * 2,
        vxAmp: 0.1 + Math.random() * 0.4,
        size: isSkyEmber ? 0.3 + Math.random() * 1.0 : 0.4 + Math.random() * 1.8,
        opacity: 0,
        maxOpacity: isSkyEmber ? 0.5 + Math.random() * 0.4 : 0.6 + Math.random() * 0.4,
        hue: 15 + Math.random() * 30,
        life: Math.random(),
        lifeSpeed: isSkyEmber ? 0.0005 + Math.random() * 0.0012 : 0.0008 + Math.random() * 0.0018,
        kind: "ember" as const,
      };
    });

    const smoke: VolcanoParticle[] = Array.from({ length: smokeCount }).map(() => {
      const fromRight = Math.random() > 0.45;
      const spawnX = fromRight
        ? rightPeakX + (Math.random() - 0.4) * w * 0.10
        : leftPeakX + (Math.random() - 0.6) * w * 0.10;
      return {
        x: spawnX,
        y: peakY - Math.random() * h * 0.04,
        vy: -(0.12 + Math.random() * 0.20),
        vx: fromRight ? 0.05 + Math.random() * 0.14 : -(0.05 + Math.random() * 0.14),
        vxPhase: Math.random() * Math.PI * 2,
        vxAmp: 0.15 + Math.random() * 0.45,
        size: 70 + Math.random() * 110,
        opacity: 0,
        maxOpacity: 0.15 + Math.random() * 0.1,
        hue: 28, // Dark brown defaults
        life: Math.random(),
        lifeSpeed: 0.0003 + Math.random() * 0.0006,
        kind: "smoke" as const,
      };
    });

    const ash: VolcanoParticle[] = Array.from({ length: ashCount }).map(() => {
      return {
        x: Math.random() * w,
        y: Math.random() * h * 0.5,
        vy: 0.2 + Math.random() * 0.4,
        vx: 0.5 + Math.random() * 0.5,
        vxPhase: 0,
        vxAmp: 0,
        size: 1 + Math.random() * 2,
        opacity: 0,
        maxOpacity: 0.4 + Math.random() * 0.4,
        hue: 0,
        life: Math.random(),
        lifeSpeed: 0.001 + Math.random() * 0.002,
        kind: "ash" as const,
      };
    });

    particlesRef.current = [...smoke, ...ash, ...embers];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const peakPos = { leftX: 0, rightX: 0, y: 0 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      peakPos.leftX = canvas.width * (510 / 1600);
      peakPos.rightX = canvas.width * (910 / 1600);
      peakPos.y = canvas.height * 0.52;
      if (particlesRef.current.length === 0) {
        initParticles(canvas.width, canvas.height);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const onVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) rafRef.current = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);

    let lastFrame = 0;
    const TARGET_INTERVAL = 1000 / 30; // 30fps for decorative background

    function draw(now = 0) {
      if (pausedRef.current || !ctx || !canvas) return;

      rafRef.current = requestAnimationFrame(draw);
      if (now - lastFrame < TARGET_INTERVAL) return;
      lastFrame = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Bubbling Lava
      if (Math.random() < 0.03 && !isReducedMotion) {
        const xOffset = (Math.random() - 0.5) * 40;
        bubblesRef.current.push({
          x: peakPos.rightX + 50 + xOffset, // Rough estimate of base location
          y: canvas.height * 0.9 + Math.random() * 50,
          r: 1,
          maxR: 5 + Math.random() * 10,
          opacity: 1,
          life: 0,
          lifeSpeed: 0.04 + Math.random() * 0.03
        });
      }

      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];
        b.life += b.lifeSpeed;
        if (b.life >= 1.0) {
          bubblesRef.current.splice(i, 1);
          continue;
        }
        b.r = b.maxR * b.life;
        b.opacity = 1.0 - Math.pow(b.life, 2);

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 120, 20, ${b.opacity * 0.8})`;
        ctx.fillStyle = `rgba(255, 60, 0, ${b.opacity * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fill();
      }

      // Lightning
      const l = lightningRef.current;
      if (l) {
        if (l.life > 0) {
          // Ambient flash
          ctx.fillStyle = `rgba(255,200,150,${l.life * 0.06})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Glow
          ctx.strokeStyle = `rgba(255, 230, 200, ${l.life * 0.3})`;
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke(l.glow);

          // Forks
          ctx.strokeStyle = `rgba(255, 240, 220, ${l.life * 0.6})`;
          ctx.lineWidth = 1;
          ctx.stroke(l.forks);

          // Main Core
          ctx.strokeStyle = `rgba(255, 255, 255, ${l.life})`;
          ctx.lineWidth = 2;
          ctx.stroke(l.path);

          l.life -= 0.15; // Decay
        } else {
          lightningRef.current = null;
        }
      }

      // Draw all particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];

        if (p.kind === "ballistic") {
          p.vy += p.gravity || 0;
          p.x += p.vx;
          p.y += p.vy;
          p.life += p.lifeSpeed;
          p.opacity = p.maxOpacity * (1 - p.life);

          if (!p.trail) p.trail = [];
          p.trail.unshift({ x: p.x, y: p.y });
          if (p.trail.length > 4) p.trail.pop();

          if (p.life >= 1 || p.y > canvas.height) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          if (p.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let j = 1; j < p.trail.length; j++) {
              ctx.lineTo(p.trail[j].x, p.trail[j].y);
            }
            ctx.strokeStyle = `hsla(${p.hue}, 90%, 65%, ${p.opacity * 0.8})`;
            ctx.lineWidth = p.size;
            ctx.lineCap = "round";
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 100%, 80%, ${p.opacity})`;
          ctx.fill();

        } else {
          p.life += p.lifeSpeed;
          if (p.life >= 1) {
            p.life = 0;
            const isSmoke = p.kind === "smoke";
            const isAsh = p.kind === "ash";
            const fromRight = isSmoke ? Math.random() > 0.45 : Math.random() > 0.35;
            const isSkyEmber = !isSmoke && !isAsh && Math.random() < 0.20;

            if (isSkyEmber) {
              p.x = canvas.width * (0.1 + Math.random() * 0.8);
              p.y = canvas.height * (0.15 + Math.random() * 0.35);
              p.vy = -(0.15 + Math.random() * 0.45);
              p.vx = (Math.random() - 0.5) * 0.3;
              p.size = 0.3 + Math.random() * 1.0;
              p.maxOpacity = 0.5 + Math.random() * 0.4;
              p.lifeSpeed = 0.0005 + Math.random() * 0.0012;
            } else if (isAsh) {
              p.x = Math.random() * canvas.width;
              p.y = Math.random() * canvas.height * 0.5;
              p.vy = 0.2 + Math.random() * 0.4;
              p.vx = 0.5 + Math.random() * 0.5;
            } else if (fromRight) {
              p.x = peakPos.rightX + (Math.random() - (isSmoke ? 0.4 : 0.5)) * canvas.width * (isSmoke ? 0.10 : 0.50);
              if (isSmoke) p.vx = 0.05 + Math.random() * 0.12;
            } else {
              p.x = peakPos.leftX + (Math.random() - (isSmoke ? 0.6 : 0.5)) * canvas.width * (isSmoke ? 0.10 : 0.50);
              if (isSmoke) p.vx = -(0.05 + Math.random() * 0.12);
            }

            if (!isSkyEmber && !isAsh) {
              p.y = peakPos.y + (isSmoke ? -Math.random() * canvas.height * 0.04 : (Math.random() - 0.3) * canvas.height * 0.12);
            }
            if (!isSmoke && !isSkyEmber && !isAsh) {
              p.vy = -(0.15 + Math.random() * 0.45);
              p.vx = (Math.random() - 0.5) * 0.3;
            }
          }

          p.y += p.vy;
          p.x += p.vx + Math.sin(p.life * Math.PI * 2 + p.vxPhase) * p.vxAmp;
          p.opacity = p.maxOpacity * Math.sin(p.life * Math.PI);

          if (eruptionActiveRef.current) {
            p.opacity *= 1.3; // Eruption brightness boost
          }

          if (p.kind === "smoke") {
            const currentSize = p.size * (1 + p.life * 2.2);
            const isHigh = p.y < canvas.height * 0.3;
            // Near lava veins got warm tint
            const isOverVein = p.x > canvas.width * 0.4 && p.y > peakPos.y;
            const rBase = isOverVein ? 190 : (isHigh ? 90 : 130);
            const gBase = isHigh ? 90 : 65;
            const bBase = isHigh ? 90 : 22;

            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
            grad.addColorStop(0, `rgba(${rBase},${gBase},${bBase},${p.opacity})`);
            grad.addColorStop(0.3, `rgba(${rBase - 30},${gBase - 20},${bBase},${p.opacity * 0.5})`);
            grad.addColorStop(0.6, `rgba(${rBase - 70},${gBase - 40},${bBase},${p.opacity * 0.15})`);
            grad.addColorStop(1, `rgba(0,0,0,0)`);

            ctx.beginPath();
            ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
          } else if (p.kind === "ash") {
            ctx.fillStyle = `rgba(30, 25, 20, ${p.opacity * 0.8})`;
            ctx.fillRect(p.x, p.y, p.size, p.size);
          } else {
            // Motion blur trail for larger embers
            if (p.size > 1.5) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
              ctx.strokeStyle = `hsla(${p.hue}, 90%, 55%, ${p.opacity * 0.3})`;
              ctx.lineWidth = p.size * 0.4;
              ctx.lineCap = "round";
              ctx.stroke();
            }
            // Subtle glow halo — only for larger embers
            if (p.size > 1.5) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${p.hue}, 90%, 50%, ${p.opacity * 0.12})`;
              ctx.fill();
            }
            // Ember core — sharp pinpoint
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.opacity})`;
            ctx.fill();
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [initParticles]);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#0a0504]">
      {/* Layer 0: Background image */}
      <img
        src="/themes/vulcan-bg.webp"
        alt=""
        fetchPriority="high"
        decoding="async"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          zIndex: 0,
          animation: 'vulcan-image-breathe 14s ease-in-out infinite',
          willChange: 'filter'
        }}
      />

      {/* Layer 1.1: Faint stars in upper 40% */}
      <div className="absolute top-0 left-0 right-0 h-[40%]" style={{
        boxShadow: "20vw 10vh 0 0px rgba(255,240,220,0.3), 10vw 20vh 0 0px rgba(255,240,220,0.2), 80vw 30vh 0 0px rgba(255,240,220,0.25), 40vw 5vh 0 0px rgba(255,240,220,0.15), 60vw 25vh 0 0px rgba(255,240,220,0.2), 5vw 35vh 0 0px rgba(255,240,220,0.2), 70vw 15vh 0 0px rgba(255,240,220,0.3), 90vw 5vh 0 0px rgba(255,240,220,0.15), 30vw 30vh 0 0px rgba(255,240,220,0.2), 50vw 10vh 0 0px rgba(255,240,220,0.2)",
        width: "2px",
        height: "2px",
        borderRadius: "50%",
        opacity: 0.8
      }} />

      {/* Layer 1.2: Atmospheric haze */}
      <div className="absolute w-full h-[25%] top-[40%]" style={{
        background: "linear-gradient(180deg, transparent 0%, rgba(60,20,5,0.15) 50%, rgba(80,30,10,0.3) 100%)"
      }} />
      <div className="absolute w-full h-[10%] top-[65%]" style={{
        background: "linear-gradient(180deg, rgba(80,30,10,0.3) 0%, rgba(100,40,15,0.4) 100%)"
      }} />

      {/* Layer 1.3: Volcanic cloud illumination (animated by GSAP opacity) */}
      <div className="volcanic-cloud absolute pointer-events-none" style={{
        left: "40%", top: "15%", width: "40%", height: "40%",
        background: "radial-gradient(ellipse at center, rgba(180,60,10,0.15) 0%, rgba(100,30,5,0.05) 50%, transparent 100%)",
        animation: !isReducedMotion ? "pulse 8s ease-in-out infinite alternate" : "none"
      }} />

      {/* Layer 2: Background Mountain Silhouette (Parallax depth) */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[55%] opacity-50"
        viewBox="0 0 1600 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,700 L0,480 L150,450 L250,380 L350,340 L450,220 L550,240 L650,200 L750,230 L850,150 L950,210 L1050,300 L1200,380 L1400,450 L1600,480 L1600,700 Z" fill="#080604" />
      </svg>

      {/* Layer 3: Main Mountain + Lava veins */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[52%]"
        viewBox="0 0 1600 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="v-glow-sm" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
          <filter id="v-glow-md" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="v-glow-lg" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="v-glow-xl" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="v-glow-xxl" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="v-glow-ridge" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>

          <filter id="heat-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence id="heat-turb" type="fractalNoise" baseFrequency="0.015 0.04" numOctaves="3" result="noise">
              {!isReducedMotion && <animate attributeName="seed" values="1;50;1" dur="8s" repeatCount="indefinite" />}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <filter id="mountain-texture" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0" in="noise" result="coloredNoise" />
            <feComposite in="coloredNoise" in2="SourceGraphic" operator="in" result="texture" />
            <feComposite in="SourceGraphic" in2="texture" operator="over" />
          </filter>

          <linearGradient id="lava-river-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop className="lava-grad-stop-1" offset="20%" stopColor="#FFEEAA" />
            <stop className="lava-grad-stop-2" offset="60%" stopColor="#FF8800" />
            <stop offset="100%" stopColor="#FF2200" />
          </linearGradient>

          <filter id="lava-center-turb" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" result="noise">
              {!isReducedMotion && <animate attributeName="seed" values="1;20;1" dur="5s" repeatCount="indefinite" />}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Mountain fill — jet-black, textured */}
        <path d={MOUNTAIN_PATH} fill="#0c0a08" filter="url(#mountain-texture)" />

        {/* ==== RIDGE EDGE LIGHTING — warm rim light along mountain contours ==== */}
        {/* Far-left foothills */}
        <path d="M0,520 L50,510 L100,490 L140,470 L180,440" stroke="#FF6040" strokeOpacity={0.10} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#v-glow-ridge)" />
        {/* Left foothills up to left peak */}
        <path d="M180,440 L210,410 L240,380 L265,355 L280,340 L290,330 L300,335 L315,350 L340,370 L360,365 L380,350 L395,330 L420,290 L438,258 L448,265 L458,240 L468,222 L478,198 L488,168 L496,150 L502,140 L508,128 L510,125" stroke="#FF8040" strokeOpacity={0.18} strokeWidth={2.0} strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#v-glow-ridge)" />
        {/* Left peak to saddle */}
        <path d="M510,125 L513,128 L516,138 L520,145 L524,152 L530,155 L545,180 L565,210 L590,240 L620,268 L655,290 L690,305 L720,312 L745,310 L768,302" stroke="#FF7030" strokeOpacity={0.14} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#v-glow-ridge)" />
        {/* Saddle to right peak */}
        <path d="M768,302 L790,285 L815,255 L838,225 L858,195 L876,165 L890,142 L900,128 L906,115 L910,112" stroke="#FF6030" strokeOpacity={0.22} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#v-glow-ridge)" />
        {/* Right peak descent — brightest, near main lava river */}
        <path d="M910,112 L914,115 L920,130 L930,148 L942,172 L958,205 L976,240 L998,278 L1022,315 L1050,350 L1085,385 L1125,415" stroke="#FF5020" strokeOpacity={0.25} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#v-glow-ridge)" />
        {/* Right foothills */}
        <path d="M1125,415 L1175,445 L1240,472 L1320,498 L1420,518 L1510,530" stroke="#FF6040" strokeOpacity={0.10} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#v-glow-ridge)" />

        {/* ==== MAIN LAVA RIVER — Tapered filled polygon + centerline ==== */}
        {/* Layer 1: Wide ambient heat bloom */}
        <path d={MAIN_LAVA_RIVER_FILL} fill="#FF2200" fillOpacity={0.08} stroke="none" filter="url(#v-glow-xxl)" />
        {/* Layer 2: Outer glow (animated) */}
        <path className="lava-river-glow" d={MAIN_LAVA_RIVER_FILL} fill="#FF3300" fillOpacity={0.18} stroke="none" filter="url(#v-glow-lg)" />
        {/* Layer 3: Bright body fill — slightly blurred edges */}
        <path d={MAIN_LAVA_RIVER_FILL} fill="#FF4400" fillOpacity={0.45} stroke="none" filter="url(#v-glow-sm)" />
        {/* Layer 4: Core fill — animated gradient */}
        <path d={MAIN_LAVA_RIVER_FILL} fill="url(#lava-river-grad)" fillOpacity={0.60} stroke="none" />
        {/* Layer 5: Yellow-orange centerline glow */}
        <path d={MAIN_LAVA_RIVER_CENTER} stroke="#FF8800" strokeOpacity={0.70} strokeWidth={4.0} strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#v-glow-md)" />
        {/* Layer 6: White-hot centerline with turbulence */}
        <path d={MAIN_LAVA_RIVER_CENTER} stroke="#FFDD66" strokeOpacity={0.85} strokeWidth={2.0} strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#lava-center-turb)" />
        {/* Layer 7: Brightest inner pinpoint */}
        <path d={MAIN_LAVA_RIVER_CENTER} stroke="#FFEEAA" strokeOpacity={0.65} strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Wide bloom layer behind thicker veins for ambient heat */}
        {LAVA_VEINS.filter((v) => v.w >= 1.0).map((v, i) => (
          <path
            key={`bloom-${i}`}
            d={v.d}
            stroke={v.color}
            strokeOpacity={v.opacity * 0.15}
            strokeWidth={v.w * 5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#v-glow-xl)"
          />
        ))}

        {/* Outer glow layer — softer, animated pulse */}
        {LAVA_VEINS.map((v, i) => (
          <path
            key={`glow-${i}`}
            className={`lava-glow-layer ${v.w >= 0.8 ? 'lava-vein-flow' : ''}`}
            d={v.d}
            stroke={v.color}
            strokeOpacity={v.opacity * 0.50}
            strokeWidth={v.w * 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter={v.w >= 1.0 ? "url(#v-glow-lg)" : "url(#v-glow-md)"}
          />
        ))}

        {/* Bright core layer — sharp, always visible */}
        {LAVA_VEINS.map((v, i) => (
          <path
            key={`core-${i}`}
            d={v.d}
            stroke={v.color}
            strokeOpacity={v.opacity}
            strokeWidth={v.w}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#v-glow-sm)"
          />
        ))}
      </svg>

      {/* Layer 3.5: Heat Distortion Zone (above peaks) */}
      {!isReducedMotion && <div className="absolute top-[35%] left-[30%] w-[40%] h-[25%] pointer-events-none" style={{ backdropFilter: "url(#heat-distortion)" }} />}

      {/* Layer 4: Crater glows — focused at summit tips */}
      {/* Left peak crater glow */}
      <div
        className="crater-glow absolute pointer-events-none"
        style={{
          left: "29.5%", bottom: "40.5%", width: "5%", height: "6%",
          background: "radial-gradient(ellipse at 50% 60%, rgba(255,160,60,0.60) 0%, rgba(255,120,30,0.22) 40%, transparent 70%)",
          filter: "blur(8px)",
          transformOrigin: "center 60%",
        }}
      />
      {/* Right peak crater glow */}
      <div
        className="crater-glow absolute pointer-events-none"
        style={{
          left: "54%", bottom: "41.5%", width: "6%", height: "8%",
          background: "radial-gradient(ellipse at 50% 60%, rgba(255,100,10,0.80) 0%, rgba(255,80,0,0.30) 40%, transparent 70%)",
          filter: "blur(10px)",
          transformOrigin: "center 60%",
        }}
      />
      {/* Right peak white-hot center */}
      <div
        className="crater-glow absolute pointer-events-none"
        style={{
          left: "55.8%", bottom: "42.5%", width: "2.5%", height: "3%",
          background: "radial-gradient(ellipse at 50% 60%, rgba(255,230,100,0.60) 0%, rgba(255,180,40,0.20) 50%, transparent 80%)",
          filter: "blur(5px)",
          transformOrigin: "center 60%",
        }}
      />

      {/* Layer 4b: Subtle warm haze at mountain base */}
      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: "12%",
          background: "linear-gradient(to top, rgba(40,15,5,0.15) 0%, rgba(30,10,3,0.06) 50%, transparent 100%)",
        }}
      />

      {/* Layer 5: Canvas particles (embers + smoke) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Layer 6: Noise overlay */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <filter id="volcano-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ filter: "url(#volcano-noise)", opacity: 0.015, zIndex: 2 }}
      />
    </div>
  );
}

/* ================================================================
   OCEAN — Deep underwater cave with bioluminescence
   ================================================================ */

type OceanParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vxPhase: number;
  vxAmp: number;
  size: number;
  opacity: number;
  maxOpacity: number;
  life: number;
  lifeSpeed: number;
  kind: "bio" | "snow" | "bubble";
  r: number;
  g: number;
  b: number;
  glowR?: number;
  glowG?: number;
  glowB?: number;
};

function OceanBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<OceanParticle[]>([]);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const isReducedMotion = useReducedMotion();

  const [jellyfish, setJellyfish] = useState<{ id: number; left: number; top: number; size: number; colorIndex: number; delay: number; duration: number; pulseDuration: number; }[]>([]);
  const [smallFish, setSmallFish] = useState<{ id: number; top: number; size: number; duration: number; delay: number; goingRight: boolean; colorIndex: number; }[]>([]);

  const BIO_COLORS = [
    { r: 100, g: 220, b: 255, gr: 14, gg: 165, gb: 233 },
    { r: 200, g: 120, b: 255, gr: 168, gg: 85, gb: 247 },
    { r: 255, g: 130, b: 200, gr: 236, gg: 72, gb: 153 },
    { r: 100, g: 255, b: 218, gr: 45, gg: 212, gb: 191 },
    { r: 255, g: 200, b: 100, gr: 251, gg: 191, gb: 36 },
    { r: 180, g: 240, b: 255, gr: 125, gg: 211, gb: 252 },
  ];

  const JELLY_COLORS = [
    { fill: "rgba(100, 220, 255, 0.5)", inner: "rgba(100, 220, 255, 1)", outer: "rgba(14, 165, 233, 0.4)", stroke: "rgba(100, 220, 255, 0.7)" },
    { fill: "rgba(200, 120, 255, 0.5)", inner: "rgba(200, 120, 255, 1)", outer: "rgba(168, 85, 247, 0.4)", stroke: "rgba(200, 120, 255, 0.7)" },
    { fill: "rgba(255, 130, 200, 0.5)", inner: "rgba(255, 130, 200, 1)", outer: "rgba(236, 72, 153, 0.4)", stroke: "rgba(255, 130, 200, 0.7)" },
    { fill: "rgba(100, 255, 218, 0.5)", inner: "rgba(100, 255, 218, 1)", outer: "rgba(45, 212, 191, 0.4)", stroke: "rgba(100, 255, 218, 0.7)" },
    { fill: "rgba(255, 200, 100, 0.5)", inner: "rgba(255, 200, 100, 1)", outer: "rgba(251, 191, 36, 0.4)", stroke: "rgba(255, 200, 100, 0.7)" },
    { fill: "rgba(180, 240, 255, 0.5)", inner: "rgba(180, 240, 255, 1)", outer: "rgba(125, 211, 252, 0.4)", stroke: "rgba(180, 240, 255, 0.7)" },
  ];

  const FISH_COLORS = [
    { body: "rgba(100, 220, 255, 0.6)", glow: "rgba(14, 165, 233, 0.3)" },
    { body: "rgba(100, 255, 218, 0.55)", glow: "rgba(45, 212, 191, 0.3)" },
    { body: "rgba(255, 180, 220, 0.5)", glow: "rgba(236, 72, 153, 0.25)" },
    { body: "rgba(180, 240, 255, 0.5)", glow: "rgba(125, 211, 252, 0.25)" },
    { body: "rgba(200, 160, 255, 0.5)", glow: "rgba(168, 85, 247, 0.25)" },
  ];

  const initParticles = useCallback((w: number, h: number) => {
    const isMobile = window.innerWidth < 768;
    const bioCount = isMobile ? 60 : 120;
    const snowCount = isMobile ? 15 : 30;

    const particles: OceanParticle[] = [];

    for (let i = 0; i < bioCount; i++) {
      const color = BIO_COLORS[Math.floor(Math.random() * BIO_COLORS.length)];
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(0.05 + Math.random() * 0.15),
        vxPhase: Math.random() * Math.PI * 2,
        vxAmp: 0.1 + Math.random() * 0.3,
        size: 0.8 + Math.random() * 2,
        opacity: 0,
        maxOpacity: 0.6 + Math.random() * 0.4,
        life: Math.random(),
        lifeSpeed: 0.001 + Math.random() * 0.002,
        kind: "bio",
        r: color.r, g: color.g, b: color.b,
        glowR: color.gr, glowG: color.gg, glowB: color.gb,
      });
    }

    for (let i = 0; i < snowCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.1,
        vy: 0.08 + Math.random() * 0.17,
        vxPhase: Math.random() * Math.PI * 2,
        vxAmp: 0.05 + Math.random() * 0.1,
        size: 0.5 + Math.random() * 1.5,
        opacity: 0.3 + Math.random() * 0.3,
        maxOpacity: 1,
        life: 0, lifeSpeed: 0, kind: "snow",
        r: 200, g: 220, b: 240,
      });
    }

    particlesRef.current = particles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const jellyCount = isMobile ? 3 : 5;
    const fishCount = isMobile ? 4 : 6;

    setJellyfish(
      Array.from({ length: jellyCount }).map((_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        top: 20 + Math.random() * 60,
        size: 30 + Math.random() * 50,
        colorIndex: Math.floor(Math.random() * JELLY_COLORS.length),
        delay: Math.random() * -20,
        duration: 12 + Math.random() * 8,
        pulseDuration: 4 + Math.random() * 2,
      }))
    );

    setSmallFish(
      Array.from({ length: fishCount }).map((_, i) => ({
        id: i,
        top: 15 + Math.random() * 70,
        size: 6 + Math.random() * 12,
        duration: 22 + Math.random() * 20,
        delay: -(Math.random() * 40),
        goingRight: i < fishCount / 2,
        colorIndex: Math.floor(Math.random() * FISH_COLORS.length),
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      if (!isReducedMotion) {
        gsap.utils.toArray<HTMLElement>(".triton-ray").forEach((ray, i) => {
          gsap.to(ray, {
            scaleX: 1.15,
            duration: 8 + (i % 3) * 2,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
          });

          gsap.fromTo(ray,
            { opacity: 0.6 },
            {
              opacity: 1.0,
              duration: 10 + (i % 4) * 2,
              yoyo: true,
              repeat: -1,
              ease: "sine.inOut",
              delay: i * -1.5
            }
          );
        });

        gsap.utils.toArray<HTMLElement>(".jellyfish").forEach((el, i) => {
          gsap.to(el, { x: 20, y: -20, duration: 12 + i * 2, yoyo: true, repeat: -1, ease: "sine.inOut" });
          gsap.fromTo(el, { opacity: 0.3 }, { opacity: 0.7, duration: 4 + i, yoyo: true, repeat: -1, ease: "sine.inOut" });

          const bell = el.querySelector('.jelly-bell');
          if (bell) gsap.to(bell, { scale: 1.08, transformOrigin: 'center', duration: 3 + i, yoyo: true, repeat: -1, ease: "sine.inOut" });

          const tentacles = el.querySelectorAll('.jelly-tentacle');
          tentacles.forEach((t, j) => {
            gsap.to(t, { rotation: 10 + j * 2, transformOrigin: 'top center', duration: 2.5 + j * 0.4, yoyo: true, repeat: -1, ease: "sine.inOut", delay: j * -0.5 });
          });
        });

        const triggerAnglerFish = () => {
          if (pausedRef.current || !containerRef.current) {
            gsap.delayedCall(5, triggerAnglerFish);
            return;
          }

          const isRightToLeft = Math.random() > 0.5;
          const topPercent = 25 + Math.random() * 40;
          const container = containerRef.current.querySelector('.angler-container');

          if (container) {
            gsap.set(container, {
              top: `${topPercent}%`,
              left: isRightToLeft ? window.innerWidth + 200 : -200,
              scaleX: isRightToLeft ? -1 : 1,
              opacity: 1
            });

            const lure = container.querySelector('.angler-lure');
            const svg = container.querySelector('.angler-svg');

            const lureAnim = gsap.to(lure, { scale: 1.3, opacity: 1, duration: 1.5, yoyo: true, repeat: -1 });
            const bobAnim = gsap.to(svg, { y: 16, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' });

            gsap.to(container, {
              x: isRightToLeft ? -(window.innerWidth + 400) : window.innerWidth + 400,
              duration: 10 + Math.random() * 4,
              ease: "none",
              onComplete: () => {
                gsap.set(container, { opacity: 0, x: 0 });
                lureAnim.kill();
                bobAnim.kill();
              }
            });
          }

          gsap.delayedCall(90 + Math.random() * 60, triggerAnglerFish);
        };
        gsap.delayedCall(90 + Math.random() * 60, triggerAnglerFish);

        const triggerPulseWave = () => {
          if (pausedRef.current || !containerRef.current) {
            gsap.delayedCall(5, triggerPulseWave);
            return;
          }

          gsap.fromTo(".triton-pulse-wave",
            { opacity: 0, scale: 0.8, transformOrigin: "center bottom" },
            {
              opacity: 1, scale: 1.5, duration: 1.5, ease: "sine.out",
              onComplete: () => {
                gsap.to(".triton-pulse-wave", { opacity: 0, duration: 2, ease: "sine.in" });
              }
            }
          );

          gsap.delayedCall(18 + Math.random() * 7, triggerPulseWave);
        };
        gsap.delayedCall(18, triggerPulseWave);

        const triggerRumble = () => {
          if (pausedRef.current || !containerRef.current) {
            gsap.delayedCall(5, triggerRumble);
            return;
          }

          gsap.to(containerRef.current, { x: 2, y: -1, duration: 0.08, yoyo: true, repeat: 5, ease: "sine.inOut" });

          const tl = gsap.timeline();
          tl.to(".triton-rumble-flash", { opacity: 0.06, duration: 0.3 })
            .to(".triton-rumble-flash", { opacity: 0, duration: 0.5 });

          gsap.delayedCall(45 + Math.random() * 45, triggerRumble);
        };
        gsap.delayedCall(45, triggerRumble);
      }
    },
    { scope: containerRef, dependencies: [isReducedMotion] }
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (particlesRef.current.length === 0) {
        initParticles(canvas.width, canvas.height);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const onVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) rafRef.current = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);

    let lastFrame = 0;
    const TARGET_INTERVAL = 1000 / 30;
    const VENTS = [0.2, 0.65, 0.85];

    function draw(now = 0) {
      if (pausedRef.current || !ctx || !canvas) return;
      rafRef.current = requestAnimationFrame(draw);
      if (now - lastFrame < TARGET_INTERVAL) return;
      lastFrame = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isReducedMotion) {
        if (Math.random() < 0.03) {
          const ventX = VENTS[Math.floor(Math.random() * VENTS.length)] * canvas.width;
          particlesRef.current.push({
            x: ventX + (Math.random() - 0.5) * 10,
            y: canvas.height + 10,
            vx: 0,
            vy: -(0.5 + Math.random() * 1.0),
            vxPhase: Math.random() * Math.PI * 2,
            vxAmp: 0.3 + Math.random() * 0.5,
            size: 2 + Math.random() * 2,
            opacity: 0,
            maxOpacity: 1,
            life: 0,
            lifeSpeed: 0,
            kind: "bubble",
            r: 14, g: 165, b: 233
          });
        }
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];

        if (p.kind === "bio") {
          if (!isReducedMotion) {
            p.life += p.lifeSpeed;
            if (p.life >= 1) {
              p.life = 0;
              p.x = Math.random() * canvas.width;
              p.y = Math.random() * canvas.height;
            }
            p.y += p.vy;
            p.x += p.vx + Math.sin(p.life * Math.PI * 2 + p.vxPhase) * p.vxAmp;
            p.opacity = p.maxOpacity * Math.sin(p.life * Math.PI);
          } else {
            p.opacity = p.maxOpacity * 0.5;
          }

          if (p.opacity > 0) {
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
            grad.addColorStop(0, `rgba(${p.glowR}, ${p.glowG}, ${p.glowB}, ${p.opacity * 0.4})`);
            grad.addColorStop(1, `rgba(${p.glowR}, ${p.glowG}, ${p.glowB}, 0)`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity})`;
            ctx.fill();
          }

        } else if (p.kind === "snow") {
          if (!isReducedMotion) {
            p.y += p.vy;
            p.x += p.vx + Math.sin(now * 0.001 + p.vxPhase) * p.vxAmp;
            if (p.y > canvas.height + 10) {
              p.y = -10;
              p.x = Math.random() * canvas.width;
            }
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity})`;
          ctx.fill();

        } else if (p.kind === "bubble") {
          if (!isReducedMotion) {
            p.y += p.vy;
            p.x += Math.sin(p.y * 0.02 + p.vxPhase) * p.vxAmp;
            p.size += 0.005;

            const progress = 1 - (p.y / canvas.height);
            const bubbleOpacity = progress > 0.7 ? Math.max(0, 1 - (progress - 0.7) / 0.3) : 1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(14, 165, 233, ${0.15 * bubbleOpacity})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 * bubbleOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            if (bubbleOpacity <= 0 || p.y < -10) {
              particlesRef.current.splice(i, 1);
            }
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [initParticles, isReducedMotion]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <img
        src="/themes/triton-bg.webp"
        alt=""
        fetchPriority="high"
        decoding="async"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          zIndex: 0,
          animation: 'triton-image-breathe 15s ease-in-out infinite',
          willChange: 'filter'
        }}
      />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 65% 55% at 50% 35%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.30) 55%, rgba(0,0,0,0.55) 100%)'
      }} />

      <div className="triton-caustics" />

      {[
        { left: "15%", angle: 12, width: 130, opacity: 0.14, dur: 10, delay: 0 },
        { left: "35%", angle: 5, width: 170, opacity: 0.11, dur: 12, delay: -3 },
        { left: "55%", angle: -6, width: 120, opacity: 0.13, dur: 11, delay: -6 },
        { left: "72%", angle: 18, width: 90, opacity: 0.10, dur: 14, delay: -9 },
        { left: "25%", angle: -10, width: 100, opacity: 0.09, dur: 16, delay: -5 },
        { left: "80%", angle: 8, width: 80, opacity: 0.08, dur: 13, delay: -11 },
      ].map((ray, i) => (
        <div
          key={i}
          className="triton-ray"
          style={{
            left: ray.left,
            width: `${ray.width}px`,
            height: "110%",
            background: `linear-gradient(180deg, rgba(125,211,252,${ray.opacity}) 0%, rgba(14,165,233,${ray.opacity * 0.3}) 40%, transparent 80%)`,
            "--ray-angle": `${ray.angle}deg`,
          } as React.CSSProperties}
        />
      ))}

      <div className="triton-pulse-wave absolute inset-0 pointer-events-none opacity-0" style={{
        background: "radial-gradient(ellipse at 50% 100%, rgba(14, 165, 233, 0.20) 0%, rgba(100, 220, 255, 0.08) 40%, transparent 70%)"
      }} />
      <div className="triton-rumble-flash absolute inset-0 pointer-events-none opacity-0 bg-[#0ea5e9]" />

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />

      {jellyfish.map((j) => {
        const c = JELLY_COLORS[j.colorIndex];
        return (
          <div
            key={j.id}
            className="jellyfish"
            style={{
              left: `${j.left}%`,
              top: `${j.top}%`,
              width: `${j.size}px`,
              height: `${j.size * 0.7}px`,
              filter: `drop-shadow(0 0 ${j.size / 2}px ${c.outer})`,
            }}
          >
            <svg width="100%" height="180%" viewBox="0 0 100 180" style={{ overflow: "visible" }}>
              <defs>
                <radialGradient id={`jelly-glow-${j.id}`}>
                  <stop offset="0%" stopColor={c.inner} stopOpacity="0.8" />
                  <stop offset="60%" stopColor={c.fill} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={c.fill} stopOpacity="0" />
                </radialGradient>
                <filter id="glow-blur">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
              </defs>
              {[40, 50, 60, 70].map((x, tIdx) => (
                <path
                  key={tIdx}
                  className="jelly-tentacle"
                  d={`M${x},40 C${x - 10},80 ${x + 10},120 ${x},160`}
                  fill="none"
                  stroke={c.stroke}
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              ))}
              <ellipse className="jelly-bell" cx="50" cy="35" rx="45" ry="30" fill={`url(#jelly-glow-${j.id})`} />
              <ellipse className="jelly-bell" cx="50" cy="35" rx="35" ry="20" fill={c.inner} filter="url(#glow-blur)" opacity="0.5" />
            </svg>
          </div>
        );
      })}

      {smallFish.map((fish) => {
        const color = FISH_COLORS[fish.colorIndex];
        return (
          <div
            key={fish.id}
            className={fish.goingRight ? "triton-fish-right" : "triton-fish-left"}
            style={{
              top: `${fish.top}%`,
              "--fish-duration": `${fish.duration}s`,
              "--fish-delay": `${fish.delay}s`,
              "--fish-size": `${fish.size}px`,
            } as React.CSSProperties}
          >
            <svg
              width={fish.size * 2.2}
              height={fish.size}
              viewBox="0 0 22 10"
              style={{ filter: `drop-shadow(0 0 ${fish.size * 0.5}px ${color.glow})` }}
            >
              <ellipse cx="10" cy="5" rx="8" ry="4" fill={color.body} />
              <polygon
                points={fish.goingRight ? "2,5 0,1 0,9" : "20,5 22,1 22,9"}
                fill={color.body}
              />
              <circle
                cx={fish.goingRight ? "15" : "7"}
                cy="4"
                r="1"
                fill="rgba(255,255,255,0.8)"
              />
            </svg>
          </div>
        );
      })}

      <div className="triton-big-fish">
        <svg width="120" height="40" viewBox="0 0 120 40" style={{ filter: "drop-shadow(0 0 8px rgba(14,165,233,0.15))" }}>
          <path
            d="M5,20 Q10,8 30,6 Q50,4 70,8 Q85,12 95,15 Q100,17 105,14 Q110,10 115,8 L118,12 L115,16 Q110,20 105,22 Q100,23 95,25 Q85,28 70,32 Q50,36 30,34 Q10,32 5,20 Z"
            fill="rgba(8,25,50,0.7)"
            stroke="rgba(14,165,233,0.15)"
            strokeWidth="0.5"
          />
          <circle cx="25" cy="18" r="2" fill="rgba(125,211,252,0.4)" />
          <path d="M25,22 Q50,30 90,24" fill="none" stroke="rgba(14,165,233,0.08)" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="angler-container absolute pointer-events-none opacity-0" style={{ zIndex: 2 }}>
        <svg className="angler-svg" width="160" height="100" viewBox="0 0 160 100" style={{ filter: "drop-shadow(0 0 10px rgba(4,14,30,0.5))" }}>
          <path d="M40,50 Q20,30 35,15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <circle className="angler-lure" cx="35" cy="15" r="4" fill="#a855f7" style={{ filter: "drop-shadow(0 0 10px #d8b4fe) drop-shadow(0 0 20px #a855f7)" }} opacity="0.5" />
          <g>
            <path d="M90,55 Q110,35 120,60" fill="rgba(6, 20, 42, 0.8)" />
            <path d="M20,60 C30,30 80,30 110,40 C140,50 150,60 155,70 C140,80 120,85 100,85 C60,85 30,75 20,60 Z" fill="rgba(4, 14, 30, 0.9)" stroke="rgba(14, 165, 233, 0.15)" strokeWidth="1" />
            <polygon points="150,70 160,50 160,90" fill="rgba(8, 25, 50, 0.85)" stroke="rgba(14, 165, 233, 0.1)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="1.5" fill="rgba(100, 255, 218, 0.8)" style={{ filter: "drop-shadow(0 0 4px #2dd4bf)" }} />
            <path d="M25,65 Q50,75 75,70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          </g>
        </svg>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1/3" style={{
        background: "linear-gradient(to top, rgba(2,8,23,0.8), transparent)",
        zIndex: 3
      }} />
    </div>
  );
}



/* ================================================================
   DASHBOARD BLACK HOLE — Uses shared RealisticBlackHole component
   ================================================================ */

/* ================================================================
   MAIN STARFIELD COMPONENT
   ================================================================ */

export function Starfield() {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();

  // When OS "Reduce motion" is enabled, render only static backgrounds
  if (reducedMotion) {
    const bg: Record<string, string> = {
      nebula: "#080c14",
      obsidian: "#0a0a0c",
      cipher: "#000000",
      vulcan: "linear-gradient(180deg, #1a0a00 0%, #0d0500 40%, #0a0300 100%)",
      triton: "linear-gradient(180deg, #020a18 0%, #001020 50%, #020a18 100%)",
      satoshi: "linear-gradient(180deg, #0a0806 0%, #0d0a05 50%, #0a0806 100%)",
      synthwave: "#0a0015",
      pangaea: "linear-gradient(180deg, #0a1a0a 0%, #061006 50%, #0a1a0a 100%)",
    };
    return (
      <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        style={{ background: bg[theme] ?? "var(--background)" }}
      >
        {/* Static star dots for dark theme */}
        {theme === "nebula" && (
          <>
            <div className="stars-small" />
            <div className="stars-medium" />
            <div className="stars-large" />
          </>
        )}
      </div>
    );
  }

  // Nebula mode — stars, violet shooting stars, purple nebula, floating space objects
  if (theme === "nebula") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: "#080c14" }}>
        <img
          src="/themes/nebula-bg.webp"
          alt=""
          fetchPriority="high"
          decoding="async"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            zIndex: 0,
            animation: 'nebula-image-breathe 18s ease-in-out infinite',
            willChange: 'filter'
          }}
        />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.55) 100%)'
        }} />
        <div className="stars-small" />
        <div className="stars-medium" />
        <div className="stars-large" />
        <div className="shooting-star" />
        <div className="shooting-star" />
        <div className="nebula-blob nebula-blob-1" />

        {/* Floating space objects — only 1 visible at a time (staggered long delays) */}
        {/* Comet — tapered tail with ice particles and bright nucleus */}
        <div className="space-object space-object-1">
          <svg width="100" height="16" viewBox="0 0 100 16" style={{ opacity: 0.65 }}>
            <defs>
              <linearGradient id="comet-tail" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="rgba(139,92,246,0)" />
                <stop offset="40%" stopColor="rgba(139,92,246,0.1)" />
                <stop offset="70%" stopColor="rgba(167,139,250,0.3)" />
                <stop offset="90%" stopColor="rgba(221,214,254,0.6)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.9)" />
              </linearGradient>
              <radialGradient id="comet-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="40%" stopColor="rgba(221,214,254,0.8)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0)" />
              </radialGradient>
            </defs>
            {/* Main tail — tapered shape */}
            <polygon points="0,7 0,9 88,6.5 88,9.5" fill="url(#comet-tail)" />
            {/* Secondary dust trail */}
            <polygon points="20,6 20,10 88,7 88,9" fill="rgba(167,139,250,0.15)" />
            {/* Ice particle dots trailing behind */}
            <circle cx="30" cy="6" r="0.6" fill="rgba(221,214,254,0.4)" />
            <circle cx="45" cy="10" r="0.5" fill="rgba(196,181,253,0.35)" />
            <circle cx="55" cy="5.5" r="0.7" fill="rgba(221,214,254,0.3)" />
            <circle cx="65" cy="11" r="0.4" fill="rgba(167,139,250,0.25)" />
            <circle cx="72" cy="7" r="0.5" fill="rgba(221,214,254,0.45)" />
            {/* Bright nucleus with glow */}
            <circle cx="91" cy="8" r="4" fill="url(#comet-glow)" style={{ filter: "drop-shadow(0 0 4px rgba(139,92,246,0.9)) drop-shadow(0 0 8px rgba(167,139,250,0.5))" }} />
            <circle cx="91" cy="8" r="1.5" fill="white" />
          </svg>
        </div>

      </div>
    );
  }

  // Obsidian — clean dark background with floating candles
  if (theme === "obsidian") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: "#0a0a0c" }}>
        <CandleBackground />
      </div>
    );
  }

  // Cipher mode — dense binary rain, no stars
  if (theme === "cipher") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: "#000000" }}>
        <MatrixRain />
        <div className="cipher-scanlines" />
      </div>
    );
  }

  // Vulcan mode — fiery eruption
  if (theme === "vulcan") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <VolcanoBackground />
      </div>
    );
  }

  // Triton mode — deep underwater cave
  if (theme === "triton") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <OceanBackground />
      </div>
    );
  }

  // Satoshi (formerly midas) — highest tier animated background
  if (theme === "satoshi") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <SatoshiBackground reducedMotion={reducedMotion} />
      </div>
    );
  }

  // Synthwave mode
  if (theme === "synthwave") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <SynthwaveBackground />
      </div>
    );
  }

  // Pangaea mode — lush jungle
  if (theme === "pangaea") {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <JungleBackground />
      </div>
    );
  }

  // Light mode: animated candlesticks
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ background: "var(--background)" }}>
      <CandleBackground />
    </div>
  );
}
