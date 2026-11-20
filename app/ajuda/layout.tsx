import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Central de Manuais & Ajuda — Açaí da Rose',
  description: 'Guias operacionais passo a passo da Franqueadora Master, Franquias e Operação de Caixa.',
  icons: {
    icon: 'https://app.acaidarose.pt/logo-oficial-1.png',
    shortcut: 'https://app.acaidarose.pt/logo-oficial-1.png',
    apple: 'https://app.acaidarose.pt/logo-oficial-1.png',
  },
}

export default function AjudaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="icon" href="https://app.acaidarose.pt/logo-oficial-1.png" type="image/png" />
      <link rel="apple-touch-icon" href="https://app.acaidarose.pt/logo-oficial-1.png" />
      {children}
    </>
  )
}
