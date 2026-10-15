'use client'

import React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Store, Globe, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ApplyScopeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  actionLabel: string
  currentStoreName: string
  storesCount: number
  onConfirm: (applyToAll: boolean) => void
}

export default function ApplyScopeModal({
  open,
  onOpenChange,
  itemName,
  actionLabel,
  currentStoreName,
  storesCount,
  onConfirm,
}: ApplyScopeModalProps) {
  const handleSelect = (applyToAll: boolean) => {
    onConfirm(applyToAll)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-[#160228] text-foreground border border-purple-100 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
        <DialogTitle className="text-base sm:text-lg font-black text-purple-950 dark:text-white leading-tight">
          Onde deseja aplicar esta alteração?
        </DialogTitle>

        <div className="my-2 p-3 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-xs">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
            Item Selecionado
          </div>
          <div className="font-extrabold text-purple-950 dark:text-white text-sm truncate mt-0.5">
            {itemName}
          </div>
          <div className="text-[11px] text-purple-700 dark:text-pink-300 font-semibold mt-0.5">
            {actionLabel}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Como Franqueadora Master, você pode aplicar esta modificação apenas na unidade atual ou propagar para toda a franquia:
        </p>

        <div className="space-y-2.5">
          {/* OPÇÃO 1: APENAS NA LOJA ATUAL */}
          <button
            type="button"
            onClick={() => handleSelect(false)}
            className="w-full p-3.5 rounded-2xl border border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-left transition flex items-center justify-between group cursor-pointer shadow-xs"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 mt-0.5 shrink-0">
                <Store className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground">
                  Apenas na Loja Atual
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {currentStoreName}
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition shrink-0 ml-2" />
          </button>

          {/* OPÇÃO 2: PARA TODA A REDE */}
          <button
            type="button"
            onClick={() => handleSelect(true)}
            className="w-full p-3.5 rounded-2xl border-2 border-purple-600 dark:border-pink-500 bg-purple-50/60 dark:bg-pink-950/20 hover:bg-purple-100/60 dark:hover:bg-pink-950/40 text-left transition flex items-center justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-700 to-pink-600 text-white mt-0.5 shrink-0 shadow-xs">
                <Globe className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-purple-950 dark:text-white">
                    Para TODA A REDE
                  </span>
                  <Badge className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-[9px] py-0 px-1.5 border-0">
                    {storesCount} lojas
                  </Badge>
                </div>
                <div className="text-[11px] text-purple-900/80 dark:text-purple-200/80 mt-0.5">
                  Propagar e acumular publicação em todas as filiais
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-pink-600 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
          </button>
        </div>

        <div className="flex justify-end pt-3 mt-1 border-t border-purple-100 dark:border-white/10">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition"
          >
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
