'use client'

import React, { useState, useEffect } from 'react'
import { CatalogData, Order, PaymentMethodCode } from '@/types'
import { RestaurantTable } from '@/types/tables'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/stores/cartStore'
import StepIndicator from './StepIndicator'
import ContainerSelector from './ContainerSelector'
import BaseSelector from './BaseSelector'
import ToppingSelector from './ToppingSelector'
import CartSummary from './CartSummary'
import PaymentModal from './PaymentModal'
import OrderReceiptModal from './OrderReceiptModal'
import { ShoppingBag, Store, ArrowLeft, CheckCircle2 } from 'lucide-react'

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
  const [allTables, setAllTables] = useState<RestaurantTable[]>([])

  const { items, draft, startDraft, resetDraft, toggleBase, toggleTopping, addDraftToCart, removeItem, clearCart, total } = useCartStore()

  const currentTotal = total()

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
    if (!draft?.container || draft.bases.length === 0) {
      toast.error('Escolha pelo menos uma base de açaí')
      return
    }
    addDraftToCart()
    setStep(1)
    toast.success('Açaí montado e adicionado à comanda!')
  }

  const handleProcessPayment = async (method: PaymentMethodCode, customer: { name: string; phone: string }) => {
    setSubmitting(true)
    try {
      const isTable = orderType === 'MESA' && selectedTable
      const tableNumber = isTable ? `Mesa ${selectedTable.number.toString().padStart(2, '0')}` : 'Balcão'

      // 1. Criar pedido oficial
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          items,
          paymentMethod: method,
          customerName: customer.name || (isTable ? `Cliente ${tableNumber}` : 'Cliente Balcão'),
          customerPhone: customer.phone,
          isTableOrder: isTable,
          tableNumber,
          status: 'NEW',
        }),
      })

      if (!res.ok) throw new Error('Falha ao registar comanda')
      const order = await res.json()

      // 2. Se for mesa, atualizar/desocupar mesa ou sincronizar
      if (isTable && selectedTable) {
        await fetch(`/api/tables/${selectedTable.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'CLOSE' }),
        }).catch(() => {})
      }

      setLastOrder(order)
      clearCart()
      setPayOpen(false)
      setReceiptOpen(true)
      toast.success('Comanda finalizada e enviada para a produção!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao finalizar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Seletor de Tipo de Atendimento & Mesa */}
      <div className="p-3 bg-white border border-purple-100 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          {onBackToTables && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToTables}
              className="h-8.5 text-xs font-bold border-purple-200 text-purple-950 hover:bg-purple-50 gap-1 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Salão</span>
            </Button>
          )}

          <div className="flex bg-purple-50 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setOrderType('BALCAO')
                setSelectedTable(null)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                orderType === 'BALCAO'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-900 hover:bg-purple-100'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Pedido Balcão / Takeaway</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOrderType('MESA')
                if (!selectedTable && allTables.length > 0) {
                  setSelectedTable(allTables[0])
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                orderType === 'MESA'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-900 hover:bg-purple-100'
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>Lançar para Mesa</span>
            </button>
          </div>
        </div>

        {orderType === 'MESA' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Mesa:</span>
            <select
              value={selectedTable?.id || ''}
              onChange={(e) => {
                const tbl = allTables.find((t) => t.id === e.target.value) || null
                setSelectedTable(tbl)
              }}
              className="h-9 px-3 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-black text-purple-950 cursor-pointer"
            >
              {allTables.map((t) => (
                <option key={t.id} value={t.id}>
                  Mesa {t.number} ({t.nickname || (t.status === 'AVAILABLE' ? 'Livre' : 'Ocupada')})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid Principal: Montador + Resumo da Comanda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Esquerda: Montador / Wizard de Açaí */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-4 md:p-6 bg-white shadow-xs border border-purple-100 rounded-3xl">
            <StepIndicator current={step} onSelectStep={setStep} />

            {loading ? (
              <div className="text-center py-16 text-muted-foreground text-xs font-bold">
                A carregar cardápio oficial...
              </div>
            ) : (
              <div className="min-h-[320px] pt-4">
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

            {/* Rodapé de Ações do Montador */}
            {draft?.container && (
              <div className="mt-6 pt-4 border-t border-purple-50 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetDraft}
                  className="text-xs text-muted-foreground hover:text-red-600 font-bold"
                >
                  Reiniciar Açaí
                </Button>

                <div className="flex gap-2">
                  {step > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStep(step - 1)}
                      className="text-xs font-bold border-purple-200"
                    >
                      Voltar Etapa
                    </Button>
                  )}

                  {step < 3 ? (
                    <Button
                      size="sm"
                      onClick={() => setStep(step + 1)}
                      disabled={step === 2 && draft.bases.length === 0}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-5 rounded-xl shadow-xs"
                    >
                      Avançar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleAddCurrentToCart}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 rounded-xl shadow-md cursor-pointer"
                    >
                      Adicionar à Comanda
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
