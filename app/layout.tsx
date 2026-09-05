import React from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Açaí da Rose — PDV & Franqueadora Multi-Loja',
  description: 'Frente de caixa touch com Motor de Montagem de Açaí e Gestão Multi-Loja (PT-PT)',
  icons: {
    icon: '/logo-oficial.png',
    shortcut: '/logo-oficial.png',
    apple: '/logo-oficial.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo-oficial.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-oficial.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Dancing+Script:wght@600;700&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);',
          }}
        />
      </head>
      <body className="bg-[#f8f6fc] text-slate-900 dark:bg-[#120120] dark:text-white min-h-screen antialiased selection:bg-pink-500 selection:text-white transition-colors duration-150">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
