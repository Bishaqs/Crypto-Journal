# Dark-Themed Trading Journal Banners

Below are all 36 redesigned, purely CSS, emoji-free banner classes for the dark-themed profile cards. They are organized by rarity.

```css
/* =========================================================================
   BASE STYLES
   All banners require position: relative and overflow: hidden.
   ========================================================================= */
[class^="banner-"] {
  position: relative;
  overflow: hidden;
  /* Assumed base card background underneath the 0.7 opacity overlay */
  background-color: var(--card-bg, #1e293b);
  border-radius: inherit;
  width: 100%;
  height: 100%;
}

/* =========================================================================
   COMMON (7 BANNERS)
   ========================================================================= */

/* 1. Thin tearing lines that widen slightly over a grainy paper texture. */
.banner-paper-hands {
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
}
.banner-paper-hands::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px);
  opacity: 0.5;
}
.banner-paper-hands::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 50% 0 auto 0;
  height: 2px;
  background: rgba(255,255,255,0.4);
  box-shadow: 0 0 5px rgba(255,255,255,0.3);
  transform-origin: center;
  animation: paper-tear 4s ease-in-out infinite alternate;
}

/* 2. Sleek horizontal light streak racing across a dark purple gradient. */
.banner-wen-lambo {
  background: linear-gradient(90deg, #090014, #2a0a4a, #090014);
}
.banner-wen-lambo::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: 50%;
  left: -50%;
  width: 50%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #a855f7, #fff);
  transform: translateY(-50%);
  box-shadow: 0 0 10px #a855f7, 0 0 20px #a855f7;
  animation: light-streak 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

/* 3. Deep pulsing red gradient with a scanning horizontal warning line. */
.banner-red-alert {
  background: repeating-linear-gradient(-45deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.1) 15px, rgba(0, 0, 0, 0.2) 15px, rgba(0, 0, 0, 0.2) 30px);
  animation: red-alert-pulse 2s ease-in-out infinite;
}
.banner-red-alert::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: -10px;
  left: 0;
  right: 0;
  height: 10px;
  background: rgba(239, 68, 68, 0.8);
  box-shadow: 0 0 15px #ef4444;
  animation: scan-vertical 3s linear infinite;
}

/* 4. Green to red gradient with a drifting jagged chart failure line. */
.banner-buy-high-sell-low {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 40%, rgba(239, 68, 68, 0.1) 60%, rgba(239, 68, 68, 0.2) 100%);
  animation: subtle-pulse 3s ease-in-out infinite;
}
.banner-buy-high-sell-low::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background: linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.3) 49%, transparent 51%);
  clip-path: polygon(0 80%, 30% 20%, 50% 40%, 70% 10%, 100% 90%, 100% 100%, 0 100%);
  opacity: 0.4;
  animation: zigzag-drift 4s linear infinite;
}

/* 5. Minimalist green candles drifting steadily upward from the bottom. */
.banner-green-candles {
  background: #0f172a;
}
.banner-green-candles::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: 
    linear-gradient(#22c55e, #22c55e),
    linear-gradient(#22c55e, #22c55e),
    linear-gradient(#22c55e, #22c55e);
  background-size: 4px 40%, 6px 60%, 5px 30%;
  background-position: 20% 100%, 50% 100%, 80% 100%;
  background-repeat: no-repeat;
  opacity: 0.6;
  animation: candles-rise 3s ease-in-out infinite alternate;
}

/* 6. Choppy flickering static noise with erratic scanning interference. */
.banner-static-noise {
  background-image: repeating-linear-gradient(rgba(255,255,255,0.05) 0 1px, transparent 1px 100%);
  background-size: 100% 3px;
  animation: static-flicker 0.2s steps(2) infinite;
}
.banner-static-noise::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  height: 20%;
  background: rgba(255, 255, 255, 0.1);
  animation: static-scan 4s linear infinite;
}

/* 7. Serene night gradient featuring a glowing celestial body in the corner. */
.banner-moonrise {
  background: linear-gradient(to bottom, #071022, #000);
}
.banner-moonrise::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  width: 60px;
  height: 60px;
  top: -10px;
  right: 20px;
  background: radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0.2) 40%, transparent 70%);
  box-shadow: 0 0 30px rgba(255,255,255,0.4);
  border-radius: 50%;
  animation: subtle-pulse 4s ease-in-out infinite;
}

/* =========================================================================
   UNCOMMON (7 BANNERS)
   ========================================================================= */

/* 8. Sharp diagonal green arrow rocketing upward with a neon glow. */
.banner-stonks {
  background: #0f172a;
}
.banner-stonks::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  left: -10%;
  bottom: -20%;
  width: 120%;
  height: 10px;
  background: #22c55e;
  box-shadow: 0 0 15px #22c55e, 0 -5px 25px rgba(34, 197, 94, 0.4);
  transform-origin: bottom left;
  transform: rotate(-15deg);
  animation: stonks-up 3s ease-in-out infinite alternate;
}

/* 9. Soft, wavering colorful bands resembling a northern lights display. */
.banner-aurora-shimmer {
  background: #0f172a;
}
.banner-aurora-shimmer::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: -50px;
  background: linear-gradient(90deg, rgba(20, 184, 166, 0.2), rgba(34, 197, 94, 0.2), rgba(168, 85, 247, 0.2));
  filter: blur(20px);
  animation: aurora-wave 6s ease-in-out infinite alternate;
}

/* 10. Cyberpunk pink/blue gradient with a sweeping vertical scan boundary. */
.banner-neon-pulse {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1));
  box-shadow: inset 0 0 20px rgba(236, 72, 153, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.3);
  animation: neon-breathe 2s ease-in-out infinite alternate;
}
.banner-neon-pulse::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #ec4899;
  box-shadow: 0 0 10px #ec4899;
  animation: scan-vertical-bounce 4s linear infinite;
}

/* 11. Jagged polygon skyline along the bottom edge against a night sky. */
.banner-city-skyline {
  background: linear-gradient(to top, rgba(30, 41, 59, 0.9), transparent);
}
.banner-city-skyline::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: #000;
  clip-path: polygon(0 100%, 0 80%, 10% 80%, 10% 50%, 25% 50%, 25% 70%, 40% 70%, 40% 40%, 55% 40%, 55% 60%, 70% 60%, 70% 30%, 85% 30%, 85% 75%, 100% 75%, 100% 100%);
}
.banner-city-skyline::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background-image: radial-gradient(circle, rgba(234, 179, 8, 0.6) 1px, transparent 1px);
  background-size: 15px 15px;
  background-position: 5px 5px;
  clip-path: polygon(0 100%, 0 80%, 10% 80%, 10% 50%, 25% 50%, 25% 70%, 40% 70%, 40% 40%, 55% 40%, 55% 60%, 70% 60%, 70% 30%, 85% 30%, 85% 75%, 100% 75%, 100% 100%);
  animation: city-lights-flicker 5s infinite;
}

/* 12. Constant sweeping radar beam on a phosphor green concentric circle background. */
.banner-radar-sweep {
  background: #05100a;
}
.banner-radar-sweep::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: repeating-radial-gradient(circle at 20% 50%, transparent 0, transparent 20px, rgba(34, 197, 94, 0.1) 20px, rgba(34, 197, 94, 0.1) 21px);
}
.banner-radar-sweep::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: -100%;
  left: -30%;
  width: 100%;
  height: 300%;
  background: conic-gradient(from 0deg at 20% 50%, transparent 270deg, rgba(34, 197, 94, 0.05) 350deg, rgba(34, 197, 94, 0.6) 360deg);
  animation: radar-spin 4s linear infinite;
  transform-origin: 20% 50%;
}

/* 13. Horizontal scrolling background bars resembling an old-school stock ticker. */
.banner-ticker-tape {
  background: #0f172a;
}
.banner-ticker-tape::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 80px);
  animation: ticker-scroll 2s linear infinite;
}
.banner-ticker-tape::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #22c55e;
  box-shadow: 0 0 5px #22c55e;
  transform: translateY(-50%);
}

/* 14. Vibrant multi-color gradient panning smoothly to simulate organic motion. */
.banner-gradient-wave {
  background: linear-gradient(60deg, #3b82f6, #a855f7, #14b8a6);
  background-size: 300% 300%;
  animation: bg-pan 8s ease-in-out infinite alternate;
  opacity: 0.8;
}

/* =========================================================================
   RARE (10 BANNERS)
   ========================================================================= */

/* 15. Icy faceted geometry mimicking a reflecting diamond surface. */
.banner-diamond-hands {
  background: linear-gradient(135deg, #0f172a, #1e3a8a);
}
.banner-diamond-hands::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1), transparent);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: diamond-shine 3s linear infinite;
}
.banner-diamond-hands::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 10px;
  background: linear-gradient(-45deg, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.2));
  clip-path: polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%);
}

/* 16. Inward-collapsing void on a bloody red background with rapid jitter. */
.banner-liquidation {
  background: linear-gradient(to right, #450a0a, #000);
  box-shadow: inset 0 0 30px rgba(239, 68, 68, 0.8);
  animation: alarm-pulse 1s ease-in-out infinite;
}
.banner-liquidation::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background: radial-gradient(circle at center, transparent, #000 80%);
  animation: drain-inward 2s linear infinite;
}
.banner-liquidation::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(239, 68, 68, 0.2) 10px, rgba(239, 68, 68, 0.2) 12px);
  animation: glitch-jitter 0.3s steps(2) infinite;
}

/* 17. Rising orange-red flames dancing with upward-drifting glowing embers. */
.banner-dumpster-fire {
  background: linear-gradient(to top, #7f1d1d, transparent 80%);
}
.banner-dumpster-fire::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  bottom: -20px;
  left: 0;
  right: 0;
  height: 60px;
  background: #ea580c;
  filter: blur(10px);
  clip-path: polygon(0% 100%, 10% 40%, 20% 80%, 30% 20%, 40% 70%, 50% 10%, 60% 80%, 70% 30%, 80% 90%, 90% 20%, 100% 100%);
  animation: flames-dance 1.5s ease-in-out infinite alternate;
}
.banner-dumpster-fire::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: radial-gradient(circle, rgba(250, 204, 21, 0.8) 1px, transparent 1px);
  background-size: 30px 40px;
  animation: embers-rise 3s linear infinite;
}

/* 18. High-speed golden motion streaks charging forward across amber. */
.banner-bull-run {
  background: linear-gradient(90deg, #713f12, #ca8a04);
}
.banner-bull-run::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px);
  animation: bull-streaks 1s linear infinite;
}
.banner-bull-run::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: 50%;
  left: -20%;
  width: 140%;
  height: 20px;
  background: radial-gradient(ellipse at center, rgba(253, 224, 71, 0.8) 0%, transparent 70%);
  transform: translateY(-50%);
  filter: blur(5px);
  animation: flare-pulse 2s ease-in-out infinite alternate;
}

/* 19. Heavy, slow downward falling lines matching cold plummeting markets. */
.banner-bear-market {
  background: linear-gradient(to bottom, #0f172a, #1e3a8a);
}
.banner-bear-market::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: repeating-linear-gradient(180deg, rgba(148, 163, 184, 0.1) 0, rgba(148, 163, 184, 0.1) 10px, transparent 10px, transparent 30px);
  background-size: 2px 100%;
  background-position: center;
  animation: rain-fall 1s linear infinite;
}
.banner-bear-market::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to top, rgba(56, 189, 248, 0.3), transparent);
}

/* 20. Phosphorescent green digital data streams descending rapidly. */
.banner-matrix-rain {
  background: #000;
}
.banner-matrix-rain::before,
.banner-matrix-rain::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: linear-gradient(180deg, transparent 50%, rgba(34, 197, 94, 0.8) 90%, #fff 100%);
  background-size: 15px 150px;
  background-repeat: repeat-x;
  opacity: 0.6;
}
.banner-matrix-rain::before {
  background-position: 10px 0, 40px -50px, 70px -100px, 100px -20px;
  animation: matrix-fall 2s linear infinite;
}
.banner-matrix-rain::after {
  background-position: 25px -80px, 55px -10px, 85px -120px, 115px -60px;
  animation: matrix-fall 3s linear infinite;
}

/* 21. Intensely thick, layered crimson waves mimicking extreme heat distortion. */
.banner-inferno {
  background: linear-gradient(to top, #991b1b, #000);
}
.banner-inferno::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  bottom: -40px;
  left: -20px;
  right: -20px;
  height: 120px;
  background: #dc2626;
  filter: blur(15px);
  opacity: 0.8;
  clip-path: polygon(0 100%, 15% 30%, 30% 80%, 45% 10%, 60% 70%, 80% 0%, 100% 100%);
  animation: inferno-waves 2s ease-in-out infinite alternate;
}
.banner-inferno::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  bottom: -20px;
  left: 0;
  right: 0;
  height: 50px;
  background: #f97316;
  filter: blur(20px);
  animation: subtle-pulse 1s stretch infinite alternate;
}

/* 22. Infinite loading progression ring simulating steadfast patience. */
.banner-trust-process {
  background: #0f172a;
}
.banner-trust-process::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  left: 50%;
  top: 50%;
  width: 80px;
  height: 80px;
  transform: translate(-50%, -50%);
  background: conic-gradient(from 0deg, transparent 70%, rgba(59, 130, 246, 0.4) 100%);
  border-radius: 50%;
  animation: radar-spin 2s linear infinite;
}
.banner-trust-process::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  bottom: 0;
  left: 0;
  height: 4px;
  background: #3b82f6;
  box-shadow: 0 0 10px #3b82f6;
  animation: process-bar 4s ease-in-out infinite;
}

/* 23. A dense, continuously horizontal panning forest of trading candlesticks. */
.banner-candlestick-forest {
  background: #0f172a;
}
.banner-candlestick-forest::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: 
    repeating-linear-gradient(90deg, rgba(34, 197, 94, 0.3) 0, rgba(34, 197, 94, 0.3) 6px, transparent 6px, transparent 20px),
    repeating-linear-gradient(90deg, transparent 10px, transparent 16px, rgba(239, 68, 68, 0.3) 16px, rgba(239, 68, 68, 0.3) 22px, transparent 22px, transparent 30px);
  background-size: 200% 60%, 200% 40%;
  background-position: 0 bottom, 0 bottom;
  background-repeat: no-repeat;
  animation: pan-horizontal 10s linear infinite;
}

/* 24. Right-angled grid tracing paths illuminated by traveling blue pulses. */
.banner-circuit-flow {
  background: #0f172a;
}
.banner-circuit-flow::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: 
    linear-gradient(90deg, transparent 40px, rgba(56, 189, 248, 0.1) 40px, rgba(56, 189, 248, 0.1) 42px, transparent 42px),
    linear-gradient(0deg, transparent 20px, rgba(56, 189, 248, 0.1) 20px, rgba(56, 189, 248, 0.1) 22px, transparent 22px);
  background-size: 80px 40px;
}
.banner-circuit-flow::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: 20px;
  left: -20%;
  width: 40px;
  height: 2px;
  background: #38bdf8;
  box-shadow: 0 0 15px #38bdf8;
  animation: trace-flow 3s ease-in-out infinite;
}

/* =========================================================================
   EPIC (8 BANNERS)
   ========================================================================= */

/* 25. Intense storm atmosphere ripped by an angular, violent lightning flash. */
.banner-lightning-storm {
  background: #0f172a;
  animation: lightning-bg-flash 5s infinite;
}
.banner-lightning-storm::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: -10%;
  left: 20%;
  width: 10px;
  height: 120%;
  background: #fff;
  box-shadow: 0 0 20px #60a5fa, 0 0 40px #60a5fa;
  transform: skew(-20deg);
  opacity: 0;
  clip-path: polygon(0 0, 100% 0, 60% 40%, 100% 40%, 40% 100%, 0 100%, 40% 60%, 0 60%);
  animation: lightning-strike 5s infinite;
}

/* 26. Solid dark stone fortress texture with embattled top edge silhouettes. */
.banner-hodl-fortress {
  background: linear-gradient(to bottom, #1e293b, #0f172a);
}
.banner-hodl-fortress::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: 
    repeating-linear-gradient(0deg, transparent 0, transparent 9px, rgba(0,0,0,0.5) 9px, rgba(0,0,0,0.5) 10px),
    repeating-linear-gradient(90deg, transparent 0, transparent 19px, rgba(0,0,0,0.5) 19px, rgba(0,0,0,0.5) 20px);
  opacity: 0.3;
}
.banner-hodl-fortress::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: #334155;
  clip-path: polygon(0 0, 10% 0, 10% 100%, 20% 100%, 20% 0, 30% 0, 30% 100%, 40% 100%, 40% 0, 50% 0, 50% 100%, 60% 100%, 60% 0, 70% 0, 70% 100%, 80% 100%, 80% 0, 90% 0, 90% 100%, 100% 100%, 100% 0);
  box-shadow: 0 5px 15px rgba(0,0,0,0.8);
}

/* 27. Dreamy, deeply-layered particles drifting smoothly across dark space. */
.banner-particle-drift {
  background: radial-gradient(ellipse at bottom, #1e1b4b, #000);
}
.banner-particle-drift::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: 
    radial-gradient(circle, #fff 1px, transparent 1px),
    radial-gradient(circle, #818cf8 2px, transparent 2px);
  background-size: 50px 50px, 120px 80px;
  background-position: 0 0, 20px 30px;
  animation: space-drift 20s linear infinite;
  opacity: 0.6;
}
.banner-particle-drift::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: radial-gradient(circle, #c084fc 1.5px, transparent 1.5px);
  background-size: 90px 60px;
  animation: space-drift-reverse 15s linear infinite;
  opacity: 0.4;
}

/* 28. Harsh chromatic split with erratic offset slicing and displacement. */
.banner-glitch {
  background: #0f172a;
}
.banner-glitch::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background: rgba(239, 68, 68, 0.4);
  clip-path: polygon(0 10%, 100% 10%, 100% 20%, 0 20%);
  transform: translateX(-5px);
  animation: glitch-slice-1 2s linear infinite;
}
.banner-glitch::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background: rgba(6, 182, 212, 0.4);
  clip-path: polygon(0 60%, 100% 60%, 100% 70%, 0 70%);
  transform: translateX(5px);
  animation: glitch-slice-2 3s linear infinite;
}

/* 29. Dramatic split: sinking decay on the left, ascendant pristine glow on the right. */
.banner-ngmi-wagmi {
  background: #0f172a;
}
.banner-ngmi-wagmi::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  clip-path: polygon(0 0, 50% 0, 30% 100%, 0 100%);
  background: linear-gradient(to bottom, #7f1d1d, transparent);
  animation: collapse-tremor 0.5s ease-in-out infinite alternate;
}
.banner-ngmi-wagmi::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  clip-path: polygon(50% 0, 100% 0, 100% 100%, 30% 100%);
  background: linear-gradient(to top, rgba(34, 197, 94, 0.4), transparent);
  animation: ascend-glow 2s ease-in-out infinite alternate;
}

/* 30. Majestic, over-sized fluid gradient curtains simulating aurora borealis. */
.banner-northern-lights {
  background: #0f172a;
}
.banner-northern-lights::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: -100px;
  background: linear-gradient(90deg, rgba(20, 184, 166, 0.6), rgba(168, 85, 247, 0.6), rgba(59, 130, 246, 0.6), rgba(20, 184, 166, 0.6));
  background-size: 200% 100%;
  filter: blur(40px);
  opacity: 0.8;
  animation: bg-pan 10s linear infinite;
}
.banner-northern-lights::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background: radial-gradient(ellipse at top, transparent, #0f172a 80%);
}

/* 31. Menacing red-black crust breaking to reveal oozing hot orange magma cracks. */
.banner-lava-flow {
  background: #2a0a0a;
}
.banner-lava-flow::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: -50px;
  background: radial-gradient(circle at 30% 50%, #ea580c 0%, transparent 40%),
              radial-gradient(circle at 70% 60%, #ef4444 0%, transparent 40%),
              radial-gradient(circle at 50% 20%, #eab308 0%, transparent 30%);
  filter: blur(20px);
  animation: lava-ooze 6s ease-in-out infinite alternate;
  mix-blend-mode: screen;
}
.banner-lava-flow::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.8) 10px, rgba(0,0,0,0.8) 20px);
  opacity: 0.5;
}

/* 32. Outrun-style receding 3D perspective floor grid overlaid with tech blue. */
.banner-cyber-grid {
  background: linear-gradient(to bottom, #170a1c, #2e1065);
}
.banner-cyber-grid::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  bottom: 0;
  left: -50%;
  width: 200%;
  height: 200%;
  background-image: 
    linear-gradient(transparent 95%, #ec4899 100%),
    linear-gradient(90deg, transparent 95%, #3b82f6 100%);
  background-size: 40px 40px;
  transform: perspective(300px) rotateX(70deg);
  transform-origin: bottom center;
  animation: grid-forward 2s linear infinite;
}

/* =========================================================================
   LEGENDARY (4 BANNERS)
   ========================================================================= */

/* 33. Imposing deep surge mimicking a massive whale breaching with turbulent foam spray. */
.banner-whale-splash {
  background: linear-gradient(to bottom, #0ea5e9, #082f49);
}
.banner-whale-splash::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  bottom: -40%;
  left: 10%;
  width: 80%;
  height: 100%;
  background: radial-gradient(ellipse at top, #0284c7, transparent 70%);
  border-radius: 50%;
  box-shadow: 0 -20px 40px rgba(56, 189, 248, 0.6);
  animation: whale-breach 6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}
.banner-whale-splash::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: radial-gradient(circle, #fff 1.5px, transparent 1.5px);
  background-size: 30px 40px;
  background-repeat: repeat;
  opacity: 0;
  animation: splash-particles 6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* 34. Ultra-premium iridescent foil shifting continuously through full spectrum light. */
.banner-holographic {
  background: linear-gradient(120deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff0080);
  background-size: 300% 300%;
  animation: holo-shift 8s ease infinite;
}
.banner-holographic::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: -100%;
  background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%);
  animation: holo-shimmer 3s linear infinite;
}
.banner-holographic::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  inset: 0;
  background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px);
  opacity: 0.5;
}

/* 35. Intense roaring launch trajectory pushing toward a glowing celestial orb. */
.banner-moon-shot {
  background: radial-gradient(ellipse at top right, #1e1b4b, #000);
}
.banner-moon-shot::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: 10%;
  right: 15%;
  width: 50px;
  height: 50px;
  background: radial-gradient(circle, #fcd34d 0%, #ca8a04 40%, transparent 70%);
  border-radius: 50%;
  box-shadow: 0 0 30px #fde047;
  animation: moon-glow 3s ease-in-out infinite alternate;
}
.banner-moon-shot::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  bottom: -20%;
  left: -10%;
  width: 150%;
  height: 20px;
  background: linear-gradient(90deg, transparent, #ef4444, #f59e0b, #ffff00, #fff);
  transform: rotate(-30deg) translateY(-50%);
  transform-origin: left center;
  box-shadow: 0 0 20px #f59e0b, 0 0 40px #ef4444;
  animation: rocket-thrust 1.5s linear infinite;
}

/* 36. Blinding central expanding burst displacing monumental shockwave rings. */
.banner-supernova-collapse {
  background: #000;
}
.banner-supernova-collapse::before {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, #ffffff 0%, #3b82f6 30%, transparent 70%);
  transform: translate(-50%, -50%);
  filter: blur(5px);
  animation: supernova-core 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
.banner-supernova-collapse::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 1;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.8), 0 0 0 0 rgba(59, 130, 246, 0.4);
  transform: translate(-50%, -50%);
  animation: supernova-rings 4s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
}

/* =========================================================================
   KEYFRAMES (ALPHABETIZED)
   ========================================================================= */

@keyframes alarm-pulse {
  0%, 100% { box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.5); }
  50% { box-shadow: inset 0 0 60px rgba(239, 68, 68, 0.9); }
}

@keyframes ascend-glow {
  0% { opacity: 0.6; filter: brightness(1); }
  100% { opacity: 1; filter: brightness(1.3); }
}

@keyframes aurora-wave {
  0% { transform: translateY(-10px) rotate(-2deg); opacity: 0.6; }
  100% { transform: translateY(10px) rotate(2deg); opacity: 0.9; }
}

@keyframes bg-pan {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

@keyframes bull-streaks {
  from { transform: translateX(0); }
  to { transform: translateX(-40px); }
}

@keyframes candles-rise {
  0% { background-position: 20% 120%, 50% 110%, 80% 130%; opacity: 0.4; }
  100% { background-position: 20% 80%, 50% 70%, 80% 90%; opacity: 0.8; }
}

@keyframes city-lights-flicker {
  0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100% { opacity: 0.8; }
  5%, 25%, 55%, 75% { opacity: 0.3; }
}

@keyframes collapse-tremor {
  0% { transform: translateY(0) translateX(0); opacity: 1; }
  100% { transform: translateY(2px) translateX(-2px); opacity: 0.7; }
}

@keyframes diamond-shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes drain-inward {
  0% { transform: scale(1.5); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: scale(0.5); opacity: 0; }
}

@keyframes embers-rise {
  0% { background-position: 0 40px; opacity: 0; }
  50% { opacity: 1; }
  100% { background-position: 0 0; opacity: 0; }
}

@keyframes flames-dance {
  0% { transform: scaleY(1) translateY(0); opacity: 0.8; }
  100% { transform: scaleY(1.2) translateY(-10px); opacity: 1; }
}

@keyframes flare-pulse {
  0% { opacity: 0.5; width: 120%; }
  100% { opacity: 1; width: 160%; }
}

@keyframes glitch-jitter {
  0% { transform: translateX(-2px); }
  100% { transform: translateX(2px); }
}

@keyframes glitch-slice-1 {
  0%, 100% { clip-path: polygon(0 10%, 100% 10%, 100% 20%, 0 20%); }
  50% { clip-path: polygon(0 40%, 100% 40%, 100% 50%, 0 50%); }
}

@keyframes glitch-slice-2 {
  0%, 100% { clip-path: polygon(0 60%, 100% 60%, 100% 70%, 0 70%); }
  50% { clip-path: polygon(0 80%, 100% 80%, 100% 90%, 0 90%); }
}

@keyframes grid-forward {
  from { background-position: 0 0; }
  to { background-position: 0 40px; }
}

@keyframes holo-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes holo-shimmer {
  0% { transform: translate(-50%, -50%) rotate(45deg); }
  100% { transform: translate(150%, 150%) rotate(45deg); }
}

@keyframes inferno-waves {
  0% { transform: translateY(0) scaleY(1); opacity: 0.7; }
  100% { transform: translateY(-10px) scaleY(1.1); opacity: 1; }
}

@keyframes lava-ooze {
  0% { transform: scale(1) translateX(0); opacity: 0.8; }
  100% { transform: scale(1.1) translateX(-10px); opacity: 1; }
}

@keyframes light-streak {
  0% { left: -50%; opacity: 0; }
  50% { opacity: 1; }
  100% { left: 150%; opacity: 0; }
}

@keyframes lightning-bg-flash {
  0%, 9%, 11%, 14%, 16%, 100% { background: #0f172a; }
  10%, 15% { background: #1e3a8a; }
}

@keyframes lightning-strike {
  0%, 9%, 11%, 14%, 16%, 100% { opacity: 0; }
  10%, 15% { opacity: 1; }
}

@keyframes matrix-fall {
  0% { transform: translateY(-150px); }
  100% { transform: translateY(100vh); }
}

@keyframes moon-glow {
  0% { box-shadow: 0 0 20px #fde047; opacity: 0.8; }
  100% { box-shadow: 0 0 50px #fde047; opacity: 1; }
}

@keyframes neon-breathe {
  0% { box-shadow: inset 0 0 10px rgba(236, 72, 153, 0.2), inset 0 0 10px rgba(59, 130, 246, 0.2); }
  100% { box-shadow: inset 0 0 30px rgba(236, 72, 153, 0.5), inset 0 0 30px rgba(59, 130, 246, 0.5); }
}

@keyframes pan-horizontal {
  0% { background-position: 0 bottom, 0 bottom; }
  100% { background-position: -200% bottom, -200% bottom; }
}

@keyframes paper-tear {
  0% { transform: scaleX(0.8) translateY(0); opacity: 0.5; }
  100% { transform: scaleX(1.1) translateY(1px); opacity: 0.8; }
}

@keyframes process-bar {
  0%, 100% { width: 0%; left: 0%; transform: translateX(0); }
  50% { width: 100%; left: 0%; transform: translateX(0); }
  50.1% { left: 100%; transform: translateX(-100%); }
}

@keyframes radar-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes rain-fall {
  0% { background-position: center 0; }
  100% { background-position: center 30px; }
}

@keyframes red-alert-pulse {
  0%, 100% { background-color: rgba(239, 68, 68, 0.05); }
  50% { background-color: rgba(239, 68, 68, 0.2); }
}

@keyframes rocket-thrust {
  0% { transform: rotate(-30deg) translateY(-50%) translateX(-20%); opacity: 0.6; }
  100% { transform: rotate(-30deg) translateY(-50%) translateX(20%); opacity: 1; }
}

@keyframes scan-vertical {
  0% { top: -10px; opacity: 0; }
  10%, 90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@keyframes scan-vertical-bounce {
  0% { top: 0; }
  50% { top: 100%; }
  100% { top: 0; }
}

@keyframes space-drift {
  from { background-position: 0 0, 20px 30px; }
  to { background-position: -100px -50px, -80px -20px; }
}

@keyframes space-drift-reverse {
  from { background-position: 0 0; }
  to { background-position: 100px 50px; }
}

@keyframes splash-particles {
  0% { opacity: 0; transform: translateY(0); }
  20% { opacity: 1; transform: translateY(-20px); }
  80% { opacity: 0; transform: translateY(-80px); }
  100% { opacity: 0; transform: translateY(-100px); }
}

@keyframes static-flicker {
  0% { opacity: 0.8; }
  100% { opacity: 0.2; }
}

@keyframes static-scan {
  0% { top: -20%; opacity: 0; }
  50% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@keyframes stonks-up {
  0% { transform: rotate(-15deg) translateY(0); filter: brightness(1); }
  100% { transform: rotate(-18deg) translateY(-5px); filter: brightness(1.3); }
}

@keyframes subtle-pulse {
  0% { opacity: 0.7; filter: brightness(0.9); }
  100% { opacity: 1; filter: brightness(1.2); }
}

@keyframes supernova-core {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
}

@keyframes supernova-rings {
  0% { width: 0; height: 0; box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.8), 0 0 0 0 rgba(59, 130, 246, 0.4); opacity: 1; }
  100% { width: 300px; height: 300px; box-shadow: 0 0 0 20px transparent, 0 0 0 40px transparent; opacity: 0; }
}

@keyframes ticker-scroll {
  from { background-position: 0 0; }
  to { background-position: -80px 0; }
}

@keyframes trace-flow {
  0% { left: -20%; opacity: 0; }
  30% { opacity: 1; }
  70% { opacity: 1; }
  100% { left: 120%; opacity: 0; }
}

@keyframes whale-breach {
  0% { transform: translateY(40%); opacity: 0.5; }
  50% { transform: translateY(0%); opacity: 1; }
  100% { transform: translateY(40%); opacity: 0.5; }
}

@keyframes zigzag-drift {
  from { background-position: 0 0; }
  to { background-position: 200px 0; }
}
```
