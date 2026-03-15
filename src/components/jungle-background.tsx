"use client";

import React, { useMemo } from 'react';

export function JungleBackground() {
  // Falling Leaves (15 leaves drifting down)
  const leaves = useMemo(() => {
    const colors = ["#1a5a1a", "#1e6b1e", "#2a7a2a", "#3a6a2a", "#2d5a1a"];
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 12 + Math.random() * 16,
      left: 5 + Math.random() * 90,
      drift: `${(Math.random() * 16) - 8}vw`,
      spin: `${180 + Math.random() * 540}deg`,
      duration: `${15 + Math.random() * 13}s`,
      delay: `${-(Math.random() * 28)}s`,
    }));
  }, []);

  // Fireflies (25 glowing particles)
  const fireflies = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      top: 15 + Math.random() * 70,
      size: 2 + Math.random() * 2,
      pulseDuration: 2 + Math.random() * 3,
      pulseDelay: -(Math.random() * 5),
      driftDuration: 8 + Math.random() * 8,
      driftDelay: -(Math.random() * 15),
      dx1: `${(Math.random() * 30) - 15}px`,
      dy1: `${(Math.random() * 30) - 15}px`,
      dx2: `${(Math.random() * 30) - 15}px`,
      dy2: `${(Math.random() * 30) - 15}px`,
      dx3: `${(Math.random() * 30) - 15}px`,
      dy3: `${(Math.random() * 30) - 15}px`,
    }));
  }, []);

  // Mist patches (4 drifting patches)
  const mistPatches = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      left: Math.random() * 60,
      top: i < 2 ? 10 + Math.random() * 20 : 50 + Math.random() * 30,
      width: 35 + Math.random() * 15,
      height: 15 + Math.random() * 10,
      duration: 20 + Math.random() * 15,
      delay: -(Math.random() * 30),
    }));
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', backgroundColor: '#0a1a0a', zIndex: 0 }}>

      {/* Layer 0: Background Image */}
      <img
        src="/themes/pangaea-bg.webp"
        alt=""
        fetchPriority="high"
        decoding="async"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* Layer 1: Dark vignette overlay for text readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.65) 100%)',
        zIndex: 1,
      }} />

      {/* Layer 2: Falling Leaves */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden' }}>
        {leaves.map(leaf => (
          <div key={`leaf-${leaf.id}`} style={{
            position: 'absolute',
            left: `${leaf.left}%`,
            top: '0px',
            width: `${leaf.size}px`,
            height: `${leaf.size * 1.5}px`,
            color: leaf.color,
            animation: `jungle-leaf-fall ${leaf.duration} linear ${leaf.delay} infinite`,
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
            '--drift': leaf.drift,
            '--spin': leaf.spin,
          } as React.CSSProperties} >
            <svg viewBox="0 0 20 30" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <path d="M10,0 Q15,8 14,15 Q13,22 10,30 Q7,22 6,15 Q5,8 10,0 Z" fill="currentColor" opacity="0.6"/>
              <line x1="10" y1="0" x2="10" y2="30" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
            </svg>
          </div>
        ))}
      </div>

      {/* Layer 3: Fireflies */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        {fireflies.map(fly => (
          <div key={`fly-${fly.id}`} style={{
            position: 'absolute',
            left: `${fly.left}%`,
            top: `${fly.top}%`,
            width: `${fly.size}px`,
            height: `${fly.size}px`,
            backgroundColor: '#bbff44',
            borderRadius: '50%',
            boxShadow: '0 0 6px 3px rgba(187, 255, 68, 0.5), 0 0 12px 6px rgba(187, 255, 68, 0.2)',
            animation: `jungle-firefly-drift ${fly.driftDuration}s ease-in-out ${fly.driftDelay}s infinite`,
            willChange: 'transform',
            '--dx1': fly.dx1, '--dy1': fly.dy1,
            '--dx2': fly.dx2, '--dy2': fly.dy2,
            '--dx3': fly.dx3, '--dy3': fly.dy3,
          } as React.CSSProperties}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: 'inherit',
              animation: `jungle-firefly-pulse ${fly.pulseDuration}s ease-in-out ${fly.pulseDelay}s infinite`,
              willChange: 'opacity',
              backgroundColor: 'inherit',
              boxShadow: 'inherit'
            }} />
          </div>
        ))}
      </div>

      {/* Layer 4: Atmospheric Mist */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
        {mistPatches.map(mist => (
          <div key={`mist-${mist.id}`} style={{
            position: 'absolute',
            left: `${mist.left}vw`,
            top: `${mist.top}vh`,
            width: `${mist.width}vw`,
            height: `${mist.height}vh`,
            background: 'radial-gradient(ellipse, rgba(160, 210, 160, 0.04) 0%, rgba(140, 190, 140, 0.015) 40%, transparent 70%)',
            filter: 'blur(20px)',
            animation: `jungle-mist-drift ${mist.duration}s ease-in-out ${mist.delay}s infinite`,
            willChange: 'transform, opacity'
          }} />
        ))}
      </div>

      <style jsx global>{`
        @keyframes jungle-leaf-fall {
          0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(110vh) translateX(var(--drift)) rotate(var(--spin)); opacity: 0; }
        }

        @keyframes jungle-firefly-pulse {
          0%, 100% { opacity: 0; }
          40%, 60% { opacity: 0.9; }
        }

        @keyframes jungle-firefly-drift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(var(--dx1), var(--dy1)); }
          50% { transform: translate(var(--dx2), var(--dy2)); }
          75% { transform: translate(var(--dx3), var(--dy3)); }
        }

        @keyframes jungle-mist-drift {
          0%, 100% { transform: translateX(-8vw); opacity: 0.3; }
          50% { transform: translateX(8vw); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
