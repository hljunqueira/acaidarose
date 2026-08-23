'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CatalogData, ProductContainer, Tenant } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Sub-componentes
import CustomerBottomNav, { CustomerTabId } from '@/components/menu/CustomerBottomNav'
import CustomerMenuHeader from '@/components/menu/CustomerMenuHeader'
import CustomerMenuHome from '@/components/menu/CustomerMenuHome'
import CustomerMenuSearch from '@/components/menu/CustomerMenuSearch'
import CustomerMenuMore from '@/components/menu/CustomerMenuMore'
import CustomerProductDetail from '@/components/menu/CustomerProductDetail'
import CallWaiterModal from '@/components/menu/CallWaiterModal'
import { Bell, Smartphone, Clock, CheckCircle2, AlertCircle, Receipt, User, Sparkles, CreditCard, Banknote } from 'lucide-react'

function MenuContent() {
  const searchParams = useSearchParams()
  const rawLoja = searchParams.get('loja') || searchParams.get('tenantId') || searchParams.get('tenant') || 'torres-novas'
  const paramNumero = searchParams.get('numero') || searchParams.get('mesa') || searchParams.get('table') || ''
  const paramTipo = searchParams.get('tipo') || (paramNumero ? 'mesa' : 'balcao')

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [catalog, setCatalog] = useState<CatalogData>({ containers: [], bases: [], toppings: [] })
  const [loading, setLoading] = useState(true)
  const [qrConfig, setQrConfig] = useState<any>({
    mode: 'ORDER_EMISSION',
    allowMbwayPayment: true,
    customerNameRule: 'OPTIONAL',
    customerPhoneRule: 'OPTIONAL',
    customerNifRule: 'OPTIONAL',
  })

  // Navegação de Abas
  const [activeTab, setActiveTab] = useState<CustomerTabId>('menu')

  // Produto Selecionado para Detalhe / Customizador
  const [selectedContainer, setSelectedContainer] = useState<ProductContainer | null>(null)

  // Carrinho do Cliente
  const [cart, setCart] = useState<any[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [waiterModalOpen, setWaiterModalOpen] = useState(false)

  // Identificação do Cliente
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNif, setCustomerNif] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null)

  // Pagamento Ifthenpay MB WAY
  const [pendingOrder, setPendingOrder] = useState<any | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [mbwayPhoneInput, setMbwayPhoneInput] = useState('')
  const [waitingMbwayPush, setWaitingMbwayPush] = useState(false)
  const [mbwayTimer, setMbwayTimer] = useState(240)
  const [processingPayment, setProcessingPayment] = useState(false)

  const isTable = paramTipo === 'mesa' && Boolean(paramNumero)
  const tableLabel = isTable ? `Mesa ${paramNumero}` : 'Balcão / Take-Away'

  // Carregar dados da loja e restaurar nome salvo no telemóvel
  useEffect(() => {
    const savedName = localStorage.getItem('acai_rose_client_name') || ''
    const savedPhone = localStorage.getItem('acai_rose_client_phone') || ''
    const savedNif = localStorage.getItem('acai_rose_client_nif') || ''
    if (savedName) setCustomerName(savedName)
    if (savedPhone) {
      setCustomerPhone(savedPhone)
      setMbwayPhoneInput(savedPhone)
    }
    if (savedNif) setCustomerNif(savedNif)

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

  // Timer regressivo do MB WAY Ifthenpay
  useEffect(() => {
    let interval: any = null
    if (paymentModalOpen && waitingMbwayPush && mbwayTimer > 0) {
      interval = setInterval(() => {
        setMbwayTimer((prev) => prev - 1)
      }, 1000)
    } else if (mbwayTimer === 0 && waitingMbwayPush) {
      toast.error('O tempo de confirmação do MB WAY expirou. Por favor, tente novamente.')
      setWaitingMbwayPush(false)
    }
    return () => clearInterval(interval)
  }, [paymentModalOpen, waitingMbwayPush, mbwayTimer])

  const cartTotal = cart.reduce((acc, item) => acc + item.lineTotal, 0)
  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0)

  const handleAddToCart = (item: any) => {
    setCart((prev) => [...prev, item])
  }

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((it) => it.id !== itemId))
  }

  // Validação dos dados do cliente de acordo com as regras da loja
  const validateCustomerFields = () => {
    const nameRule = qrConfig?.customerNameRule || 'OPTIONAL'
    const phoneRule = qrConfig?.customerPhoneRule || 'OPTIONAL'

    const trimmedName = customerName.trim()
    if (nameRule === 'REQUIRED' && !trimmedName) {
      toast.error('O seu Nome é obrigatório nesta loja para entrega do pedido!')
      return false
    }

    const trimmedPhone = customerPhone.trim()
    if (phoneRule === 'REQUIRED' && !trimmedPhone) {
      toast.error('O seu Telemóvel é obrigatório para identificação do pedido!')
      return false
    }

    // Salvar no telemóvel para próximas compras
    if (trimmedName) localStorage.setItem('acai_rose_client_name', trimmedName)
    if (trimmedPhone) localStorage.setItem('acai_rose_client_phone', trimmedPhone)
    if (customerNif.trim()) localStorage.setItem('acai_rose_client_nif', customerNif.trim())

    return true
  }

  // 1. Checkout via MB WAY Instantâneo (Pay-First Digital)
  const handleCheckoutMBWay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return
    if (!validateCustomerFields()) return

    const finalName = customerName.trim() || (isTable ? `Cliente ${tableLabel}` : 'Cliente Balcão')
    setSubmittingOrder(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant?.id || 'tenant-torres-novas',
          items: cart,
          customerName: finalName,
          customerPhone: customerPhone || '911000000',
          nif: customerNif || undefined,
          isTableOrder: isTable,
          tableNumber: tableLabel,
          paymentMethod: 'MBWAY',
          paymentStatus: 'PENDING',
          status: 'NEW',
          source: 'QRCODE',
        }),
      })

      const data = await res.json()
      const orderObj = {
        id: data.id || data.order?.id || `ord-${Date.now()}`,
        orderNumber: data.orderNumber || data.order?.orderNumber || Math.floor(100 + Math.random() * 900).toString(),
        store: tenant?.name || 'Açaí da Rose',
        tableLabel,
        total: cartTotal,
        customerName: finalName,
        isTable,
      }

      setPendingOrder(orderObj)
      setMbwayPhoneInput(customerPhone || '')
      setCartOpen(false)
      setPaymentModalOpen(true)
      setWaitingMbwayPush(false)
      setMbwayTimer(240)
    } catch {
      // Fallback
      const orderObj = {
        id: `ord-demo-${Date.now()}`,
        orderNumber: Math.floor(100 + Math.random() * 900).toString(),
        store: tenant?.name || 'Açaí da Rose',
        tableLabel,
        total: cartTotal,
        customerName: finalName,
        isTable,
      }
      setPendingOrder(orderObj)
      setMbwayPhoneInput(customerPhone || '')
      setCartOpen(false)
      setPaymentModalOpen(true)
      setWaitingMbwayPush(false)
      setMbwayTimer(240)
    } finally {
      setSubmittingOrder(false)
    }
  }

  // 2. Checkout para Pagar no Caixa / Balcão (Dinheiro ou Cartão Físico)
  const handleCheckoutAtCounter = async () => {
    if (cart.length === 0) return
    if (!validateCustomerFields()) return

    const finalName = customerName.trim() || (isTable ? `Cliente ${tableLabel}` : 'Cliente Balcão')
    setSubmittingOrder(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant?.id || 'tenant-torres-novas',
          items: cart,
          customerName: finalName,
          customerPhone: customerPhone || undefined,
          nif: customerNif || undefined,
          isTableOrder: isTable,
          tableNumber: tableLabel,
          paymentMethod: 'COUNTER_CASH_OR_CARD',
          paymentStatus: 'PENDING',
          status: 'WAITING_PAYMENT',
          source: 'QRCODE',
        }),
      })

      const data = await res.json()
      const orderObj = {
        id: data.id || data.order?.id || `ord-${Date.now()}`,
        orderNumber: data.orderNumber || data.order?.orderNumber || Math.floor(100 + Math.random() * 900).toString(),
        store: tenant?.name || 'Açaí da Rose',
        tableLabel,
        total: cartTotal,
        customerName: finalName,
        paymentStatus: 'WAITING_PAYMENT',
        isTable,
      }

      setOrderSuccess(orderObj)
      setCartOpen(false)
      setCart([])
      toast.success(`Comanda #${orderObj.orderNumber} gerada! Dirija-se ao caixa para efetuar o pagamento.`)
    } catch {
      const orderObj = {
        id: `ord-demo-${Date.now()}`,
        orderNumber: Math.floor(100 + Math.random() * 900).toString(),
        store: tenant?.name || 'Açaí da Rose',
        tableLabel,
        total: cartTotal,
        customerName: finalName,
        paymentStatus: 'WAITING_PAYMENT',
        isTable,
      }
      setOrderSuccess(orderObj)
      setCartOpen(false)
      setCart([])
    } finally {
      setSubmittingOrder(false)
    }
  }

  // 3. Disparo do Push MB WAY via Ifthenpay
  const handleTriggerIfthenpayMbway = async () => {
    const cleanPhone = mbwayPhoneInput.replace(/\D/g, '')
    if (cleanPhone.length < 9) {
      toast.error('Insira um número de telemóvel português válido com 9 dígitos.')
      return
    }

    setProcessingPayment(true)
    try {
      const res = await fetch('/api/payments/ifthenpay/mbway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: pendingOrder?.id,
          amount: pendingOrder?.total,
          mobileNumber: cleanPhone,
          customerName: pendingOrder?.customerName,
          tableLabel: pendingOrder?.tableLabel,
          tenantId: tenant?.id,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setWaitingMbwayPush(true)
        setMbwayTimer(240)
        toast.success('Notificação MB WAY enviada! Abra o seu telemóvel para aprovar.')
      } else {
        toast.error(data.message || 'Erro ao comunicar com o MB WAY')
      }
    } catch {
      setWaitingMbwayPush(true)
      setMbwayTimer(240)
    } finally {
      setProcessingPayment(false)
    }
  }

  // 4. Confirmação do Pagamento MB WAY
  const handleConfirmPaymentSuccess = async () => {
    if (!pendingOrder) return
    setProcessingPayment(true)

    try {
      if (pendingOrder.id && !pendingOrder.id.startsWith('ord-demo-')) {
        await fetch(`/api/orders/${pendingOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentStatus: 'PAID',
            paymentMethod: 'MBWAY',
            status: 'NEW',
          }),
        })
      }

      setOrderSuccess({
        ...pendingOrder,
        paymentStatus: 'PAID',
      })
      setPaymentModalOpen(false)
      setWaitingMbwayPush(false)
      setPendingOrder(null)
      setCart([])
      toast.success('Pagamento MB WAY confirmado! Pedido enviado para a copa de montagem.')
    } catch {
      setOrderSuccess({
        ...pendingOrder,
        paymentStatus: 'PAID',
      })
      setPaymentModalOpen(false)
      setWaitingMbwayPush(false)
      setPendingOrder(null)
      setCart([])
    } finally {
      setProcessingPayment(false)
    }
  }

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
      {/* Header Superior da Loja */}
      <CustomerMenuHeader
        tenant={tenant}
        isTable={isTable}
        tableLabel={tableLabel}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* Conteúdo Dinâmico */}
      {loading ? (
        <div className="py-24 text-center text-xs text-purple-300/60">
          A carregar o cardápio oficial...
        </div>
      ) : (
        <>
          {activeTab === 'menu' && (
            <CustomerMenuHome
              catalog={catalog}
              tenantId={tenant?.id || 'tenant-torres-novas'}
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

      {/* Modal de Chamada de Garçom / Mesa */}
      <CallWaiterModal
        open={waiterModalOpen}
        onOpenChange={setWaiterModalOpen}
        tableLabel={tableLabel}
        tenantId={tenant?.id || 'tenant-torres-novas'}
      />

      {/* Barra Inferior Fixa de Navegação */}
      <CustomerBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setCartOpen(true)}
        isTable={isTable}
        onCallWaiter={() => setWaiterModalOpen(true)}
      />

      {/* Modal de Detalhes do Produto */}
      {selectedContainer && (
        <CustomerProductDetail
          container={selectedContainer}
          catalog={catalog}
          tenantId={tenant?.id || 'tenant-torres-novas'}
          onClose={() => setSelectedContainer(null)}
          onAddToCart={handleAddToCart}
          viewOnly={qrConfig?.mode === 'VIEW_ONLY'}
        />
      )}

      {/* Modal do Carrinho & Checkout Pay-First */}
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

          {/* Itens do Carrinho */}
          <div className="divide-y divide-white/10 my-2 max-h-48 overflow-y-auto pr-1">
            {cart.map((item, idx) => (
              <div key={item.id || idx} className="py-2.5 flex justify-between items-start gap-2 text-xs">
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
                    className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center text-xs">
            <span className="font-bold text-purple-200">Total do seu Pedido:</span>
            <span className="text-base font-black text-fuchsia-300 font-mono">
              {formatCurrency(cartTotal)}
            </span>
          </div>

          {/* Banner Pay-First Informativo */}
          <div className="p-2.5 rounded-2xl bg-purple-900/30 border border-purple-500/25 text-[11px] text-purple-200 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>⚡</span>
              <span>Pagamento Obrigatório Antes do Preparo</span>
            </div>
            <p className="text-purple-300/80 text-[10.5px] leading-tight">
              Pague com <strong>MB WAY</strong> direto no telemóvel para envio imediato à cozinha, ou gere a comanda para pagar no <strong>caixa (Dinheiro / Cartão)</strong>.
            </p>
          </div>

          {/* Formulário de Identificação do Cliente */}
          <div className="space-y-2.5 pt-1">
            {/* Nome do Cliente */}
            {qrConfig?.customerNameRule !== 'NONE' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-purple-200">
                    Seu Nome: {qrConfig?.customerNameRule === 'REQUIRED' && <span className="text-pink-400 font-black">* (Obrigatório)</span>}
                  </Label>
                  <span className="text-[10px] text-purple-300/60">Para entrega à mesa/balcão</span>
                </div>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ex: Henrique Silva"
                  required={qrConfig?.customerNameRule === 'REQUIRED'}
                  className="h-9 text-xs bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl"
                />
              </div>
            )}

            {/* Telemóvel */}
            {qrConfig?.customerPhoneRule !== 'NONE' && (
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-200">
                  Telemóvel (MB WAY / 9 dígitos): {qrConfig?.customerPhoneRule === 'REQUIRED' && <span className="text-pink-400 font-black">* (Obrigatório)</span>}
                </Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="ex: 911 050 264"
                  required={qrConfig?.customerPhoneRule === 'REQUIRED'}
                  className="h-9 text-xs bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl"
                />
              </div>
            )}

            {/* NIF na Fatura */}
            {qrConfig?.customerNifRule !== 'NONE' && (
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-200">
                  NIF na Fatura: {qrConfig?.customerNifRule === 'REQUIRED' ? <span className="text-pink-400 font-black">* (Obrigatório)</span> : <span className="text-purple-300/60 font-normal">(Opcional)</span>}
                </Label>
                <Input
                  value={customerNif}
                  onChange={(e) => setCustomerNif(e.target.value)}
                  placeholder="ex: 509123456"
                  required={qrConfig?.customerNifRule === 'REQUIRED'}
                  className="h-9 text-xs bg-white/10 border-white/15 text-white placeholder:text-purple-300/40 rounded-xl"
                />
              </div>
            )}

            {/* 2 Botões de Ação Pay-First */}
            <div className="pt-2 space-y-2">
              {qrConfig?.allowMbwayPayment !== false && (
                <Button
                  type="button"
                  onClick={handleCheckoutMBWay}
                  disabled={submittingOrder || cart.length === 0}
                  className="w-full h-11 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>{submittingOrder ? 'A processar...' : `Pagar ${formatCurrency(cartTotal)} via MB WAY →`}</span>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={handleCheckoutAtCounter}
                disabled={submittingOrder || cart.length === 0}
                className="w-full h-10 border-purple-400/40 hover:bg-white/10 text-purple-100 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2"
              >
                <Banknote className="h-3.5 w-3.5 text-emerald-400" />
                <CreditCard className="h-3.5 w-3.5 text-pink-400" />
                <span>Pagar no Balcão / Caixa (Dinheiro ou Cartão)</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento MB WAY Ifthenpay */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md p-6 bg-[#160228] text-white border border-white/20 rounded-3xl">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🟣</span>
              <DialogTitle className="text-base font-black text-white">
                MB WAY Instantâneo (Ifthenpay)
              </DialogTitle>
            </div>
            <p className="text-xs text-purple-200/70">
              {pendingOrder?.tableLabel} · Cliente: <strong className="text-white">{pendingOrder?.customerName}</strong>
            </p>
          </DialogHeader>

          {/* Detalhe do Valor */}
          <div className="p-4 rounded-2xl bg-fuchsia-950/60 border border-fuchsia-500/40 text-center space-y-1 my-2">
            <div className="text-[11px] text-fuchsia-300 font-bold uppercase tracking-wider">
              Total a Pagar
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {formatCurrency(pendingOrder?.total || 0)}
            </div>
            <div className="text-[10px] text-purple-300/70">
              Gateway Oficial Ifthenpay Portugal
            </div>
          </div>

          {!waitingMbwayPush ? (
            <div className="space-y-3 my-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-200">
                  Número de Telemóvel associado ao MB WAY:
                </Label>
                <Input
                  value={mbwayPhoneInput}
                  onChange={(e) => setMbwayPhoneInput(e.target.value)}
                  placeholder="ex: 911 050 264"
                  maxLength={12}
                  className="h-11 text-sm font-mono text-center font-bold bg-white/10 border-fuchsia-500/40 text-white rounded-xl"
                />
              </div>

              <Button
                onClick={handleTriggerIfthenpayMbway}
                disabled={processingPayment}
                className="w-full h-11 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black text-xs rounded-2xl cursor-pointer"
              >
                {processingPayment ? 'A enviar notificação...' : 'Enviar Notificação ao Telemóvel →'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-center my-3">
              <div className="p-4 rounded-2xl bg-purple-900/40 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-center gap-2 text-fuchsia-400 font-bold text-xs animate-pulse">
                  <Clock className="h-4 w-4" />
                  <span>Aguardando autorização no seu MB WAY ({mbwayTimer}s)...</span>
                </div>
                <p className="text-xs text-purple-200/80">
                  Abra a app <strong>MB WAY</strong> no telemóvel <strong>{mbwayPhoneInput}</strong> e aprove o pagamento de {formatCurrency(pendingOrder?.total || 0)}.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleConfirmPaymentSuccess}
                  disabled={processingPayment}
                  className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{processingPayment ? 'A validar...' : '✓ Já aprovei no telemóvel / Confirmar'}</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setWaitingMbwayPush(false)}
                  className="text-xs text-purple-300/70 hover:text-white underline cursor-pointer"
                >
                  Alterar número de telemóvel
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Pedido Gerado (Pago ou a Pagar no Caixa) */}
      <Dialog open={Boolean(orderSuccess)} onOpenChange={() => setOrderSuccess(null)}>
        <DialogContent className="max-w-sm p-6 bg-[#160228] text-white border border-white/20 rounded-3xl text-center">
          <div className="space-y-3">
            <span className="text-4xl">{orderSuccess?.paymentStatus === 'PAID' ? '🎉' : '⏳'}</span>
            <DialogTitle className="text-lg font-black text-white">
              {orderSuccess?.paymentStatus === 'PAID' ? 'Pagamento Confirmado!' : 'Comanda Registada!'}
            </DialogTitle>
            
            {orderSuccess?.paymentStatus === 'PAID' ? (
              <p className="text-xs text-purple-200/80">
                O açaí do(a) <strong>{orderSuccess?.customerName}</strong> foi <strong>liberado para montagem</strong> na copa para a <strong>{orderSuccess?.tableLabel}</strong>.
              </p>
            ) : (
              <p className="text-xs text-amber-200/90 font-medium">
                Comanda gerada para <strong>{orderSuccess?.customerName}</strong> ({orderSuccess?.tableLabel}). Por favor, dirija-se ao <strong>caixa/balcão</strong> para efetuar o pagamento e liberar o preparo!
              </p>
            )}

            <div className={`p-4 rounded-2xl border text-center ${
              orderSuccess?.paymentStatus === 'PAID'
                ? 'bg-emerald-950/40 border-emerald-500/30'
                : 'bg-amber-950/40 border-amber-500/30'
            }`}>
              <div className={`text-[10px] uppercase font-black tracking-wider flex items-center justify-center gap-1 ${
                orderSuccess?.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {orderSuccess?.paymentStatus === 'PAID' ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>PAGO VIA MB WAY & EM PREPARAÇÃO</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    <span>AGUARDANDO PAGAMENTO NO CAIXA</span>
                  </>
                )}
              </div>
              <div className="text-3xl font-black text-fuchsia-300 font-mono mt-1">
                Ticket #{orderSuccess?.orderNumber}
              </div>
              <div className="text-xs font-bold text-white mt-1">
                Total: {formatCurrency(orderSuccess?.total || 0)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-purple-200/70 italic">
              {orderSuccess?.paymentStatus === 'PAID'
                ? '"O atendente levará o seu pedido diretamente à mesa chamando pelo seu nome."'
                : '"Apresente o número do seu Ticket no caixa para validar o pagamento em Dinheiro ou Cartão."'}
            </div>
          </div>

          <DialogFooter className="mt-3">
            <Button
              onClick={() => setOrderSuccess(null)}
              className="w-full bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-black text-xs rounded-xl cursor-pointer"
            >
              Concluir
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
