"use client";

import { useRef, useEffect, useCallback } from "react";

interface SatoshiBackgroundProps {
    reducedMotion: boolean;
}

interface GoldParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    maxOpacity: number;
    hue: number;
    life: number;
    lifeSpeed: number;
}

interface EmberParticle extends GoldParticle {
    history: { x: number; y: number; opacity: number; size: number }[];
}

interface SparkleParticle {
    x: number;
    y: number;
    size: number;
    baseOpacity: number;
    freq: number;
    phase: number;
}

interface MiniLogo {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    rotation: number;
    rotSpeed: number;
    nextDirChange: number;
}

interface HalvingState {
    active: boolean;
    startTime: number;
    nextTrigger: number;
    burstParticles: EmberParticle[];
}

function createBTCPath(size: number) {
    const s = size / 32;
    const path = new Path2D();

    // ₿ letter only — no outer circle (circle is drawn separately as a stroke)

    // Left vertical spine of the B
    path.rect(11 * s, 8 * s, 1.5 * s, 16 * s);

    // Top vertical strike (extends above B)
    path.rect(13.5 * s, 5 * s, 1.8 * s, 3.5 * s);
    // Bottom vertical strike (extends below B)
    path.rect(13.5 * s, 23.5 * s, 1.8 * s, 3.5 * s);
    // Second top strike
    path.rect(17.2 * s, 5 * s, 1.8 * s, 3.5 * s);
    // Second bottom strike
    path.rect(17.2 * s, 23.5 * s, 1.8 * s, 3.5 * s);

    // Upper B bump
    path.moveTo(12.5 * s, 8 * s);
    path.lineTo(19 * s, 8 * s);
    path.bezierCurveTo(23.5 * s, 8 * s, 23.5 * s, 15.5 * s, 19 * s, 15.5 * s);
    path.lineTo(12.5 * s, 15.5 * s);
    path.closePath();

    // Lower B bump (slightly wider)
    path.moveTo(12.5 * s, 15.5 * s);
    path.lineTo(20 * s, 15.5 * s);
    path.bezierCurveTo(25 * s, 15.5 * s, 25 * s, 24 * s, 20 * s, 24 * s);
    path.lineTo(12.5 * s, 24 * s);
    path.closePath();

    return path;
}

