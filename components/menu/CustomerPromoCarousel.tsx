'use client'

import React, { useState, useEffect } from 'react'
import { useHighlightsStore } from '@/lib/stores/highlightsStore'
import { formatCurrency } from '@/lib/i18n/formatters'

import { ChevronLeft, ChevronRight, ArrowRight, ChevronDown } from 'lucide-react'

export default function CustomerPromoCarousel({ onSelectPromo }: { onSelectPromo?: (id: string) => void }) {
  const { highlights } = useHighlightsStore()
  const [currentIndex, setCurrentIndex] = useState(0)

  // Filtrar apenas destaques ativos
  const activeHighlights = highlights.filter((h) => h.active)
  const displayItems = activeHighlights.length > 0 ? activeHighlights : highlights

  useEffect(() => {
    if (displayItems.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [displayItems.length])

  if (displayItems.length === 0) return null

  const banner = displayItems[currentIndex] || displayItems[0]
  const videoSrc = banner.videoUrl || '/videos/hero_cup_rotation.mp4'

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % displayItems.length)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 select-none">
      <div
        onClick={() => onSelectPromo && onSelectPromo(banner.id)}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2c044e] via-[#3a065e] to-[#1a012c] border border-white/20 shadow-xl p-4 sm:p-6 md:p-10 flex flex-col-reverse md:flex-row items-center justify-between gap-4 sm:gap-6 md:gap-8 cursor-pointer group transition-all duration-300 hover:border-pink-500/50 hover:shadow-pink-600/20"
      >
        {/* Glows de Fundo */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Coluna Texto & Call-to-Action */}
        <div className="relative z-10 space-y-3 sm:space-y-4 max-w-xl text-left w-full">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white tracking-wider shadow-sm">
              {banner.badgeLabel || 'DESTAQUE OFICIAL'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white leading-tight tracking-tight group-hover:text-pink-200 transition-colors">
            {banner.title}
          </h2>

          <p className="text-xs sm:text-sm text-purple-200/85 leading-relaxed line-clamp-2">
            {banner.subtitle}
          </p>

          <div className="flex items-center justify-between gap-3 pt-3 sm:pt-4 pb-3">
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-purple-300 tracking-wider">Preço Especial</span>
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-pink-300 font-mono tracking-tight">
                {formatCurrency(banner.price)}
              </span>
            </div>

            <button
              type="button"
              className="h-11 sm:h-12 px-5 sm:px-7 rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-pink-600/30 flex items-center gap-2 hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <span>Ver no Cardápio</span>
              <ChevronDown className="h-4 w-4 animate-bounce" />
            </button>
          </div>
        </div>

        {/* Coluna Vídeo / Imagem Oficial em Loop Contínuo */}
        <div className="relative z-10 flex-shrink-0 w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-white/20 bg-purple-950/50">
          {videoSrc ? (
            <video
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
        </div>

        {/* Botões Laterais de Navegação (Desktop) */}
        {displayItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white items-center justify-center backdrop-blur-md transition-all hover:scale-105"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white items-center justify-center backdrop-blur-md transition-all hover:scale-105"
              aria-label="Próximo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Indicadores de Paginação do Carrossel */}
        {displayItems.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {displayItems.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex(idx)
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-6 bg-pink-400' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
