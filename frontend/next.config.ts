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

// Extra dev origins (your LAN IP, an ngrok host) come from DEV_ORIGINS — a
// comma-separated list — so personal/ephemeral values never get committed.
// e.g. DEV_ORIGINS=192.168.1.50,abc123.ngrok-free.dev
const devOrigins = (process.env.DEV_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: devOrigins,
  turbopack: {},
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
    ],
  },
}

export default withPWA(nextConfig)
