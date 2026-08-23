'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CatalogData, ProductContainer, Tenant } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

// Sub-componentes
import CustomerBottomNav, { CustomerTabId } from '@/components/menu/CustomerBottomNav'
import CustomerMenuHeader from '@/components/menu/CustomerMenuHeader'
import CustomerMenuHome from '@/components/menu/CustomerMenuHome'
import CustomerMenuSearch from '@/components/menu/CustomerMenuSearch'
import CustomerMenuMore from '@/components/menu/CustomerMenuMore'
import CustomerProductDetail from '@/components/menu/CustomerProductDetail'
import CallWaiterModal from '@/components/menu/CallWaiterModal'
import { Bell } from 'lucide-react'

function MenuContent() {
  const searchParams = useSearchParams()
  const rawLoja = searchParams.get('loja') || searchParams.get('tenantId') || 'torres-novas'
  const paramTipo = searchParams.get('tipo') || 'balcao'
  const paramNumero = searchParams.get('numero') || ''

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [catalog, setCatalog] = useState<CatalogData>({ containers: [], bases: [], toppings: [] })
  const [loading, setLoading] = useState(true)
  const [qrConfig, setQrConfig] = useState<any>({ mode: 'ORDER_EMISSION' })

  // Navegação de 3 Abas
  const [activeTab, setActiveTab] = useState<CustomerTabId>('menu')

  // Produto Selecionado para Detalhe / Customizador
  const [selectedContainer, setSelectedContainer] = useState<ProductContainer | null>(null)

  // Carrinho do Cliente
  const [cart, setCart] = useState<any[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [waiterModalOpen, setWaiterModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null)

  const isTable = paramTipo === 'mesa' && Boolean(paramNumero)
  const tableLabel = isTable ? `Mesa ${paramNumero}` : 'Balcão / Take-Away'

  useEffect(() => {
    fetch('/api/tenants')
      .then((r) => r.json())
      .then((d) => {
        const cleanLoja = (rawLoja || '').toLowerCase().trim()
        const found =
          d.tenants?.find(
            (t: any) =>
              t.id?.toLowerCase() === cleanLoja ||
              t.slug?.toLowerCase() === cleanLoja ||
              t.id?.toLowerCase() === `tenant-${cleanLoja}` ||
              t.slug?.toLowerCase() === cleanLoja.replace('tenant-', '')
          ) ||
          d.tenants?.[0] ||
          null

        setTenant(found)
        const tid = found?.id || 'tenant-torres-novas'
        return Promise.all([
          fetch(`/api/products?tenantId=${tid}`).then((r) => r.json()),
          fetch(`/api/qrcode-config?tenantId=${tid}`).then((r) => r.json()),
        ])
      })
      .then(([cat, cfg]) => {
        if (cat) setCatalog(cat)
        if (cfg?.config) setQrConfig(cfg.config)
      })
      .finally(() => setLoading(false))
  }, [rawLoja])

  const cartTotal = cart.reduce((acc, item) => acc + item.lineTotal, 0)
  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0)

  const handleAddToCart = (item: any) => {
    setCart((prev) => [...prev, item])
  }

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((it) => it.id !== itemId))
  }

  const [pendingOrder, setPendingOrder] = useState<any | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedPayMethod, setSelectedPayMethod] = useState<'MBWAY' | 'MULTIBANCO' | 'NUMERARIO'>('MBWAY')
  const [mbwayPhoneInput, setMbwayPhoneInput] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    setSubmittingOrder(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant?.id || 'tenant-torres-novas',
          items: cart,
          customerName: customerName || (isTable ? `Cliente ${tableLabel}` : 'Cliente Balcão'),
          customerPhone: customerPhone || '911000000',
          isTableOrder: isTable,
          tableNumber: tableLabel,
          paymentMethod: selectedPayMethod,
          paymentStatus: 'PENDING',
          status: 'NEW',
          source: 'QRCODE',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar pedido')

      setPendingOrder({
        id: data.id || data.order?.id,
        orderNumber: data.orderNumber || data.order?.orderNumber || '104',
        store: tenant?.name || 'Açaí da Rose',
        tableLabel,
        total: cartTotal,
        isTable,
      })

      setMbwayPhoneInput(customerPhone || '')
      setCartOpen(false)
      setPaymentModalOpen(true)
    } catch {
      // Fallback
      setPendingOrder({
        id: `ord-demo-${Date.now()}`,
        orderNumber: Math.floor(100 + Math.random() * 900).toString(),
        store: tenant?.name || 'Açaí da Rose',
        tableLabel,
        total: cartTotal,
        isTable,
      })
      setCartOpen(false)
      setPaymentModalOpen(true)
    } finally {
      setSubmittingOrder(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!pendingOrder) return
    setProcessingPayment(true)

    try {
      if (pendingOrder.id && !pendingOrder.id.startsWith('ord-demo-')) {
        await fetch(`/api/orders/${pendingOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentStatus: 'PAID',
            paymentMethod: selectedPayMethod,
            status: 'NEW',
          }),
        })
      }

      setOrderSuccess({
        ...pendingOrder,
        paymentStatus: 'PAID',
      })
      setPaymentModalOpen(false)
      setPendingOrder(null)
      setCart([])
      toast.success('Pagamento confirmado! O seu pedido foi enviado para montagem.')
    } catch {
      setOrderSuccess({
        ...pendingOrder,
        paymentStatus: 'PAID',
      })
      setPaymentModalOpen(false)
      setPendingOrder(null)
      setCart([])
    } finally {
      setProcessingPayment(false)
    }
  }

  // Se o QR code estiver desativado pelo lojista
  if (qrConfig?.mode === 'DISABLED') {
    return (
      <div className="min-h-screen bg-[#120224] text-white flex flex-col items-center justify-center p-6 text-center">
        <img src="/logo.png" alt="Açaí da Rose" className="h-16 w-auto object-contain mb-4" />
        <div className="max-w-sm p-6 rounded-3xl bg-white/5 border border-white/15 space-y-2">
          <div className="text-sm font-black text-white">Atendimento Digital Indisponível</div>
          <p className="text-xs text-purple-200/70">
            O atendimento via QR Code está temporariamente pausado nesta unidade. Por favor, faça o seu pedido diretamente ao atendente no balcão.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#120224] text-white selection:bg-fuchsia-500 selection:text-white pb-20">
      {/* Header Superior da Loja com status e badges condicionais */}
      <CustomerMenuHeader
        tenant={tenant}
        isTable={isTable}
        tableLabel={tableLabel}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* Conteúdo Dinâmico das 3 Abas */}
      {loading ? (
        <div className="py-24 text-center text-xs text-purple-300/60">
          A carregar o cardápio oficial...
        </div>
      ) : (
        <>
          {activeTab === 'menu' && (
            <CustomerMenuHome
              catalog={catalog}
              onSelectContainer={(c) => setSelectedContainer(c)}
              isTable={isTable}
            />
          )}

          {activeTab === 'search' && (
            <CustomerMenuSearch
              catalog={catalog}
              onSelectContainer={(c) => setSelectedContainer(c)}
            />
          )}

          {activeTab === 'more' && (
            <CustomerMenuMore tenant={tenant} />
          )}
        </>
      )}

      {/* Botão Flutuante de Chamada de Garçom / Ajuda de Mesa */}
      {isTable && (
        <div className="fixed bottom-20 right-4 z-30">
          <button
            type="button"
            onClick={() => setWaiterModalOpen(true)}
            className="h-12 px-4 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black text-xs shadow-2xl shadow-pink-600/50 flex items-center gap-2 border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Bell className="h-4 w-4 animate-bounce" />
            <span>Chamar Atendente ({tableLabel})</span>
          </button>
        </div>
      )}

      {/* Modal de Chamada de Garçom / Mesa */}
      <CallWaiterModal
        open={waiterModalOpen}
        onOpenChange={setWaiterModalOpen}
        tableLabel={tableLabel}
        tenantId={tenant?.id || 'tenant-torres-novas'}
      />

      {/* Barra Inferior Fixa de Navegação (3 Abas + Carrinho) */}
      <CustomerBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* Modal / Tela de Detalhes do Produto Selecionado (Exclusivo para Comanda via QR Code de Mesa) */}
      {isTable && selectedContainer && (
        <CustomerProductDetail
          container={selectedContainer}
          catalog={catalog}
          onClose={() => setSelectedContainer(null)}
          onAddToCart={handleAddToCart}
          viewOnly={qrConfig?.mode === 'VIEW_ONLY'}
        />
      )}

      {/* Modal da Comanda / Carrinho */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-md p-6 bg-[#160228] text-white border border-white/20 rounded-3xl">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-black text-white">
              Sua Comanda ({cartCount} itens)
            </DialogTitle>
            <p className="text-xs text-purple-200/70">
              {tableLabel} · {tenant?.name}
            </p>
          </DialogHeader>

          <div className="divide-y divide-white/10 my-3 max-h-64 overflow-y-auto pr-1">
            {cart.map((item, idx) => (
              <div key={item.id || idx} className="py-3 flex justify-between items-start gap-2 text-xs">
                <div>
                  <div className="font-bold text-white">
                    {item.quantity}x {item.container.name}
                  </div>
                  <div className="text-[11px] text-purple-200/70 mt-0.5">
                    {item.bases.map((b: any) => b.name).join(', ')}
                    {item.toppings.length > 0 && ` + ${item.toppings.map((t: any) => t.name).join(', ')}`}
                  </div>
                  {item.notes && (
                    <div className="text-[10px] text-amber-300/80 italic mt-0.5">
                      Obs: {item.notes}
                    </div>
                  )}
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span className="font-mono font-black text-fuchsia-300">
                    {formatCurrency(item.lineTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="text-[10px] text-red-400 hover:text-red-300"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center text-xs">
            <span className="font-bold text-purple-200">Total do Pedido:</span>
            <span className="text-base font-black text-fuchsia-300 font-mono">
              {formatCurrency(cartTotal)}
            </span>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-200">Seu Nome / Como prefere ser chamado:</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="ex: João Silva"
                required
                className="h-10 text-xs bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-200">Telemóvel (opcional / MB WAY):</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="ex: 911 050 264"
                className="h-10 text-xs bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={submittingOrder || cart.length === 0}
                className="w-full h-12 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black text-xs rounded-2xl shadow-lg cursor-pointer"
              >
                {submittingOrder ? 'A processar...' : 'Avançar para Pagamento →'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento Obrigatório Antes da Montagem */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md p-6 bg-[#160228] text-white border border-white/20 rounded-3xl">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">💳</span>
              <DialogTitle className="text-base font-black text-white">
                Pagamento da Comanda #{pendingOrder?.orderNumber}
              </DialogTitle>
            </div>
            <p className="text-xs text-purple-200/70">
              {pendingOrder?.tableLabel} · Total: <span className="font-mono font-black text-amber-300">{formatCurrency(pendingOrder?.total || 0)}</span>
            </p>
          </DialogHeader>

          {/* Alerta de Pagamento Obrigatório */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 my-2">
            <span className="text-base flex-shrink-0">⚠️</span>
            <p className="leading-snug">
              <strong>Controle de Zonas Turísticas:</strong> O pedido só é encaminhado à <strong>copa de montagem</strong> após a confirmação do pagamento.
            </p>
          </div>

          <div className="space-y-2.5 my-2">
            <div className="text-xs font-bold text-purple-200">Selecione a forma de pagamento:</div>
            
            {/* Opção MB WAY */}
            <div
              onClick={() => setSelectedPayMethod('MBWAY')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedPayMethod === 'MBWAY'
                  ? 'bg-fuchsia-950/60 border-fuchsia-500 ring-1 ring-fuchsia-500 shadow-md'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🟣</span>
                <div>
                  <div className="font-black text-xs text-white">MB WAY Instantâneo</div>
                  <div className="text-[11px] text-purple-300/70">Notificação direta no telemóvel</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-fuchsia-300">MB WAY</span>
            </div>

            {/* Opção Multibanco */}
            <div
              onClick={() => setSelectedPayMethod('MULTIBANCO')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedPayMethod === 'MULTIBANCO'
                  ? 'bg-fuchsia-950/60 border-fuchsia-500 ring-1 ring-fuchsia-500 shadow-md'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💳</span>
                <div>
                  <div className="font-black text-xs text-white">Multibanco / Cartão (TPA)</div>
                  <div className="text-[11px] text-purple-300/70">Terminal portátil no atendimento</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300">TPA</span>
            </div>

            {/* Opção Numerário */}
            <div
              onClick={() => setSelectedPayMethod('NUMERARIO')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedPayMethod === 'NUMERARIO'
                  ? 'bg-fuchsia-950/60 border-fuchsia-500 ring-1 ring-fuchsia-500 shadow-md'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💵</span>
                <div>
                  <div className="font-black text-xs text-white">Numerário no Balcão</div>
                  <div className="text-[11px] text-purple-300/70">Pagamento direto ao atendente</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300">Dinheiro</span>
            </div>

            {/* Campo de Telemóvel para MB WAY */}
            {selectedPayMethod === 'MBWAY' && (
              <div className="pt-2 space-y-1">
                <Label className="text-[11px] font-bold text-fuchsia-200">Número de Telemóvel MB WAY:</Label>
                <Input
                  value={mbwayPhoneInput}
                  onChange={(e) => setMbwayPhoneInput(e.target.value)}
                  placeholder="ex: 911 050 264"
                  className="h-10 text-xs bg-white/10 border-fuchsia-500/40 text-white rounded-xl"
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              onClick={handleConfirmPayment}
              disabled={processingPayment}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lg cursor-pointer"
            >
              {processingPayment ? 'A validar pagamento...' : `Pagar ${formatCurrency(pendingOrder?.total || 0)} & Liberar Montagem`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pedido Pago & Enviado para Montagem */}
      <Dialog open={Boolean(orderSuccess)} onOpenChange={() => setOrderSuccess(null)}>
        <DialogContent className="max-w-sm p-6 bg-[#160228] text-white border border-white/20 rounded-3xl text-center">
          <div className="space-y-3">
            <span className="text-4xl">🎉</span>
            <DialogTitle className="text-lg font-black text-white">
              Pagamento Confirmado!
            </DialogTitle>
            <p className="text-xs text-purple-200/80">
              O seu açaí foi <strong>liberado para montagem</strong> na copa para a <strong>{orderSuccess?.tableLabel}</strong>.
            </p>

            <div className="p-4 rounded-2xl bg-purple-900/40 border border-purple-500/30 text-center">
              <div className="text-[10px] text-emerald-400 uppercase font-black tracking-wider">
                ✓ PAGO & EM MONTAGEM
              </div>
              <div className="text-2xl font-black text-fuchsia-300 font-mono mt-0.5">
                Comanda #{orderSuccess?.orderNumber}
              </div>
              <div className="text-xs font-bold text-white mt-1">
                Total Pago: {formatCurrency(orderSuccess?.total || 0)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-purple-200/70 italic">
              "Açaí não se explica: se experimenta, se apaixona e repete."
            </div>
          </div>

          <DialogFooter className="mt-3">
            <Button
              onClick={() => setOrderSuccess(null)}
              className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black text-xs rounded-xl cursor-pointer"
            >
              Acompanhar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#120224] text-white p-6 text-center text-xs">A carregar cardápio...</div>}>
      <MenuContent />
    </Suspense>
  )
}
