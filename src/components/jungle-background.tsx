"use client";

import React, { useMemo } from 'react';

export function JungleBackground() {
  const rays = useMemo(() => Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    left: `${35 + Math.random() * 30}%`,
    widthBottom: 4 + Math.random() * 4,
    widthTop: 1 + Math.random() * 2,
    height: 45 + Math.random() * 20,
    rotation: -15 + Math.random() * 30,
    duration: 7 + Math.random() * 7,
    delay: Math.random() * 5
  })), []);

  const ripples = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    cx: `${25 + Math.random() * 50}%`,
    cy: `${50 + Math.random() * 50}%`,
    rx: 10 + Math.random() * 20,
    ry: 2 + Math.random() * 3,
    duration: 3 + Math.random() * 3,
    delay: Math.random() * 5
  })), []);

  const particles = useMemo(() => Array.from({ length: 35 }).map((_, i) => ({
    id: i,
    size: 1 + Math.random() * 2,
    left: `${20 + Math.random() * 60}%`,
    top: `${50 + Math.random() * 50}%`,
    floatDur: 15 + Math.random() * 15,
    twinkleDur: 3 + Math.random() * 3,
    delay: -Math.random() * 30,
    isWarm: Math.random() > 0.5
  })), []);

  const droplets = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    height: 15 + Math.random() * 15,
    dur: 15 + Math.random() * 15,
    delay: Math.random() * 20
  })), []);

  const leaves = useMemo(() => Array.from({ length: 15 }).map((_, i) => {
    const colors = ["#1a5a1a", "#1e6b1e", "#2a7a2a", "#3a6a2a", "#2d5a1a"];
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 15 + Math.random() * 20,
      dur: 15 + Math.random() * 13,
      delay: -Math.random() * 28,
      drift: `${-20 + Math.random() * 40}vw`,
      spin: `${360 + Math.random() * 720}deg`
    };
  }), []);

  const fireflies = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${30 + Math.random() * 70}%`,
    size: 2 + Math.random() * 2,
    pDur: 3 + Math.random() * 4,
    pDel: -Math.random() * 4,
    dDur: 10 + Math.random() * 20,
    dDel: -Math.random() * 20,
    dx1: `${-50 + Math.random() * 100}px`,
    dy1: `${-50 + Math.random() * 100}px`,
    dx2: `${-50 + Math.random() * 100}px`,
    dy2: `${-50 + Math.random() * 100}px`,
    dx3: `${-50 + Math.random() * 100}px`,
    dy3: `${-50 + Math.random() * 100}px`,
  })), []);

  const mists = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    width: 40 + Math.random() * 15,
    height: 18 + Math.random() * 10,
    left: Math.random() * 60,
    top: i < 2 ? Math.random() * 20 : i < 4 ? 40 + Math.random() * 20 : 70 + Math.random() * 20,
    dur: 25 + Math.random() * 15,
    delay: -Math.random() * 40
  })), []);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', backgroundColor: '#0a1a0a', zIndex: 0 }}>
        {/* Layer 0 & 1: Background Image with Breathing */}
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
            animation: 'jungle-image-breathe 12s ease-in-out infinite',
            willChange: 'filter'
          }}
        />

        {/* Layer 2: Vignette */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.6) 100%)'
        }} />

        {/* Layer 3: Volumetric Light Rays */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, filter: 'blur(12px)', mixBlendMode: 'screen', overflow: 'hidden' }}>
          {rays.map(r => (
            <div key={r.id} style={{
              position: 'absolute',
              top: '5%',
              left: r.left,
              width: `${r.widthBottom}%`,
              height: `${r.height}vh`,
              transform: `rotate(${r.rotation}deg)`,
              transformOrigin: 'top center',
              clipPath: `polygon(${(r.widthBottom - r.widthTop)/2}% 0%, ${100 - (r.widthBottom - r.widthTop)/2}% 0%, 100% 100%, 0% 100%)`,
              background: 'linear-gradient(to bottom, rgba(200, 235, 130, 0.10) 0%, rgba(170, 210, 90, 0.04) 50%, transparent 100%)',
              animation: `jungle-ray-pulse ${r.duration}s ease-in-out infinite ${r.delay}s`,
              willChange: 'opacity'
            }} />
          ))}
        </div>

        {/* Layer 4: Water Shimmer */}
        <div style={{
          position: 'absolute', left: '35%', top: '40%', width: '30%', height: '60%', zIndex: 3,
          clipPath: 'polygon(42% 0%, 58% 0%, 75% 100%, 25% 100%)', mixBlendMode: 'screen'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: '-100%', width: '200%', height: '100%',
            background: 'linear-gradient(170deg, transparent 0%, rgba(100, 220, 200, 0.03) 20%, transparent 40%, rgba(130, 240, 220, 0.04) 60%, transparent 80%, rgba(100, 200, 190, 0.03) 100%)',
            animation: 'jungle-water-shimmer 6s linear infinite',
            willChange: 'transform'
          }} />
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
            {ripples.map(r => (
              <ellipse key={r.id} cx={r.cx} cy={r.cy} rx={`${r.rx}%`} ry={`${r.ry}%`}
                style={{
                  fill: 'none', stroke: 'rgba(150, 230, 220, 0.08)', strokeWidth: 0.5,
                  animation: `jungle-ripple ${r.duration}s ease-in-out infinite ${r.delay}s`,
                  transformOrigin: `${r.cx} ${r.cy}`,
                  willChange: 'transform, opacity'
                }} />
            ))}
          </svg>
        </div>

        {/* Layer 5: Particles */}
        <div style={{ position: 'absolute', left: '20%', top: 0, width: '60%', height: '100%', zIndex: 4, pointerEvents: 'none' }}>
          {particles.map(p => (
            <div key={p.id} style={{
              position: 'absolute',
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              backgroundColor: p.isWarm ? 'rgba(255, 255, 200, 0.4)' : 'rgba(200, 230, 150, 0.3)',
              animation: `jungle-particle-float ${p.floatDur}s linear infinite ${p.delay}s`,
              willChange: 'transform'
            }}>
              <div style={{
                width: '100%', height: '100%',
                animation: `jungle-particle-twinkle ${p.twinkleDur}s ease-in-out infinite ${p.delay}s`,
                willChange: 'opacity'
              }} />
            </div>
          ))}
        </div>

        {/* Layer 6: Rain Droplets */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden' }}>
          {droplets.map(d => (
            <div key={d.id} style={{
              position: 'absolute',
              left: d.left,
              top: '-5vh',
              width: '1px',
              height: `${d.height}px`,
              backgroundColor: 'rgba(180, 220, 255, 0.15)',
              animation: `jungle-rain-drop ${d.dur}s linear infinite ${d.delay}s`,
              willChange: 'transform, opacity'
            }} />
          ))}
        </div>

        {/* Layer 9: Enhanced Mist */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', overflow: 'hidden' }}>
          {mists.map(m => (
            <div key={m.id} style={{
              position: 'absolute',
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: `${m.width}vw`,
              height: `${m.height}vh`,
              background: 'radial-gradient(ellipse, rgba(140, 190, 140, 0.06) 0%, rgba(120, 170, 120, 0.025) 40%, transparent 70%)',
              filter: 'blur(25px)',
              animation: `jungle-mist-drift ${m.dur}s ease-in-out infinite ${m.delay}s`,
              willChange: 'transform, opacity'
            }} />
          ))}
        </div>

        {/* Layer 7: Falling Leaves */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 7, pointerEvents: 'none', overflow: 'hidden' }}>
          {leaves.map((leaf) => (
            <svg
              key={leaf.id}
              width={leaf.size}
              height={leaf.size}
              viewBox="0 0 24 24"
              style={{
                position: 'absolute',
                left: leaf.left,
                top: '-10vh',
                fill: leaf.color,
                '--drift': leaf.drift,
                '--spin': leaf.spin,
                animation: `jungle-leaf-fall ${leaf.dur}s linear infinite ${leaf.delay}s`,
                willChange: 'transform, opacity'
              } as React.CSSProperties}
            >
              <path d="M12 2C6.5 6 2 10 2 15c0 3 2 5 4 6.5C7 22 9 22 12 22c3 0 5 0 6-0.5C20 20 22 18 22 15c0-5-4.5-9-10-13zM12 19c-2.5 0-5-1.5-5-4.5C7 11 9 7.5 12 4c3 3.5 5 7 5 10.5c0 3-2.5 4.5-5 4.5z" />
            </svg>
          ))}
        </div>

        {/* Layer 8: Fireflies */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 8, pointerEvents: 'none' }}>
          {fireflies.map(f => (
            <div key={f.id} style={{
              position: 'absolute',
              left: f.left,
              top: f.top,
              width: `${f.size}px`,
              height: `${f.size}px`,
              borderRadius: '50%',
              backgroundColor: '#bbff44',
              boxShadow: '0 0 8px 4px rgba(187, 255, 68, 0.6), 0 0 16px 8px rgba(187, 255, 68, 0.25), 0 0 24px 12px rgba(187, 255, 68, 0.1)',
              '--dx1': f.dx1, '--dy1': f.dy1, '--dx2': f.dx2, '--dy2': f.dy2, '--dx3': f.dx3, '--dy3': f.dy3,
              animation: `jungle-firefly-drift ${f.dDur}s ease-in-out infinite ${f.dDel}s`,
              willChange: 'transform'
            } as React.CSSProperties}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                animation: `jungle-firefly-pulse ${f.pDur}s ease-in-out infinite ${f.pDel}s`,
                willChange: 'opacity'
              }} />
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes jungle-image-breathe {
          0%, 100% { filter: brightness(0.95) saturate(1.0); }
          50% { filter: brightness(1.05) saturate(1.08); }
        }
        @keyframes jungle-ray-pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.7; }
        }
        @keyframes jungle-water-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes jungle-ripple {
          0%, 100% { transform: scaleX(0.6); opacity: 0.05; }
          50% { transform: scaleX(1.4); opacity: 0.15; }
        }
        @keyframes jungle-particle-float {
          0% { transform: translateY(20vh) translateX(0); }
          25% { transform: translateY(10vh) translateX(2vw); }
          50% { transform: translateY(0vh) translateX(-1vw); }
          75% { transform: translateY(-10vh) translateX(3vw); }
          100% { transform: translateY(-20vh) translateX(0); }
        }
        @keyframes jungle-particle-twinkle {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.6; }
        }
        @keyframes jungle-rain-drop {
          0% { transform: translateY(-5vh); opacity: 0; }
          2% { opacity: 0.4; }
          3% { opacity: 0.4; }
          5% { transform: translateY(110vh); opacity: 0; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
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
          0%, 100% { transform: translateX(-10vw); opacity: 0.3; }
          50% { transform: translateX(10vw); opacity: 0.9; }
        }
      `}</style>
    </>
  );
}
