"use client";
import { useRef, useMemo, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type BlackHoleSize = "small" | "medium" | "large";
type BlackHoleColor = "purple" | "orange" | "blue" | "green" | "neutral";

const COLOR_PALETTES: Record<
  BlackHoleColor,
  { primary: string; bright: string; mid: string; glow: string; dark: string; voidEdge: string }
> = {
  purple: { primary: "139,92,246", bright: "221,214,254", mid: "150,120,255", glow: "200,180,255", dark: "91,33,182", voidEdge: "#0a0515" },
  orange: { primary: "249,115,22", bright: "254,215,170", mid: "251,146,60", glow: "253,186,116", dark: "194,65,12", voidEdge: "#150a05" },
  blue: { primary: "14,165,233", bright: "186,230,253", mid: "56,189,248", glow: "125,211,252", dark: "3,105,161", voidEdge: "#050a15" },
  green: { primary: "34,197,94", bright: "187,247,208", mid: "74,222,128", glow: "134,239,172", dark: "21,128,61", voidEdge: "#050f0a" },
  neutral: { primary: "161,161,170", bright: "228,228,231", mid: "212,212,216", glow: "244,244,245", dark: "82,82,91", voidEdge: "#0a0a0f" },
};

const SCALE_MAP: Record<BlackHoleSize, number> = { small: 0.25, medium: 0.55, large: 1 };

export function RealisticBlackHole({
  size = "large",
  opacity = 1,
  color = "purple",
}: {
  size?: BlackHoleSize;
  opacity?: number;
  color?: BlackHoleColor;
}) {
  const container = useRef<HTMLDivElement>(null);
  const tweensRef = useRef<gsap.core.Tween[]>([]);
  const reducedMotion = useReducedMotion();
  const c = COLOR_PALETTES[color];
  const scale = SCALE_MAP[size];

  const stars = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 800,
        scale: 0.2 + Math.random() * 1.5,
        opacity: 0.1 + Math.random() * 0.7,
        duration: 2 + Math.random() * 4,
        delay: Math.random() * 5,
        rotation: (Math.random() - 0.5) * 1440,
      })),
    [],
  );

  useGSAP(
    () => {
      if (!container.current || reducedMotion) return;
      const tweens: gsap.core.Tween[] = [];

      // 1. Container Breathing
      tweens.push(gsap.to(container.current, {
        y: -15,
        x: 10,
        rotationZ: 1,
        duration: 10,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      }));

      // 2. Accretion Disk Rotation
      tweens.push(gsap.to(".accretion-group", { rotationZ: -360, duration: 25, ease: "none", repeat: -1 }));
      tweens.push(gsap.to(".accretion-group-reverse", { rotationZ: 360, duration: 35, ease: "none", repeat: -1 }));

      // 3. Einstein Ring
      tweens.push(gsap.to(".einstein-ring", { rotationZ: -360, scale: 1.02, duration: 40, yoyo: true, repeat: -1, ease: "sine.inOut" }));

      // 4. Photon Sphere Pulse (transform-only — avoids boxShadow repaint)
      tweens.push(gsap.to(".photon-ring", {
        scale: 1.03,
        opacity: 0.85,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      }));

      // 5. Gravitational Lensing Ambient
      tweens.push(gsap.to(".gravity-ambient", { scale: 1.15, opacity: 0.7, duration: 6, yoyo: true, repeat: -1, ease: "power1.inOut" }));

      // 6. Particle field
      const starElements = gsap.utils.toArray(".bh-star") as HTMLElement[];
      starElements.forEach((star, index) => {
        const cfg = stars[index];
        if (!cfg) return;
        tweens.push(gsap.fromTo(
          star,
          { x: cfg.x, y: cfg.y, scale: cfg.scale, opacity: cfg.opacity },
          { x: 0, y: 0, scale: 0, opacity: 0, rotation: cfg.rotation, duration: cfg.duration, repeat: -1, delay: cfg.delay, ease: "power2.in" },
        ));
      });

      // Signal that GSAP is active — disables CSS fallback animations
      container.current?.setAttribute("data-gsap", "");

      tweensRef.current = tweens;
    },
    { scope: container, dependencies: [reducedMotion] },
  );

  // Pause animations when tab is hidden to save CPU/GPU
  useEffect(() => {
    function handleVisibility() {
      const tweens = tweensRef.current;
      if (!tweens.length) return;
      if (document.hidden) {
        tweens.forEach((t) => t.pause());
      } else {
        tweens.forEach((t) => t.resume());
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return (
    <div
      ref={container}
      className="absolute top-1/2 left-1/2 flex items-center justify-center"
      style={{
        transform: `translate(-50%, -50%) scale(${scale})`,
        perspective: 1200,
        transformStyle: "preserve-3d",
        willChange: "transform",
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      {/* 1. AGGREGATING MASS (Particle Field) */}
      <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
        {stars.map((star) => (
          <div
            key={star.id}
            className="bh-star absolute w-[3px] h-[3px] bg-white rounded-full mix-blend-screen"
            style={{ boxShadow: "0 0 12px 2px rgba(255,255,255,0.8)" }}
          />
        ))}
      </div>

      {/* 2. AMBIENT GRAVITY WELL */}
      <div
        className="gravity-ambient absolute w-[700px] h-[700px] md:w-[1300px] md:h-[1300px] rounded-full blur-[60px] md:blur-[80px] z-[0] pointer-events-none mix-blend-screen overflow-visible"
        style={{ background: `rgba(${c.primary},0.15)`, willChange: "transform" }}
      />
      <div
        className="gravity-ambient absolute w-[500px] h-[500px] md:w-[800px] md:h-[800px] rounded-full blur-[40px] md:blur-[60px] z-[0] pointer-events-none mix-blend-screen"
        style={{ background: `rgba(${c.mid},0.35)`, willChange: "transform" }}
      />

      {/* 3. EINSTEIN RING */}
      <div className="absolute z-10 flex items-center justify-center">
        <div className="einstein-ring relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full mix-blend-screen">
          <div
            className="absolute inset-0 rounded-full border-[10px] md:border-[20px] border-transparent opacity-80 blur-[8px] md:blur-[12px]"
            style={{ borderTopColor: `rgb(${c.glow})`, borderRightColor: "rgba(255,255,255,0.4)" }}
          />
          <div
            className="absolute inset-0 rounded-full border-[6px] md:border-[12px] border-transparent opacity-60 blur-[6px] md:blur-[8px]"
            style={{ borderBottomColor: `rgb(${c.mid})`, borderLeftColor: `rgb(${c.primary})` }}
          />
          <div className="absolute inset-[-40px] rounded-full border-[4px] border-white/20 blur-[15px]" />
        </div>
      </div>

      {/* 4. ACCRETION DISK (BACK HALF) */}
      <div className="absolute z-20 flex items-center justify-center" style={{ transformStyle: "preserve-3d", transform: "rotateX(78deg)" }}>
        <div className="accretion-group relative w-[600px] h-[600px] md:w-[1000px] md:h-[1000px]" style={{ willChange: "transform" }}>
          <div
            className="absolute inset-0 rounded-full opacity-90 mix-blend-screen"
            style={{
              background: `conic-gradient(from 0deg, rgba(${c.primary},0) 0%, rgba(${c.glow},0.7) 15%, #ffffff 30%, rgba(${c.primary},0.9) 50%, rgba(${c.primary},0) 70%, rgba(${c.mid},0.5) 100%)`,
              filter: "blur(12px)",
              boxShadow: `inset 0 0 100px rgba(${c.primary},1), 0 0 120px rgba(${c.glow},0.8)`,
            }}
          />
          <div className="absolute inset-10 border-[4px] md:border-[8px] rounded-full blur-[2px]" style={{ borderColor: "rgba(255,255,255,0.4)" }} />
          <div className="absolute inset-24 border-[2px] md:border-[6px] rounded-full border-dashed opacity-80" style={{ borderColor: `rgba(${c.mid},0.6)` }} />
          <div className="absolute inset-32 border-[10px] md:border-[20px] rounded-full blur-[8px]" style={{ borderColor: `rgba(${c.mid},0.3)` }} />
        </div>
      </div>

      <div className="absolute z-20 flex items-center justify-center" style={{ transformStyle: "preserve-3d", transform: "rotateX(78deg) rotateY(15deg)" }}>
        <div className="accretion-group-reverse relative w-[800px] h-[800px] md:w-[1200px] md:h-[1200px]" style={{ willChange: "transform" }}>
          <div
            className="absolute inset-0 rounded-full opacity-50 mix-blend-screen"
            style={{
              background: `conic-gradient(from 90deg, transparent 0%, rgba(${c.mid},0.4) 25%, transparent 50%, rgba(${c.glow},0.6) 75%, transparent 100%)`,
              filter: "blur(20px)",
              boxShadow: `0 0 200px rgba(${c.primary},0.2)`,
            }}
          />
        </div>
      </div>

      {/* 5. PHOTON RING */}
      <div
        className="photon-ring absolute w-[200px] h-[200px] md:w-[320px] md:h-[320px] rounded-full z-30 mix-blend-screen flex items-center justify-center border-[3px] md:border-[5px] border-white"
        style={{ boxShadow: `0 0 50px 10px rgba(${c.mid},0.9), inset 0 0 30px 5px rgba(255,255,255,0.8)` }}
      >
        <div className="absolute inset-[2px] border-[2px] rounded-full opacity-80" style={{ borderColor: `rgb(${c.glow})` }} />
        <div className="absolute inset-[-10px] border border-white/40 rounded-full blur-[4px]" />
      </div>

      {/* 6. EVENT HORIZON */}
      <div
        className="absolute w-[185px] h-[185px] md:w-[295px] md:h-[295px] bg-[#010002] rounded-full z-40 flex items-center justify-center overflow-hidden mix-blend-normal"
        style={{ boxShadow: "inset 0 0 100px rgba(0,0,0,1)" }}
      >
        <div className="w-full h-full bg-black rounded-full" />
        <div
          className="absolute w-[120%] h-[120%] opacity-50"
          style={{ background: `linear-gradient(to top right, black, black, ${c.voidEdge})` }}
        />
      </div>

      {/* 7. ACCRETION DISK (FRONT HALF OCCLUSION) */}
      <div
        className="absolute z-[50] flex items-center justify-center pointer-events-none"
        style={{ transform: "rotateX(78deg)", clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" }}
      >
        <div className="accretion-group relative w-[600px] h-[600px] md:w-[1000px] md:h-[1000px]">
          <div
            className="absolute inset-0 rounded-full opacity-90 mix-blend-screen"
            style={{
              background: `conic-gradient(from 0deg, rgba(${c.primary},0) 0%, rgba(${c.glow},0.7) 15%, #ffffff 30%, rgba(${c.primary},0.9) 50%, rgba(${c.primary},0) 70%, rgba(${c.mid},0.5) 100%)`,
              filter: "blur(10px)",
              boxShadow: `inset 0 0 100px rgba(${c.primary},1), 0 0 120px rgba(${c.glow},0.8)`,
            }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[30%] bg-white/40 blur-[30px] rounded-full mix-blend-screen" />
          <div className="absolute inset-10 border-[4px] md:border-[8px] rounded-full blur-[2px]" style={{ borderColor: "rgba(255,255,255,0.4)" }} />
          <div className="absolute inset-24 border-[2px] md:border-[6px] rounded-full border-dashed opacity-80" style={{ borderColor: `rgba(${c.mid},0.6)` }} />
          <div className="absolute inset-32 border-[10px] md:border-[20px] rounded-full blur-[8px]" style={{ borderColor: `rgba(${c.mid},0.3)` }} />
        </div>
      </div>

      <div
        className="absolute z-[50] flex items-center justify-center pointer-events-none"
        style={{ transform: "rotateX(78deg) rotateY(15deg)", clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" }}
      >
        <div className="accretion-group-reverse relative w-[800px] h-[800px] md:w-[1200px] md:h-[1200px]">
          <div
            className="absolute inset-0 rounded-full opacity-60 mix-blend-screen"
            style={{
              background: `conic-gradient(from 90deg, transparent 0%, rgba(${c.mid},0.4) 25%, transparent 50%, rgba(${c.glow},0.6) 75%, transparent 100%)`,
              filter: "blur(20px)",
              boxShadow: `0 0 200px rgba(${c.primary},0.2)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
