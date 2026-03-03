"use client";

import { useEffect, useRef } from "react";

type StarWarpProps = {
  onComplete: () => void;
};

type Star = {
  x: number;
  y: number;
  z: number;
  prevZ: number;
};

export function StarWarpTransition({ onComplete }: StarWarpProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Get accent color from CSS custom property
    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim() || "#8b5cf6";

    const STAR_COUNT = 200;
    const TOTAL_MS = 2500;
    const FADE_START = 2000;

    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: (Math.random() - 0.5) * w,
      y: (Math.random() - 0.5) * h,
      z: Math.random() * w,
      prevZ: 0,
    }));
    stars.forEach((s) => { s.prevZ = s.z; });

    const cx = w / 2;
    const cy = h / 2;

    let rafId: number;

    function draw(timestamp: number) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / TOTAL_MS, 1);

      // Speed ramps up over time
      const speed = 2 + progress * 40;

      ctx!.fillStyle = `rgba(0, 0, 0, ${progress < 0.05 ? progress / 0.05 : 1})`;
      ctx!.fillRect(0, 0, w, h);

      // Fade out phase
      let globalAlpha = 1;
      if (elapsed > FADE_START) {
        globalAlpha = 1 - (elapsed - FADE_START) / (TOTAL_MS - FADE_START);
      }

      for (const star of stars) {
        star.prevZ = star.z;
        star.z -= speed;
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * w;
          star.y = (Math.random() - 0.5) * h;
          star.z = w;
          star.prevZ = w;
        }

        const sx = (star.x / star.z) * w + cx;
        const sy = (star.y / star.z) * w + cy;
        const px = (star.x / star.prevZ) * w + cx;
        const py = (star.y / star.prevZ) * w + cy;

        const size = Math.max(0.5, (1 - star.z / w) * 3);

        ctx!.globalAlpha = globalAlpha * Math.min(1, (1 - star.z / w) * 2);

        if (progress < 0.2) {
          // Phase 1: dots
          ctx!.fillStyle = accent;
          ctx!.beginPath();
          ctx!.arc(sx, sy, size, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          // Phase 2+: streaks
          ctx!.strokeStyle = accent;
          ctx!.lineWidth = size;
          ctx!.beginPath();
          ctx!.moveTo(px, py);
          ctx!.lineTo(sx, sy);
          ctx!.stroke();
        }
      }

      ctx!.globalAlpha = 1;

      if (elapsed >= TOTAL_MS) {
        if (!doneRef.current) {
          doneRef.current = true;
          onComplete();
        }
        return;
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[10000] bg-black"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
