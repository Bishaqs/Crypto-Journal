"use client";

import { useMemo } from "react";

export function SynthwaveBackground() {
    const stars = useMemo(() => {
        return Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 45,
            size: 1 + Math.random() * 1.5,
            opacity: 0.3 + Math.random() * 0.5,
            duration: 2 + Math.random() * 3,
            delay: Math.random() * -5,
        }));
    }, []);

    const totalHorizontalLines = 15;
    const horizontalLines = useMemo(() => {
        return Array.from({ length: totalHorizontalLines }).map((_, i) => {
            const p = i / (totalHorizontalLines - 1);
            return {
                id: i,
                top: 55 + 45 * Math.pow(p, 2),
                opacity: 0.15 + (0.8 - 0.15) * p,
                borderWidth: 0.5 + (1.5 - 0.5) * Math.pow(p, 1.5),
            };
        });
    }, []);

    const totalVerticalLines = 20;
    const verticalLines = useMemo(() => {
        return Array.from({ length: totalVerticalLines }).map((_, i) => {
            const p = i / (totalVerticalLines - 1);
            const bottomX = -100 + p * 300;

            return {
                id: i,
                x1: 50,
                y1: 52,
                x2: bottomX,
                y2: 100,
                opacity: 0.6,
                strokeWidth: 1.0,
            };
        });
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ background: "#0a0015", zIndex: 0 }}>
            <style jsx global>{`
        @keyframes synthwave-twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes synthwave-sun-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @keyframes synthwave-glow-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes synthwave-grid-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(1.5vh); }
        }
      `}</style>

            {/* Sky Background Gradient */}
            <div
                className="absolute top-0 left-0 right-0 h-[55%]"
                style={{
                    background: "linear-gradient(to bottom, #0a0015 0%, #120a28 72%, #1a0030 100%)"
                }}
            />

            {/* Stars */}
            <div className="absolute top-0 left-0 w-full h-full">
                {stars.map((star) => (
                    <div
                        key={star.id}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: `${star.left}%`,
                            top: `${star.top}%`,
                            width: `${star.size * 2}px`,
                            height: `${star.size * 2}px`,
                            opacity: star.opacity,
                            animation: `synthwave-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`
                        }}
                    />
                ))}
            </div>

            {/* Sun Glow */}
            <div
                className="absolute rounded-[100%]"
                style={{
                    left: "50%",
                    top: "42%",
                    width: "40vw",
                    height: "25vh",
                    transform: "translate(-50%, -50%)",
                    background: "radial-gradient(ellipse, rgba(255, 45, 149, 0.3) 0%, rgba(180, 0, 255, 0.1) 50%, transparent 100%)",
                    animation: "synthwave-glow-pulse 8s ease-in-out infinite",
                    zIndex: 1
                }}
            />

            {/* The Sun */}
            <div
                className="absolute"
                style={{
                    left: "50%",
                    top: "40%",
                    width: "28vw",
                    height: "28vw",
                    transform: "translate(-50%, -50%)",
                    transformOrigin: "center center",
                    animation: "synthwave-sun-breathe 12s ease-in-out infinite",
                    zIndex: 2,
                }}
            >
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="sun-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ffe66d" />
                            <stop offset="25%" stopColor="#ffb347" />
                            <stop offset="45%" stopColor="#ff6b6b" />
                            <stop offset="70%" stopColor="#ff2d95" />
                            <stop offset="100%" stopColor="#ff006e" />
                        </linearGradient>
                        <clipPath id="sun-slices">
                            <rect x="0" y="0" width="100" height="40" />
                            <rect x="0" y="42" width="100" height="5.5" />
                            <rect x="0" y="49" width="100" height="5" />
                            <rect x="0" y="56" width="100" height="4.5" />
                            <rect x="0" y="63" width="100" height="4.5" />
                            <rect x="0" y="70.5" width="100" height="4" />
                            <rect x="0" y="78" width="100" height="3.5" />
                            <rect x="0" y="85.5" width="100" height="4" />
                            <rect x="0" y="93.5" width="100" height="6.5" />
                        </clipPath>
                    </defs>
                    <circle cx="50" cy="50" r="50" fill="url(#sun-grad)" clipPath="url(#sun-slices)" />
                </svg>
            </div>

            {/* Mountains */}
            <div className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 3 }}>
                <svg width="100%" height="100%" preserveAspectRatio="none">
                    <polyline
                        points="0,55 5,50 15,48 25,52 35,47 45,51 55,49 65,48 75,51 85,47 95,50 100,55"
                        stroke="#6366f1"
                        strokeWidth="1px"
                        fill="none"
                        opacity="0.3"
                        vectorEffect="non-scaling-stroke"
                        transform="scale(100, 1)"
                    />
                </svg>
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute top-[35%] w-full h-[20%]"
                >
                    <polyline
                        points="0,100 8,85 18,75 25,90 35,65 42,80 52,60 65,85 75,65 85,85 92,70 100,100"
                        stroke="#6366f1"
                        strokeWidth="1.5px"
                        fill="none"
                        opacity="0.3"
                        vectorEffect="non-scaling-stroke"
                    />
                    <polyline
                        points="0,100 10,75 20,55 30,85 40,45 50,70 60,40 70,80 80,55 90,85 95,65 100,100"
                        stroke="#7c3aed"
                        strokeWidth="2px"
                        fill="none"
                        opacity="0.6"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            </div>

            {/* Grid Floor */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[45%]"
                style={{ zIndex: 4, transformOrigin: 'bottom', overflow: 'hidden' }}
            >
                <svg width="0" height="0" className="absolute">
                    <defs>
                        <filter id="grid-glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                </svg>

                <svg width="100%" height="100%" preserveAspectRatio="none" className="absolute top-0 left-0">
                    <g filter="url(#grid-glow)">
                        {verticalLines.map(line => (
                            <line
                                key={`v-${line.id}`}
                                x1={`${line.x1}%`} y1="-15%"
                                x2={`${line.x2}%`} y2="100%"
                                stroke="#ff2d95"
                                strokeWidth={line.strokeWidth}
                                opacity="0.3"
                            />
                        ))}
                    </g>
                </svg>

                <div
                    className="absolute top-0 left-0 w-full h-[150%]"
                    style={{ animation: "synthwave-grid-scroll 4s linear infinite" }}
                >
                    {horizontalLines.map(line => (
                        <div
                            key={`h-${line.id}`}
                            className="absolute w-full"
                            style={{
                                top: `${((line.top - 55) / 45) * 66.6}%`,
                                borderTop: `${line.borderWidth}px solid #ff2d95`,
                                opacity: line.opacity,
                                filter: "drop-shadow(0 0 2px #ff2d95)",
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* CRT Scanlines Overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
                    opacity: 0.5,
                    zIndex: 10
                }}
            />
        </div>
    );
}
