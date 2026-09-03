'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { CatalogData, Order, PaymentMethodCode } from '@/types'
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
import { ShoppingBag, Store, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react'

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
  const [catalog, setCatalog] = useState<CatalogData>({ containers: [], bases: [], toppings: [] })
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<number>(1)
  const [payOpen, setPayOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)

  // Tipo de Pedido: BALCAO vs MESA
  const [orderType, setOrderType] = useState<'BALCAO' | 'MESA'>(initialTable ? 'MESA' : 'BALCAO')
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(initialTable || null)
  const [customerNameInput, setCustomerNameInput] = useState<string>('')
  const [allTables, setAllTables] = useState<RestaurantTable[]>([])

  const { items, draft, startDraft, resetDraft, toggleBase, toggleTopping, addDraftToCart, removeItem, clearCart, total } = useCartStore()

  const currentTotal = total()
  const currentDraftTotal = draft?.container ? computeItemLineTotal(draft) : 0

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

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      fetch(`/api/products?tenantId=${encodeURIComponent(tenantId)}`).then((r) => r.json()),
      fetch(`/api/tables?tenantId=${encodeURIComponent(tenantId)}`).then((r) => r.json()),
    ])
      .then(([dataCatalog, dataTables]) => {
        if (alive) {
          if (dataCatalog) setCatalog(dataCatalog)
          if (dataTables?.tables) setAllTables(dataTables.tables)
        }
      })
      .catch(() => toast.error('Erro ao carregar dados do PDV'))
      .finally(() => alive && setLoading(false))

    return () => {
      alive = false
    }
  }, [tenantId])

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

  const handleProcessPayment = async (method: PaymentMethodCode, customer: { name: string; phone: string }) => {
    setSubmitting(true)
    try {
      const isTable = orderType === 'MESA' && selectedTable
      const finalCustomerName = customer.name?.trim() || customerNameInput.trim() || (isTable ? `Cliente Mesa ${selectedTable?.number}` : 'Balcão')
      const tableNumber = isTable ? String(selectedTable?.number || '1') : 'Balcão'

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
        {/* Coluna Esquerda: Montador / Wizard de Açaí */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-4 md:p-6 bg-white dark:bg-[#160228] shadow-xs border border-purple-100 dark:border-white/10 rounded-3xl">
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
                        +{draftBreakdown.extraToppings}x Topping Extra (+{formatCurrency(draftBreakdown.extraToppingsVal)})
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

            {loading ? (
              <div className="text-center py-16 text-muted-foreground text-xs font-bold">
                A carregar cardápio oficial...
              </div>
            ) : (
              <div className="min-h-[320px] pt-2">
                {step === 1 && (
                  <ContainerSelector
                    containers={catalog.containers}
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
            )}

            {/* Rodapé de Ações do Montador com Soma Dinâmica */}
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
          </Card>
        </div>

        {/* Coluna Direita: Carrinho / Resumo da Comanda */}
        <div className="lg:col-span-4">
          <CartSummary
            items={items}
            total={currentTotal}
            onRemoveItem={removeItem}
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
    </div>
  )
}
