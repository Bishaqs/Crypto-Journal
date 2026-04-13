import type { NextConfig } from "next";

// ── CSP: Client-Side Allowed Origins ─────────────────────────────
// Every external domain the BROWSER talks to must be listed here.
// Server-side API routes (src/app/api/) are NOT governed by CSP.
// When adding a new client-side fetch/WebSocket, add the domain here.
const cspConnectSrc = [
  "'self'",
  "https://*.supabase.co",           // Auth, DB, storage
  "wss://*.supabase.co",             // Realtime subscriptions
  "https://api.coingecko.com",       // Market overview (via API route, but also client cache)
  "https://min-api.cryptocompare.com", // Crypto price data
  "https://api.anthropic.com",       // AI chat (client streaming)
  "https://api.openai.com",          // AI chat fallback
  "https://generativelanguage.googleapis.com", // Gemini AI
  "https://cryptopanic.com",         // News feed
  "https://finnhub.io",              // Stock/forex news
  "https://*.binance.com",           // Derivatives page, emotion popover, simulator klines
  "wss://*.binance.com",             // Liquidations WebSocket
  "https://*.tradingview.com",       // TradingView widget data
  "wss://*.tradingview.com",         // TradingView real-time data
];

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['recharts', 'framer-motion', 'lucide-react'],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'stargate-journal.vercel.app' }],
        destination: 'https://traversejournal.com/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self'",
              `connect-src ${cspConnectSrc.join(' ')}`,
              "frame-src 'self' https://*.tradingview.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
