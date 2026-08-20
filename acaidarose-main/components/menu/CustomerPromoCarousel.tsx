'use client'

import React, { useState, useEffect } from 'react'
import { useHighlightsStore } from '@/lib/stores/highlightsStore'
import { formatCurrency } from '@/lib/i18n/formatters'

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
    }, 5000)
    return () => clearInterval(timer)
  }, [displayItems.length])

  if (displayItems.length === 0) return null

  const banner = displayItems[currentIndex] || displayItems[0]

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-4 select-none">
      <div
        onClick={() => onSelectPromo && onSelectPromo(banner.id)}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#290348] via-[#43076a] to-[#1e0236] border border-white/15 shadow-2xl p-6 md:p-8 min-h-[220px] md:min-h-[260px] flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer group transition-all duration-300 hover:border-fuchsia-400/50"
      >
        {/* Fundo com Brilho Suave Roxo */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Informações Textuais */}
        <div className="relative z-10 space-y-3 max-w-xl text-left">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-400 text-purple-950 tracking-wider shadow-sm">
              {banner.badgeLabel || 'DESTAQUE'}
            </span>
            <span className="text-xs font-bold text-fuchsia-300">
              ★ Escolha do Chef
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight group-hover:text-fuchsia-200 transition-colors">
            {banner.title}
          </h2>

          <p className="text-xs md:text-sm text-purple-200/80 leading-relaxed line-clamp-2">
            {banner.subtitle}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-lg md:text-xl font-black text-amber-300 font-mono">
              {formatCurrency(banner.price)}
            </span>
            <span className="text-xs font-bold text-white/90 bg-fuchsia-600/80 px-3 py-1 rounded-xl shadow-sm">
              Pedir Agora →
            </span>
          </div>
        </div>

        {/* Imagem do Produto em Alta Definição */}
        <div className="relative z-10 flex-shrink-0 w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Indicadores de Paginação do Carrossel */}
        {displayItems.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {displayItems.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex(idx)
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
