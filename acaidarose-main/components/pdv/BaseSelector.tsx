'use client'

import React from 'react'
import { ProductBase, ProductContainer } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface BaseSelectorProps {
  bases: ProductBase[]
  container: ProductContainer
  selectedBases: ProductBase[]
  onToggleBase: (base: ProductBase) => void
}

export default function BaseSelector({ bases, container, selectedBases, onToggleBase }: BaseSelectorProps) {
  const max = container.limiteCremes || container.limiteBases || 1
  const count = selectedBases.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100">
        <div>
          <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
            Cremes Gelados & Bases (1 Opcional Incluso)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pode escolher <b>{max}</b> opção de creme gelado para acompanhar o seu açaí
          </p>
        </div>
        <span
          className={`text-xs font-black px-3 py-1 rounded-full ${
            count > 0 ? 'bg-purple-600 text-white shadow-xs' : 'bg-muted text-muted-foreground'
          }`}
        >
          {count} de {max} selecionado
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {bases.filter((b) => b.active !== false).map((b) => {
          const isSelected = selectedBases.some((x) => x.id === b.id)
          const isAvailable = b.isAvailableInStore !== false

          return (
            <button
              key={b.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onToggleBase(b)}
              className={`relative p-3.5 rounded-2xl border-2 transition-all duration-200 text-left flex items-center justify-between gap-3 ${
                !isAvailable
                  ? 'border-border/60 bg-muted/40 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-purple-600 bg-purple-50/90 shadow-lg shadow-purple-600/15 ring-2 ring-purple-400/30 scale-[1.01] cursor-pointer'
                  : 'border-purple-100/80 hover:border-purple-300 hover:shadow-md bg-white hover:scale-[1.01] cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl p-1 rounded-xl bg-purple-50 border border-purple-100 flex-shrink-0">
                  {b.emoji || '🍨'}
                </span>
                <div className="min-w-0">
                  <div className="font-black text-xs sm:text-sm text-foreground leading-tight truncate">
                    {b.name}
                  </div>
                  {b.description && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{b.description}</div>
                  )}
                </div>
              </div>

              {!isAvailable ? (
                <Badge variant="destructive" className="text-[9px] py-0 px-1 font-bold flex-shrink-0">
                  Esgotado
                </Badge>
              ) : (
                <div
                  className={`h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'border-2 border-muted-foreground/20 bg-muted/20 text-transparent opacity-40'
                  }`}
                >
                  <Check className={`h-4 w-4 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
