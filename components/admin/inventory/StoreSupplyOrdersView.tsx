'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Send,
  CheckCircle2,
  RefreshCw,
  PackageCheck,
  Clock,
  Edit2,
  Truck,
  Building2,
  Store,
  Boxes,
  ClipboardList,
  Trash2,
  Factory,
  BarChart3,
  PlusCircle,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  FileText,
  DollarSign,
  Eye,
  LayoutGrid,
  List,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { formatCurrency } from '@/lib/i18n/formatters'
import {
  MasterInventoryItem,
  SupplyOrderRow,
  SupplierRow,
  SupplierPurchaseRow,
} from '@/lib/repositories/inventoryRepository'
import InventoryItemDialog, { InventoryItemFormData } from './InventoryItemDialog'

export default function StoreSupplyOrdersView({
  tenantId = '11111111-1111-1111-1111-111111111111',
}: {
  tenantId?: string
}) {
  const { user, authFetch } = useAuthStore()
  const [catalog, setCatalog] = useState<MasterInventoryItem[]>([])
  const [orders, setOrders] = useState<SupplyOrderRow[]>([])
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [purchases, setPurchases] = useState<SupplierPurchaseRow[]>([])
  const [metrics, setMetrics] = useState<{
    totalPurchasedCost: number
    totalSoldRevenue: number
    grossMargin: number
    grossMarginPercent: number
    storeUsage: any[]
  } | null>(null)

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Contexto Sede / Central da Matriz sempre ativo nesta tela
  const isMasterAdmin = true
  const [supplyMode, setSupplyMode] = useState<'distributor' | 'store_order'>('distributor')
  const isMatriz = supplyMode === 'distributor'
  const [activeTab, setActiveTab] = useState<'orders' | 'purchases' | 'catalog' | 'report'>('catalog')

  // Modal de Confirmação e Envio do Pedido de Reposição (Franquia)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')

  // Modal de Recusa de Pedido com Motivo (Matriz)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingOrder, setRejectingOrder] = useState<SupplyOrderRow | null>(null)
  const [rejectionReasonText, setRejectionReasonText] = useState('')
  const [rejecting, setRejecting] = useState(false)

  // Modal de Exclusão de Pedido com Estorno de Reserva (Matriz)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<SupplyOrderRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Modo de Exibição dos Pedidos (Cards vs Tabela/Lista) e Modal de Detalhes
  const [orderViewMode, setOrderViewMode] = useState<'cards' | 'table'>('cards')
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<SupplyOrderRow | null>(null)

  // Modal de Exclusão de Insumo Mestre (Matriz)
  const [deleteItemModalOpen, setDeleteItemModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<MasterInventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  // Modal de Compra com Fornecedor (Criar / Editar / Excluir)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null)
  const [deletePurchaseModalOpen, setDeletePurchaseModalOpen] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<SupplierPurchaseRow | null>(null)
  const [deletingPurchase, setDeletingPurchase] = useState(false)

  const [purchaseSupplierId, setPurchaseSupplierId] = useState('')
  const [purchaseItemId, setPurchaseItemId] = useState('')
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(10)
  const [purchaseCostUnitPrice, setPurchaseCostUnitPrice] = useState<number>(0)
  const [purchaseInvoice, setPurchaseInvoice] = useState('')
  const [purchaseBatch, setPurchaseBatch] = useState('')
  const [purchaseExpiration, setPurchaseExpiration] = useState('')
  const [purchaseNotes, setPurchaseNotes] = useState('')
  const [savingPurchase, setSavingPurchase] = useState(false)

  // Diálogo de Edição Mestre / Preços
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItemFormData | null>(null)


  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Carrega catálogo mestre oficial
      const resCat = await authFetch('/api/inventory?scope=master')
      if (resCat.ok) {
        const data = await resCat.json()
        if (Array.isArray(data.items)) {
          setCatalog(data.items)
        }
      }

      // 2. Carrega pedidos B2B: se Matriz Aveiro carrega todos os pedidos da rede; se franquia carrega apenas daquela loja
      const ordersUrl = isMatriz ? '/api/supply-orders' : `/api/supply-orders?tenantId=${tenantId}`
      const resOrders = await authFetch(ordersUrl)
      if (resOrders.ok) {
        const data = await resOrders.json()
        if (Array.isArray(data.orders)) {
          setOrders(data.orders)
        }
      }

      // 3. Se for Matriz, carrega dados de compras com fornecedores e DRE
      if (isMatriz) {
        const [resSuppliers, resPurchases, resMetrics] = await Promise.all([
          authFetch('/api/suppliers'),
          authFetch('/api/supply-purchases'),
          authFetch('/api/supply-chain/metrics'),
        ])

        if (resSuppliers.ok) {
          const d = await resSuppliers.json()
          if (Array.isArray(d.suppliers)) setSuppliers(d.suppliers)
        }
        if (resPurchases.ok) {
          const d = await resPurchases.json()
          if (Array.isArray(d.purchases)) setPurchases(d.purchases)
        }
        if (resMetrics.ok) {
          const d = await resMetrics.json()
          if (d.metrics) setMetrics(d.metrics)
        }
      }
    } catch {
      toast.error('Erro ao carregar dados de suprimentos')
    } finally {
      setLoading(false)
    }
  }, [tenantId, isMatriz, authFetch])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Lista dos itens selecionados pela franquia
  const selectedItemsList = catalog
    .filter((it) => (quantities[it.id] || 0) > 0)
    .map((it) => {
      const qty = quantities[it.id] || 0
      const available = it.centralStock || 0
      const isPreorder = available <= 0
      return {
        itemId: it.id,
        name: it.name,
        unit: it.unit,
        supplyCode: it.supplyCode,
        quantity: qty,
        unitPrice: it.supplyPrice,
        marketPrice: it.marketPrice,
        total: qty * it.supplyPrice,
        savings: qty * (it.marketPrice - it.supplyPrice),
        centralStock: available,
        isPreorder,
      }
    })

  const totalItemsCount = selectedItemsList.reduce((acc, it) => acc + it.quantity, 0)
  const totalHQ = selectedItemsList.reduce((acc, it) => acc + it.total, 0)
  const totalMarket = selectedItemsList.reduce((acc, it) => acc + it.quantity * it.marketPrice, 0)
  const totalSavings = totalMarket - totalHQ
  const hasPreorderItems = selectedItemsList.some((it) => it.isPreorder)

  // Envio oficial do pedido da franquia para a matriz
  const handleConfirmSendOrder = async () => {
    if (selectedItemsList.length === 0) return

    setSubmitting(true)
    try {
      const res = await authFetch('/api/supply-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          items: selectedItemsList,
          totalAmount: totalHQ,
          totalSavings,
          notes: orderNotes.trim() || undefined,
        }),
      })

      if (!res.ok) throw new Error('Falha ao registrar pedido de suprimentos')
      toast.success('Pedido de reposição enviado para a Central de Distribuição (Figueira da Foz)!')
      setQuantities({})
      setOrderNotes('')
      setConfirmModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar pedido')
    } finally {
      setSubmitting(false)
    }
  }

  // Ação da Matriz: Atualizar status do pedido (Despachar para SHIPPED ou Concluir)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'SHIPPED' | 'DELIVERED') => {
    try {
      const res = await authFetch(`/api/supply-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar status')
      toast.success(newStatus === 'SHIPPED' ? 'Carga despachada em transporte!' : 'Pedido concluído!')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar status do pedido')
    }
  }

  // Ação da Matriz: Recusar pedido com motivo registrado no histórico
  const handleConfirmRejectOrder = async () => {
    if (!rejectingOrder || !rejectionReasonText.trim()) {
      toast.error('Informe o motivo da recusa')
      return
    }
    setRejecting(true)
    try {
      const res = await authFetch(`/api/supply-orders/${rejectingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: rejectionReasonText.trim(),
        }),
      })
      if (!res.ok) throw new Error('Falha ao recusar pedido')
      toast.success(`Pedido #${rejectingOrder.orderNumber} recusado. Motivo registrado no histórico!`)
      setRejectModalOpen(false)
      setRejectingOrder(null)
      setRejectionReasonText('')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao recusar pedido')
    } finally {
      setRejecting(false)
    }
  }

  // Ação da Franquia: Confirmar recebimento de carga na filial (abastece estoque físico)
  const handleConfirmReceive = async (orderId: string, orderNumber: number) => {
    try {
      const res = await authFetch(`/api/supply-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DELIVERED',
          tenantId,
        }),
      })
      if (!res.ok) throw new Error('Falha ao confirmar recebimento')
      toast.success(`Carga do Pedido #${orderNumber} confirmada! Saldo creditado no estoque local.`)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao confirmar recebimento')
    }
  }

  // Ação da Matriz: Excluir pedido indesejado com estorno de reservas
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return
    setDeleting(true)
    try {
      const res = await authFetch(`/api/supply-orders/${orderToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir pedido')
      toast.success(`Pedido #${orderToDelete.orderNumber} excluído! Reservas devolvidas ao armazém central.`)
      setDeleteModalOpen(false)
      setOrderToDelete(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir pedido')
    } finally {
      setDeleting(false)
    }
  }

  // Ação da Matriz: Excluir insumo mestre da rede
  const handleDeleteMasterItem = async (itemId: string) => {
    setDeletingItem(true)
    try {
      const res = await authFetch(`/api/inventory/${itemId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir insumo mestre')
      toast.success('Insumo removido da central e do cardápio corporativo com sucesso!')
      setDeleteItemModalOpen(false)
      setItemToDelete(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir insumo mestre')
    } finally {
      setDeletingItem(false)
    }
  }

  // Ação da Matriz: Abrir modal de nova compra
  const handleOpenNewPurchase = () => {
    setEditingPurchaseId(null)
    if (suppliers.length > 0) setPurchaseSupplierId(suppliers[0].id)
    if (catalog.length > 0) {
      setPurchaseItemId(catalog[0].id)
      setPurchaseCostUnitPrice(catalog[0].lastCostPrice || 0)
    }
    setPurchaseQuantity(10)
    setPurchaseInvoice('')
    setPurchaseBatch('')
    setPurchaseExpiration('')
    setPurchaseNotes('')
    setPurchaseModalOpen(true)
  }

  // Ação da Matriz: Abrir modal para editar compra existente
  const handleEditPurchase = (p: SupplierPurchaseRow) => {
    setEditingPurchaseId(p.id)
    setPurchaseSupplierId(p.supplierId)
    setPurchaseItemId(p.itemId)
    setPurchaseQuantity(p.quantity)
    setPurchaseCostUnitPrice(p.costUnitPrice)
    setPurchaseInvoice(p.invoiceNumber || '')
    setPurchaseBatch(p.batchNumber || '')
    setPurchaseExpiration(p.expirationDate || '')
    setPurchaseNotes(p.notes || '')
    setPurchaseModalOpen(true)
  }

  // Ação da Matriz: Excluir compra com fornecedor e estornar saldo de Aveiro
  const handleDeletePurchase = async () => {
    if (!purchaseToDelete) return
    setDeletingPurchase(true)
    try {
      const res = await authFetch(`/api/supply-purchases/${purchaseToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir compra com fornecedor')
      toast.success('Registro de compra excluído e estoque central estornado com sucesso!')
      setDeletePurchaseModalOpen(false)
      setPurchaseToDelete(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir compra com fornecedor')
    } finally {
      setDeletingPurchase(false)
    }
  }

  // Ação da Matriz: Registrar ou Atualizar compra com fornecedor (CRUD)
  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchaseSupplierId || !purchaseItemId || purchaseQuantity <= 0 || purchaseCostUnitPrice <= 0) {
      toast.error('Preencha os campos obrigatórios da compra')
      return
    }
    setSavingPurchase(true)
    try {
      const isEditing = Boolean(editingPurchaseId)
      const url = isEditing ? `/api/supply-purchases/${editingPurchaseId}` : '/api/supply-purchases'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: purchaseSupplierId,
          itemId: purchaseItemId,
          quantity: purchaseQuantity,
          costUnitPrice: purchaseCostUnitPrice,
          invoiceNumber: purchaseInvoice.trim() || undefined,
          batchNumber: purchaseBatch.trim() || undefined,
          expirationDate: purchaseExpiration || undefined,
          notes: purchaseNotes.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error(`Falha ao ${isEditing ? 'atualizar' : 'registrar'} compra`)
      toast.success(
        isEditing
          ? 'Registro de compra atualizado com sucesso!'
          : 'Entrada de mercadoria registrada e estoque central abastecido com sucesso!'
      )
      setPurchaseModalOpen(false)
      setEditingPurchaseId(null)
      setPurchaseInvoice('')
      setPurchaseBatch('')
      setPurchaseExpiration('')
      setPurchaseNotes('')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar compra com fornecedor')
    } finally {
      setSavingPurchase(false)
    }
  }

  // Ação da Matriz: Atualizar status financeiro do pedido
  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: 'PENDING' | 'PAID' | 'INVOICED_30D') => {
    try {
      const res = await authFetch(`/api/supply-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar pagamento')
      toast.success('Status de pagamento atualizado!')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar pagamento')
    }
  }

  const handleSaveMasterItem = async (formData: InventoryItemFormData) => {
    try {
      if (formData.id) {
        const res = await authFetch(`/api/inventory/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Falha ao atualizar insumo')
        toast.success('Insumo e preços atualizados com sucesso!')
      } else {
        const res = await authFetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Falha ao cadastrar insumo')
        toast.success('Novo insumo homologado cadastrado na rede!')
      }
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar insumo')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 pb-24">
      {/* HEADER MINIMALISTA COM TÍTULO NA LINHA SUPERIOR */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
          Central de Suprimentos & Distribuição (Matriz)
        </h1>
        <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium">
          Catálogo corporativo homologado, armazém central e preços B2B com regime fiscal de Portugal (Preço Líquido + IVA)
        </p>
      </div>

      {/* BARRA DE NAVEGAÇÃO E AÇÕES EM LINHA ÚNICA (h-10) */}
      <div className="flex items-center justify-between gap-3 border-b border-purple-150 dark:border-white/10 pb-3 flex-wrap">
        {/* Abas da Central */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'catalog'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'bg-purple-50 dark:bg-white/5 text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-white/10 border border-purple-200/60 dark:border-white/10'
            }`}
          >
            <Boxes className="h-4 w-4" />
            <span>Catálogo B2B & Armazém</span>
            <span className="text-[10px] opacity-70">({catalog.length} insumos)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'orders'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'bg-purple-50 dark:bg-white/5 text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-white/10 border border-purple-200/60 dark:border-white/10'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Pedidos das Franquias</span>
            <Badge className="bg-white/20 text-white text-[10px] py-0 px-1.5 ml-1">
              {orders.filter((o) => o.status === 'PENDING').length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'purchases'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'bg-purple-50 dark:bg-white/5 text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-white/10 border border-purple-200/60 dark:border-white/10'
            }`}
          >
            <Factory className="h-4 w-4" />
            <span>Compras com Fornecedores</span>
            <span className="text-[10px] opacity-70">({purchases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'report'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'bg-purple-50 dark:bg-white/5 text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-white/10 border border-purple-200/60 dark:border-white/10'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>DRE & Margem da Rede</span>
          </button>
        </div>

        {/* Botões de Ação na mesma linha com h-10 padronizado */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'catalog' && (
            <Button
              onClick={() => {
                setEditingItem(null)
                setItemDialogOpen(true)
              }}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Novo Insumo</span>
            </Button>
          )}

          {activeTab === 'purchases' && (
            <Button
              onClick={handleOpenNewPurchase}
              className="h-10 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nova Compra</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={loadData}
            className="h-10 px-3.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white cursor-pointer shadow-2xs flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* ABA: Catálogo Mestre e Armazém Central B2B */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
                  Catálogo Mestre Homologado para a Rede
                </CardTitle>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium mt-0.5">
                  Tabela oficial B2B com cotações líquidas, taxas de IVA de Portugal (6%, 13%, 23%) e valor final de liquidação
                </p>
              </div>
              <span className="text-[11px] font-bold text-purple-700 dark:text-pink-400">
                Regime Fiscal PT (Preço Líquido + IVA)
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                    <tr>
                      <th className="py-3.5 px-4">Insumo Homologado</th>
                      <th className="py-3.5 px-4">Cód. SKU</th>
                      <th className="py-3.5 px-4">Embalagem</th>
                      <th className="py-3.5 px-4">Estoque Central</th>
                      <th className="py-3.5 px-4">Último Custo (s/ IVA)</th>
                      <th className="py-3.5 px-4">Preço B2B (s/ IVA)</th>
                      <th className="py-3.5 px-4">IVA (%)</th>
                      <th className="py-3.5 px-4">Total c/ IVA</th>
                      <th className="py-3.5 px-4">Margem Matriz</th>
                      <th className="py-3.5 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                    {catalog.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                          Nenhum insumo cadastrado na central de suprimentos.
                        </td>
                      </tr>
                    ) : (
                      catalog.map((item) => {
                        const taxRate = item.taxRate !== undefined ? Number(item.taxRate) : 23.00
                        const costNet = Number(item.lastCostPrice || 0)
                        const costTax = Number(((costNet * taxRate) / 100).toFixed(2))
                        const costGross = Number((costNet + costTax).toFixed(2))

                        const supplyNet = Number(item.supplyPrice || 0)
                        const supplyTax = Number(((supplyNet * taxRate) / 100).toFixed(2))
                        const supplyGross = Number((supplyNet + supplyTax).toFixed(2))

                        const netMargin = Math.max(0, supplyNet - costNet)
                        const marginPercent = supplyNet > 0 ? ((netMargin / supplyNet) * 100).toFixed(1) : '0.0'

                        return (
                          <tr key={item.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                            {/* Nome do Insumo */}
                            <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                              <div>{item.name}</div>
                              {item.category && (
                                <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70 font-semibold">
                                  {item.category}
                                </span>
                              )}
                            </td>

                            {/* Cód. SKU */}
                            <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-purple-900/70 dark:text-purple-300/70">
                              {item.supplyCode || '—'}
                            </td>

                            {/* Embalagem e Peso */}
                            <td className="py-3.5 px-4 text-purple-800 dark:text-purple-200">
                              <span className="font-bold">{item.unit}</span>
                              {item.netWeightKg && Number(item.netWeightKg) > 0 && (
                                <span className="block text-[11px] text-purple-600/80 dark:text-purple-400 font-mono">
                                  ({item.netWeightKg} kg)
                                </span>
                              )}
                            </td>

                            {/* Estoque Central */}
                            <td className="py-3.5 px-4 font-mono font-bold">
                              <span
                                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black ${
                                  (item.centralStock || 0) > 10
                                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : (item.centralStock || 0) > 0
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-300'
                                }`}
                              >
                                {item.centralStock || 0} {item.unit}
                              </span>
                            </td>

                            {/* Custo Fornecedor (s/ IVA e c/ IVA) */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-purple-950 dark:text-white text-xs">
                                {formatCurrency(costNet)}
                              </div>
                              <div className="text-[10px] text-purple-600/80 dark:text-purple-400 font-medium">
                                {formatCurrency(costGross)} c/ IVA
                              </div>
                            </td>

                            {/* Preço Venda B2B (s/ IVA) */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-black text-purple-950 dark:text-white text-sm">
                                {formatCurrency(supplyNet)}
                              </div>
                              {item.pricePerKg && Number(item.pricePerKg) > 0 && (
                                <div className="text-[10px] text-purple-600 dark:text-pink-400 font-bold">
                                  {formatCurrency(item.pricePerKg)} / kg
                                </div>
                              )}
                            </td>

                            {/* IVA (%) e Valor em Euros */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
                                  taxRate === 6
                                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : taxRate === 13
                                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300'
                                    : 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300'
                                }`}
                                title={`IVA de ${taxRate}% sobre ${formatCurrency(supplyNet)} = ${formatCurrency(supplyTax)}`}
                              >
                                +{taxRate}% ({formatCurrency(supplyTax)})
                              </span>
                            </td>

                            {/* Preço Final com IVA (Destaque Principal) */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-base font-black text-pink-600 dark:text-pink-400">
                                {formatCurrency(supplyGross)}
                              </div>
                              <div className="text-[10px] text-purple-600/70 dark:text-purple-400/70 font-semibold">
                                Total faturado
                              </div>
                            </td>

                            {/* Margem Líquida Matriz */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                +{formatCurrency(netMargin)}
                              </div>
                              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">
                                +{marginPercent}% margem
                              </div>
                            </td>

                            {/* Ações (Editar e Excluir) */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingItem({
                                      id: item.id,
                                      name: item.name,
                                      category: item.category,
                                      supplyCode: item.supplyCode,
                                      unit: item.unit,
                                      marketPrice: item.marketPrice,
                                      supplyPrice: item.supplyPrice,
                                      centralStock: item.centralStock,
                                      lastCostPrice: item.lastCostPrice,
                                      taxRate: item.taxRate !== undefined ? Number(item.taxRate) : 23,
                                      netWeightKg: item.netWeightKg !== undefined ? Number(item.netWeightKg) : undefined,
                                      pricePerKg: item.pricePerKg !== undefined ? Number(item.pricePerKg) : undefined,
                                      isCriticalChecklist: item.isCriticalChecklist,
                                    })
                                    setItemDialogOpen(true)
                                  }}
                                  className="h-8 w-8 p-0 text-purple-700 dark:text-pink-300 hover:bg-purple-100 dark:hover:bg-white/10 rounded-xl cursor-pointer"
                                  title="Editar Insumo, Taxas de IVA e Preços"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setItemToDelete(item)
                                    setDeleteItemModalOpen(true)
                                  }}
                                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl cursor-pointer"
                                  title="Excluir Insumo da Matriz"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CENÁRIO 2: Pedidos das Franquias (Visualização da Matriz Aveiro) */}
      {isMatriz && activeTab === 'orders' && (
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
                Pedidos de Reposição Recebidos das Franquias
              </CardTitle>
              <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
                Atendimento, separação e despacho de insumos para as lojas da rede
              </p>
            </div>

            {/* Alternador de Modo de Visualização: Cards vs Lista */}
            <div className="flex items-center gap-1.5 bg-purple-100/70 dark:bg-white/5 p-1 rounded-2xl border border-purple-200/60 dark:border-white/10 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setOrderViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  orderViewMode === 'cards'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-purple-900/70 dark:text-purple-300/70 hover:text-purple-950 dark:hover:text-white'
                }`}
                title="Visualização em Cards"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  orderViewMode === 'table'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-purple-900/70 dark:text-purple-300/70 hover:text-purple-950 dark:hover:text-white'
                }`}
                title="Visualização em Lista / Tabela"
              >
                <List className="h-3.5 w-3.5" />
                <span>Lista</span>
              </button>
            </div>
          </CardHeader>

          {/* MODO 1: CARDS */}
          {orderViewMode === 'cards' ? (
            <CardContent className="p-4 sm:p-5">
              {orders.length === 0 ? (
                <div className="py-12 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                  Nenhum pedido de suprimentos recebido no momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders.map((ord) => {
                    const hasPreorder = ord.items.some((it: any) => it.isPreorder)
                    const totalUnits = ord.items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0)
                    return (
                      <Card
                        key={ord.id}
                        className="rounded-3xl border border-purple-150 dark:border-white/10 bg-white dark:bg-[#19032d] shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                      >
                        <div className="p-4 sm:p-5 space-y-3.5">
                          {/* Cabeçalho do Card */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-purple-950 dark:text-white text-base">
                                  #{ord.orderNumber}
                                </span>
                                {ord.status === 'PENDING' && (
                                  <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 text-[10px] font-bold">
                                    Pendente
                                  </Badge>
                                )}
                                {ord.status === 'SHIPPED' && (
                                  <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border-blue-300 text-[10px] font-bold">
                                    Em Transporte
                                  </Badge>
                                )}
                                {ord.status === 'DELIVERED' && (
                                  <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300 text-[10px] font-bold">
                                    Entregue
                                  </Badge>
                                )}
                                {ord.status === 'REJECTED' && (
                                  <Badge className="bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200 border-red-300 text-[10px] font-bold">
                                    Recusado
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-200 mt-1">
                                <Store className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400" />
                                <span>{ord.tenantName}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] text-purple-600/70 dark:text-purple-300/60 font-medium">
                                {new Date(ord.createdAt).toLocaleDateString('pt-PT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Resumo de Itens do Card */}
                          <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/5 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-purple-950 dark:text-white">
                                {ord.items.length} {ord.items.length === 1 ? 'insumo' : 'insumos'} ({totalUnits} un)
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedOrderForDetails(ord)}
                                className="h-6 text-[11px] font-bold px-2 text-purple-700 dark:text-pink-300 hover:bg-purple-100 dark:hover:bg-white/10 rounded-lg gap-1 cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Ver Itens</span>
                              </Button>
                            </div>

                            {/* Mini preview dos 2 primeiros itens */}
                            <div className="space-y-1 text-[11px] text-purple-900/80 dark:text-purple-200/80">
                              {ord.items.slice(0, 2).map((it: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <span className="truncate max-w-[180px]">
                                    <strong>{it.quantity}x</strong> {it.name}
                                  </span>
                                  {it.isPreorder ? (
                                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md">
                                      Sob Encomenda
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">• Pronta Entrega</span>
                                  )}
                                </div>
                              ))}
                              {ord.items.length > 2 && (
                                <p className="text-[10px] text-purple-500 italic">
                                  +{ord.items.length - 2} outros insumos...
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Seletor de Pagamento e Total */}
                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <div className="text-[10px] text-purple-700/70 dark:text-purple-300/60 font-semibold">Pagamento:</div>
                              <select
                                value={ord.paymentStatus || 'PENDING'}
                                onChange={(e) => handleUpdatePaymentStatus(ord.id, e.target.value as any)}
                                className="text-[10px] font-bold py-1 px-2 rounded-lg border border-purple-200 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white cursor-pointer mt-0.5"
                              >
                                <option value="PENDING">🟡 Pendente</option>
                                <option value="PAID">🟢 Pago (Transf.)</option>
                                <option value="INVOICED_30D">🔵 Faturado 30D</option>
                              </select>
                            </div>

                            <div className="text-right">
                              <div className="text-[10px] text-purple-700/70 dark:text-purple-300/60 font-semibold">Total Matriz:</div>
                              <div className="text-base font-black font-mono text-purple-950 dark:text-pink-300">
                                {formatCurrency(ord.totalAmount)}
                              </div>
                            </div>
                          </div>

                          {/* Motivo de Recusa (se houver) */}
                          {ord.status === 'REJECTED' && ord.rejectionReason && (
                            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-[11px] text-red-800 dark:text-red-300">
                              <strong>Motivo da Recusa:</strong> {ord.rejectionReason}
                            </div>
                          )}
                        </div>

                        {/* Rodapé com Botões de Ação */}
                        <div className="p-3 bg-purple-50/50 dark:bg-white/5 border-t border-purple-100 dark:border-white/10 flex items-center justify-between gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setOrderToDelete(ord)
                              setDeleteModalOpen(true)
                            }}
                            className="h-8 w-8 p-0 rounded-xl text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 cursor-pointer"
                            title="Excluir pedido enviado por engano"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center gap-1.5">
                            {ord.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRejectingOrder(ord)
                                    setRejectionReasonText('')
                                    setRejectModalOpen(true)
                                  }}
                                  className="h-8 text-xs font-bold px-3 rounded-xl border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                                >
                                  Recusar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'SHIPPED')}
                                  className="h-8 text-xs font-bold px-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                  <span>Despachar Carga</span>
                                </Button>
                              </>
                            )}

                            {ord.status === 'SHIPPED' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateOrderStatus(ord.id, 'DELIVERED')}
                                className="h-8 text-xs font-bold px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Concluir Entrega</span>
                              </Button>
                            )}

                            {ord.status === 'DELIVERED' && (
                              <span className="text-xs text-emerald-600 font-bold px-2">Finalizado</span>
                            )}
                            {ord.status === 'REJECTED' && (
                              <span className="text-xs text-red-500 font-bold px-2">Cancelado</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          ) : (
            /* MODO 2: LISTA / TABELA COMPACTA COM MODAL DE DETALHES */
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                    <tr>
                      <th className="py-3 px-4">Pedido #</th>
                      <th className="py-3 px-4">Loja Solicitante</th>
                      <th className="py-3 px-4">Data/Hora</th>
                      <th className="py-3 px-4">Insumos Solicitados</th>
                      <th className="py-3 px-4">Valor Total</th>
                      <th className="py-3 px-4">Pagamento</th>
                      <th className="py-3 px-4">Estado Logístico</th>
                      <th className="py-3 px-4 text-right">Ação da Matriz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                          Nenhum pedido de suprimentos recebido no momento.
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => {
                        const hasPreorder = ord.items.some((it: any) => it.isPreorder)
                        return (
                          <tr key={ord.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-white">
                              #{ord.orderNumber}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white flex items-center gap-2">
                              <Store className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400" />
                              <span>{ord.tenantName}</span>
                            </td>
                            <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-300/70">
                              {new Date(ord.createdAt).toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedOrderForDetails(ord)}
                                  className="h-7 text-xs font-bold px-2.5 rounded-xl border-purple-200 dark:border-white/10 hover:bg-purple-100 dark:hover:bg-white/10 text-purple-900 dark:text-white cursor-pointer gap-1.5 shadow-2xs"
                                >
                                  <Eye className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400" />
                                  <span>{ord.items.length} {ord.items.length === 1 ? 'insumo' : 'insumos'}</span>
                                </Button>
                                {hasPreorder && (
                                  <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 text-[9px] py-0 px-1 font-bold">
                                    Sob Encomenda
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-black font-mono text-purple-950 dark:text-pink-300 text-sm">
                              {formatCurrency(ord.totalAmount)}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={ord.paymentStatus || 'PENDING'}
                                onChange={(e) => handleUpdatePaymentStatus(ord.id, e.target.value as any)}
                                className="text-[10px] font-bold py-1 px-2 rounded-lg border border-purple-200 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white cursor-pointer"
                              >
                                <option value="PENDING">🟡 Pendente</option>
                                <option value="PAID">🟢 Pago (Transf.)</option>
                                <option value="INVOICED_30D">🔵 Faturado 30D</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4">
                              {ord.status === 'PENDING' && (
                                <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 text-[10px] font-bold">
                                  Pendente Separação
                                </Badge>
                              )}
                              {ord.status === 'SHIPPED' && (
                                <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border-blue-300 text-[10px] font-bold">
                                  Em Transporte
                                </Badge>
                              )}
                              {ord.status === 'DELIVERED' && (
                                <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300 text-[10px] font-bold">
                                  Entregue & Abastecido
                                </Badge>
                              )}
                              {ord.status === 'REJECTED' && (
                                <div>
                                  <Badge className="bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200 border-red-300 text-[10px] font-bold">
                                    Recusado pela Matriz
                                  </Badge>
                                  {ord.rejectionReason && (
                                    <p className="text-[10px] text-red-700 dark:text-red-300/80 font-medium italic mt-0.5 max-w-[200px] truncate" title={ord.rejectionReason}>
                                      Motivo: {ord.rejectionReason}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {ord.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setRejectingOrder(ord)
                                        setRejectionReasonText('')
                                        setRejectModalOpen(true)
                                      }}
                                      className="h-8 text-xs font-bold px-2.5 rounded-xl border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                                    >
                                      Recusar
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateOrderStatus(ord.id, 'SHIPPED')}
                                      className="h-8 text-xs font-bold px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white cursor-pointer shadow-xs gap-1.5"
                                    >
                                      <Truck className="h-3.5 w-3.5" />
                                      <span>Despachar Carga</span>
                                    </Button>
                                  </>
                                )}
                                {ord.status === 'SHIPPED' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'DELIVERED')}
                                    className="h-8 text-xs font-bold px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs gap-1.5"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Concluir Entrega</span>
                                  </Button>
                                )}
                                {ord.status === 'DELIVERED' && (
                                  <span className="text-[11px] text-emerald-600 font-bold px-2">Finalizado</span>
                                )}
                                {ord.status === 'REJECTED' && (
                                  <span className="text-[11px] text-red-500 font-bold px-2">Cancelado</span>
                                )}

                                {/* Botão de Exclusão Segura de Pedido Enviado por Engano */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setOrderToDelete(ord)
                                    setDeleteModalOpen(true)
                                  }}
                                  className="h-8 w-8 p-0 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                                  title="Excluir pedido enviado por engano"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* ABA 2: Compras com Fornecedores / Entrada de Cargas (Matriz) */}
      {isMatriz && activeTab === 'purchases' && (
        <div className="space-y-6">
          <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-purple-950 dark:text-white flex items-center gap-2">
                  <Factory className="h-4 w-4 text-purple-600 dark:text-pink-400" />
                  <span>Histórico de Compras com Fornecedores & Indústria</span>
                </CardTitle>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
                  Rastreabilidade de compras B2B, preços de custo pagos pela Matriz, lotes e validade (HACCP)
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (suppliers.length > 0) setPurchaseSupplierId(suppliers[0].id)
                  if (catalog.length > 0) {
                    setPurchaseItemId(catalog[0].id)
                    setPurchaseCostUnitPrice(catalog[0].lastCostPrice || 0)
                  }
                  setPurchaseModalOpen(true)
                }}
                className="h-8 text-xs font-bold px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white cursor-pointer shadow-xs gap-1.5"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Nova Entrada / Compra</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                    <tr>
                      <th className="py-3 px-4">Data da Compra</th>
                      <th className="py-3 px-4">Fornecedor / Indústria</th>
                      <th className="py-3 px-4">Insumo</th>
                      <th className="py-3 px-4">Quantidade</th>
                      <th className="py-3 px-4">Custo Unitário</th>
                      <th className="py-3 px-4">Total Pago</th>
                      <th className="py-3 px-4">Fatura / Guia</th>
                      <th className="py-3 px-4">Lote & Validade</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                    {purchases.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                          Nenhuma compra de fornecedor registrada até o momento.
                        </td>
                      </tr>
                    ) : (
                      purchases.map((p) => (
                        <tr key={p.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-300/70">
                            {new Date(p.purchasedAt).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                            {p.supplierName || 'Fornecedor'}
                          </td>
                          <td className="py-3.5 px-4 text-purple-900 dark:text-purple-200">
                            <div className="font-semibold">{p.itemName}</div>
                            {p.supplyCode && <div className="text-[10px] text-purple-500 font-mono">{p.supplyCode}</div>}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-950 dark:text-white">
                            {p.quantity}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-purple-700/80 dark:text-purple-300/70">
                            {formatCurrency(p.costUnitPrice)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-pink-300">
                            {formatCurrency(p.totalCost)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-purple-600 dark:text-purple-400">
                            {p.invoiceNumber || '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[11px] font-mono font-bold text-purple-950 dark:text-white">
                              {p.batchNumber ? `Lote: ${p.batchNumber}` : '—'}
                            </div>
                            {p.expirationDate && (
                              <div className="text-[10px] text-purple-700/70 dark:text-purple-300/70">
                                Val: {new Date(p.expirationDate).toLocaleDateString('pt-PT')}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPurchase(p)}
                                className="h-8 w-8 p-0 text-purple-700 dark:text-pink-300 hover:bg-purple-100 dark:hover:bg-white/10 rounded-xl cursor-pointer"
                                title="Editar Entrada / Compra"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setPurchaseToDelete(p)
                                  setDeletePurchaseModalOpen(true)
                                }}
                                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl cursor-pointer"
                                title="Excluir Compra e Estornar Saldo"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ABA 4: Relatório & Margem DRE de Supply Chain (Matriz) */}
      {isMatriz && activeTab === 'report' && (
        <div className="space-y-6">
          {/* Cards de KPIs Financeiros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 rounded-3xl border border-purple-150 dark:border-white/10 bg-white dark:bg-[#160228] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700/80 dark:text-purple-300/70">Total Investido (Compras)</span>
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-pink-400">
                  <Factory className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-purple-950 dark:text-white mt-2">
                {formatCurrency(metrics?.totalPurchasedCost || 0)}
              </div>
              <p className="text-[11px] text-purple-700/70 dark:text-purple-300/60 mt-1">Custo de mercadorias adquiridas</p>
            </Card>

            <Card className="p-4 rounded-3xl border border-purple-150 dark:border-white/10 bg-white dark:bg-[#160228] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700/80 dark:text-purple-300/70">Faturamento B2B (Lojas)</span>
                <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-purple-950 dark:text-white mt-2">
                {formatCurrency(metrics?.totalSoldRevenue || 0)}
              </div>
              <p className="text-[11px] text-purple-700/70 dark:text-purple-300/60 mt-1">Total repassado para as franquias</p>
            </Card>

            <Card className="p-4 rounded-3xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Margem Bruta Matriz</span>
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-950 dark:text-emerald-300 mt-2">
                {formatCurrency(Math.max(0, metrics?.grossMargin || 0))}
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                {(metrics?.grossMarginPercent ? Math.max(0, metrics.grossMarginPercent) : 0).toFixed(1)}% de margem bruta B2B
              </p>
            </Card>

            <Card className="p-4 rounded-3xl border border-purple-150 dark:border-white/10 bg-white dark:bg-[#160228] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700/80 dark:text-purple-300/70">Lojas em Operação</span>
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-purple-950 dark:text-white mt-2">
                {metrics?.storeUsage.length || 0}
              </div>
              <p className="text-[11px] text-purple-700/70 dark:text-purple-300/60 mt-1">Unidades abastecidas pela central</p>
            </Card>
          </div>

          {/* Tabela de Consumo por Loja */}
          <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10">
              <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
                Distribuição e Faturamento por Unidade Franqueada
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                    <tr>
                      <th className="py-3 px-4">Unidade Franqueada</th>
                      <th className="py-3 px-4">Pedidos Realizados</th>
                      <th className="py-3 px-4">Total Faturado (€)</th>
                      <th className="py-3 px-4">% do Volume Total da Rede</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                    {(!metrics || metrics.storeUsage.length === 0) ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                          Nenhum faturamento registrado com lojas ainda.
                        </td>
                      </tr>
                    ) : (
                      metrics.storeUsage.map((st, idx) => {
                        const pct = metrics.totalSoldRevenue > 0 ? (st.totalRevenue / metrics.totalSoldRevenue) * 100 : 0
                        return (
                          <tr key={idx} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white flex items-center gap-2">
                              <Store className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400" />
                              <span>{st.storeName}</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-purple-950 dark:text-white">
                              {st.ordersCount} pedidos
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-pink-300 text-sm">
                              {formatCurrency(st.totalRevenue)}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 rounded-full bg-purple-100 dark:bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                  />
                                </div>
                                <span className="font-mono text-xs font-bold text-purple-950 dark:text-white">
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Histórico de Pedidos da Franquia (Exibido apenas para a Loja Franquiada) */}
      {!isMatriz && (
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10">
            <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
              Histórico de Pedidos de Reposição Desta Unidade
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                  <tr>
                    <th className="py-3 px-4">Pedido #</th>
                    <th className="py-3 px-4">Data do Pedido</th>
                    <th className="py-3 px-4">Itens Solicitados</th>
                    <th className="py-3 px-4">Total Matriz</th>
                    <th className="py-3 px-4">Economia Gerada</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                        Nenhum pedido anterior encontrado para esta loja.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-white">
                          #{ord.orderNumber}
                        </td>
                        <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-300/70">
                          {new Date(ord.createdAt).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-purple-900 dark:text-purple-200">
                          {ord.items.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')}
                        </td>
                        <td className="py-3.5 px-4 font-black font-mono text-purple-950 dark:text-pink-300">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 font-mono">
                          +{formatCurrency(ord.totalSavings)}
                        </td>
                        <td className="py-3.5 px-4">
                          {ord.status === 'PENDING' && (
                            <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 text-[10px] font-bold">
                              Em Separação
                            </Badge>
                          )}
                          {ord.status === 'SHIPPED' && (
                            <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border-blue-300 text-[10px] font-bold">
                              Em Transporte
                            </Badge>
                          )}
                          {ord.status === 'DELIVERED' && (
                            <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300 text-[10px] font-bold">
                              Recebido & Concluído
                            </Badge>
                          )}
                          {ord.status === 'REJECTED' && (
                            <div>
                              <Badge className="bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200 border-red-300 text-[10px] font-bold">
                                Recusado pela Matriz
                              </Badge>
                              {ord.rejectionReason && (
                                <p className="text-[10px] text-red-700 dark:text-red-300/80 font-medium italic mt-0.5" title={ord.rejectionReason}>
                                  Motivo: {ord.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {ord.status === 'SHIPPED' ? (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmReceive(ord.id, ord.orderNumber)}
                              className="h-8 text-xs font-bold px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs gap-1.5"
                            >
                              <PackageCheck className="h-3.5 w-3.5" />
                              <span>Confirmar Recebimento</span>
                            </Button>
                          ) : ord.status === 'REJECTED' ? (
                            <span className="text-[11px] text-red-400 font-medium">Recusado</span>
                          ) : (
                            <span className="text-[11px] text-purple-400 font-medium">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BARRA FLUTUANTE TIPO CARRINHO (Aparece quando a franquia seleciona itens) */}
      {!isMatriz && totalItemsCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto bg-purple-950 dark:bg-[#120220] text-white p-3.5 sm:px-6 rounded-3xl shadow-2xl border border-purple-800/80 dark:border-white/20 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-black">
                {totalItemsCount} {totalItemsCount === 1 ? 'insumo selecionado' : 'insumos selecionados'}
              </div>
              <div className="text-[11px] text-purple-200/90 font-medium">
                Total Matriz: <strong className="text-pink-300 font-mono text-xs">{formatCurrency(totalHQ)}</strong>
                {totalSavings > 0 && (
                  <span className="text-emerald-400 font-bold ml-1.5">(Economia: +{formatCurrency(totalSavings)})</span>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={() => setConfirmModalOpen(true)}
            className="h-10 px-5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs rounded-2xl cursor-pointer shadow-md shrink-0 flex items-center gap-2"
          >
            <span>Revisar e Enviar Pedido</span>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO E ENVIO DO PEDIDO DE REPOSIÇÃO */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-lg p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-purple-100 dark:bg-white/10 flex items-center justify-center text-purple-800 dark:text-pink-300">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
                  Confirmar Pedido de Reposição
                </DialogTitle>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
                  Envio direto para a Central de Abastecimento da Matriz (Figueira da Foz)
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Lista de Insumos no Modal */}
          <div className="space-y-3 py-2">
            <div className="max-h-56 overflow-y-auto space-y-1.5 border rounded-2xl p-2.5 border-purple-100 dark:border-white/10 bg-purple-50/30 dark:bg-white/5">
              {selectedItemsList.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between p-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-purple-100/60 dark:border-white/5"
                >
                  <div>
                    <div className="font-bold text-purple-950 dark:text-white">{item.name}</div>
                    <div className="text-[10px] text-purple-700/70 dark:text-purple-300/70 font-mono">
                      {item.supplyCode || '—'} • {formatCurrency(item.unitPrice)} / {item.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-purple-950 dark:text-white">
                      {item.quantity} {item.unit}
                    </div>
                    <div className="font-mono font-bold text-pink-600 dark:text-pink-400 text-[11px]">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quadro Financeiro do Pedido */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-1 text-xs">
              <div className="flex justify-between text-purple-700/80 dark:text-purple-300/70">
                <span>Total Estimado no Mercado de Rua:</span>
                <span className="line-through font-mono">{formatCurrency(totalMarket)}</span>
              </div>
              <div className="flex justify-between font-bold text-purple-950 dark:text-white text-sm pt-1 border-t border-purple-200/60 dark:border-white/10">
                <span>Total Matriz (Preço de Fábrica):</span>
                <span className="font-mono text-pink-600 dark:text-pink-400">{formatCurrency(totalHQ)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 text-xs pt-1">
                  <span>Economia Líquida da Franquia:</span>
                  <span className="font-mono">+{formatCurrency(totalSavings)}</span>
                </div>
              )}
            </div>

            {/* Observações de Entrega */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-purple-950 dark:text-white">
                Observações de Entrega (Opcional)
              </label>
              <Input
                placeholder="Ex: Entregar com urgência na terça-feira..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-purple-100 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
              className="h-9 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
            >
              Voltar e Ajustar
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={handleConfirmSendOrder}
              className="h-9 text-xs font-black px-5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? 'A enviar pedido...' : 'Confirmar Envio para a Distribuição'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE RECUSA DO PEDIDO DE REPOSIÇÃO COM MOTIVO */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Recusar Pedido de Reposição #{rejectingOrder?.orderNumber}
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
              Indique o motivo da recusa para a filial <strong>{rejectingOrder?.tenantName}</strong>. O motivo ficará gravado no histórico da loja.
            </p>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-purple-950 dark:text-white">
                Motivo da Recusa <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Ex: Insumo em falta na matriz, previsão de chegada na quinta..."
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                className="h-10 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-purple-100 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              className="h-9 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!rejectionReasonText.trim() || rejecting}
              onClick={handleConfirmRejectOrder}
              className="h-9 text-xs font-black px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-xs"
            >
              {rejecting ? 'A recusar...' : 'Confirmar Recusa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE DETALHES DOS ITENS DO PEDIDO DE REPOSIÇÃO */}
      <Dialog
        open={!!selectedOrderForDetails}
        onOpenChange={(open) => !open && setSelectedOrderForDetails(null)}
      >
        <DialogContent className="max-w-2xl p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
          {selectedOrderForDetails && (
            <>
              <DialogHeader className="text-left border-b border-purple-100 dark:border-white/10 pb-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-700 dark:text-pink-300">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-black text-purple-950 dark:text-white flex items-center gap-2">
                        <span>Pedido #{selectedOrderForDetails.orderNumber}</span>
                        {selectedOrderForDetails.status === 'PENDING' && (
                          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 text-[10px] font-bold">
                            Pendente Separação
                          </Badge>
                        )}
                        {selectedOrderForDetails.status === 'SHIPPED' && (
                          <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border-blue-300 text-[10px] font-bold">
                            Em Transporte
                          </Badge>
                        )}
                        {selectedOrderForDetails.status === 'DELIVERED' && (
                          <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300 text-[10px] font-bold">
                            Entregue
                          </Badge>
                        )}
                        {selectedOrderForDetails.status === 'REJECTED' && (
                          <Badge className="bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200 border-red-300 text-[10px] font-bold">
                            Recusado
                          </Badge>
                        )}
                      </DialogTitle>
                      <p className="text-xs text-purple-700/80 dark:text-purple-300/70 font-medium flex items-center gap-1.5 mt-0.5">
                        <Store className="h-3.5 w-3.5 text-purple-600 dark:text-pink-400" />
                        <strong>{selectedOrderForDetails.tenantName}</strong> •{' '}
                        <span>
                          {new Date(selectedOrderForDetails.createdAt).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-purple-700/80 dark:text-purple-300/70">Pagamento:</span>
                    <select
                      value={selectedOrderForDetails.paymentStatus || 'PENDING'}
                      onChange={(e) => {
                        const val = e.target.value as any
                        handleUpdatePaymentStatus(selectedOrderForDetails.id, val)
                        setSelectedOrderForDetails({ ...selectedOrderForDetails, paymentStatus: val })
                      }}
                      className="text-xs font-bold py-1 px-2.5 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white cursor-pointer"
                    >
                      <option value="PENDING">🟡 Pendente</option>
                      <option value="PAID">🟢 Pago (Transf.)</option>
                      <option value="INVOICED_30D">🔵 Faturado 30D</option>
                    </select>
                  </div>
                </div>
              </DialogHeader>

              {/* Tabela dos Itens no Modal */}
              <div className="space-y-4 py-3">
                <div className="rounded-2xl border border-purple-150 dark:border-white/10 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                      <tr>
                        <th className="py-2.5 px-3">Insumo</th>
                        <th className="py-2.5 px-3 text-center">Quantidade</th>
                        <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        <th className="py-2.5 px-3">Tipo Atendimento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                      {selectedOrderForDetails.items.map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-purple-50/40 dark:hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-purple-950 dark:text-white">
                            <div>{it.name}</div>
                            {it.supplyCode && (
                              <div className="text-[10px] text-purple-500 font-mono">{it.supplyCode}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-purple-950 dark:text-white">
                            {it.quantity} {it.unit || 'un'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-purple-700/80 dark:text-purple-300/70">
                            {formatCurrency(it.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-purple-950 dark:text-pink-300">
                            {formatCurrency((it.quantity || 1) * (it.unitPrice || 0))}
                          </td>
                          <td className="py-2.5 px-3">
                            {it.isPreorder ? (
                              <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 text-[10px] font-bold">
                                Sob Encomenda (Comprar)
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 text-[10px] font-bold">
                                Pronta Entrega
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Resumo Financeiro */}
                <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-purple-700/80 dark:text-purple-300/70 font-semibold">
                      Total de Itens: <strong>{selectedOrderForDetails.items.length} insumos</strong>
                    </span>
                    {selectedOrderForDetails.totalSavings > 0 && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                        Economia Líquida da Filial: +{formatCurrency(selectedOrderForDetails.totalSavings)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-purple-700/70 dark:text-purple-300/60 font-semibold">Total Faturado Matriz:</div>
                    <div className="text-xl font-black font-mono text-purple-950 dark:text-pink-300">
                      {formatCurrency(selectedOrderForDetails.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Observações de Entrega */}
                {selectedOrderForDetails.notes && (
                  <div className="p-3 rounded-xl bg-purple-100/50 dark:bg-white/5 border border-purple-200/60 dark:border-white/10 text-xs">
                    <strong className="text-purple-950 dark:text-white">Observações da Loja:</strong>
                    <p className="text-purple-800/90 dark:text-purple-200/90 mt-0.5 italic">
                      "{selectedOrderForDetails.notes}"
                    </p>
                  </div>
                )}

                {/* Motivo de Recusa (se houver) */}
                {selectedOrderForDetails.status === 'REJECTED' && selectedOrderForDetails.rejectionReason && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300">
                    <strong>Motivo da Recusa:</strong> {selectedOrderForDetails.rejectionReason}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-purple-100 dark:border-white/10 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedOrderForDetails(null)}
                  className="h-9 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
                >
                  Fechar
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOrderToDelete(selectedOrderForDetails)
                      setSelectedOrderForDetails(null)
                      setDeleteModalOpen(true)
                    }}
                    className="h-9 text-xs font-bold px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl cursor-pointer gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Excluir</span>
                  </Button>

                  {selectedOrderForDetails.status === 'PENDING' && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setRejectingOrder(selectedOrderForDetails)
                          setRejectionReasonText('')
                          setSelectedOrderForDetails(null)
                          setRejectModalOpen(true)
                        }}
                        className="h-9 text-xs font-bold px-3 rounded-xl border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                      >
                        Recusar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          handleUpdateOrderStatus(selectedOrderForDetails.id, 'SHIPPED')
                          setSelectedOrderForDetails(null)
                        }}
                        className="h-9 text-xs font-black px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white cursor-pointer shadow-xs gap-1.5"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Despachar Carga</span>
                      </Button>
                    </>
                  )}

                  {selectedOrderForDetails.status === 'SHIPPED' && (
                    <Button
                      type="button"
                      onClick={() => {
                        handleUpdateOrderStatus(selectedOrderForDetails.id, 'DELIVERED')
                        setSelectedOrderForDetails(null)
                      }}
                      className="h-9 text-xs font-black px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Concluir Entrega</span>
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE EXCLUSÃO SEGURA DE PEDIDO COM ESTORNO (MATRIZ) */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Excluir Pedido de Reposição #{orderToDelete?.orderNumber}</span>
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
              Tem certeza que deseja excluir o pedido da filial <strong>{orderToDelete?.tenantName}</strong>?
            </p>
          </DialogHeader>

          <div className="p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-800 dark:text-red-300/90 space-y-1">
            <p className="font-bold">Atenção:</p>
            <p>
              • Esta ação removerá o pedido permanentemente do histórico da rede.<br />
              • Qualquer reserva física deste pedido será restituída automaticamente ao estoque central da Matriz (Figueira da Foz).
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-purple-100 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="h-9 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDeleteOrder}
              className="h-9 text-xs font-black px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-xs"
            >
              {deleting ? 'A excluir...' : 'Sim, Excluir Pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE COMPRA COM FORNECEDOR (CRIAR / EDITAR - MATRIZ) */}
      <Dialog open={purchaseModalOpen} onOpenChange={setPurchaseModalOpen}>
        <DialogContent className="max-w-lg p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white flex items-center gap-2">
              <Factory className="h-4 w-4 text-purple-600 dark:text-pink-400" />
              <span>{editingPurchaseId ? 'Editar Compra com Fornecedor' : 'Registrar Compra com Fornecedor / Fabricante'}</span>
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
              Esta entrada abastece o armazém central da Matriz e atualiza o histórico de custos B2B.
            </p>
          </DialogHeader>

          <form onSubmit={handleRecordPurchase} className="space-y-3.5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-purple-950 dark:text-white">
                  Fornecedor Homologado <span className="text-red-500">*</span>
                </label>
                <select
                  value={purchaseSupplierId}
                  onChange={(e) => setPurchaseSupplierId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-medium cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id} className="text-purple-950 dark:text-black">
                      {s.name} ({s.category || 'Geral'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-purple-950 dark:text-white">
                  Matéria-Prima / Insumo <span className="text-red-500">*</span>
                </label>
                <select
                  value={purchaseItemId}
                  onChange={(e) => {
                    setPurchaseItemId(e.target.value)
                    const it = catalog.find((c) => c.id === e.target.value)
                    if (it?.lastCostPrice) setPurchaseCostUnitPrice(it.lastCostPrice)
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-medium cursor-pointer"
                >
                  {catalog.map((it) => (
                    <option key={it.id} value={it.id} className="text-purple-950 dark:text-black">
                      {it.name} ({it.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-purple-950 dark:text-white">
                  Quantidade Adquirida <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(parseFloat(e.target.value) || 0)}
                  className="h-10 text-xs rounded-xl font-mono border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-purple-950 dark:text-white">
                  Preço de Custo Unitário (€) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={purchaseCostUnitPrice}
                  onChange={(e) => setPurchaseCostUnitPrice(parseFloat(e.target.value) || 0)}
                  className="h-10 text-xs rounded-xl font-mono border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-between">
              <span className="text-xs text-purple-800 dark:text-purple-200 font-bold">Total da Fatura:</span>
              <span className="font-mono text-base font-black text-purple-950 dark:text-pink-300">
                {formatCurrency(purchaseQuantity * purchaseCostUnitPrice)}
              </span>
            </div>

            {/* Rastreabilidade Sanitária HACCP / ASAE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-purple-950 dark:text-white">Nº da Fatura / Guia</label>
                <Input
                  placeholder="Ex: FT-2026/890"
                  value={purchaseInvoice}
                  onChange={(e) => setPurchaseInvoice(e.target.value)}
                  className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-purple-950 dark:text-white">Número de Lote</label>
                <Input
                  placeholder="Ex: LOTE-ACA-2609"
                  value={purchaseBatch}
                  onChange={(e) => setPurchaseBatch(e.target.value)}
                  className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-purple-950 dark:text-white">Validade (ASAE)</label>
                <Input
                  type="date"
                  value={purchaseExpiration}
                  onChange={(e) => setPurchaseExpiration(e.target.value)}
                  className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-purple-950 dark:text-white">Notas Internas</label>
              <Input
                placeholder="Ex: Entrega recebida sem avarias..."
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-purple-100 dark:border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPurchaseModalOpen(false)}
                className="h-9 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingPurchase}
                className="h-9 text-xs font-black px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>{savingPurchase ? 'A salvar...' : editingPurchaseId ? 'Salvar Alterações' : 'Confirmar Entrada no Armazém'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EXCLUSÃO DE COMPRA COM FORNECEDOR (MATRIZ) */}
      <Dialog open={deletePurchaseModalOpen} onOpenChange={setDeletePurchaseModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Excluir Compra de Fornecedor</span>
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
              Tem certeza que deseja excluir a entrada do insumo <strong>{purchaseToDelete?.itemName}</strong> ({purchaseToDelete?.quantity} unidades)?
            </p>
          </DialogHeader>

          <div className="p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-800 dark:text-red-300/90 space-y-1">
            <p className="font-bold">Atenção:</p>
            <p>
              • O registro financeiro e o lote desta compra serão excluídos.<br />
              • A quantidade de <strong>{purchaseToDelete?.quantity} un</strong> será estornada (deduzida) do armazém central da Matriz (Figueira da Foz).
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-purple-100 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletePurchaseModalOpen(false)}
              className="h-9 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={deletingPurchase}
              onClick={handleDeletePurchase}
              className="h-9 text-xs font-black px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-xs"
            >
              {deletingPurchase ? 'A excluir...' : 'Sim, Excluir e Estornar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EXCLUSÃO DE INSUMO DA MATRIZ */}
      <Dialog open={deleteItemModalOpen} onOpenChange={setDeleteItemModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Excluir Insumo da Matriz</span>
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
              Tem certeza que deseja excluir o insumo <strong>{itemToDelete?.name}</strong> do catálogo central?
            </p>
          </DialogHeader>

          <div className="p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-800 dark:text-red-300/90 space-y-1">
            <p className="font-bold">Atenção:</p>
            <p>
              • Este insumo deixará de existir no catálogo B2B de todas as filiais.<br />
              • Históricos de compras vinculados serão limpos.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-purple-100 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteItemModalOpen(false)}
              className="h-9 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={deletingItem}
              onClick={() => itemToDelete && handleDeleteMasterItem(itemToDelete.id)}
              className="h-9 text-xs font-black px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-xs"
            >
              {deletingItem ? 'A excluir...' : 'Sim, Excluir Insumo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação/Edição de Insumo Mestre */}
      <InventoryItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={editingItem}
        onSave={handleSaveMasterItem}
        onDelete={handleDeleteMasterItem}
        isMaster={true}
      />
    </div>
  )
}
