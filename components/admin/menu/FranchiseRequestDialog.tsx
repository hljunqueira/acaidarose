'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/i18n/formatters'
import { toast } from 'sonner'
import { Building2, Send, AlertCircle, Sparkles } from 'lucide-react'
import { CatalogData } from '@/types'

interface FranchiseRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantName?: string
  catalog?: CatalogData
  initialItem?: any
  initialType?: 'NEW_PRODUCT' | 'PRICE_CHANGE'
}

const STORE_NAMES: Record<string, string> = {
  'tenant-aveiro': 'Açaí da Rose — Filial Aveiro',
  'tenant-lisboa': 'Açaí da Rose — Filial Lisboa (Parque das Nações)',
  'tenant-santarem': 'Açaí da Rose — Filial Santarém',
  'tenant-torres-novas': 'Açaí da Rose — Matriz Central',
}

export default function FranchiseRequestDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  catalog,
  initialItem,
  initialType = 'PRICE_CHANGE',
}: FranchiseRequestDialogProps) {
  const [requestType, setRequestType] = useState<'NEW_PRODUCT' | 'PRICE_CHANGE'>(initialType)
  const [selectedProductId, setSelectedProductId] = useState<string>(initialItem?.id || '')
  const [itemName, setItemName] = useState(initialItem?.name || '')
  const [category, setCategory] = useState(initialItem?.category || 'Copos Master')
  const [currentPrice, setCurrentPrice] = useState<number>(initialItem?.precoBase || initialItem?.price || 0)
  const [proposedPrice, setProposedPrice] = useState<string>(initialItem ? String(initialItem.precoBase || initialItem.price || '') : '')
  const [justification, setJustification] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const containers = useMemo(() => {
    return catalog?.containers || []
  }, [catalog])

  // Inicializar seleção com o primeiro item do cardápio se não houver initialItem
  useEffect(() => {
    if (open) {
      if (initialItem) {
        setSelectedProductId(initialItem.id)
        setItemName(initialItem.name)
        setCurrentPrice(initialItem.precoBase || initialItem.price || 0)
        setProposedPrice(String(initialItem.precoBase || initialItem.price || ''))
        setCategory(initialItem.category || 'Copos Master')
      } else if (containers.length > 0 && !selectedProductId) {
        const first = containers[0]
        setSelectedProductId(first.id)
        setItemName(first.name)
        setCurrentPrice(first.precoBase || 0)
        setCategory('Copos Master')
      }
    }
  }, [open, initialItem, containers, selectedProductId])

  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId)
    const prod = containers.find((c) => c.id === prodId)
    if (prod) {
      setItemName(prod.name)
      setCurrentPrice(prod.precoBase || 0)
      setCategory('Copos Master')
    }
  }

  const priceVariation = useMemo(() => {
    const sug = Number(proposedPrice) || 0
    const cur = currentPrice || 0
    if (cur === 0 || sug === 0) return null
    const diff = sug - cur
    const pct = ((diff / cur) * 100).toFixed(1)
    return { diff, pct, isIncrease: diff > 0 }
  }, [currentPrice, proposedPrice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalItemName = requestType === 'PRICE_CHANGE' ? itemName : itemName.trim()

    if (!finalItemName) {
      toast.error('Informe o nome do produto')
      return
    }
    if (!justification.trim() || justification.trim().length < 5) {
      toast.error('Informe uma justificativa detalhada para a franqueadora')
      return
    }
    if (!proposedPrice || Number(proposedPrice) <= 0) {
      toast.error('Informe um preço sugerido válido')
      return
    }

    setSubmitting(true)
    const storeLabel = tenantName || STORE_NAMES[tenantId] || 'Loja Franqueada'

    try {
      const res = await fetch('/api/franchise-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          storeName: storeLabel,
          managerName: 'Gerente da Filial',
          productId: requestType === 'PRICE_CHANGE' ? selectedProductId : `new-${Date.now()}`,
          productName: finalItemName,
          category,
          currentPrice: requestType === 'PRICE_CHANGE' ? Number(currentPrice) : 0,
          suggestedPrice: Number(proposedPrice),
          type: requestType,
          reason: justification.trim(),
        }),
      })

      if (!res.ok) throw new Error('Falha ao enviar proposta')

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('franchise_requests_updated', {}))
      }

      toast.success('Solicitação enviada com sucesso para a Franqueadora Master!')
      onOpenChange(false)
      setJustification('')
      setProposedPrice('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao submeter solicitação')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-3xl border border-purple-150 dark:border-white/20 shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-purple-100 dark:border-white/10 text-left">
          <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
            Solicitação à Franqueadora
          </DialogTitle>
          <DialogDescription className="text-xs text-purple-700/80 dark:text-purple-200/70">
            Novos produtos ou alterações de preço base exigem aprovação da Holding para {STORE_NAMES[tenantId] || 'sua filial'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 my-2 text-xs">
          {/* Tipo de Solicitação */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRequestType('PRICE_CHANGE')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center ${
                requestType === 'PRICE_CHANGE'
                  ? 'border-purple-600 bg-purple-100/70 dark:bg-purple-900 text-purple-950 dark:text-white shadow-xs'
                  : 'border-purple-200 dark:border-white/10 text-purple-900/70 dark:text-purple-200/70 hover:bg-purple-50'
              }`}
            >
              Reajustar Preço Base
            </button>
            <button
              type="button"
              onClick={() => setRequestType('NEW_PRODUCT')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer text-center ${
                requestType === 'NEW_PRODUCT'
                  ? 'border-purple-600 bg-purple-100/70 dark:bg-purple-900 text-purple-950 dark:text-white shadow-xs'
                  : 'border-purple-200 dark:border-white/10 text-purple-900/70 dark:text-purple-200/70 hover:bg-purple-50'
              }`}
            >
              Novo Produto / Combo
            </button>
          </div>

          {requestType === 'PRICE_CHANGE' ? (
            <>
              {/* Seleção do Produto do Catálogo com Auto-Preenchimento */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">
                  Selecione o Produto do Cardápio:
                </Label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white [&>option]:bg-white dark:[&>option]:bg-[#160228]"
                >
                  {containers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Preço Atual: {formatCurrency(c.precoBase || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço Atual (€):</Label>
                  <div className="h-9 px-3 rounded-xl bg-purple-50/70 dark:bg-white/10 border border-purple-200 dark:border-white/15 flex items-center font-mono font-bold text-purple-950 dark:text-white">
                    {formatCurrency(currentPrice)}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço Sugerido (€):</Label>
                  <Input
                    type="number"
                    step="0.10"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="ex: 13.50"
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Cálculo do Impacto */}
              {priceVariation && (
                <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-purple-700 dark:text-purple-300 font-bold">Variação Proposta:</span>
                  <span className={`font-black ${priceVariation.isIncrease ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {priceVariation.isIncrease ? `+${formatCurrency(priceVariation.diff)} (+${priceVariation.pct}%)` : `${formatCurrency(priceVariation.diff)} (${priceVariation.pct}%)`}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Novo Produto */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Nome do Produto / Item:</Label>
                <Input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ex: Combo Açaí 350g + Topping Especial"
                  required
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Categoria:</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white"
                  >
                    <option value="Copos Master">Copos Master</option>
                    <option value="Combos Especiais">Combos Especiais</option>
                    <option value="Sobremesas & Cafés">Sobremesas & Cafés</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço de Venda (€):</Label>
                  <Input
                    type="number"
                    step="0.10"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="ex: 8.50"
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </>
          )}

          {/* Justificativa */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-purple-950 dark:text-white">
              Justificativa para a Franqueadora:
            </Label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique o motivo do reajuste ou a demanda de clientes na sua região..."
              rows={3}
              required
              className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-300">
            A solicitação será enviada à Holding e ficará disponível para acompanhamento na aba <b>Solicitações à Franqueadora</b>.
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="w-full sm:w-auto h-8 text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto h-8 bg-purple-900 hover:bg-purple-950 dark:bg-pink-600 dark:hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {submitting ? 'A enviar...' : 'Enviar para Aprovação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
