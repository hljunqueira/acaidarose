'use client'

import React, { useState, useEffect } from 'react'
import { useHighlightsStore } from '@/lib/stores/highlightsStore'
import { formatCurrency } from '@/lib/i18n/formatters'

import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ChevronDown } from 'lucide-react'

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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2c044e] via-[#3a065e] to-[#1a012c] border border-white/20 shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12 min-h-[260px] md:min-h-[320px] lg:min-h-[360px] flex flex-col-reverse md:flex-row items-center justify-between gap-6 md:gap-10 cursor-pointer group transition-all duration-300 hover:border-pink-500/60 hover:shadow-[0_20px_50px_rgba(236,72,153,0.25)]"
      >
        {/* Glows de Fundo */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-pink-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-fuchsia-600/25 rounded-full blur-3xl pointer-events-none" />

        {/* Coluna Texto & Call-to-Action */}
        <div className="relative z-10 space-y-4 md:space-y-5 max-w-xl text-left w-full">
          <div>
            <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white tracking-wider shadow-md">
              {banner.badgeLabel || 'DESTAQUE OFICIAL'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight group-hover:text-pink-200 transition-colors">
            {banner.title}
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-purple-200/85 leading-relaxed line-clamp-2">
            {banner.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 md:pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Preço Especial</span>
              <span className="text-2xl sm:text-3xl md:text-4xl font-black text-pink-300 font-mono tracking-tight">
                {formatCurrency(banner.price)}
              </span>
            </div>

            <button
              type="button"
              className="h-12 sm:h-13 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 group-hover:from-pink-500 group-hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-pink-600/30 flex items-center gap-2 group-hover:scale-105 transition-all cursor-pointer"
            >
              <span>Ver no Cardápio</span>
              <ChevronDown className="h-4 w-4 animate-bounce" />
            </button>
          </div>
        </div>

        {/* Coluna Imagem Oficial 8K Ampliada */}
        <div className="relative z-10 flex-shrink-0 w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-84 lg:h-84 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-purple-950/40">
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
          />
        </div>

        {/* Botões Laterais de Navegação (Desktop) */}
        {displayItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white items-center justify-center backdrop-blur-md transition-all hover:scale-110"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white items-center justify-center backdrop-blur-md transition-all hover:scale-110"
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Indicadores de Paginação do Carrossel */}
        {displayItems.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {displayItems.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex(idx)
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-8 bg-pink-400' : 'w-2.5 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
