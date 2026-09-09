'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { CatalogData, Order, PaymentMethodCode, ProductContainer } from '@/types'
import { RestaurantTable } from '@/types/tables'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useCartStore, computeItemLineTotal, getPremiumToppingPrice } from '@/lib/stores/cartStore'
import { formatCurrency } from '@/lib/i18n/formatters'
import StepIndicator from './StepIndicator'
import ContainerSelector from './ContainerSelector'
import BaseSelector from './BaseSelector'
import ToppingSelector from './ToppingSelector'
import CartSummary from './CartSummary'
import PaymentModal from './PaymentModal'
import OrderReceiptModal from './OrderReceiptModal'
import PDVItemOptionsModal from './PDVItemOptionsModal'
import { ShoppingBag, Store, ArrowLeft, Search, Plus, SlidersHorizontal } from 'lucide-react'
import { subscribeCatalogSync } from '@/lib/utils/catalogSync'

// Identificadores canônicos de Menus
const MASTER_ACAI_MENU_ID = '1c8ff060-3048-47c3-a5ec-efb60a56d0c1'

interface PDVViewProps {
  tenantId: string
  storePhone?: string | null
  initialTable?: RestaurantTable | null
  onBackToTables?: () => void
}

export default function PDVView({
  tenantId,
  storePhone,
  initialTable,
  onBackToTables,
}: PDVViewProps) {
  const [catalog, setCatalog] = useState<CatalogData>({ containers: [], bases: [], toppings: [], menus: [], categories: [] })
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<number>(1)
  const [payOpen, setPayOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)

  // Menu Selecionado no PDV (Dinâmico do Banco)
  const [selectedMenuId, setSelectedMenuId] = useState<string>('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [lanchesSearchQuery, setLanchesSearchQuery] = useState<string>('')
  const [optionsModalProduct, setOptionsModalProduct] = useState<ProductContainer | null>(null)

  // Tipo de Pedido: BALCAO vs MESA
  const [orderType, setOrderType] = useState<'BALCAO' | 'MESA'>(initialTable ? 'MESA' : 'BALCAO')
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(initialTable || null)
  const [customerNameInput, setCustomerNameInput] = useState<string>('')
  const [allTables, setAllTables] = useState<RestaurantTable[]>([])

  const {
    items,
    draft,
    startDraft,
    setDraftPackagingType,
    resetDraft,
    toggleBase,
    toggleTopping,
    addDraftToCart,
    addSimpleItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    total,
  } = useCartStore()

  const currentTotal = total()
  const currentDraftTotal = draft?.container ? computeItemLineTotal(draft) : 0

  // Filtra itens ativos e visíveis
  const allContainers = useMemo(() => {
    return (catalog.containers || [])
      .filter((c) => c.active !== false && !c.isCategoryPaused)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }, [catalog.containers])

  // Menus Dinâmicos do Catálogo (Carregados diretamente do banco de dados)
  const pdvMenus = useMemo(() => {
    return (catalog.menus || [])
      .filter((m) => m.active !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }, [catalog.menus])

  useEffect(() => {
    if (pdvMenus.length > 0 && !pdvMenus.some((m) => m.id === selectedMenuId)) {
      setSelectedMenuId(pdvMenus[0].id)
    }
  }, [pdvMenus, selectedMenuId])

  // Identifica dinamicamente se o menu atual é o montador de Taças de Açaí
  const isAcaiMenu = useMemo(() => {
    const m = pdvMenus.find((menu) => menu.id === selectedMenuId)
    if (!m) return false
    return m.code === 'MENU_ACAI_ROSE' || m.id === MASTER_ACAI_MENU_ID || m.name.toLowerCase().includes('açaí')
  }, [pdvMenus, selectedMenuId])

  // Categorias cadastradas para o menu ativo
  const activeMenuCategories = useMemo(() => {
    return (catalog.categories || []).filter(
      (cat) => cat.menuId === selectedMenuId && cat.active !== false
    )
  }, [catalog.categories, selectedMenuId])

  // Produtos do menu atual selecionado (100% Dinâmico do PostgreSQL)
  const currentMenuProducts = useMemo(() => {
    return allContainers.filter((c) => c.menuId === selectedMenuId)
  }, [allContainers, selectedMenuId])

  // Produtos filtrados por subcategoria e busca
  const displayedItems = useMemo(() => {
    let list = currentMenuProducts
    if (selectedCategoryId !== 'all') {
      list = list.filter((p) => p.categoryId === selectedCategoryId)
    }
    if (lanchesSearchQuery.trim()) {
      const q = lanchesSearchQuery.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    return list
  }, [currentMenuProducts, selectedCategoryId, lanchesSearchQuery])

  const draftBreakdown = useMemo(() => {
    if (!draft?.container) return null
    const weight = Number(draft.container.weightGrams) || 500
    const isUnlimited = weight >= 500
    const maxBases = draft.container.limiteCremes || draft.container.limiteBases || 1
    const basesModel = (draft.container.optionGroups || []).find((g: any) => g.id === 'model-bases' || g.name?.toLowerCase().includes('base') || g.name?.toLowerCase().includes('creme'))
    const toppingsModel = (draft.container.optionGroups || []).find((g: any) => g.id === 'model-toppings' || g.name?.toLowerCase().includes('acompanhamento') || g.name?.toLowerCase().includes('topping'))
    const frutasModel = (draft.container.optionGroups || []).find((g: any) => g.id === 'model-frutas' || g.name?.toLowerCase().includes('fruta'))

    const additionalBasePrice = basesModel?.additionalPrice !== undefined ? Number(basesModel.additionalPrice) : 2.0
    const additionalToppingPrice = toppingsModel?.additionalPrice !== undefined ? Number(toppingsModel.additionalPrice) : 0.5
    const additionalFrutaPrice = frutasModel?.additionalPrice !== undefined ? Number(frutasModel.additionalPrice) : 0.5

    const extraBases = Math.max(0, (draft.bases?.length || 0) - maxBases)
    const extraBasesVal = extraBases * additionalBasePrice

    const maxFrutas = draft.container.limiteFrutas || (isUnlimited ? 999 : weight === 250 ? 2 : 3)
    const maxToppings = draft.container.limiteToppings || (isUnlimited ? 999 : 3)

    let frutasCount = 0
    let toppingsCount = 0
    let premiumsVal = 0

    for (const t of draft.toppings || []) {
      const isSpecial = t.isSpecialAddon || t.category === 'Adicionais' || t.isPremium || (t.precoExtra && t.precoExtra > 0)
      const isFruta = t.category === 'Frutas' || ['banana', 'morango', 'kiwi', 'manga', 'uva', 'abacaxi'].some((f) => t.name.toLowerCase().includes(f))

      if (isSpecial) {
        premiumsVal += getPremiumToppingPrice(t.name, weight, t.precoExtra)
      } else if (isFruta) {
        frutasCount++
      } else {
        toppingsCount++
      }
    }

    const extraFrutas = isUnlimited ? 0 : Math.max(0, frutasCount - maxFrutas)
    const extraFrutasVal = extraFrutas * additionalFrutaPrice
    const extraToppings = isUnlimited ? 0 : Math.max(0, toppingsCount - maxToppings)
    const extraToppingsVal = extraToppings * additionalToppingPrice

    return {
      basePrice: draft.container.precoBase,
      extraBases,
      extraBasesVal,
      extraFrutas,
      extraFrutasVal,
      extraToppings,
      extraToppingsVal,
      premiumsVal,
      total: +(draft.container.precoBase + extraBasesVal + extraFrutasVal + extraToppingsVal + premiumsVal).toFixed(2),
    }
  }, [draft])

  const [catalogVersion, setCatalogVersion] = useState<number>(0)

  const loadCatalogData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/products?tenantId=${encodeURIComponent(tenantId)}&_t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setCatalog(data)
      }
    } catch {}
  }, [tenantId])

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      fetch(`/api/products?tenantId=${encodeURIComponent(tenantId)}`).then((r) => r.json()),
      fetch(`/api/tables?tenantId=${encodeURIComponent(tenantId)}`).then((r) => r.json()),
      fetch(`/api/catalog/version?tenantId=${encodeURIComponent(tenantId)}`).then((r) => r.json()).catch(() => null),
    ])
      .then(([dataCatalog, dataTables, dataVersion]) => {
        if (alive) {
          if (dataCatalog) setCatalog(dataCatalog)
          if (dataTables?.tables) setAllTables(dataTables.tables)
          if (dataVersion?.version) setCatalogVersion(dataVersion.version)
        }
      })
      .catch(() => toast.error('Erro ao carregar dados do PDV'))
      .finally(() => alive && setLoading(false))

    // Ouvinte imediato via BroadcastChannel
    const unsubscribe = subscribeCatalogSync(() => {
      loadCatalogData()
    })

    // Polling leve a cada 15s para sincronizar PDVs em múltiplos terminais
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/catalog/version?tenantId=${encodeURIComponent(tenantId)}&_t=${Date.now()}`, {
          cache: 'no-store',
        })
        if (!res.ok) return
        const vData = await res.json()
        if (vData?.version && vData.version > catalogVersion) {
          setCatalogVersion(vData.version)
          loadCatalogData()
        }
      } catch {}
    }, 15000)

    return () => {
      alive = false
      unsubscribe()
      clearInterval(interval)
    }
  }, [tenantId, loadCatalogData, catalogVersion])

  const handleAddCurrentToCart = () => {
    if (!draft?.container) {
      toast.error('Selecione uma taça')
      return
    }

    const hasBasesGroup = (draft.container.optionGroups || []).some(
      (g: any) => g.id === 'model-bases' || g.name?.toLowerCase().includes('base')
    )

    if (hasBasesGroup && draft.bases.length === 0) {
      toast.error('Escolha pelo menos uma base')
      return
    }

    addDraftToCart()
    setStep(1)
    toast.success('Taça adicionada ao pedido!')
  }

  const handleOptionsModalConfirm = (payload: {
    containerId: string
    containerName: string
    unitPrice: number
    quantity: number
    lineTotal: number
    selectedOptions: any[]
    observations?: string
  }) => {
    if (!optionsModalProduct) return
    addSimpleItem(
      optionsModalProduct,
      payload.quantity || 1,
      payload.selectedOptions,
      payload.observations || '',
      payload.unitPrice
    )
    toast.success(`${optionsModalProduct.name} adicionado ao pedido!`)
    setOptionsModalProduct(null)
  }

  const handleProcessPayment = async (
    method: PaymentMethodCode,
    customer: { name: string; phone: string },
    options?: {
      consumptionType?: 'DINE_IN' | 'TAKEAWAY'
      isTakeaway?: boolean
      needBag?: boolean
      bagQuantity?: number
      bagFee?: number
      totalWithBags?: number
    }
  ) => {
    setSubmitting(true)
    try {
      const isTable = orderType === 'MESA' && selectedTable
      const finalCustomerName = customer.name?.trim() || customerNameInput.trim() || (isTable ? `Cliente Mesa ${selectedTable?.number}` : 'Balcão')
      const tableNumber = isTable ? String(selectedTable?.number || '1') : 'Balcão'
      const consumptionType = options?.consumptionType || (isTable ? 'DINE_IN' : 'DINE_IN')
      const bagQuantity = options?.bagQuantity || 0
      const bagFee = options?.bagFee || 0

      // 1. Criar pedido oficial com status PREPARING e pagamento liquidado no balcão
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          items,
          paymentMethod: method,
          customerName: finalCustomerName,
          customerPhone: customer.phone,
          isTableOrder: isTable,
          tableNumber,
          channel: 'POS',
          isQRCode: false,
          cashierName: 'Operador de Caixa',
          consumptionType,
          isTakeaway: consumptionType === 'TAKEAWAY',
          needBag: bagQuantity > 0,
          bagQuantity,
          bagFee,
          status: 'PREPARING',
          paymentStatus: 'PAID',
          paidAt: new Date().toISOString(),
        }),
      })

      if (!res.ok) throw new Error('Falha ao registar comanda')
      const order = await res.json()

      setLastOrder(order)
      clearCart()
      setCustomerNameInput('')
      setPayOpen(false)
      setReceiptOpen(true)
      toast.success('Pedido pago e enviado diretamente para a produção!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Seletor de Tipo de Atendimento & Mesa */}
      <div className="p-3.5 bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {onBackToTables && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToTables}
              className="h-9 text-xs font-bold border-purple-200 dark:border-white/15 text-purple-950 dark:text-white hover:bg-purple-50 dark:hover:bg-white/5 cursor-pointer rounded-xl"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span>Salão</span>
            </Button>
          )}

          <div className="flex bg-purple-50 dark:bg-white/5 p-1 rounded-xl gap-1 border border-purple-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setOrderType('BALCAO')
                setSelectedTable(null)
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                orderType === 'BALCAO'
                  ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200 hover:bg-purple-100/60 dark:hover:bg-white/10'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Balcão / Takeaway</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOrderType('MESA')
                if (!selectedTable && allTables.length > 0) {
                  setSelectedTable(allTables[0])
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                orderType === 'MESA'
                  ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200 hover:bg-purple-100/60 dark:hover:bg-white/10'
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>Lançar para Mesa</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {orderType === 'MESA' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-900/70 dark:text-purple-300">Mesa:</span>
              <select
                value={selectedTable?.id || ''}
                onChange={(e) => {
                  const tbl = allTables.find((t) => t.id === e.target.value) || null
                  setSelectedTable(tbl)
                }}
                className="h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-[#1f0337] text-xs font-black text-purple-950 dark:text-white cursor-pointer"
              >
                {allTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Mesa {t.number}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Campo Opcional do Nome do Cliente para Identificação da Comanda */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-900/70 dark:text-purple-300">Cliente:</span>
            <input
              type="text"
              value={customerNameInput}
              onChange={(e) => setCustomerNameInput(e.target.value)}
              placeholder="Ex: Valdair"
              className="h-9 px-3 w-32 sm:w-40 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-[#1f0337] text-xs font-bold text-purple-950 dark:text-white placeholder:text-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>
        </div>
      </div>

      {/* Grid Principal: Montador + Resumo da Comanda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Esquerda: Catálogo / Montador por Menu */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-4 md:p-6 bg-white dark:bg-[#160228] shadow-xs border border-purple-100 dark:border-white/10 rounded-3xl space-y-4">
            {/* 1. SELETOR DE MENUS CANÔNICOS (5 Menus Oficiais) */}
            <div className="flex flex-col gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-purple-100/70 dark:bg-white/5 border border-purple-200/70 dark:border-white/10 overflow-x-auto no-scrollbar">
                {pdvMenus.map((menu) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => {
                      setSelectedMenuId(menu.id)
                      setSelectedCategoryId('all')
                    }}
                    className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-black transition-all text-center cursor-pointer ${
                      selectedMenuId === menu.id
                        ? 'bg-purple-700 text-white dark:bg-pink-600 shadow-sm'
                        : 'text-purple-900 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white'
                    }`}
                  >
                    {menu.name}
                  </button>
                ))}
              </div>

              {/* Subcategorias em Pílulas (Clean & Sem Emojis) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 text-xs ${
                    selectedCategoryId === 'all'
                      ? 'bg-purple-900 text-white dark:bg-pink-600'
                      : 'bg-purple-50 dark:bg-white/5 text-slate-700 dark:text-purple-200 border border-purple-200/70 dark:border-white/10 hover:bg-purple-100 dark:hover:bg-white/10'
                  }`}
                >
                  {isAcaiMenu ? 'Todas as Taças' : 'Todas as Categorias'}
                </button>

                {activeMenuCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 text-xs ${
                      selectedCategoryId === cat.id
                        ? 'bg-purple-900 text-white dark:bg-pink-600'
                        : 'bg-purple-50 dark:bg-white/5 text-slate-700 dark:text-purple-200 border border-purple-200/70 dark:border-white/10 hover:bg-purple-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-muted-foreground text-xs font-bold">
                A carregar cardápio oficial...
              </div>
            ) : isAcaiMenu ? (
              <>
                {/* WIZARD DE AÇAÍ: ETAPAS 1, 2 e 3 */}
                <StepIndicator current={step} onSelectStep={setStep} />

                {/* Cabeçalho da Taça Sendo Montada com Preço em Tempo Real */}
                {draft?.container && (
                  <div className="space-y-2 py-3 px-4 my-3 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-100 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-700 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl">
                          {draft.container.name}
                        </Badge>
                        <span className="text-xs font-bold text-purple-900/70 dark:text-purple-200/70">
                          Base: {formatCurrency(draft.container.precoBase)}
                        </span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-purple-950 dark:text-white font-mono">
                        Subtotal: <span className="text-pink-600 dark:text-pink-400 font-extrabold">{formatCurrency(currentDraftTotal)}</span>
                      </div>
                    </div>

                    {/* Seletor de Embalagem para 750g e 1kg */}
                    {draft.container && (
                      (draft.container.weightGrams || 0) >= 750 || 
                      draft.container.name.toLowerCase().includes('taça ou caixa') ||
                      draft.container.name.toLowerCase().includes('sensação') ||
                      draft.container.name.toLowerCase().includes('família') ||
                      draft.container.name.toLowerCase().includes('familia')
                    ) && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-100 dark:border-white/10">
                        <span className="text-xs font-black uppercase text-purple-950 dark:text-purple-200">
                          Embalagem:
                        </span>
                        <div className="inline-flex rounded-xl p-1 bg-purple-100/80 dark:bg-white/10 border border-purple-200/60 dark:border-white/10">
                          <button
                            type="button"
                            onClick={() => setDraftPackagingType('TACA')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              draft.packagingType !== 'CAIXA'
                                ? 'bg-purple-700 text-white shadow-xs'
                                : 'text-purple-900 dark:text-purple-200 hover:text-purple-950'
                            }`}
                          >
                            Taça (Consumo no Local)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftPackagingType('CAIXA')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              draft.packagingType === 'CAIXA'
                                ? 'bg-purple-700 text-white shadow-xs'
                                : 'text-purple-900 dark:text-purple-200 hover:text-purple-950'
                            }`}
                          >
                            Caixa com Tampa (Takeaway)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tags de Extras Ativos na Taça */}
                    {draftBreakdown && (draftBreakdown.extraBases > 0 || draftBreakdown.extraFrutas > 0 || draftBreakdown.extraToppings > 0 || draftBreakdown.premiumsVal > 0) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-black border-t border-purple-100/60 dark:border-white/10">
                        <span className="text-muted-foreground text-[10px]">Adicionais somados:</span>
                        {draftBreakdown.extraBases > 0 && (
                          <span className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 px-2 py-0.5 rounded-md">
                            +{draftBreakdown.extraBases}x Creme Extra (+{formatCurrency(draftBreakdown.extraBasesVal)})
                          </span>
                        )}
                        {draftBreakdown.extraFrutas > 0 && (
                          <span className="bg-pink-100 text-pink-900 dark:bg-pink-950/60 dark:text-pink-200 px-2 py-0.5 rounded-md">
                            +{draftBreakdown.extraFrutas}x Fruta Extra (+{formatCurrency(draftBreakdown.extraFrutasVal)})
                          </span>
                        )}
                        {draftBreakdown.extraToppings > 0 && (
                          <span className="bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950/60 dark:text-fuchsia-200 px-2 py-0.5 rounded-md">
                            +{draftBreakdown.extraToppings}x Acompanhamento Extra (+{formatCurrency(draftBreakdown.extraToppingsVal)})
                          </span>
                        )}
                        {draftBreakdown.premiumsVal > 0 && (
                          <span className="bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200 px-2 py-0.5 rounded-md">
                            + Especiais/Premium (+{formatCurrency(draftBreakdown.premiumsVal)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="min-h-[320px] pt-2">
                  {step === 1 && (
                    <ContainerSelector
                      containers={displayedItems}
                      selected={draft?.container || null}
                      onSelect={(c) => {
                        startDraft(c)
                        setStep(2)
                      }}
                    />
                  )}

                  {step === 2 && draft?.container && (
                    <BaseSelector
                      bases={catalog.bases}
                      container={draft.container}
                      selectedBases={draft.bases}
                      onToggleBase={toggleBase}
                    />
                  )}

                  {step === 3 && draft?.container && (
                    <ToppingSelector
                      toppings={catalog.toppings}
                      container={draft.container}
                      selectedToppings={draft.toppings}
                      onToggleTopping={toggleTopping}
                    />
                  )}
                </div>

                {/* Rodapé de Ações do Montador de Açaí */}
                {draft?.container && (
                  <div className="mt-6 pt-4 border-t border-purple-50 dark:border-white/10 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetDraft}
                      className="text-xs text-muted-foreground hover:text-red-600 font-bold cursor-pointer"
                    >
                      Reiniciar Açaí
                    </Button>

                    <div className="flex items-center gap-2">
                      {step > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStep(step - 1)}
                          className="text-xs font-bold border-purple-200 dark:border-white/15 cursor-pointer"
                        >
                          Voltar Etapa
                        </Button>
                      )}

                      {step < 3 ? (
                        <Button
                          size="sm"
                          onClick={() => setStep(step + 1)}
                          disabled={
                            step === 2 &&
                            Boolean(
                              (draft.container.optionGroups || []).some(
                                (g: any) => g.id === 'model-bases' || g.name?.toLowerCase().includes('base')
                              )
                            ) &&
                            draft.bases.length === 0
                          }
                          className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Avançar</span>
                          <span className="opacity-90 font-mono text-[11px]">({formatCurrency(currentDraftTotal)})</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleAddCurrentToCart}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Adicionar ao Pedido •</span>
                          <span className="font-mono text-sm">{formatCurrency(currentDraftTotal)}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* CATÁLOGO DE PRODUTOS DIRETOS (LANCHES, MILK SHAKES, BEBIDAS, CHOCOLATES) */
              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                      {pdvMenus.find((m) => m.id === selectedMenuId)?.name || 'Itens'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Selecione os itens para adicionar diretamente ao pedido
                    </p>
                  </div>

                  {/* Campo de Busca Rápida de Itens */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={lanchesSearchQuery}
                      onChange={(e) => setLanchesSearchQuery(e.target.value)}
                      placeholder="Buscar item por nome..."
                      className="h-9 pl-9 pr-3 w-full rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/40 dark:bg-[#1f0337] text-xs font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                </div>

                {displayedItems.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-xs font-bold">
                    Nenhum item encontrado nesta categoria.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {displayedItems.map((p) => {
                      const inCartCount = items
                        .filter((i) => i.container.id === p.id)
                        .reduce((sum, i) => sum + (i.quantity || 1), 0)

                      const hasOptions = Array.isArray(p.optionGroups) && p.optionGroups.length > 0

                      return (
                        <Card
                          key={p.id}
                          onClick={() => {
                            if (hasOptions) {
                              setOptionsModalProduct(p)
                            } else {
                              addSimpleItem(p, 1)
                              toast.success(`${p.name} adicionado ao pedido!`)
                            }
                          }}
                          className="p-3.5 rounded-3xl border border-purple-150 hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white dark:bg-[#1f0337] cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                        >
                          {inCartCount > 0 && (
                            <div className="absolute top-2 right-2 z-10 bg-purple-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                              {inCartCount} no pedido
                            </div>
                          )}

                          <div>
                            <div className="h-28 w-full rounded-2xl overflow-hidden bg-purple-100 dark:bg-purple-950/40 relative mb-3 border border-purple-100 dark:border-white/10">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs font-black text-purple-700 dark:text-purple-300 p-2 text-center">
                                  {p.name}
                                </div>
                              )}
                              <div className="absolute bottom-2 right-2 bg-[#1b032e]/85 backdrop-blur-md text-fuchsia-200 px-2.5 py-0.5 rounded-xl font-black text-xs shadow-md border border-white/10">
                                {formatCurrency(p.precoBase)}
                              </div>
                            </div>

                            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-pink-400">
                              {p.categoryName || 'Item'}
                            </div>
                            <div className="font-black text-sm text-foreground leading-tight mt-0.5 line-clamp-2">
                              {p.name}
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            className="mt-3 w-full h-8 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <span>{hasOptions ? 'Personalizar' : 'Adicionar'}</span>
                          </Button>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Coluna Direita: Carrinho / Resumo da Comanda */}
        <div className="lg:col-span-4">
          <CartSummary
            items={items}
            total={currentTotal}
            onRemoveItem={removeItem}
            onUpdateQuantity={updateItemQuantity}
            onClearCart={clearCart}
            onOpenPayment={() => setPayOpen(true)}
          />
        </div>
      </div>

      {/* Modal de Pagamento Rápido */}
      <PaymentModal
        open={payOpen}
        onOpenChange={setPayOpen}
        total={currentTotal}
        storePhone={storePhone}
        submitting={submitting}
        initialCustomerName={customerNameInput.trim() || (orderType === 'MESA' && selectedTable ? `Cliente Mesa ${selectedTable.number}` : '')}
        initialTableName={orderType === 'MESA' && selectedTable ? `Mesa ${selectedTable.number}` : 'Balcão'}
        onPay={handleProcessPayment}
      />

      {/* Modal de Recibo e Senha */}
      <OrderReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        order={lastOrder}
        onNewOrder={() => {
          setReceiptOpen(false)
          setLastOrder(null)
          clearCart()
        }}
      />

      {/* Modal de Opções do Item Selecionado */}
      {optionsModalProduct && (
        <PDVItemOptionsModal
          open={Boolean(optionsModalProduct)}
          product={optionsModalProduct}
          onClose={() => setOptionsModalProduct(null)}
          onConfirm={handleOptionsModalConfirm}
        />
      )}
    </div>
  )
}
