import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { OfflineBanner } from "@/components/offline-banner"
import { SerwistProvider } from "@serwist/turbopack/react"
import "@/lib/patchFetch"

export const metadata: Metadata = {
  title: 'CreditWay Préstamos',
  description: 'Gestión de préstamos',
  applicationName: 'CreditWay Préstamos',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CreditWay',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Dancing+Script:wght@600;700&display=swap" rel="stylesheet" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV !== 'production'}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors closeButton position="top-right" />
            <OfflineBanner />
          </ThemeProvider>
        </SerwistProvider>
      </body>
    </html>
  )
}
