import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Gatherly — Admin Console',
  description: 'Events, orchestrated end to end.',
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable}>
      <body style={{ fontFamily: 'var(--font-sora), sans-serif' }}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