export function SatoshiBackground({ reducedMotion }: SatoshiBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<GoldParticle[]>([]);
    const embersRef = useRef<EmberParticle[]>([]);
    const sparklesRef = useRef<SparkleParticle[]>([]);
    const miniLogosRef = useRef<MiniLogo[]>([]);

    const halvingRef = useRef<HalvingState>({
        active: false,
        startTime: 0,
        nextTrigger: 0,
        burstParticles: [],
    });

    const btcPathRef = useRef<Path2D | null>(null);
    const rafRef = useRef<number>(0);
    const pausedRef = useRef(false);
    const startTimeRef = useRef(0);

    const initParticles = useCallback((w: number, h: number) => {
        const isMobile = window.innerWidth < 768;

        // Gold Dust (80/48)
        const dustCount = isMobile ? 48 : 80;
        particlesRef.current = Array.from({ length: dustCount }).map(() => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.1, // Horizontal sway amplitude
            vy: -(0.05 + Math.random() * 0.2), // Slow rise
            size: 0.6 + Math.random() * 1.9,
            opacity: 0,
            maxOpacity: 0.2 + Math.random() * 0.4,
            hue: 35 + Math.random() * 15,
            life: Math.random(),
            lifeSpeed: 0.0005 + Math.random() * 0.001,
        }));

        // Embers (25/15)
        const emberCount = isMobile ? 15 : 25;
        embersRef.current = Array.from({ length: emberCount }).map(() => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.2, // Drift
            vy: -(0.15 + Math.random() * 0.25), // Faster rise
            size: 1.5 + Math.random() * 2,
            opacity: 0,
            maxOpacity: 0.15 + Math.random() * 0.3,
            hue: 25 + Math.random() * 15,
            life: Math.random(),
            lifeSpeed: 0.001 + Math.random() * 0.002,
            history: [],
        }));

        // Sparkles (8/5)
        const sparkleCount = isMobile ? 5 : 8;
        sparklesRef.current = Array.from({ length: sparkleCount }).map(() => ({
            x: Math.random() * w,
            y: Math.random() * h,
            size: 1 + Math.random() * 1,
            baseOpacity: 0.3 + Math.random() * 0.5,
            freq: 0.001 + Math.random() * 0.002,
            phase: Math.random() * Math.PI * 2,
        }));

        // Mini Logos (5/3)
        const logoCount = isMobile ? 3 : 5;
        const centerX = w / 2;
        const centerY = h / 2;
        const centerAvoidRad = Math.min(w, h) * 0.25;

        miniLogosRef.current = Array.from({ length: logoCount }).map(() => {
            let x, y;
            do {
                x = Math.random() * w;
                y = Math.random() * h;
            } while (Math.hypot(x - centerX, y - centerY) < centerAvoidRad);

            const angle = Math.random() * Math.PI * 2;
            return {
                x,
                y,
                vx: Math.cos(angle) * 0.02,
                vy: Math.sin(angle) * 0.02,
                size: 12 + Math.random() * 8,
                opacity: 0.02 + Math.random() * 0.03,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.002,
                nextDirChange: performance.now() + 30000 + Math.random() * 30000,
            };
        });

        halvingRef.current.nextTrigger = performance.now() + 90000 + Math.random() * 30000;
    }, []);

    useEffect(() => {
        // Determine BTC logo size based on screen
        const size = typeof window !== 'undefined' ? Math.min(window.innerWidth, window.innerHeight) * 0.38 : 300;
        btcPathRef.current = createBTCPath(size);
    }, []);

    useEffect(() => {
        if (reducedMotion) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const size = Math.min(canvas.width, canvas.height) * 0.38;
            btcPathRef.current = createBTCPath(size);

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
        const TARGET_INTERVAL = 1000 / 30; // 30fps cap

        const draw = (now: number) => {
            if (pausedRef.current) return;
            rafRef.current = requestAnimationFrame(draw);

            const deltaTime = now - lastFrame;
            if (deltaTime < TARGET_INTERVAL) return;
            lastFrame = now;

            const w = canvas.width;
            const h = canvas.height;
            const centerX = w / 2;
            const centerY = h * 0.45; // slightly above center
            const time = now - startTimeRef.current;

            ctx.clearRect(0, 0, w, h);

            // --- Halving Event Logic ---
            if (!halvingRef.current.active && now > halvingRef.current.nextTrigger) {
                halvingRef.current.active = true;
                halvingRef.current.startTime = now;
                halvingRef.current.nextTrigger = now + 90000 + Math.random() * 30000;

                // Spawn burst embers
                halvingRef.current.burstParticles = Array.from({ length: 20 }).map(() => {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 3;
                    return {
                        x: centerX,
                        y: centerY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 2 + Math.random() * 2,
                        opacity: 1, // Start fully opaque for burst
                        maxOpacity: 1,
                        hue: 25 + Math.random() * 15,
                        life: 0,
                        lifeSpeed: 0.01 + Math.random() * 0.01, // Short life ~2s (depends on update logic below)
                        history: [],
                    };
                });
            }

            let halvingFlashOp = 0;
            let halvingRingOp = 0;
            let halvingRingRadius = 0;
            let halvingLogoScaleInc = 0;
            let halvingLogoOpInc = 0;

            if (halvingRef.current.active) {
                const hTime = now - halvingRef.current.startTime;

                // 1. Flash (0 - 300ms)
                if (hTime < 300) {
                    const progress = hTime / 300;
                    halvingFlashOp = Math.sin(progress * Math.PI) * 0.06;
                }

                // 2. Ring expansion (0 - 2000ms)
                if (hTime < 2000) {
                    const progress = hTime / 2000;
                    const easeOutProgress = 1 - Math.pow(1 - progress, 3);
                    const startRadius = Math.min(w, h) * 0.19; // Half of 0.38 size
                    const maxRadius = Math.hypot(w, h); // screen diagonal

                    halvingRingRadius = startRadius + (maxRadius - startRadius) * easeOutProgress;
                    halvingRingOp = 0.25 * (1 - easeOutProgress);
                }

                // 4. Logo flash (0 - 500ms)
                if (hTime < 500) {
                    const progress = hTime / 500;
                    const pop = Math.sin(progress * Math.PI);
                    halvingLogoScaleInc = pop * 0.05; // Base is up to 1.03, so +0.05 -> 1.08
                    halvingLogoOpInc = pop * 0.08;   // Base is up to 0.07, so +0.08 -> 0.15
                }

                // End event (~2.5s to let particles settle is handled by empty array)
                if (hTime > 3000) {
                    halvingRef.current.active = false;
                }
            }

            // --- Layer 1: Base Gradient (CSS handled) ---

            // --- Layer 4: Constellation Lines (Drawn before particles) ---
            ctx.lineWidth = 0.4;
            const MAX_DIST = 110;

            // Basic O(n^2) for now as N=80 is very small, spatial grid overhead might not be worth it in JS
            // But let's stick to the spec suggestion if possible. A simple double loop is fine for N=80.
            const particles = particlesRef.current;
            for (let i = 0; i < particles.length; i++) {
                const p1 = particles[i];
                if (p1.opacity < 0.05) continue;

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    if (p2.opacity < 0.05) continue;

                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < MAX_DIST * MAX_DIST) {
                        const dist = Math.sqrt(distSq);
                        const proximity = 1 - (dist / MAX_DIST);
                        const minOp = Math.min(p1.opacity, p2.opacity);

                        // Neural fire logic (simplified random pulse)
                        // We'll just add a slight random flicker based on time and position
                        const pulse = Math.sin(time * 0.005 + p1.x * 0.01) > 0.95 ? 3 : 1;

                        ctx.strokeStyle = `rgba(247, 147, 26, ${0.03 * proximity * minOp * pulse})`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }

            // --- Layer 3a: Gold Dust ---
            for (const p of particlesRef.current) {
                // Lifecycle
                p.life += p.lifeSpeed;
                if (p.life > 1) {
                    p.life = 0;
                    p.x = Math.random() * w;
                    p.y = h + 10;
                    p.opacity = 0;
                }

                // Opacity
                if (p.life < 0.1) {
                    p.opacity = (p.life / 0.1) * p.maxOpacity;
                } else if (p.life > 0.85) {
                    p.opacity = ((1 - p.life) / 0.15) * p.maxOpacity;
                } else {
                    p.opacity = p.maxOpacity;
                }

                // Movement
                p.x += Math.sin(time * 0.001 + p.y * 0.01) * p.vx;
                p.y += p.vy;

                // Render
                ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            // --- Layer 3b: Embers ---
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(247,147,26,0.3)";
            for (const p of embersRef.current) {
                p.life += p.lifeSpeed;
                if (p.life > 1 || p.y < -10) {
                    p.life = 0;
                    p.x = Math.random() * w;
                    p.y = h + 10;
                    p.opacity = 0;
                    p.history = [];
                }

                if (p.life < 0.1) p.opacity = (p.life / 0.1) * p.maxOpacity;
                else if (p.life > 0.85) p.opacity = ((1 - p.life) / 0.15) * p.maxOpacity;
                else p.opacity = p.maxOpacity;

                p.x += p.vx;
                p.y += p.vy;

                p.history.unshift({ x: p.x, y: p.y, opacity: p.opacity, size: p.size });
                if (p.history.length > 4) p.history.pop();

                // Draw history
                for (let i = p.history.length - 1; i >= 0; i--) {
                    const hPt = p.history[i];
                    const sizeMap = Math.max(0.1, hPt.size * (1 - (i / p.history.length)));
                    const opMap = hPt.opacity * (1 - (i / p.history.length));

                    ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${opMap})`;
                    ctx.beginPath();
                    ctx.arc(hPt.x, hPt.y, sizeMap, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.shadowBlur = 0; // reset

            // --- Layer 3c: Star Sparkles ---
            for (const s of sparklesRef.current) {
                s.x += (Math.random() - 0.5) * 0.1;
                s.y += (Math.random() - 0.5) * 0.1;

                // Twinkle
                const op = s.baseOpacity * (0.5 + 0.5 * Math.sin(time * s.freq + s.phase));

                ctx.fillStyle = `hsla(45, 50%, 90%, ${op})`;

                // Cross shape
                ctx.beginPath();
                ctx.fillRect(s.x - 3, s.y - 0.5, 6, 1);
                ctx.fillRect(s.x - 0.5, s.y - 3, 1, 6);
            }

            // --- Layer 7 Burst Particles ---
            if (halvingRef.current.active && halvingRef.current.burstParticles.length > 0) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = "rgba(247,147,26,0.5)";

                for (let i = halvingRef.current.burstParticles.length - 1; i >= 0; i--) {
                    const p = halvingRef.current.burstParticles[i];
                    p.life += p.lifeSpeed;

                    // Friction
                    p.vx *= 0.96;
                    p.vy *= 0.96;

                    p.x += p.vx;
                    p.y += p.vy;

                    p.opacity = Math.max(0, 1 - p.life);

                    if (p.life >= 1) {
                        halvingRef.current.burstParticles.splice(i, 1);
                        continue;
                    }

                    p.history.unshift({ x: p.x, y: p.y, opacity: p.opacity, size: p.size });
                    if (p.history.length > 4) p.history.pop();

                    for (let j = p.history.length - 1; j >= 0; j--) {
                        const hPt = p.history[j];
                        const sizeMap = Math.max(0.1, hPt.size * (1 - (j / p.history.length)));
                        const opMap = hPt.opacity * (1 - (j / p.history.length));

                        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${opMap})`;
                        ctx.beginPath();
                        ctx.arc(hPt.x, hPt.y, sizeMap, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.shadowBlur = 0;
            }

            // --- Layer 5: Mini BTC Logos ---
            for (const m of miniLogosRef.current) {
                if (now > m.nextDirChange) {
                    const angle = Math.random() * Math.PI * 2;
                    m.vx = Math.cos(angle) * 0.02;
                    m.vy = Math.sin(angle) * 0.02;
                    m.rotSpeed = (Math.random() - 0.5) * 0.002;
                    m.nextDirChange = now + 30000 + Math.random() * 30000;
                }

                m.x += m.vx;
                m.y += m.vy;
                m.rotation += m.rotSpeed;

                // Wraparound
                if (m.x < -50) m.x = w + 50;
                if (m.x > w + 50) m.x = -50;
                if (m.y < -50) m.y = h + 50;
                if (m.y > h + 50) m.y = -50;

                if (btcPathRef.current) {
                    ctx.save();
                    ctx.translate(m.x, m.y);
                    ctx.rotate(m.rotation);
                    // We need a path scaled for this, but to save creating 5 scaled paths, we can just scale the context.
                    // Assuming btcPathRef was made for size 'S', and we want size 'm.size'.
                    const sSize = Math.min(w, h) * 0.38;
                    const scaleRatio = m.size / sSize;

                    // Scale to match
                    ctx.scale(scaleRatio, scaleRatio);

                    // We need to offset because the path is drawn from (0,0) as top-left of the 32-grid
                    // The 32-grid has center at (16,16).
                    const pathGridOffset = -16 * (sSize / 32);
                    ctx.translate(pathGridOffset, pathGridOffset);

                    ctx.fillStyle = `rgba(247, 147, 26, ${m.opacity})`;
                    ctx.fill(btcPathRef.current);
                    ctx.restore();
                }
            }

            // --- Layer 7 Halving Effects ---
            if (halvingRef.current.active) {
                // Halving Flash
                if (halvingFlashOp > 0) {
                    ctx.fillStyle = `rgba(247, 147, 26, ${halvingFlashOp})`;
                    ctx.fillRect(0, 0, w, h);
                }

                // Halving Ring
                if (halvingRingOp > 0) {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, halvingRingRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(247, 147, 26, ${halvingRingOp})`;
                    ctx.lineWidth = 1; // start is 3px? We can lerp it, let's keep it simple at 2px avg
                    ctx.stroke();
                }
            }

            // --- Layer 2: Central BTC Logo ---
            if (btcPathRef.current) {
                const breathT = (Math.sin(time * 0.000785) + 1) / 2; // ~8s full cycle
                const logoOpacity = 0.03 + breathT * 0.04 + halvingLogoOpInc; // 0.03 to 0.07 + event
                const logoScale = 0.97 + breathT * 0.06 + halvingLogoScaleInc; // 0.97 to 1.03 + event

                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.scale(logoScale, logoScale);

                const sSize = Math.min(w, h) * 0.38;
                const pathGridOffset = -16 * (sSize / 32);
                ctx.translate(pathGridOffset, pathGridOffset);

                // Glow layer
                ctx.shadowColor = "rgba(247, 147, 26, 0.3)";
                ctx.shadowBlur = 40;
                ctx.fillStyle = `rgba(247, 147, 26, ${logoOpacity * 0.5})`;
                ctx.fill(btcPathRef.current);

                // Main logo
                ctx.shadowBlur = 0;
                ctx.fillStyle = `rgba(247, 147, 26, ${logoOpacity})`;
                ctx.fill(btcPathRef.current);

                // Circle outline ring around the ₿
                const sHalf = 16 * (sSize / 32);
                ctx.beginPath();
                ctx.arc(sHalf, sHalf, 15 * (sSize / 32), 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(247, 147, 26, ${logoOpacity * 0.3})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.restore();
            }

        };

        startTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [reducedMotion, initParticles]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0806]">
            {/* Layer 1: Base gradient */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: "linear-gradient(180deg, #0a0806 0%, #0d0a05 50%, #0a0806 100%)"
            }} />
            <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse at 50% 85%, rgba(247,147,26,0.08) 0%, rgba(191,120,10,0.04) 35%, transparent 65%)"
            }} />

            {/* Layer 2-5,7: Canvas (all animated layers) */}
            {!reducedMotion && <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />}

            {/* Reduced motion fallback: static BTC logo */}
            {reducedMotion && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* The SVG viewBox corresponds to our 32x32 grid */}
                    <svg viewBox="0 0 32 32" className="w-[35vmin] h-[35vmin] opacity-[0.04]" fill="rgba(247,147,26,1)">
                        <path d="M16 1C7.716 1 1 7.716 1 16s6.716 15 15 15 15-6.716 15-15S24.284 1 16 1zm-2 4h4v3h-4V5zm4 19h-4v3h4v-3zm-7-16h8c2.209 0 4 3.358 4 7.5H11V8zm0 7.5h9c2.485 0 4.5 3.806 4.5 8.5H11v-8.5z" fillRule="evenodd" />
                    </svg>
                </div>
            )}

            {/* Layer 6: Golden vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse at center, transparent 40%, rgba(10, 8, 6, 0.4) 100%)"
            }} />
        </div>
    );
}
