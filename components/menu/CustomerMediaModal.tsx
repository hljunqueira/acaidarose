'use client'

import React from 'react'
import { ProductContainer } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { X, Play } from 'lucide-react'
import { useLanguageStore } from '@/lib/stores/languageStore'
import { getLocalizedField } from '@/lib/i18n/localization'

interface CustomerMediaModalProps {
  product: ProductContainer | null
  onClose: () => void
}

export default function CustomerMediaModal({ product, onClose }: CustomerMediaModalProps) {
  const { language } = useLanguageStore()
  if (!product) return null

  const displayName = getLocalizedField(product, 'name', language) || product.name
  const displayDesc = getLocalizedField(product, 'description', language) || product.description
  const hasVideo = Boolean(product.videoUrl)
  const imageSrc = product.image || product.videoPoster || ''
  const hasMedia = hasVideo || Boolean(imageSrc)
  const weight = product.weightGrams || null

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl w-[95vw] p-0 overflow-hidden bg-black/90 backdrop-blur-xl border border-white/15 text-white rounded-3xl shadow-2xl sm:max-w-xl"
        style={{ animationDuration: '200ms' }}
      >
        <DialogTitle className="sr-only">{displayName}</DialogTitle>

        {/* Botão Fechar Flutuante */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Conteúdo de Mídia: Vídeo ou Imagem em Destaque */}
        <div className="relative w-full flex items-center justify-center bg-black/40 min-h-[260px] max-h-[72vh] sm:max-h-[75vh] overflow-hidden">
          {hasVideo ? (
            <video
              src={product.videoUrl!}
              controls
              autoPlay
              loop
              playsInline
              preload="auto"
              className="w-full max-h-[72vh] sm:max-h-[75vh] object-contain mx-auto"
            />
          ) : imageSrc ? (
            <img
              src={imageSrc}
              alt={displayName}
              className="w-full max-h-[72vh] sm:max-h-[75vh] object-contain mx-auto"
            />
          ) : (
            <div className="py-20 px-4 text-center text-white/60 text-sm">
              Nenhuma mídia disponível para este item.
            </div>
          )}
        </div>

        {/* Rodapé Informativo: Nome, Categoria, Peso e Preço */}
        <div className="p-4 sm:p-5 bg-gradient-to-t from-black via-black/90 to-black/70 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 bg-pink-500/20 px-2 py-0.5 rounded-md border border-pink-500/30">
                {product.categoryName || 'Item'}
              </span>
              {weight && (
                <span className="text-[10px] font-bold text-white/80 bg-white/10 px-2 py-0.5 rounded-md">
                  {weight}g
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white truncate tracking-tight">
              {displayName}
            </h3>
            {displayDesc && (
              <p className="text-xs text-white/70 line-clamp-2 leading-relaxed max-w-md">
                {displayDesc}
              </p>
            )}
          </div>

          <div className="text-left sm:text-right shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
            <span className="text-[10px] uppercase font-bold text-white/50">Preço</span>
            <span className="text-xl sm:text-2xl font-black text-pink-400 font-mono">
              {formatCurrency(product.precoBase || 0)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
