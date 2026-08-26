'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/i18n/formatters'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { Tenant, CatalogData } from '@/types'
import {
  Globe,
  Store,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Check,
} from 'lucide-react'

interface ReplicateCatalogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTenantId: string
  catalog: CatalogData
  onSuccess: () => void
}

export default function ReplicateCatalogModal({
  open,
  onOpenChange,
  currentTenantId,
  catalog,
  onSuccess,
}: ReplicateCatalogModalProps) {
  const { authFetch } = useAuthStore()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [syncScope, setSyncScope] = useState<'ALL' | 'SELECTED'>('ALL')
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)

  // Carregar lojas ativas da rede
  useEffect(() => {
    if (open) {
      authFetch('/api/tenants')
        .then((r) => r.json())
        .then((d) => {
          if (d.tenants) {
            setTenants(d.tenants)
            setSelectedTenantIds(d.tenants.map((t: Tenant) => t.id))
          }
        })
        .catch(() => {})
    }
  }, [open, authFetch])

  const handleToggleTenant = (id: string) => {
    setSelectedTenantIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const handleSelectAllTenants = () => {
    setSelectedTenantIds(tenants.map((t) => t.id))
  }

  const handleDeselectAllTenants = () => {
    setSelectedTenantIds([])
  }

  // Montar mapa de preços dos produtos para replicação
  const getProductPricesMap = () => {
    const prices: Record<string, number> = {}
    catalog.containers.forEach((c) => {
      const price = Number(c.precoBase || c.price || 0)
      if (price > 0) {
        prices[c.id] = price
        if (c.weightGrams) {
          prices[`weight-${c.weightGrams}`] = price
          prices[`${c.weightGrams}g`] = price
        }
      }
    })
    return prices
  }

  const handleConfirmSync = async () => {
    if (syncScope === 'SELECTED' && selectedTenantIds.length === 0) {
      toast.error('Selecione ao menos uma unidade para sincronizar.')
      return
    }

    setSyncing(true)
    try {
      const pricesMap = getProductPricesMap()
      const targetIds = syncScope === 'ALL' ? tenants.map((t) => t.id) : selectedTenantIds

      const res = await authFetch('/api/products/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applyToAll: syncScope === 'ALL',
          targetTenantIds: targetIds,
          prices: pricesMap,
          tenantId: currentTenantId,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao sincronizar preços com as unidades.')
      }

      const count = data.targetStoresCount || targetIds.length
      toast.success(
        syncScope === 'ALL'
          ? `✓ Cardápio e preços oficiais replicados para TODA A REDE (${count} lojas)!`
          : `✓ Preços atualizados com sucesso em ${count} loja(s) selecionada(s)!`
      )

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao sincronizar cardápio.')
    } finally {
      setSyncing(false)
    }
  }

  const targetCount = syncScope === 'ALL' ? tenants.length : selectedTenantIds.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[94vw] bg-white dark:bg-[#150226] border-purple-100 dark:border-white/10 rounded-3xl p-0 overflow-hidden shadow-2xl text-slate-900 dark:text-white flex flex-col max-h-[90vh]">
        {/* Top Header Compacto */}
        <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-pink-600 px-5 py-3 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-md shadow-xs">
              <RefreshCw className="h-4 w-4 text-pink-200" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-black text-white leading-tight">
                Publicar & Sincronizar Cardápio
              </DialogTitle>
              <p className="text-[11px] text-purple-100/90 font-medium">
                Propague preços e produtos para toda a rede ou filiais selecionadas.
              </p>
            </div>
          </div>
        </div>

        {/* Corpo do Modal: Layout em 2 Colunas Lado a Lado (Mais Largo e Mais Baixo) */}
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-y-auto flex-1">
          {/* Coluna 1 (7 Colunas): Escolha do Escopo e Seleção de Lojas */}
          <div className="md:col-span-7 space-y-3 flex flex-col justify-start">
            <label className="text-[11px] font-black text-purple-950 dark:text-white uppercase tracking-wider block">
              1. Escopo de Aplicação
            </label>

            {/* Grid 2 Botões de Escopo */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Opção 1: Toda a Rede */}
              <div
                onClick={() => setSyncScope('ALL')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  syncScope === 'ALL'
                    ? 'border-purple-600 dark:border-pink-500 bg-purple-50/80 dark:bg-purple-950/40 shadow-xs'
                    : 'border-purple-100 dark:border-white/10 hover:border-purple-300 dark:hover:border-white/20 bg-white dark:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-pink-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <Badge className="bg-purple-700 dark:bg-pink-600 text-white font-black text-[9px] py-0 px-1.5 rounded-full border-0">
                    Toda a Rede
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs font-black text-purple-950 dark:text-white">
                    Todas as Lojas ({tenants.length})
                  </h4>
                  <p className="text-[10px] text-purple-800/70 dark:text-purple-200/70 mt-0.5 leading-tight">
                    Preço master oficial para todas as filiais e totens.
                  </p>
                </div>
              </div>

              {/* Opção 2: Lojas Específicas */}
              <div
                onClick={() => setSyncScope('SELECTED')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  syncScope === 'SELECTED'
                    ? 'border-purple-600 dark:border-pink-500 bg-purple-50/80 dark:bg-purple-950/40 shadow-xs'
                    : 'border-purple-100 dark:border-white/10 hover:border-purple-300 dark:hover:border-white/20 bg-white dark:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-pink-400">
                    <Store className="h-4 w-4" />
                  </div>
                  <Badge variant="outline" className="border-purple-300 dark:border-white/20 text-purple-900 dark:text-purple-200 font-black text-[9px] py-0 px-1.5 rounded-full">
                    Segmentado
                  </Badge>
                </div>
                <div>
                  <h4 className="text-xs font-black text-purple-950 dark:text-white">
                    Lojas Específicas
                  </h4>
                  <p className="text-[10px] text-purple-800/70 dark:text-purple-200/70 mt-0.5 leading-tight">
                    Aplica os valores somente nas filiais marcadas abaixo.
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Checkboxes de Lojas (se Segmentado) */}
            {syncScope === 'SELECTED' ? (
              <div className="p-2.5 bg-purple-50/50 dark:bg-white/5 rounded-2xl border border-purple-100 dark:border-white/10 space-y-1.5 flex-1 animate-in fade-in">
                <div className="flex items-center justify-between pb-1 border-b border-purple-100 dark:border-white/10 px-1">
                  <span className="text-[11px] font-black text-purple-950 dark:text-white">
                    Unidades Alvo ({selectedTenantIds.length} selecionadas):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllTenants}
                      className="text-[10px] font-bold text-purple-700 dark:text-pink-400 hover:underline cursor-pointer"
                    >
                      Marcar Todas
                    </button>
                    <span className="text-purple-300 text-[10px]">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllTenants}
                      className="text-[10px] font-bold text-purple-700 dark:text-pink-400 hover:underline cursor-pointer"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                  {tenants.map((t) => {
                    const isChecked = selectedTenantIds.includes(t.id)
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleToggleTenant(t.id)}
                        className={`flex items-center justify-between p-1.5 px-2 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'border-purple-400 dark:border-pink-500/60 bg-white dark:bg-purple-900/30'
                            : 'border-purple-150 dark:border-white/10 bg-white/60 dark:bg-white/5 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition shrink-0 ${
                              isChecked
                                ? 'bg-purple-700 dark:bg-pink-600 border-purple-700 dark:border-pink-600 text-white'
                                : 'border-purple-300 dark:border-white/30 bg-white dark:bg-white/10'
                            }`}
                          >
                            {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-purple-950 dark:text-white truncate">
                              {t.name}
                            </p>
                          </div>
                        </div>

                        {t.isHeadquarters ? (
                          <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-pink-300 font-extrabold text-[8.5px] py-0 px-1 rounded-md border-0 shrink-0">
                            Matriz
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[8.5px] font-bold border-purple-200 dark:border-white/20 text-purple-800 dark:text-purple-200 py-0 px-1 shrink-0">
                            Filial
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-purple-50/50 dark:bg-white/5 rounded-2xl border border-purple-100 dark:border-white/10 flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-[11px] text-purple-900 dark:text-purple-100 font-medium">
                  Todas as <strong>{tenants.length} lojas da rede</strong> receberão a sincronização master simultaneamente.
                </p>
              </div>
            )}
          </div>

          {/* Coluna 2 (5 Colunas): Resumo dos Preços & Validação */}
          <div className="md:col-span-5 space-y-3 flex flex-col justify-between">
            <div>
              <label className="text-[11px] font-black text-purple-950 dark:text-white uppercase tracking-wider block mb-2">
                2. Valores Sincronizados
              </label>

              {/* Grid 5 Copos / Tamanhos */}
              <div className="grid grid-cols-2 gap-1.5">
                {catalog.containers.map((c) => (
                  <div
                    key={c.id}
                    className="p-1.5 px-2 bg-purple-50/60 dark:bg-[#1f0337] rounded-xl border border-purple-150 dark:border-white/10 flex items-center justify-between gap-1 shadow-2xs"
                  >
                    <span className="text-[10px] font-bold text-purple-800/80 dark:text-purple-200 truncate">
                      {c.name}
                    </span>
                    <span className="text-[11px] font-black text-purple-950 dark:text-white font-mono shrink-0">
                      {formatCurrency(c.precoBase || c.price || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Box Explicativo com Alerta */}
            <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl text-[10.5px] text-emerald-950 dark:text-emerald-200 space-y-1">
              <div className="font-bold">
                Atualização Imediata em Produção
              </div>
              <p className="text-[10px] text-emerald-900/80 dark:text-emerald-300/80 leading-tight">
                Os preços passarão a vigorar instantaneamente no PDV, KDS e cardápio QR Code (`/menu`) de <strong>{targetCount} unidade(s)</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé Compacto */}
        <div className="px-5 py-2.5 bg-purple-50/60 dark:bg-white/5 border-t border-purple-100 dark:border-white/10 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-purple-800/80 dark:text-purple-200 font-medium hidden sm:inline">
            Impacto: <strong>{targetCount} loja(s)</strong>
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={syncing}
              className="h-8 px-3 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 font-bold text-xs cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleConfirmSync}
              disabled={syncing || targetCount === 0}
              className="h-8 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-black text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  <span>
                    {syncScope === 'ALL'
                      ? `Confirmar Toda a Rede (${tenants.length})`
                      : `Aplicar em ${selectedTenantIds.length} Loja(s)`}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
