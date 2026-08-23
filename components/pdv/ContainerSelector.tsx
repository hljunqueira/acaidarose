'use client'

import React from 'react'
import { ProductContainer } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Check } from 'lucide-react'

interface ContainerSelectorProps {
  containers: ProductContainer[]
  selected: ProductContainer | null
  onSelect: (container: ProductContainer) => void
}

export default function ContainerSelector({ containers, selected, onSelect }: ContainerSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
          Escolha o Tamanho do Açaí
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Selecione o recipiente para aplicar as regras de frutas, acompanhamentos e valor
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {containers.filter((c) => c.active !== false).map((c) => {
          const isSelected = selected?.id === c.id
          const isAvailable = c.isAvailableInStore !== false
          const isUnlimited = c.weightGrams >= 500

          return (
            <Card
              key={c.id}
              onClick={() => isAvailable && onSelect(c)}
              className={`relative overflow-hidden transition-all duration-200 p-3.5 flex flex-col justify-between border-2 rounded-3xl group ${
                !isAvailable
                  ? 'border-border/60 bg-muted/30 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-purple-600 bg-purple-50/70 shadow-xl shadow-purple-700/15 ring-2 ring-purple-500/30 scale-[1.02] cursor-pointer'
                  : 'border-purple-100/90 hover:border-purple-300 hover:shadow-lg hover:scale-[1.01] bg-white cursor-pointer'
              }`}
            >
              {/* Selected Check Badge */}
              {isSelected && isAvailable && (
                <div className="absolute top-0 right-0 bg-purple-700 text-white rounded-bl-2xl p-1.5 shadow-md z-10">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
              )}

              {/* Status Esgotado */}
              {!isAvailable && (
                <div className="absolute top-2.5 right-2.5 z-10">
                  <Badge variant="destructive" className="text-[9px] py-0.5 px-1.5 font-black uppercase">
                    Esgotado
                  </Badge>
                </div>
              )}

              <div>
                {/* Imagem Real de Alta Qualidade */}
                <div className="h-28 w-full rounded-2xl overflow-hidden bg-purple-100 relative mb-3 border border-purple-100 shadow-2xs">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={c.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-black text-purple-700">
                      {c.name}
                    </div>
                  )}

                  {/* Preço em Destaque Flutuante no Topo da Foto */}
                  <div className="absolute bottom-2 right-2 bg-[#1b032e]/85 backdrop-blur-md text-fuchsia-200 px-2.5 py-0.5 rounded-xl font-black text-xs shadow-md border border-white/10">
                    {formatCurrency(c.precoBase)}
                  </div>
                </div>

                {/* Nome do Tamanho */}
                <div className="font-black text-sm text-foreground leading-tight">{c.name}</div>

                {/* Regras e Inclusões */}
                <div className="mt-2 space-y-1 text-xs">
                  {isUnlimited ? (
                    <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-extrabold flex items-center gap-1.5 border border-emerald-200/60">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 flex-shrink-0 animate-pulse"></span>
                      <span className="text-[11px] leading-tight">Frutas & Toppings Livres</span>
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-muted-foreground text-[11px]">
                      <div className="font-semibold text-purple-950">
                        • <b>{c.limiteFrutas}</b> frutas inclusas
                      </div>
                      <div className="font-semibold text-purple-950">
                        • <b>{c.limiteToppings}</b> toppings inclusos
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-purple-700 font-semibold pt-1">
                    + 1 creme gelado incluso
                  </div>
                </div>
              </div>

              {/* Botão de Ação / Rodapé */}
              <div className="mt-3 pt-2.5 border-t border-purple-100/70 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-semibold">Total base</span>
                <span className="text-xs font-black text-purple-900">
                  {formatCurrency(c.precoBase)}
                </span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
