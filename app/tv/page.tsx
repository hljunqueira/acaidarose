'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CatalogData } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'

const TV_PLAYLIST = [
  '/videos/hero_cup_rotation.mp4',
  '/videos/hero_gliding_texture.mp4',
  '/videos/hero_orbiting_cup.mp4',
  '/videos/hero_revealing_cup.mp4',
]

function TVMenuContent() {
  const searchParams = useSearchParams()
  const rawLoja = searchParams.get('loja') || searchParams.get('tenantId') || searchParams.get('tenant') || '1'
  
  const [catalog, setCatalog] = useState<CatalogData>({ containers: [], bases: [], toppings: [] })
  const [loading, setLoading] = useState(true)
  const [videoIndex, setVideoIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const storeTitle = rawLoja.includes('torres') || rawLoja === '2' 
    ? 'Filial Torres Novas' 
    : 'Matriz Aveiro'

  useEffect(() => {
    fetch(`/api/products?loja=${encodeURIComponent(rawLoja)}`)
      .then((r) => r.json())
      .then((data) => {
        setCatalog(data)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [rawLoja])

  const handleVideoEnded = () => {
    setVideoIndex((prev) => (prev + 1) % TV_PLAYLIST.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0612] flex items-center justify-center text-purple-300 font-bold text-lg">
        A carregar ementa digital...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0612] text-white p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Açaí da Rose" className="h-12 w-auto object-contain" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Açaí da Rose</h1>
            <p className="text-[10px] sm:text-xs text-purple-300 font-bold tracking-widest uppercase">{storeTitle}</p>
          </div>
        </div>
        <div className="text-xs font-bold text-purple-300">
          Peça pelo QR Code da sua mesa física
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Coluna Esquerda: Listagem Minimalista (7 Colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Categoria 1: Taças */}
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-pink-400 pb-1.5 border-b border-purple-900/30">
              Taças de Açaí
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {catalog.containers?.slice(0, 5).map((c) => (
                <div key={c.id} className="flex justify-between items-center bg-[#160F24] p-3 rounded-2xl border border-[#2A1E3D]">
                  <span className="font-black text-sm uppercase">{c.name}</span>
                  <span className="font-mono font-black text-pink-300 text-sm">{formatCurrency(c.precoBase)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Duas colunas para Bases e Toppings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Categoria 2: Bases */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-pink-400 pb-1.5 border-b border-purple-900/30">
                Bases Cremosas
              </h2>
              <div className="space-y-2">
                {catalog.bases?.slice(0, 5).map((b) => (
                  <div key={b.id} className="text-xs font-bold py-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                    <span>{b.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categoria 3: Toppings */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-pink-400 pb-1.5 border-b border-purple-900/30">
                Toppings em Destaque
              </h2>
              <div className="space-y-2">
                {catalog.toppings?.slice(0, 7).map((t) => (
                  <div key={t.id} className="text-xs font-bold py-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-500 shrink-0" />
                    <span>{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Video Loop (5 Colunas) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="relative aspect-video lg:aspect-[9/16] rounded-3xl overflow-hidden bg-black/60 border border-[#2A1E3D] shadow-inner">
            <video
              ref={videoRef}
              key={TV_PLAYLIST[videoIndex]}
              src={TV_PLAYLIST[videoIndex]}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnded}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TVMenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0612] flex items-center justify-center text-purple-300 font-bold">
        A carregar ementa digital...
      </div>
    }>
      <TVMenuContent />
    </Suspense>
  )
}
