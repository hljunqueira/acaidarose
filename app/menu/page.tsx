'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CatalogData, ProductContainer, Tenant } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Sub-componentes
import CustomerBottomNav, { CustomerTabId } from '@/components/menu/CustomerBottomNav'
import CustomerMenuHeader from '@/components/menu/CustomerMenuHeader'
import CustomerMenuHome from '@/components/menu/CustomerMenuHome'
import CustomerMenuSearch from '@/components/menu/CustomerMenuSearch'
import CustomerMenuMore from '@/components/menu/CustomerMenuMore'
import CustomerProductDetail from '@/components/menu/CustomerProductDetail'
import CustomerCartSheet from '@/components/menu/CustomerCartSheet'
import CallWaiterModal from '@/components/menu/CallWaiterModal'
import SwitchTableModal from '@/components/menu/SwitchTableModal'
import { Info } from 'lucide-react'
import { useCustomerTheme } from '@/lib/hooks/useIsolatedTheme'
import { subscribeCatalogSync } from '@/lib/utils/catalogSync'

function MenuContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isDark: isCustomerDark } = useCustomerTheme()
  const rawLoja = searchParams.get('loja') || searchParams.get('tenantId') || searchParams.get('tenant') || '1'
  const paramNumero = searchParams.get('numero') || searchParams.get('mesa') || searchParams.get('table') || ''
  const paramToken = searchParams.get('token') || searchParams.get('hash') || searchParams.get('t') || ''

  // Sincronização explícita do tema escuro no documento HTML (para que Portais e Modais herdem o tema)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isCustomerDark) {
        document.documentElement.classList.add('dark')
        document.body.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
        document.body.classList.remove('dark')
      }
    }
  }, [isCustomerDark])

  // Estado dinâmico da mesa e da loja ativa
  const [activeLoja, setActiveLoja] = useState(rawLoja)
  const [currentTableNum, setCurrentTableNum] = useState(paramNumero)

  // Sincroniza se o searchParam inicial de loja mudar
  useEffect(() => {
    if (rawLoja) setActiveLoja(rawLoja)
  }, [rawLoja])

  // Resolução de Mesa e Filial via Token / Hash Criptográfico
  useEffect(() => {
    if (paramToken) {
      fetch(`/api/tables/token/${encodeURIComponent(paramToken)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.table) {
            if (data.table.number) {
              const tableNumStr = String(data.table.number).padStart(2, '0')
              setCurrentTableNum(tableNumStr)
            }
            if (data.table.storeSlug || data.table.tenantId) {
              setActiveLoja(data.table.storeSlug || data.table.tenantId)
            }
          }
        })
        .catch(() => {})
    }
  }, [paramToken])

  // Configurações do QR Code da loja
  const [qrConfig, setQrConfig] = useState<any>({ mode: 'ORDER_EMISSION', allowTableTransfer: true })

  // Se o cliente acessou diretamente sem mesa/número ou se o modo da loja for VIEW_ONLY, abre em modo Catálogo Vitrine (Read-Only)
  const isTable = Boolean(currentTableNum)
  const isCatalogOnly = !isTable || qrConfig.mode === 'VIEW_ONLY'

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [catalog, setCatalog] = useState<CatalogData>({ containers: [], bases: [], toppings: [] })
  const [loading, setLoading] = useState(true)

  // Navegação de Abas
  const [activeTab, setActiveTab] = useState<CustomerTabId>('menu')

  // Produto Selecionado para Detalhe / Customizador
  const [selectedContainer, setSelectedContainer] = useState<ProductContainer | null>(null)
  const [infoModalProduct, setInfoModalProduct] = useState<ProductContainer | null>(null)

  // Carrinho do Cliente & Modais
  const [cart, setCart] = useState<any[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [waiterModalOpen, setWaiterModalOpen] = useState(false)
  const [switchTableModalOpen, setSwitchTableModalOpen] = useState(false)

  const tableLabel = isTable ? `Mesa ${currentTableNum}` : 'Catálogo Digital'
  const cartTotal = cart.reduce((acc, item) => acc + (Number(item.lineTotal) || 0), 0)

  // Sincroniza se o searchParam inicial de número mudar
  useEffect(() => {
    if (paramNumero) setCurrentTableNum(paramNumero)
  }, [paramNumero])

  const loadCatalog = () => {
    fetch(`/api/products?loja=${encodeURIComponent(activeLoja)}`)
      .then((r) => r.json())
      .then((data) => {
        setCatalog(data)
        const storeName = data.tenantName || (activeLoja === '2' || activeLoja.includes('torres') ? 'Loja 2 - Torres Novas' : 'Loja 1 - Aveiro')
        setTenant({
          id: data.tenantId || '11111111-1111-1111-1111-111111111111',
          name: storeName,
          slug: data.tenantId?.startsWith('11111111') ? 'aveiro' : 'torres-novas',
          nif: '500123456',
          currency: 'EUR',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      })
      .catch(() => {
        toast.error('Erro ao carregar o cardápio da loja')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Carregar dados da loja e configurações de QR Code com escuta em tempo real
  useEffect(() => {
    setLoading(true)
    loadCatalog()

    // 2. Configurações de QR Code da Unidade
    fetch(`/api/qrcode-config?loja=${encodeURIComponent(activeLoja)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          setQrConfig(data.config)
        }
      })
      .catch(() => {})

    const unsubscribe = subscribeCatalogSync(() => {
      loadCatalog()
    })
    return () => unsubscribe()
  }, [activeLoja])

  const handleSelectContainer = (container: ProductContainer, showInfoOnly = false) => {
    if (showInfoOnly) {
      setInfoModalProduct(container)
    } else {
      setSelectedContainer(container)
    }
  }

  const handleTableSwitched = (newTableNumber: string) => {
    setCurrentTableNum(newTableNumber)
    const url = new URL(window.location.href)
    url.searchParams.set('numero', newTableNumber)
    router.replace(url.pathname + url.search)
  }

  return (
    <div className={`min-h-dvh flex flex-col selection:bg-pink-500 selection:text-white transition-colors duration-200 overflow-x-hidden max-w-full ${isCustomerDark ? 'dark bg-[#0E0117] text-white' : 'bg-[#f8f5fc] text-slate-900'}`}>
      {/* 1. Header do Cardápio com Troca de Mesa */}
      <CustomerMenuHeader
        tenant={tenant}
        isTable={isTable}
        tableLabel={tableLabel}
        cartCount={cart.length}
        onOpenCart={() => setCartOpen(true)}
        allowTableTransfer={qrConfig.allowTableTransfer !== false}
        onOpenSwitchTable={() => setSwitchTableModalOpen(true)}
      />

      {/* Aviso de Modo Catálogo Vitrine (quando acessado diretamente sem QR Code de mesa) */}
      {isCatalogOnly && (
        <div className="bg-purple-100 text-purple-950 dark:bg-purple-950/80 dark:text-purple-200 border-b border-purple-200 dark:border-purple-800/40 px-4 py-2.5 text-center text-xs flex items-center justify-center gap-2">
          <Info className="h-4 w-4 text-pink-500 shrink-0" />
          <span>
            <strong>Modo Catálogo Digital:</strong> Para fazer pedidos e pagamentos na mesa, faça a leitura do QR Code da sua mesa física.
          </span>
        </div>
      )}

      {/* 2. Conteúdo Principal por Aba */}
      <main className="flex-1 w-full max-w-full pb-20">
        {activeTab === 'menu' && (
          <CustomerMenuHome
            catalog={catalog}
            tenantId={tenant?.id}
            onSelectContainer={handleSelectContainer}
            isTable={isTable}
            isCatalogOnly={isCatalogOnly}
          />
        )}
        {activeTab === 'search' && (
          <CustomerMenuSearch
            catalog={catalog}
            onSelectContainer={handleSelectContainer}
          />
        )}
        {activeTab === 'more' && (
          <CustomerMenuMore
            tenant={tenant}
          />
        )}
      </main>

      {/* 3. Navegação Inferior Fixa */}
      <CustomerBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        cartCount={cart.length}
        cartTotal={cartTotal}
        onOpenCart={() => setCartOpen(true)}
        isTable={isTable}
        onCallWaiter={() => setWaiterModalOpen(true)}
      />

      {/* 4. Modal Customizador de Taça (Apenas em Modo Pedido) */}
      {!isCatalogOnly && selectedContainer && (
        <CustomerProductDetail
          container={selectedContainer}
          catalog={catalog}
          onClose={() => setSelectedContainer(null)}
          onAddToCart={(item) => {
            setCart((prev) => [...prev, item])
            setSelectedContainer(null)
            toast.success(`${item.containerName} adicionado ao pedido!`)
          }}
        />
      )}

      {/* 5. Modal Informativo de Detalhes (Em Modo Catálogo Vitrine) */}
      {infoModalProduct && (
        <Dialog open={Boolean(infoModalProduct)} onOpenChange={() => setInfoModalProduct(null)}>
          <DialogContent className={`border rounded-3xl max-w-md p-6 shadow-2xl transition-colors duration-200 ${isCustomerDark ? 'dark bg-[#18022B] text-white border-white/15' : 'bg-white text-slate-900 border-purple-100'}`}>
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">
                {infoModalProduct.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-xs text-slate-600 dark:text-purple-200">
              <p className="leading-relaxed font-medium">
                {infoModalProduct.description || 'Delicioso açaí artesanal preparado na hora com os melhores ingredientes selecionados.'}
              </p>
              <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 dark:bg-white/5 dark:border-white/10 flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">Preço Base:</span>
                <span className="text-base font-black text-fuchsia-600 dark:text-pink-400 font-mono">
                  {formatCurrency(infoModalProduct.precoBase)}
                </span>
              </div>
              <div className="text-[11px] font-medium text-purple-900 bg-purple-100 p-3 rounded-xl border border-purple-200 dark:text-purple-300/80 dark:bg-purple-900/30 dark:border-purple-500/20">
                Disponível para consumo no salão e take-away na unidade {tenant?.name || 'Açaí da Rose'}.
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                onClick={() => setInfoModalProduct(null)}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold cursor-pointer h-10"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 6. Gaveta / Modal do Carrinho e Pedido */}
      <CustomerCartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={(index, newQty) => {
          setCart((prev) => {
            const next = [...prev]
            if (next[index]) {
              next[index] = {
                ...next[index],
                quantity: newQty,
                lineTotal: +(next[index].unitPrice * newQty).toFixed(2),
              }
            }
            return next
          })
        }}
        onRemoveItem={(index) => {
          setCart((prev) => prev.filter((_, i) => i !== index))
          toast.info('Item removido do pedido')
        }}
        onClearCart={() => setCart([])}
        tenantId={tenant?.id}
        tenantName={tenant?.name}
        isTable={isTable}
        tableNumber={currentTableNum}
        qrConfig={qrConfig}
      />

      {/* 7. Modal Chamada de Garçom */}
      {isTable && (
        <CallWaiterModal
          open={waiterModalOpen}
          onOpenChange={setWaiterModalOpen}
          tableLabel={tableLabel}
          tenantId={tenant?.id || ''}
        />
      )}

      {/* 8. Modal Simples de Troca de Mesa */}
      {isTable && (
        <SwitchTableModal
          open={switchTableModalOpen}
          onOpenChange={setSwitchTableModalOpen}
          currentTableNumber={currentTableNum}
          tenantId={tenant?.id || '11111111-1111-1111-1111-111111111111'}
          onTableSwitched={handleTableSwitched}
        />
      )}
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0E0117] flex items-center justify-center text-white">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-pink-500" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  )
}
