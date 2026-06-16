import type { NextConfig } from 'next'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: { disableDevLogs: true },
})

// Server-side origin of the Spring Boot backend. The browser never hits this
// directly — requests to /api/v1/* are proxied here by the rewrite below, so an
// HTTPS Vercel page can talk to an HTTP backend without mixed-content blocking
// and auth cookies stay same-origin (SameSite=Strict keeps working).
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? 'http://96.9.81.187:8083'

// Extra dev origins (your LAN IP, an ngrok host) come from DEV_ORIGINS — a
// comma-separated list — so personal/ephemeral values never get committed.
// e.g. DEV_ORIGINS=192.168.1.50,abc123.ngrok-free.dev
const devOrigins = (process.env.DEV_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  output: 'standalone',
  turbopack: {},
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_ORIGIN}/api/v1/:path*`,
      },
    ]
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/gatherly/**',
      },
      {
        protocol: 'http',
        hostname: '96.9.81.187',
        port: '9000',
        pathname: '/gatherly/**',
      },
    ],
  },
}

export default withPWA(nextConfig)
