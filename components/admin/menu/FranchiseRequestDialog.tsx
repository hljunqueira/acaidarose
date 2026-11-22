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
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/i18n/formatters'
import { toast } from 'sonner'
import { Building2, Sliders, Check, EyeOff, Eye } from 'lucide-react'
import { CatalogData } from '@/types'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import { FIGUEIRA_HQ_ID } from '@/lib/utils/permissions'

interface OptionModelItem {
  id: string
  name: string
  code?: string
  price?: number
  priceType?: string
  active?: boolean
}

interface OptionModelGroup {
  id: string
  name: string
  priceType?: 'Gratis' | 'Individual'
  additionalPrice?: number
  minQty?: number
  maxQty?: number
  options?: OptionModelItem[]
}

interface FranchiseRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantName?: string
  catalog?: CatalogData
  initialItem?: any
  initialType?: 'PRICE_CHANGE' | 'ITEM_AVAILABILITY' | 'CONFIG_CHANGE' | 'NEW_PRODUCT'
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
  const { currentTenant, tenants } = useFranchiseStore()
  const storeLabel =
    tenantName ||
    currentTenant?.name ||
    tenants.find((s) => s.id === tenantId)?.name ||
    'Loja Franqueada'

  const [requestType, setRequestType] = useState<
    'PRICE_CHANGE' | 'ITEM_AVAILABILITY' | 'CONFIG_CHANGE' | 'NEW_PRODUCT'
  >(initialType)

  // Catálogo Master da Franqueadora (Garantido via Fetch com fallback)
  const [masterContainers, setMasterContainers] = useState<any[]>(catalog?.containers || [])
  const [masterCategories, setMasterCategories] = useState<any[]>([])
  const [loadingMaster, setLoadingMaster] = useState<boolean>(false)

  // Estados de Produto selecionado
  const [selectedProductId, setSelectedProductId] = useState<string>(initialItem?.id || '')
  const [itemName, setItemName] = useState(initialItem?.name || '')
  const [category, setCategory] = useState(initialItem?.category || 'Copos Master')
  const [currentPrice, setCurrentPrice] = useState<number>(
    initialItem?.precoBase || initialItem?.price || 0
  )
  const [proposedPrice, setProposedPrice] = useState<string>(
    initialItem ? String(initialItem.precoBase || initialItem.price || '') : ''
  )
  const [justification, setJustification] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Estados da Aba 2: Opcionais & Pausa
  const [availabilityTarget, setAvailabilityTarget] = useState<'OPTION' | 'PRODUCT'>('OPTION')
  const [optionModels, setOptionModels] = useState<OptionModelGroup[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [selectedOptionItemKey, setSelectedOptionItemKey] = useState<string>('ALL')
  const [actionRequested, setActionRequested] = useState<'DISABLE' | 'ENABLE'>('DISABLE')

  // Estados da Aba 3: Configurações & Cotas
  const [quotaBases, setQuotaBases] = useState<number>(2)
  const [quotaFrutas, setQuotaFrutas] = useState<number>(2)
  const [quotaToppings, setQuotaToppings] = useState<number>(3)
  const [proposedQuotaBases, setProposedQuotaBases] = useState<number>(2)
  const [proposedQuotaFrutas, setProposedQuotaFrutas] = useState<number>(2)
  const [proposedQuotaToppings, setProposedQuotaToppings] = useState<number>(3)

  // 1. Carrega dados canônicos Master da Franqueadora e Modelos de Opções ao abrir
  useEffect(() => {
    if (open) {
      setLoadingMaster(true)
      setRequestType(initialType)

      // Busca produtos e categorias oficiais da Franqueadora Master (FIGUEIRA_HQ_ID)
      const fetchMasterData = async () => {
        try {
          const [productsRes, modelsRes] = await Promise.all([
            fetch(`/api/products?tenantId=${FIGUEIRA_HQ_ID}`),
            fetch(`/api/option-models?tenantId=${FIGUEIRA_HQ_ID}`),
          ])

          if (productsRes.ok) {
            const prodData = await productsRes.json()
            if (prodData) {
              const conts = Array.isArray(prodData.containers) ? prodData.containers : []
              setMasterContainers(conts)
              if (Array.isArray(prodData.categories)) {
                setMasterCategories(prodData.categories)
              }
              // Inicializa seleção se não houver initialItem
              if (!selectedProductId && conts.length > 0) {
                const first = conts[0]
                setSelectedProductId(first.id)
                setItemName(first.name)
                setCurrentPrice(Number(first.precoBase || first.price || 0))
                setProposedPrice(String(first.precoBase || first.price || ''))
                setCategory(first.category || 'Copos Master')
                setQuotaBases(Number(first.limiteBases ?? first.limite_bases ?? 2))
                setQuotaFrutas(Number(first.limiteFrutas ?? first.limite_frutas ?? 2))
                setQuotaToppings(Number(first.limiteToppings ?? first.limite_toppings ?? 3))
                setProposedQuotaBases(Number(first.limiteBases ?? first.limite_bases ?? 2))
                setProposedQuotaFrutas(Number(first.limiteFrutas ?? first.limite_frutas ?? 2))
                setProposedQuotaToppings(Number(first.limiteToppings ?? first.limite_toppings ?? 3))
              }
            }
          }

          if (modelsRes.ok) {
            const modelsData = await modelsRes.json()
            if (Array.isArray(modelsData) && modelsData.length > 0) {
              setOptionModels(modelsData)
              if (!selectedModelId) {
                setSelectedModelId(modelsData[0].id)
                setSelectedOptionItemKey('ALL')
              }
            }
          }
        } catch (err) {
          console.error('Erro ao carregar dados master da franqueadora:', err)
        } finally {
          setLoadingMaster(false)
        }
      }

      fetchMasterData()
    }
  }, [open, initialType, selectedProductId, selectedModelId])

  // Atualiza produto selecionado quando o usuário escolhe outro item na lista master
  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId)
    const prod = masterContainers.find((c) => c.id === prodId)
    if (prod) {
      setItemName(prod.name)
      setCurrentPrice(Number(prod.precoBase || prod.price || 0))
      setProposedPrice(String(prod.precoBase || prod.price || ''))
      setCategory(prod.category || 'Copos Master')

      const bases = Number(prod.limiteBases ?? prod.limite_bases ?? 2)
      const frutas = Number(prod.limiteFrutas ?? prod.limite_frutas ?? 2)
      const toppings = Number(prod.limiteToppings ?? prod.limite_toppings ?? 3)

      setQuotaBases(bases)
      setQuotaFrutas(frutas)
      setQuotaToppings(toppings)
      setProposedQuotaBases(bases)
      setProposedQuotaFrutas(frutas)
      setProposedQuotaToppings(toppings)
    }
  }

  // Modelo atualmente selecionado para listar as opções individuais
  const currentSelectedModel = useMemo(() => {
    return optionModels.find((m) => m.id === selectedModelId) || optionModels[0]
  }, [optionModels, selectedModelId])

  // Opções individuais do modelo selecionado
  const currentOptionsList = useMemo(() => {
    return Array.isArray(currentSelectedModel?.options) ? currentSelectedModel.options : []
  }, [currentSelectedModel])

  // Cálculo da variação de preço
  const priceVariation = useMemo(() => {
    const sug = Number(proposedPrice) || 0
    const cur = currentPrice || 0
    if (cur === 0 || sug === 0) return null
    const diff = sug - cur
    const pct = ((diff / cur) * 100).toFixed(1)
    return { diff, pct, isIncrease: diff > 0 }
  }, [currentPrice, proposedPrice])

  // Submissão da solicitação
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!justification.trim() || justification.trim().length < 5) {
      toast.error('Informe uma justificativa detalhada para a franqueadora')
      return
    }

    setSubmitting(true)
    try {
      let payload: any = null

      // 1. Aba: Reajustar Preço
      if (requestType === 'PRICE_CHANGE') {
        const prod = masterContainers.find((c) => c.id === selectedProductId)
        const finalName = prod ? prod.name : itemName
        const finalPrice = Number(proposedPrice)

        if (!finalName) {
          toast.error('Selecione um produto do cardápio')
          setSubmitting(false)
          return
        }
        if (!finalPrice || finalPrice <= 0) {
          toast.error('Informe um preço sugerido válido')
          setSubmitting(false)
          return
        }

        payload = {
          tenantId,
          storeName: storeLabel,
          managerName: 'Gerente da Filial',
          productId: selectedProductId,
          productName: finalName,
          category,
          currentPrice: Number(currentPrice) || 0,
          suggestedPrice: finalPrice,
          type: 'PRICE_CHANGE',
          reason: justification.trim(),
        }
      }

      // 2. Aba: Opcionais & Pausa
      else if (requestType === 'ITEM_AVAILABILITY') {
        if (availabilityTarget === 'PRODUCT') {
          const prod = masterContainers.find((c) => c.id === selectedProductId)
          if (!prod) {
            toast.error('Selecione o produto a ser desativado ou reativado')
            setSubmitting(false)
            return
          }

          payload = {
            tenantId,
            storeName: storeLabel,
            managerName: 'Gerente da Filial',
            productId: prod.id,
            productName: prod.name,
            category: prod.category || 'Cardápio',
            actionRequested,
            type: 'ITEM_AVAILABILITY',
            reason: justification.trim(),
          }
        } else {
          // Alvo é um Opcional / Acompanhamento
          if (!currentSelectedModel) {
            toast.error('Selecione o grupo de opcionais')
            setSubmitting(false)
            return
          }

          const isGroupAll = selectedOptionItemKey === 'ALL' || !selectedOptionItemKey
          let targetId = currentSelectedModel.id
          let targetName = currentSelectedModel.name

          if (!isGroupAll) {
            const specificOpt = currentOptionsList.find(
              (o) => (o.code && o.code === selectedOptionItemKey) || o.id === selectedOptionItemKey || o.name === selectedOptionItemKey
            )
            if (specificOpt) {
              targetId = specificOpt.code || specificOpt.id
              targetName = `${specificOpt.name}${specificOpt.code ? ` [${specificOpt.code}]` : ''} (${currentSelectedModel.name})`
            }
          } else {
            targetName = `Grupo Completo: ${currentSelectedModel.name}`
          }

          payload = {
            tenantId,
            storeName: storeLabel,
            managerName: 'Gerente da Filial',
            productId: targetId,
            productName: targetName,
            category: 'Opcionais & Acompanhamentos',
            actionRequested,
            type: 'ITEM_AVAILABILITY',
            reason: justification.trim(),
          }
        }
      }

      // 3. Aba: Configurações & Cotas
      else if (requestType === 'CONFIG_CHANGE') {
        const prod = masterContainers.find((c) => c.id === selectedProductId)
        const finalName = prod ? prod.name : itemName

        if (!finalName) {
          toast.error('Selecione o recipiente para ajustar as cotas')
          setSubmitting(false)
          return
        }

        payload = {
          tenantId,
          storeName: storeLabel,
          managerName: 'Gerente da Filial',
          productId: selectedProductId,
          productName: finalName,
          category,
          currentQuotas: {
            limiteBases: quotaBases,
            limiteFrutas: quotaFrutas,
            limiteToppings: quotaToppings,
          },
          suggestedQuotas: {
            limiteBases: Number(proposedQuotaBases),
            limiteFrutas: Number(proposedQuotaFrutas),
            limiteToppings: Number(proposedQuotaToppings),
          },
          type: 'CONFIG_CHANGE',
          reason: justification.trim(),
        }
      }

      // 4. Aba: Novo Produto
      else if (requestType === 'NEW_PRODUCT') {
        if (!itemName.trim()) {
          toast.error('Informe o nome do novo produto')
          setSubmitting(false)
          return
        }
        if (!proposedPrice || Number(proposedPrice) <= 0) {
          toast.error('Informe um preço sugerido válido')
          setSubmitting(false)
          return
        }

        payload = {
          tenantId,
          storeName: storeLabel,
          managerName: 'Gerente da Filial',
          productId: `new-${Date.now()}`,
          productName: itemName.trim(),
          category,
          currentPrice: 0,
          suggestedPrice: Number(proposedPrice),
          type: 'NEW_ITEM_PROPOSAL',
          reason: justification.trim(),
        }
      }

      const res = await fetch('/api/franchise-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Falha ao enviar solicitação')
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('franchise_requests_updated', {}))
      }

      toast.success('Solicitação enviada com sucesso para a Franqueadora Master!')
      onOpenChange(false)
      setJustification('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao submeter solicitação')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-3xl border border-purple-200 dark:border-white/15 shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-purple-100 dark:border-white/10 text-left">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-700 dark:text-pink-400" />
            <DialogTitle className="text-base sm:text-lg font-black text-purple-950 dark:text-white">
              Solicitação à Franqueadora
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-purple-700/80 dark:text-purple-200/70">
            Ajustes de preços, disponibilidade de itens, cotas ou novos produtos para <strong>{storeLabel}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2 text-xs">
          {/* Navegação entre as 4 Abas Limpas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-purple-50 dark:bg-white/5 border border-purple-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => setRequestType('PRICE_CHANGE')}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer text-center ${
                requestType === 'PRICE_CHANGE'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900/80 dark:text-purple-200 hover:bg-purple-100/50'
              }`}
            >
              Reajustar Preço
            </button>
            <button
              type="button"
              onClick={() => setRequestType('ITEM_AVAILABILITY')}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer text-center ${
                requestType === 'ITEM_AVAILABILITY'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900/80 dark:text-purple-200 hover:bg-purple-100/50'
              }`}
            >
              Opcionais & Pausa
            </button>
            <button
              type="button"
              onClick={() => setRequestType('CONFIG_CHANGE')}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer text-center ${
                requestType === 'CONFIG_CHANGE'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900/80 dark:text-purple-200 hover:bg-purple-100/50'
              }`}
            >
              Cotas & Regras
            </button>
            <button
              type="button"
              onClick={() => setRequestType('NEW_PRODUCT')}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer text-center ${
                requestType === 'NEW_PRODUCT'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-900/80 dark:text-purple-200 hover:bg-purple-100/50'
              }`}
            >
              Novo Produto
            </button>
          </div>

          {/* ======================================================== */}
          {/* ABA 1: REAJUSTAR PREÇO                                   */}
          {/* ======================================================== */}
          {requestType === 'PRICE_CHANGE' && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">
                  Selecione o Produto do Cardápio Master:
                </Label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-xs font-bold text-purple-950 dark:text-white focus:outline-none"
                >
                  {masterContainers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Preço Master: {formatCurrency(c.precoBase || c.price || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço de Tabela Atual:</Label>
                  <div className="h-10 px-3 rounded-xl bg-purple-50/70 dark:bg-white/10 border border-purple-200 dark:border-white/15 flex items-center font-mono font-bold text-purple-950 dark:text-white">
                    {formatCurrency(currentPrice)}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço Sugerido (€):</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="ex: 7.00"
                    required
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              {priceVariation && (
                <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-purple-700 dark:text-purple-300 font-bold">Variação Proposta:</span>
                  <span
                    className={`font-black ${
                      priceVariation.isIncrease
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {priceVariation.isIncrease
                      ? `+${formatCurrency(priceVariation.diff)} (+${priceVariation.pct}%)`
                      : `${formatCurrency(priceVariation.diff)} (${priceVariation.pct}%)`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: OPCIONAIS & PAUSA (SEM CAMPOS DE NOVO PRODUTO!)   */}
          {/* ======================================================== */}
          {requestType === 'ITEM_AVAILABILITY' && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Tipo de Item a Ajustar:</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAvailabilityTarget('OPTION')}
                    className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      availabilityTarget === 'OPTION'
                        ? 'border-purple-600 bg-purple-100/70 dark:bg-pink-600/30 text-purple-950 dark:text-white'
                        : 'border-purple-200 dark:border-white/10 text-purple-900/70 dark:text-purple-200 hover:bg-purple-50'
                    }`}
                  >
                    Opcional / Acompanhamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvailabilityTarget('PRODUCT')}
                    className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      availabilityTarget === 'PRODUCT'
                        ? 'border-purple-600 bg-purple-100/70 dark:bg-pink-600/30 text-purple-950 dark:text-white'
                        : 'border-purple-200 dark:border-white/10 text-purple-900/70 dark:text-purple-200 hover:bg-purple-50'
                    }`}
                  >
                    Produto do Cardápio
                  </button>
                </div>
              </div>

              {availabilityTarget === 'OPTION' ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-purple-950 dark:text-white">
                      1. Grupo / Modelo de Opções:
                    </Label>
                    <select
                      value={selectedModelId}
                      onChange={(e) => {
                        setSelectedModelId(e.target.value)
                        setSelectedOptionItemKey('ALL')
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-xs font-bold text-purple-950 dark:text-white focus:outline-none"
                    >
                      {optionModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.priceType === 'Gratis' ? 'Incluso' : `Adicional ${formatCurrency(m.additionalPrice || 0)}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-purple-950 dark:text-white">
                      2. Item Opcional Específico:
                    </Label>
                    <select
                      value={selectedOptionItemKey}
                      onChange={(e) => setSelectedOptionItemKey(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-xs font-bold text-purple-950 dark:text-white focus:outline-none"
                    >
                      <option value="ALL">Todo o Grupo ({currentSelectedModel?.name})</option>
                      {currentOptionsList.map((opt) => (
                        <option key={opt.code || opt.id} value={opt.code || opt.id}>
                          {opt.name} {opt.code ? `[${opt.code}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">
                    Produto do Cardápio a Pausar/Reativar:
                  </Label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-xs font-bold text-purple-950 dark:text-white focus:outline-none"
                  >
                    {masterContainers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Ação Desejada para a sua Loja:</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionRequested('DISABLE')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      actionRequested === 'DISABLE'
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 shadow-xs'
                        : 'border-purple-200 dark:border-white/10 text-purple-900/70 dark:text-purple-200 hover:bg-purple-50'
                    }`}
                  >
                    <EyeOff className="h-3.5 w-3.5 text-rose-600" />
                    <span>Desativar na Minha Loja</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionRequested('ENABLE')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      actionRequested === 'ENABLE'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 shadow-xs'
                        : 'border-purple-200 dark:border-white/10 text-purple-900/70 dark:text-purple-200 hover:bg-purple-50'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Reativar na Minha Loja</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: CONFIGURAÇÕES & COTAS                             */}
          {/* ======================================================== */}
          {requestType === 'CONFIG_CHANGE' && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">
                  Selecione o Recipiente / Tamanho:
                </Label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-xs font-bold text-purple-950 dark:text-white focus:outline-none"
                >
                  {masterContainers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-purple-900 dark:text-pink-300">
                  Cotas Inclusas Oficiais (Franqueadora):
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-[#160228] border border-purple-200 dark:border-white/10">
                    <span className="block text-[10px] text-purple-700/80 dark:text-purple-300">Cremes</span>
                    <strong className="text-sm font-black text-purple-950 dark:text-white font-mono">{quotaBases}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-[#160228] border border-purple-200 dark:border-white/10">
                    <span className="block text-[10px] text-purple-700/80 dark:text-purple-300">Frutas</span>
                    <strong className="text-sm font-black text-purple-950 dark:text-white font-mono">{quotaFrutas}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-[#160228] border border-purple-200 dark:border-white/10">
                    <span className="block text-[10px] text-purple-700/80 dark:text-purple-300">Acompanhamentos</span>
                    <strong className="text-sm font-black text-purple-950 dark:text-white font-mono">{quotaToppings}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">
                  Proposta de Novas Cotas Inclusas para a sua Filial:
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">Cremes Sugeridos</span>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={proposedQuotaBases}
                      onChange={(e) => setProposedQuotaBases(parseInt(e.target.value, 10) || 1)}
                      className="h-9 text-xs rounded-xl font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">Frutas Sugeridas</span>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={proposedQuotaFrutas}
                      onChange={(e) => setProposedQuotaFrutas(parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs rounded-xl font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">Acomp. Sugeridos</span>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={proposedQuotaToppings}
                      onChange={(e) => setProposedQuotaToppings(parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs rounded-xl font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 4: NOVO PRODUTO                                      */}
          {/* ======================================================== */}
          {requestType === 'NEW_PRODUCT' && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Nome do Produto Proposto:</Label>
                <Input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ex: Copo Especial de Inverno 400g"
                  required
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Categoria do Cardápio:</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-xs font-bold text-purple-950 dark:text-white focus:outline-none"
                  >
                    {masterCategories.length > 0 ? (
                      masterCategories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Copos Master">Copos Master</option>
                        <option value="Taças & Caixinhas">Taças & Caixinhas</option>
                        <option value="Milk Shakes">Milk Shakes</option>
                        <option value="Lanches">Lanches</option>
                        <option value="Bebidas">Bebidas</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço de Venda (€):</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="ex: 8.50"
                    required
                    className="h-10 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* JUSTIFICATIVA OBRIGATÓRIA PARA A FRANQUEADORA            */}
          {/* ======================================================== */}
          <div className="space-y-1 pt-1">
            <Label className="text-xs font-bold text-purple-950 dark:text-white">
              Justificativa para a Franqueadora:
            </Label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique os motivos da solicitação (ex.: demanda de clientes, ruptura de fornecedor, concorrência regional)..."
              rows={3}
              required
              className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-xs text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/20 text-[11px] text-purple-900 dark:text-purple-200 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-700 dark:text-pink-400 shrink-0" />
            <span>
              A solicitação será enviada à Franqueadora Master e ficará disponível em tempo real para deliberação.
            </span>
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="w-full sm:w-auto h-9 text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto h-9 bg-purple-900 hover:bg-purple-950 dark:bg-pink-600 dark:hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {submitting ? 'A enviar...' : 'Enviar para Aprovação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
