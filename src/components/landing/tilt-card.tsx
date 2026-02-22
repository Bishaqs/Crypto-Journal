"use client";

import { useRef, type ReactNode } from "react";

export function TiltCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -8;
    const rotateY = (x - 0.5) * 8;
    el.style.setProperty("--tilt-x", `${rotateX}deg`);
    el.style.setProperty("--tilt-y", `${rotateY}deg`);
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "2deg");
    el.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="transition-transform duration-200 ease-out"
        style={{
          transform: "perspective(1200px) rotateX(var(--tilt-x, 2deg)) rotateY(var(--tilt-y, 0deg))",
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
      {/* Reflection */}
      <div
        className="pointer-events-none h-20 mt-1 overflow-hidden rounded-2xl opacity-30"
        style={{
          transform: "scaleY(-1)",
          mask: "linear-gradient(to bottom, rgba(0,0,0,0.2), transparent 70%)",
          WebkitMask: "linear-gradient(to bottom, rgba(0,0,0,0.2), transparent 70%)",
          filter: "blur(2px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
