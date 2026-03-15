"use client";

import React, { useMemo } from 'react';

export function JungleBackground() {
  // Layer 1: Volumetric Light Rays (5 rays)
  const rays = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const leftDist = 30 + (i * 10) + (Math.random() * 5 - 2.5);
      const topWidth = 1 + Math.random() * 2;
      const bottomWidth = 3 + Math.random() * 3;
      return {
        id: i,
        left: leftDist,
        clipPath: `polygon(${50 - topWidth}% 0%, ${50 + topWidth}% 0%, ${50 + bottomWidth}% 100%, ${50 - bottomWidth}% 100%)`,
        height: 50 + Math.random() * 20,
        rotate: (Math.random() * 40) - 20,
        duration: 6 + Math.random() * 6,
        delay: -(Math.random() * 10),
      };
    });
  }, []);

  // Layer 2: Waterfall Splash/Mist (8 particles)
  const sprayParticles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      dx: `${(Math.random() * 10 - 5)}vw`,
      dy: `${-(Math.random() * 5 + 2)}vw`,
      duration: 1.5 + Math.random() * 1.5,
      delay: -(Math.random() * 3),
      left: 48 + Math.random() * 4,
      top: 40 + Math.random() * 4,
    }));
  }, []);

  // Layer 2: Water Ripples (10 ripples)
  const ripples = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      x: 40 + Math.random() * 20,
      y: 45 + Math.random() * 50,
      rx: 8 + Math.random() * 12,
      ry: 2 + Math.random() * 3,
      duration: 3 + Math.random() * 2,
      delay: -(Math.random() * 5),
    }));
  }, []);

  // Layer 4: Floating / Falling Leaves (15 leaves)
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

  // Layer 5: Fireflies (25 fireflies)
  const fireflies = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      top: 15 + Math.random() * 80,
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

  // Layer 6: Atmospheric Mist (4 patches)
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

  // Swaying animation properties
  const swayElements = useMemo(() => {
    return Array.from({ length: 6 }).map(() => ({
      duration: 6 + Math.random() * 4,
      delay: -(Math.random() * 10),
    }));
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', backgroundColor: '#0a1a0a', zIndex: 0 }}>
      {/* Layer 0: Background Gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 25%, #0d2a0d 0%, #0a1a0a 40%, #061006 80%, #030903 100%)',
        zIndex: 0
      }} />

      {/* Layer 1: Volumetric Light Rays */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, mixBlendMode: 'screen', filter: 'blur(8px)' }}>
        {rays.map(ray => (
          <div key={`ray-${ray.id}`} style={{
            position: 'absolute',
            left: `${ray.left}%`,
            top: 0,
            width: '10vw',
            height: `${ray.height}vh`,
            background: 'linear-gradient(to bottom, rgba(180, 220, 100, 0.12) 0%, rgba(150, 200, 80, 0.06) 40%, transparent 100%)',
            clipPath: ray.clipPath,
            transform: `rotate(${ray.rotate}deg)`,
            transformOrigin: 'top center',
            animation: `jungle-ray-pulse ${ray.duration}s ease-in-out ${ray.delay}s infinite alternate`,
            willChange: 'opacity'
          }} />
        ))}
      </div>

      {/* Layer 2: Waterfall + River */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {/* Waterfall glow */}
        <div style={{
          position: 'absolute',
          left: '45%',
          top: '10%',
          width: '10vw',
          height: '40vh',
          background: 'radial-gradient(ellipse, rgba(100, 200, 255, 0.06) 0%, transparent 70%)',
        }} />

        {/* Waterfall Container */}
        <div style={{
          position: 'absolute',
          left: '47vw',
          top: '18%',
          width: '6vw',
          height: '24%',
          overflow: 'hidden',
          maskImage: 'linear-gradient(to right, transparent 0%, white 15%, white 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, white 15%, white 85%, transparent 100%)'
        }}>
          {/* Scrolling Waterfall */}
          <div style={{
            width: '100%',
            height: '200%',
            background: 'repeating-linear-gradient(to bottom, rgba(180, 230, 255, 0.08) 0px, rgba(200, 240, 255, 0.15) 8px, rgba(180, 230, 255, 0.04) 16px, transparent 24px)',
            animation: 'jungle-waterfall-flow 2.5s linear infinite',
            willChange: 'transform'
          }} />
        </div>

        {/* Waterfall Splash Particles */}
        {sprayParticles.map(p => (
          <div key={`spray-${p.id}`} style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: 'rgba(200, 240, 255, 0.3)',
            animation: `jungle-spray ${p.duration}s linear ${p.delay}s infinite`,
            willChange: 'transform, opacity',
            '--spray-x': p.dx,
            '--spray-y': p.dy,
          } as React.CSSProperties} />
        ))}

        {/* River */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="jungle-river-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a3a3a" />
              <stop offset="100%" stopColor="#0d4a4a" />
            </linearGradient>
            <linearGradient id="jungle-river-surface-shimmer" x1="0" y1="0" x2="1" y2="0.5">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="20%" stopColor="rgba(100, 220, 200, 0.05)" />
              <stop offset="40%" stopColor="transparent" />
              <stop offset="60%" stopColor="rgba(120, 240, 220, 0.04)" />
              <stop offset="80%" stopColor="transparent" />
            </linearGradient>
            <clipPath id="jungle-river-clip">
              <path d="M47,42 C52,42 55,50 50,60 C42,76 25,90 30,100 L70,100 C75,90 62,80 58,60 C55,50 60,42 53,42 Z" />
            </clipPath>
          </defs>

          <path d="M47,42 C52,42 55,50 50,60 C42,76 25,90 30,100 L70,100 C75,90 62,80 58,60 C55,50 60,42 53,42 Z" fill="url(#jungle-river-gradient)" />

          <g clipPath="url(#jungle-river-clip)">
            <rect width="200" height="200" x="-50" y="-50" fill="url(#jungle-river-surface-shimmer)" style={{ animation: 'jungle-river-shimmer 8s linear infinite' }} />
          </g>

          {/* Ripples */}
          {ripples.map(r => (
            <ellipse
              key={`ripple-${r.id}`}
              cx={r.x} cy={r.y} rx={r.rx} ry={r.ry}
              fill="none" stroke="rgba(150, 230, 220, 0.15)" strokeWidth="0.5"
              style={{
                animation: `jungle-ripple ${r.duration}s ease-in-out ${r.delay}s infinite`,
                transformOrigin: `${r.x}px ${r.y}px`,
                willChange: 'transform, opacity'
              }}
            />
          ))}
        </svg>
      </div>

      {/* Layer 3: Canopy Silhouettes */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 3 }} viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <defs>
          <style>
            {`
              .jungle-sway-0 { animation: jungle-sway ${swayElements[0].duration}s ease-in-out ${swayElements[0].delay}s infinite; transform-origin: 90px 200px; }
              .jungle-sway-1 { animation: jungle-sway ${swayElements[1].duration}s ease-in-out ${swayElements[1].delay}s infinite; transform-origin: 0px 600px; }
              .jungle-sway-2 { animation: jungle-sway ${swayElements[2].duration}s ease-in-out ${swayElements[2].delay}s infinite; transform-origin: 900px 150px; }
              .jungle-sway-3 { animation: jungle-sway ${swayElements[3].duration}s ease-in-out ${swayElements[3].delay}s infinite; transform-origin: 850px 250px; }
              .jungle-sway-4 { animation: jungle-sway ${swayElements[4].duration}s ease-in-out ${swayElements[4].delay}s infinite; transform-origin: 1000px 700px; }
              .jungle-sway-5 { animation: jungle-sway ${swayElements[5].duration}s ease-in-out ${swayElements[5].delay}s infinite; transform-origin: 250px 0px; }
            `}
          </style>
        </defs>

        {/* Left palm tree */}
        <path d="M-10,1000 Q50,700 80,300 Q90,200 120,100 L50,150 L-10,200 Z" fill="#020802" />
        <g className="jungle-sway-0">
          <path d="M90,200 C150,100 250,120 280,180 C240,160 180,180 90,200 Z" fill="#020802" />
          <path d="M90,200 C140,250 200,280 230,220 C180,240 140,230 90,200 Z" fill="#020802" />
          <path d="M90,200 C80,100 150,50 180,80 C150,110 120,130 90,200 Z" fill="#020802" />
        </g>

        {/* Left Monstera leaves */}
        <g className="jungle-sway-1">
          <path d="M-50,600 C80,450 200,500 220,650 C180,680 50,650 -50,600 Z" fill="#020802" />
        </g>
        <path d="M-50,400 C100,300 150,450 180,500 C120,550 0,500 -50,400 Z" fill="#020802" />
        <path d="M-60,750 C100,600 250,750 280,850 C200,900 50,850 -60,750 Z" fill="#020802" />

        {/* Left Ferns */}
        <path d="M-20,1020 C50,850 150,800 220,880 C150,950 50,980 -20,1020 Z" fill="#020802" />
        <path d="M-20,1020 C80,920 180,950 240,1000 C180,1050 80,1030 -20,1020 Z" fill="#020802" />

        {/* Right Palm Trees */}
        <path d="M1020,1000 Q950,600 900,150 Q880,50 850,-10 L950,-20 L1050,-10 Z" fill="#020802" />
        <path d="M1010,1000 Q900,700 850,250 Q830,150 800,100 L950,150 L1050,200 Z" fill="#020802" />
        <g className="jungle-sway-2">
          <path d="M900,150 C800,50 700,80 650,150 C700,160 800,160 900,150 Z" fill="#020802" />
          <path d="M900,150 C800,200 700,250 680,200 C750,180 820,170 900,150 Z" fill="#020802" />
          <path d="M900,150 C950,50 1000,100 900,150 Z" fill="#020802" />
        </g>
        <g className="jungle-sway-3">
          <path d="M850,250 C750,200 650,250 600,350 C680,300 750,280 850,250 Z" fill="#020802" />
          <path d="M850,250 C800,350 750,400 700,380 C780,350 820,300 850,250 Z" fill="#020802" />
        </g>

        {/* Right Hanging Vines */}
        <path d="M1000,0 Q950,100 900,200 T850,350 T880,500" fill="none" stroke="#020802" strokeWidth="4" />
        <path d="M950,0 Q900,150 850,250 T880,450 T840,600" fill="none" stroke="#020802" strokeWidth="3" />

        {/* Right Large Leaves */}
        <path d="M1050,500 C900,400 750,500 700,650 C800,650 900,600 1050,500 Z" fill="#020802" />
        <g className="jungle-sway-4">
           <path d="M1050,700 C900,650 780,750 750,850 C850,850 950,800 1050,700 Z" fill="#020802" />
        </g>

        {/* Top Canopy Border */}
        <path d="M-50,-20 C100,80 200,100 300,50 C400,0 500,40 600,20 C700,0 800,120 900,80 C1000,40 1050,150 1050,-20 Z" fill="#020802" />

        {/* Ferns hanging from canopy */}
        <g className="jungle-sway-5">
           <path d="M250,-20 Q240,100 250,200 Q260,100 270,-20 Z" fill="#020802" />
           <path d="M250,20 Q200,10 180,30 Q220,40 250,20 Z" fill="#020802" />
           <path d="M250,60 Q180,40 160,80 Q210,80 250,60 Z" fill="#020802" />
           <path d="M250,100 Q200,80 170,120 Q220,110 250,100 Z" fill="#020802" />
           <path d="M250,150 Q210,130 190,160 Q230,150 250,150 Z" fill="#020802" />

           <path d="M255,10 Q300,-10 320,20 Q280,30 255,10 Z" fill="#020802" />
           <path d="M255,50 Q310,30 340,70 Q280,80 255,50 Z" fill="#020802" />
           <path d="M255,110 Q290,90 310,130 Q270,120 255,110 Z" fill="#020802" />
           <path d="M255,160 Q280,140 300,180 Q270,170 255,160 Z" fill="#020802" />
        </g>

        <path d="M780,-20 Q750,120 780,250 Q810,120 820,-20 Z" fill="#020802" />
        <path d="M780,50 Q730,40 700,60 Q750,70 780,50 Z" fill="#020802" />
        <path d="M780,110 Q710,90 680,120 Q760,120 780,110 Z" fill="#020802" />
        <path d="M780,180 Q730,150 710,190 Q750,180 780,180 Z" fill="#020802" />
        <path d="M785,40 Q840,20 860,50 Q810,60 785,40 Z" fill="#020802" />
        <path d="M785,100 Q860,80 880,120 Q830,130 785,100 Z" fill="#020802" />
        <path d="M785,160 Q840,140 860,180 Q810,180 785,160 Z" fill="#020802" />

        <path d="M450,-20 Q460,80 440,150 Q430,80 410,-20 Z" fill="#020802" />
        <path d="M450,30 Q490,20 510,40 Q470,50 450,30 Z" fill="#020802" />
        <path d="M450,80 Q510,70 530,100 Q480,100 450,80 Z" fill="#020802" />
        <path d="M440,30 Q400,10 380,30 Q420,40 440,30 Z" fill="#020802" />
        <path d="M430,80 Q380,60 360,90 Q400,90 430,80 Z" fill="#020802" />

        {/* Bottom vegetation */}
        <path d="M-50,1050 C50,880 150,920 250,1000 L-50,1050 Z" fill="#020802" />
        <path d="M1050,1050 C900,850 800,880 700,1000 L1050,1050 Z" fill="#020802" />

        {/* Rocks at river edge */}
        <path d="M220,1000 C240,930 300,920 320,980 C310,1000 250,1020 220,1000 Z" fill="#020802" />
        <path d="M280,1020 C300,980 340,970 360,1000 C340,1020 300,1030 280,1020 Z" fill="#020802" />
        <path d="M700,980 C680,940 640,940 610,980 C630,1020 680,1020 700,980 Z" fill="#020802" />
      </svg>

      {/* Layer 4: Floating / Falling Leaves */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, overflow: 'hidden' }}>
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
            willChange: 'transform, opacity' as const,
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

      {/* Layer 5: Fireflies */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
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

      {/* Layer 6: Atmospheric Mist */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}>
        {mistPatches.map(mist => (
          <div key={`mist-${mist.id}`} style={{
            position: 'absolute',
            left: `${mist.left}vw`,
            top: `${mist.top}vh`,
            width: `${mist.width}vw`,
            height: `${mist.height}vh`,
            background: 'radial-gradient(ellipse, rgba(160, 210, 160, 0.05) 0%, rgba(140, 190, 140, 0.02) 40%, transparent 70%)',
            filter: 'blur(20px)',
            animation: `jungle-mist-drift ${mist.duration}s ease-in-out ${mist.delay}s infinite`,
            willChange: 'transform, opacity'
          }} />
        ))}
      </div>

      <style jsx global>{`
        @keyframes jungle-ray-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        @keyframes jungle-waterfall-flow {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }

        @keyframes jungle-spray {
          0% { opacity: 0.4; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--spray-x), var(--spray-y)) scale(0.3); }
        }

        @keyframes jungle-river-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes jungle-ripple {
          0%, 100% { transform: scaleX(0.7); opacity: 0.1; }
          50% { transform: scaleX(1.3); opacity: 0.3; }
        }

        @keyframes jungle-sway {
          0%, 100% { transform: rotate(0deg); }
          33% { transform: rotate(1.5deg); }
          66% { transform: rotate(-1deg); }
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
          0%, 100% { transform: translateX(-8vw); opacity: 0.3; }
          50% { transform: translateX(8vw); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
