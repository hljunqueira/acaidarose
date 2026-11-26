import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Convite Cashback — Açaí da Rose',
  description:
    'Recebeste um convite para o programa de Cashback da Açaí da Rose. Regista-te na app e ganha pontos bónus na tua primeira compra.',
}

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const cleanCode = decodeURIComponent(code || '')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .toUpperCase()
  const deepLink = `acaidarose://convite/${cleanCode}`

  return (
    <main className="min-h-screen bg-[#FAF7FC] text-[#22092C] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-purple-100 shadow-sm p-8 text-center space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-700">
            Açaí da Rose · Cashback
          </p>
          <h1 className="text-2xl font-black tracking-tight text-purple-950">
            Foste convidado para ganhar pontos
          </h1>
          <p className="text-sm text-purple-900/75 leading-relaxed">
            Usa o código abaixo ao criar a tua conta na app Açaí da Rose Cashback e recebe pontos
            bónus automaticamente na tua primeira compra ao balcão.
          </p>
        </div>

        <div className="rounded-2xl bg-purple-50 border border-purple-200 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
            Código de Convite
          </div>
          <div className="text-2xl font-black font-mono tracking-widest text-purple-950 mt-1">
            {cleanCode || 'ROSE'}
          </div>
        </div>

        <div className="space-y-3">
          <a
            href={deepLink}
            className="block w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-700 to-pink-600 text-white text-sm font-black shadow-md hover:opacity-95 transition"
          >
            Abrir na App Açaí da Rose
          </a>

          <Link
            href="/"
            className="block w-full py-3 px-5 rounded-2xl border border-purple-200 text-purple-900 text-xs font-bold hover:bg-purple-50 transition"
          >
            Visitar Site Oficial
          </Link>
        </div>
      </div>
    </main>
  )
}
