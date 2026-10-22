'use client'

import React, { useEffect, useMemo } from 'react'
import { ProductBase, ProductContainer } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

interface BaseSelectorProps {
  bases: ProductBase[]
  container: ProductContainer
  selectedBases: ProductBase[]
  onToggleBase: (base: ProductBase) => void
}

export default function BaseSelector({ bases, container, selectedBases, onToggleBase }: BaseSelectorProps) {
  const isSomenteCreme =
    (container.name || '').toLowerCase().includes('somente creme') ||
    (container.name || '').toLowerCase().includes('apenas creme')
  const isBaseFixed = container.isBaseFixed !== undefined ? container.isBaseFixed : !isSomenteCreme

  // Localiza a base mestra do Açaí Tradicional
  const acaiBase = useMemo(() => {
    return bases.find(
      (b) =>
        (b.name || '').toLowerCase().includes('açaí') ||
        (b.name || '').toLowerCase().includes('acai')
    )
  }, [bases])

  // Garante que o Açaí Tradicional venha pré-marcado obrigatoriamente se for copo de açaí com base fixa
  useEffect(() => {
    if (isBaseFixed && acaiBase && !selectedBases.some((b) => b.id === acaiBase.id)) {
      onToggleBase(acaiBase)
    }
  }, [isBaseFixed, acaiBase, selectedBases, onToggleBase])

  // Demais bases são os Cremes Gelados
  const otherBases = useMemo(() => {
    if (!isBaseFixed) return bases.filter((b) => b.active !== false)
    return bases.filter((b) => b.active !== false && (!acaiBase || b.id !== acaiBase.id))
  }, [bases, isBaseFixed, acaiBase])

  // Contagem de cremes selecionados
  const selectedCremes = useMemo(() => {
    if (!isBaseFixed) return selectedBases
    return selectedBases.filter((b) => !acaiBase || b.id !== acaiBase.id)
  }, [selectedBases, isBaseFixed, acaiBase])

  const maxCremesInclusos = isBaseFixed
    ? Number(container.limiteCremes) || 1
    : Number(container.limiteCremes) || Number(container.limiteBases) || 2

  const cremesCount = selectedCremes.length
  const extraCount = Math.max(0, cremesCount - maxCremesInclusos)

  const handleAcaiClick = () => {
    if (isBaseFixed) {
      toast.info('O Açaí Tradicional é a base fixa inclusa deste copo.')
      return
    }
    if (acaiBase) onToggleBase(acaiBase)
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho de Regra Dinâmica */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-purple-50/70 dark:bg-white/5 p-3.5 rounded-2xl border border-purple-100 dark:border-white/10">
        <div>
          <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-1.5">
            <span>{isBaseFixed ? 'Cremes Gelados & Base Açaí' : 'Cremes Gelados & Bases'}</span>
            {isBaseFixed && (
              <Badge className="bg-purple-700 text-white text-[10px] font-bold px-2 py-0.2">
                Açaí Fixo Incluso
              </Badge>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isBaseFixed ? (
              <>
                <b>Açaí Tradicional incluso</b> + <b>{maxCremesInclusos} creme gelado incluso</b> no pedido • Cremes adicionais somam <b>+€ 2,00</b> cada
              </>
            ) : (
              <>
                <b>{maxCremesInclusos} opções</b> inclusas no pedido • Opções adicionais somam <b>+€ 2,00</b> cada
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {extraCount > 0 && (
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-black px-2.5 py-0.5">
              +{extraCount}x Creme Extra (+€ {(extraCount * 2).toFixed(2)})
            </Badge>
          )}
          <span
            className={`text-xs font-black px-3 py-1 rounded-full ${
              cremesCount > 0 ? 'bg-purple-600 text-white shadow-xs' : 'bg-muted text-muted-foreground'
            }`}
          >
            {cremesCount} {cremesCount === 1 ? 'creme escolhido' : 'cremes escolhidos'}
          </span>
        </div>
      </div>

      {/* 1. SEÇÃO FIXA: BASE AÇAÍ TRADICIONAL (Quando base fixa inclusa) */}
      {isBaseFixed && acaiBase && (
        <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 flex items-center justify-between gap-3 shadow-xs">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-foreground leading-tight truncate">
                {acaiBase.name}
              </span>
              <Badge className="bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                Base Fixa Inclusa
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Base mestra do copo de açaí (inclusa no preço padrão)
            </div>
          </div>

          <button
            type="button"
            onClick={handleAcaiClick}
            className="h-8 px-3 rounded-xl bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-purple-200 text-xs font-bold flex items-center cursor-not-allowed opacity-90"
            title="Açaí já incluído como base obrigatória deste copo"
          >
            <span>Obrigatório</span>
          </button>
        </div>
      )}

      {/* 2. SEÇÃO DE CREMES GELADOS LIVRES */}
      <div className="space-y-2">
        {isBaseFixed && (
          <div className="text-xs font-black uppercase text-purple-950 dark:text-purple-300 tracking-wider px-1">
            Escolha seu Creme Gelado Incluso (+€ 2,00 para cremes adicionais):
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {otherBases.map((b) => {
            const isSelected = selectedBases.some((x) => x.id === b.id)
            const isAvailable = b.isAvailableInStore !== false
            const isExtraCandidate = !isSelected && cremesCount >= maxCremesInclusos

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
                    ? 'border-purple-600 bg-purple-50/90 dark:bg-purple-950/60 shadow-lg shadow-purple-600/15 ring-2 ring-purple-400/30 scale-[1.01] cursor-pointer'
                    : 'border-purple-100/80 dark:border-white/10 hover:border-purple-300 dark:hover:border-white/20 hover:shadow-md bg-white dark:bg-[#1f0337] hover:scale-[1.01] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs sm:text-sm text-foreground leading-tight truncate">
                        {b.name}
                      </span>
                      {isExtraCandidate && (
                        <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 px-1.5 py-0.2 rounded-md">
                          +€ 2,00
                        </span>
                      )}
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
    </div>
  )
}
