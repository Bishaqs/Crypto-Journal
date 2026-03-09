/**
 * Custom SVG icon registry for avatar_icon cosmetics.
 * Each icon is stored as SVG path data and rendered inline at any size.
 * The css_class column in cosmetic_definitions stores the key (e.g., "icon-seedling").
 */

import type { JSX } from "react";

type PathDef = {
  d: string;
  fillRule?: "evenodd" | "nonzero";
  className?: string;
  opacity?: number;
  strokeWidth?: number;
};

type IconDef = {
  /** SVG viewBox (default "0 0 24 24") */
  viewBox?: string;
  /** SVG path(s) — plain string (shorthand) or object with extra props */
  paths: (string | PathDef)[];
  fillRule?: "evenodd" | "nonzero";
};

const ICONS: Record<string, IconDef> = {
  // --- Nature / Growth ---
  "icon-seedling": {
    paths: [
      { d: "M12 22V12M12 12C12 8 9 5 5 5c0 4 3 7 7 7zM12 12c0-4 3-7 7-7 0 4-3 7-7 7z" },
    ],
  },
  "icon-leaf": {
    paths: [
      { d: "M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.7c.48.17.98.3 1.34.3C19 19.5 22 7 22 7s-5 1-5 1z" },
      { d: "M12 12l-5 5" },
    ],
  },
  "icon-tree": {
    paths: [
      { d: "M12 22v-6M7 12l5-10 5 10H7zM9 12l3-6 3 6" },
    ],
  },

  // --- Trading / Finance ---
  "icon-candlestick": {
    paths: [
      { d: "M9 4v4M9 14v6M7 8h4v6H7V8zM17 2v6M17 14v8M15 8h4v6h-4V8z" },
    ],
  },
  "icon-chart-up": {
    paths: [
      { d: "M3 20l5-5 4 4 9-11M17 4h4v4" },
    ],
  },
  "icon-trend-line": {
    paths: [
      { d: "M2 20l7-7 4 4L22 4M22 4h-5M22 4v5" },
    ],
  },
  "icon-bar-chart": {
    paths: [
      { d: "M4 20h16M6 16v4M10 12v8M14 8v12M18 4v16" },
    ],
  },
  "icon-wallet": {
    paths: [
      { d: "M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5zM16 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" },
    ],
  },
  "icon-coins": {
    paths: [
      { d: "M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" },
    ],
  },

  // --- Celestial / Space ---
  "icon-star": {
    paths: [
      { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", className: "text-accent fill-accent/20", strokeWidth: 1.5 },
      { d: "M12 2v16", strokeWidth: 1, opacity: 0.5 },
      { d: "M4 10h16", strokeWidth: 1, opacity: 0.5 }
    ],
  },
  "icon-moon": {
    paths: [
      { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" },
    ],
  },
  "icon-sun": {
    paths: [
      { d: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" },
    ],
  },
  "icon-planet": {
    paths: [
      { d: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
      { d: "M2.5 12c0-1.8.5-3.5 1.4-4.9C5.9 9.6 8.8 11.5 12 11.5s6.1-1.9 8.1-4.4c.9 1.4 1.4 3.1 1.4 4.9 0 1.8-.5 3.5-1.4 4.9-2-2.5-4.9-4.4-8.1-4.4s-6.1 1.9-8.1 4.4C3 15.5 2.5 13.8 2.5 12z" },
    ],
  },
  "icon-comet": {
    paths: [
      { d: "M2 2l10 10M16 12a4 4 0 1 1-4-4" },
      { d: "M2 2c3 0 6 1 8 3M2 2c0 3 1 6 3 8" },
    ],
  },
  "icon-constellation": {
    paths: [
      { d: "M5 5l4 8 6-4 4 8M5 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM9 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM15 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM19 17a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" },
    ],
  },
  "icon-orbit": {
    paths: [
      { d: "M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0" },
      { d: "M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20" },
      { d: "M12 2c-4 0-10 4-10 10s6 10 10 10" },
    ],
  },

  // --- Power / Status ---
  "icon-crown": {
    paths: [
      { d: "M2 20h20L18 8l-4 6-2-8-2 8-4-6-4 12z", className: "text-accent fill-accent/20" },
    ],
  },
  "icon-gem": {
    paths: [
      { d: "M6 3h12l4 6-10 12L2 9l4-6zM2 9h20M12 21L6 9M12 21l6-12M12 3l-2.5 6M12 3l2.5 6" },
    ],
  },
  "icon-shield": {
    paths: [
      { d: "M12 2l8 4v6c0 5.25-3.5 10.74-8 12-4.5-1.26-8-6.75-8-12V6l8-4z" },
    ],
  },
  "icon-bolt": {
    paths: [
      { d: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", className: "text-accent fill-accent/20" },
    ],
  },
  "icon-flame": {
    paths: [
      { d: "M12 2c.5 3-2 5-2 8a4 4 0 1 0 8 0c0-3-2-5-2-8-1 1-3 2-4 0z" },
      { d: "M12 14a2 2 0 0 0 2-2c0-1.5-2-3-2-3s-2 1.5-2 3a2 2 0 0 0 2 2z", className: "text-accent fill-accent/40", strokeWidth: 1.5 },
    ],
  },
  "icon-sword": {
    paths: [
      { d: "M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M7 3l7.5 7.5" },
    ],
  },

  // --- Tools / Analysis ---
  "icon-compass": {
    paths: [
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
      "M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z",
    ],
  },
  "icon-telescope": {
    paths: [
      "M6 21l6-6M21 3l-8 8M11 11L3 19M15.5 7.5l-3-3M18 10l-3-3",
    ],
  },
  "icon-target": {
    paths: [
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    ],
  },
  "icon-hourglass": {
    paths: [
      "M5 2h14M5 22h14M12 12l-5-5V2h10v5l-5 5zM12 12l-5 5v5h10v-5l-5-5z",
    ],
  },
  "icon-scale": {
    paths: [
      "M12 2v20M2 7l10-3 10 3M2 7l3 8h6l-3-8M22 7l-3 8h-6l3-8",
    ],
  },

  // --- Abstract / Geometric ---
  "icon-hexagon": {
    paths: [
      "M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z",
    ],
  },
  "icon-infinity": {
    paths: [
      "M8 12a4 4 0 1 1 0-.01M16 12a4 4 0 1 1 0-.01",
    ],
  },
  "icon-prism": {
    paths: [
      "M12 3L2 21h20L12 3zM12 3v18M2 21l10-9M22 21L12 12",
    ],
  },
  "icon-spiral": {
    paths: [
      "M12 12m-1 0a1 1 0 1 0 2 0M12 12c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3M12 12c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5",
    ],
  },
  "icon-cube": {
    paths: [
      "M12 2l10 5v10l-10 5-10-5V7l10-5zM12 22V12M22 7l-10 5M2 7l10 5",
    ],
  },

  // --- Achievement / Special ---
  "icon-trophy": {
    paths: [
      "M6 9V2h12v7a6 6 0 0 1-12 0zM6 4H2v3a3 3 0 0 0 3 3h1M18 4h4v3a3 3 0 0 1-3 3h-1M9 18h6M12 15v3M8 22h8",
    ],
  },
  "icon-rocket": {
    paths: [
      "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3M22 2l-7.5 7.5M16.5 11.5L15 22l-4-5M12.5 7.5L2 9l5 4",
    ],
  },
  "icon-medal": {
    paths: [
      "M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.21 13.89L7 23l5-3 5 3-1.21-9.12",
    ],
  },
  "icon-phoenix": {
    paths: [
      { d: "M12 2c-4 4-8 6-8 12a8 8 0 0 0 16 0c0-6-4-8-8-12zM12 22c-2-3-2-6 0-10M12 22c2-3 2-6 0-10", className: "text-accent fill-accent/40" },
      { d: "M12 8c-2 2-4 3-4 6a4 4 0 0 0 8 0c0-3-2-4-4-6z", strokeWidth: 1.5 },
      { d: "M12 2v20", strokeWidth: 1, opacity: 0.5 }
    ],
  },

  // --- Extended Cosmic Set ---
  "icon-anchor": {
    paths: [
      "M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM12 6v14M5 12H2a10 10 0 0 0 20 0h-3",
    ],
  },
  "icon-diamond": {
    paths: [
      "M6 3h12l4 6-10 12L2 9l4-6zM2 9h20",
    ],
  },
  "icon-lightning-bolt": {
    paths: [
      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    ],
  },
  "icon-eye": {
    paths: [
      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
      "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    ],
  },
  "icon-mountain": {
    paths: [
      "M8 3l4 8 5-5 5 16H2L8 3z",
    ],
  },
  "icon-wave": {
    paths: [
      "M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0 4 3 6 0",
    ],
  },
  "icon-atom": {
    paths: [
      "M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0",
      "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10",
      "M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10",
      "M2 12h20",
    ],
  },
  "icon-galaxy": {
    paths: [
      "M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0",
      "M12 2c4 2 6 6 2 10-4 4-10 2-10-2s2-6 6-10 10-2 10 2",
    ],
  },
  "icon-dragon": {
    paths: [
      { d: "M9 2c1 3 4 5 7 5-1 3-3 5-6 5 2 2 5 4 8 3-2 4-6 7-10 7-3 0-6-3-6-7 0-5 3-10 7-13z" },
      { d: "M9 8c2.5 1.5 5 1.5 7.5 0", strokeWidth: 1, opacity: 0.7 },
      { d: "M5 14c3 2 6 2 9 0", strokeWidth: 1, opacity: 0.7 },
      { d: "M12 4l-1-2", opacity: 0.5 },
      { d: "M15 10l2 2-2 2", className: "text-accent", strokeWidth: 1.5 }
    ],
  },
  "icon-supernova": {
    paths: [
      "M12 2l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2z",
    ],
  },
  "icon-black-hole": {
    paths: [
      "M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
      "M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14",
    ],
  },
  "icon-quasar": {
    paths: [
      "M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0",
      "M2 12l4-2 4 4 4-4 4 2",
      "M12 2v4M12 18v4M4 4l3 3M17 17l3 3M4 20l3-3M17 7l3-3",
    ],
  },
  "icon-pulsar": {
    paths: [
      "M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0",
      "M2 12h4l2-6 2 12 2-12 2 6h4",
    ],
  },
  "icon-nebula-cloud": {
    paths: [
      "M8 18h8a4 4 0 0 0 0-8 5 5 0 0 0-10 1 3 3 0 0 0-1 5.9",
      "M10 8a5 5 0 0 1 8 2",
    ],
  },
  "icon-solar-flare": {
    paths: [
      "M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 0 0-8 0",
      "M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1",
    ],
  },
  "icon-wormhole": {
    paths: [
      "M12 2c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10",
      "M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6",
      "M12 9.5c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5",
    ],
  },
  "icon-singularity": {
    paths: [
      "M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0",
      "M12 2a10 10 0 1 0 0 20M12 2a10 10 0 1 1 0 20",
      "M12 6a6 6 0 1 0 0 12M12 6a6 6 0 1 1 0 12",
    ],
  },
  "icon-dark-star": {
    paths: [
      "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z",
    ],
  },
  "icon-cosmic-web": {
    paths: [
      "M5 5l14 14M19 5L5 19M12 2v20M2 12h20",
      "M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
    ],
  },
  "icon-multiverse": {
    paths: [
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
      "M4 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
      "M20 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    ],
  },
  "icon-time-crystal": {
    paths: [
      "M12 2l4 4-4 4-4-4 4-4zM12 14l4 4-4 4-4-4 4-4zM4 8l4 4-4 4M20 8l-4 4 4 4",
    ],
  },
  "icon-dyson-sphere": {
    paths: [
      "M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
      "M3.5 8h17M3.5 16h17",
    ],
  },
  "icon-omega": {
    paths: [
      "M8 21h8M12 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM8 17v4M16 17v4",
    ],
  },

  // --- New Common Icons ---
  "icon-calculator": {
    paths: [
      "M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z",
      "M8 10h8M8 14h2M8 18h2M14 14h2M14 18h2M8 6h8",
    ],
  },
  "icon-notebook": {
    paths: [
      "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z",
      "M8 4v16M12 8h4M12 12h4M12 16h2",
    ],
  },
  "icon-coffee": {
    paths: [
      "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z",
      "M6 1v3M10 1v3M14 1v3",
    ],
  },
  "icon-magnifier": {
    paths: [
      "M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.35-4.35",
    ],
  },
  "icon-bell": {
    paths: [
      "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
    ],
  },
  "icon-clock": {
    paths: [
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
      "M12 6v6l4 2",
    ],
  },
  "icon-key": {
    paths: [
      "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zM15.5 7.5l2 2L19 8l2-2",
    ],
  },
  "icon-dice": {
    paths: [
      "M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z",
      "M8 8h.01M12 12h.01M16 16h.01M16 8h.01M8 16h.01",
    ],
  },
  "icon-music": {
    paths: [
      "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    ],
  },
  "icon-puzzle": {
    paths: [
      "M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34",
      "M18 2l4 4-10 10H8v-4L18 2z",
    ],
  },

  // --- New Uncommon Icons (Crypto & Animals) ---
  "icon-bitcoin": {
    paths: [
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
      "M9.5 7H14a2.5 2.5 0 0 1 0 5h-4.5M9.5 12H15a2.5 2.5 0 0 1 0 5H9.5M10 5v2M10 17v2M14 5v2M14 17v2",
    ],
  },
  "icon-ethereum": {
    paths: [
      "M12 2l7 10-7 4-7-4 7-10zM12 16l7-4-7 10-7-10 7 4z",
    ],
  },
  "icon-bull": {
    paths: [
      "M5 3l3 5M19 3l-3 5M12 8c-4 0-7 3-7 7v4h14v-4c0-4-3-7-7-7z",
      "M9 15h.01M15 15h.01",
    ],
  },
  "icon-bear": {
    paths: [
      "M7 4a2 2 0 1 0 0 4M17 4a2 2 0 1 0 0 4M12 8c-4 0-7 3-7 7v5h14v-5c0-4-3-7-7-7z",
      "M9 15h.01M15 15h.01M10 18h4",
    ],
  },
  "icon-fingerprint": {
    paths: [
      "M12 10a2 2 0 0 0-2 2c0 3 2 6 2 6M18 12a6 6 0 0 0-12 0M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12",
      "M12 14c0 2 1 4 1 4",
    ],
  },
  "icon-stopwatch": {
    paths: [
      "M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9v4l2 2M10 2h4M12 2v3",
    ],
  },
  "icon-whale": {
    paths: [
      "M3 12c0-3 2-6 5-7 1 2 3 3 4 3s3-1 4-3c3 1 5 4 5 7 0 4-3 7-9 7s-9-3-9-7z",
      "M8 14h.01M16 14h.01",
    ],
  },
  "icon-hawk": {
    paths: [
      "M22 2L13 9l-2-2L2 16l5 5 9-9-2-2 8-8z",
      "M8 14l-3 3",
    ],
  },
  "icon-fox": {
    paths: [
      "M4 3l4 5M20 3l-4 5M12 8L8 8v7l4 5 4-5V8l-4 0z",
      "M10 13h.01M14 13h.01M11 16l1 1 1-1",
    ],
  },
  "icon-mining": {
    paths: [
      "M14 3l7 7-5 5-7-7 5-5zM3 21l6-6M3 14l7 7",
    ],
  },

  // --- New Rare Icons ---
  "icon-binoculars": {
    paths: [
      "M6 6a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0v-6a4 4 0 0 0-4-4zM18 6a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0v-6a4 4 0 0 0-4-4z",
      "M10 10h4",
    ],
  },
  "icon-radar": {
    paths: [
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
      "M12 12l7-7M12 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    ],
  },
  "icon-anvil": {
    paths: [
      "M7 8h10l2 4H5l2-4zM9 12v8M15 12v8M6 20h12M10 4h4v4h-4V4z",
    ],
  },
  "icon-tornado": {
    paths: [
      "M21 4H3M18 8H6M20 12H4M16 16H8M14 20h-4",
    ],
  },
  "icon-hourglass-flip": {
    paths: [
      "M5 2h14M5 22h14M12 12l5-5V2H7v5l5 5zM12 12l5 5v5H7v-5l5-5z",
      "M10 17h4",
    ],
  },
  "icon-crosshair": {
    paths: [
      "M12 2v4M12 18v4M2 12h4M18 12h4",
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    ],
  },
  "icon-chain": {
    paths: [
      "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
      "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    ],
  },
  "icon-satellite": {
    paths: [
      "M13 7L9 3 3 9l4 4M17 11l4 4-6 6-4-4",
      "M8 12l4 4M16 8a1 1 0 1 0 2 0 1 1 0 0 0-2 0z",
    ],
  },

  // --- New Epic Icons ---
  "icon-crystal-ball": {
    paths: [
      { d: "M12 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", className: "fill-accent/30 text-accent/50", strokeWidth: 1 },
      { d: "M12 6a4 4 0 0 1 3 1", strokeWidth: 1.5, className: "text-white opacity-80" },
      { d: "M7 19h10M9 21h6", className: "text-accent", strokeWidth: 2 },
      { d: "M10 13l1-2 2 1", strokeWidth: 1.5, className: "text-accent fill-accent" }
    ],
  },
  "icon-trident": {
    paths: [
      { d: "M12 2v20", className: "text-accent", strokeWidth: 2 },
      { d: "M8 2l4 6 4-6", strokeWidth: 1.5 },
      { d: "M6 8h12", strokeWidth: 1.5 },
      { d: "M12 12l2 2-2 2-2-2z", fillRule: "evenodd", className: "fill-accent" }
    ],
  },
  "icon-phoenix-wing": {
    paths: [
      { d: "M3 21c3-3 4-8 2-12 4 2 8 2 10 6 2-4 6-4 10-6-2 4-1 9 2 12", className: "fill-accent/40 text-accent", strokeWidth: 2 },
      { d: "M12 12v9", className: "text-accent", strokeWidth: 2, opacity: 0.7 },
      { d: "M8 15c2-2 6-2 8 0", strokeWidth: 1.5, className: "text-white opacity-80" }
    ],
  },
  "icon-lightning-orb": {
    paths: [
      { d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", className: "fill-accent/10" },
      { d: "M13 7l-4 6h5l-1 4", className: "fill-accent text-accent", strokeWidth: 1.5 },
      { d: "M12 5v1M12 18v1M5 12h1M18 12h1", opacity: 0.5, strokeWidth: 1 }
    ],
  },
  "icon-void-gem": {
    paths: [
      { d: "M6 3h12l4 6-10 12L2 9l4-6z", className: "fill-accent/20" },
      { d: "M12 9l-3 4h6l-3 4", strokeWidth: 1.5 },
      { d: "M12 3v18", opacity: 0.4 },
      { d: "M6 9h12", opacity: 0.4 }
    ],
  },
  "icon-solar-disc": {
    paths: [
      "M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z",
      "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
    ],
  },

  // --- Prestige Set (Level 100+) ---
  "icon-starfall": {
    paths: [
      { d: "M12 2l1.5 4.5L18 5l-2 4.5L20 12l-4.5 1.5L18 18l-4.5-2L12 20l-1.5-4L6 18l2-4.5L4 12l4.5-1.5L6 6l4.5 2L12 2z", className: "fill-accent/20" },
      { d: "M12 7l1 2 2-1-1 2 2 1-2 1 1 2-2-1-1 2-1-2-2 1 1-2-2-1 2-1-1-2 2 1z", className: "fill-accent", strokeWidth: 1 }
    ],
  },
  "icon-void-shard": {
    paths: [
      "M12 2l3 8h8l-6.5 5 2.5 8L12 17l-7 6 2.5-8L1 10h8l3-8z",
      "M12 8v6M9 11h6",
    ],
  },
  "icon-astral-key": {
    paths: [
      "M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V22h4V9.5A4 4 0 0 0 12 2z",
      "M10 14h4M10 17h4",
    ],
  },
  "icon-titan-hammer": {
    paths: [
      { d: "M10 2h4v6h4l-6 14-6-14h4V2z", className: "fill-accent/20" },
      { d: "M8 5h8M8 8h8", opacity: 0.5 },
      { d: "M12 12l-2 4h4z", fillRule: "evenodd", className: "fill-accent", strokeWidth: 1 }
    ],
  },
  "icon-celestial-eye": {
    paths: [
      { d: "M12 5C5 5 1 12 1 12s4 7 11 7 11-7 11-7-4-7-11-7z", className: "fill-accent/10" },
      { d: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", className: "fill-accent", strokeWidth: 1 },
      { d: "M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z", fillRule: "evenodd" },
      { d: "M1 12h2M21 12h2M12 1v2M12 21v2", opacity: 0.4, strokeWidth: 1.5 }
    ],
  },
  "icon-solar-crest": {
    paths: [
      "M12 2l2 4 4-1-1 4 4 2-4 2 1 4-4-1-2 4-2-4-4 1 1-4-4-2 4-2-1-4 4 1 2-4z",
    ],
  },
  "icon-nebula-heart": {
    paths: [
      { d: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z", className: "fill-accent/20" },
      { d: "M12 18l-1-1A12.7 12.7 0 0 1 4 8c0-2 1.5-3.5 3.5-3.5A3.5 3.5 0 0 1 11 6.5C11.5 5 13 4.5 15 4.5 17 4.5 18.5 6 18.5 8c0 3.2-6.5 9-6.5 9z", className: "fill-accent/40 text-accent", strokeWidth: 1.5 },
      { d: "M15 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", className: "fill-accent text-accent" }
    ],
  },
  "icon-quantum-core": {
    paths: [
      { d: "M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0", className: "fill-accent text-accent" },
      { d: "M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07", strokeWidth: 2, className: "text-white opacity-70" },
      { d: "M12 2v4M12 18v4M2 12h4M18 12h4", strokeWidth: 2.5, className: "text-accent" },
      { d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", strokeWidth: 1, className: "text-accent/30" }
    ],
  },
  "icon-dark-matter-shard": {
    paths: [
      { d: "M12 2l4 7h5l-4 5 2 8-7-4-7 4 2-8-4-5h5l4-7z", className: "fill-accent/30 text-accent", strokeWidth: 1.5 },
      { d: "M12 2v20", strokeWidth: 1, opacity: 0.5 },
      { d: "M2 9.5l20 5M2 14.5l20-5", strokeWidth: 1, opacity: 0.3 }
    ],
  },
  "icon-cosmic-forge": {
    paths: [
      { d: "M12 2v4M12 18v4M4 12h4M16 12h4", strokeWidth: 2 },
      { d: "M12 12m-4 0a4 4 0 1 0 8 0 4 4 0 0 0-8 0", className: "fill-accent/20" },
      { d: "M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83", strokeWidth: 1.5, opacity: 0.8 },
      { d: "M12 10l-2 2 2 2 2-2z", fillRule: "evenodd", className: "fill-accent" }
    ],
  },
  "icon-eternal-flame": {
    paths: [
      { d: "M12 2c.5 3-2 5-2 8a4 4 0 1 0 8 0c0-3-2-5-2-8-1 1-3 2-4 0z", className: "fill-accent/20 text-accent", strokeWidth: 1.5 },
      { d: "M12 14a2 2 0 0 0 2-2c0-1.5-2-3-2-3s-2 1.5-2 3a2 2 0 0 0 2 2z", className: "fill-accent text-accent" },
      { d: "M8 22h8", strokeWidth: 3 },
      { d: "M12 2v10", opacity: 0.5, strokeWidth: 1 }
    ],
  },
  "icon-void-walker": {
    paths: [
      { d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", className: "fill-accent/20 text-accent/50", strokeWidth: 1 },
      { d: "M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6", strokeWidth: 2.5, className: "text-accent" },
      { d: "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z", className: "fill-accent text-accent" },
      { d: "M12 15v4", className: "text-white opacity-90", strokeWidth: 2 }
    ],
  },
  "icon-dimension-rift": {
    paths: [
      { d: "M2 12h4l2-6 3 12 3-12 2 6h4", className: "text-accent", strokeWidth: 2 },
      { d: "M12 2v4M12 18v4", strokeWidth: 1.5, opacity: 0.8 },
      { d: "M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z", strokeWidth: 1, opacity: 0.3 }
    ],
  },
  "icon-infinite-star": {
    paths: [
      { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", className: "fill-accent/20" },
      { d: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", className: "fill-accent text-accent", strokeWidth: 1.5 },
      { d: "M8 12a4 4 0 1 1 0-.01M16 12a4 4 0 1 1 0-.01", strokeWidth: 1, opacity: 0.6 }
    ],
  },
  "icon-stargate-key": {
    paths: [
      { d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", strokeWidth: 1.5, className: "fill-accent/10" },
      { d: "M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z", strokeWidth: 1, opacity: 0.6 },
      { d: "M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", className: "fill-accent text-accent", strokeWidth: 1.5 },
      { d: "M12 2l-2 4 2 4M12 14l2 4-2 4M2 12l4 2 4-2M14 12l4-2 4 2", strokeWidth: 1, opacity: 0.4 }
    ],
  },
};

/**
 * Render a cosmetic icon as inline SVG JSX.
 * @param iconId The css_class value from cosmetic_definitions (e.g., "icon-seedling")
 * @param size Pixel size for the SVG (width & height)
 * @param className Optional additional CSS classes
 */
export function renderCosmeticIcon(
  iconId: string,
  size: number,
  className?: string,
): JSX.Element | null {
  const def = ICONS[iconId];
  if (!def) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={def.viewBox ?? "0 0 24 24"}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {def.paths.map((p, i) => {
        const pathData = typeof p === 'string' ? p : p.d;
        const fillRule = typeof p === 'object' && p.fillRule ? p.fillRule : def.fillRule ?? "nonzero";
        const cName = typeof p === 'object' ? p.className : undefined;
        const pathOpacity = typeof p === 'object' ? p.opacity : undefined;
        const pStrokeWidth = typeof p === 'object' ? p.strokeWidth : undefined;

        return (
          <path
            key={i}
            d={pathData}
            fillRule={fillRule}
            className={cName}
            opacity={pathOpacity}
            strokeWidth={pStrokeWidth}
          />
        );
      })}
    </svg>
  );
}

/** Check if an icon ID exists in the registry */
export function hasIcon(iconId: string): boolean {
  return iconId in ICONS;
}

/** Get all registered icon IDs */
export function getIconIds(): string[] {
  return Object.keys(ICONS);
}
