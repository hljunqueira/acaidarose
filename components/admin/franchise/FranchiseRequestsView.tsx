'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/i18n/formatters'
import { toast } from 'sonner'
import { User, CatalogData } from '@/types'

export interface FranchisePriceRequest {
  id: string
  tenantId: string
  storeName: string
  managerName: string
  type: 'PRICE_CHANGE' | 'NEW_PRODUCT' | 'SPECIAL_PROMO'
  productId: string
  productName: string
  productImage: string
  category: string
  currentPrice: number
  suggestedPrice: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  responseNotes?: string
}

interface FranchiseRequestsViewProps {
  tenantId?: string
  currentUser?: User
  onNavigateToMenu?: () => void
}

const STORE_NAMES: Record<string, string> = {
  'tenant-aveiro': 'Açaí da Rose — Filial Aveiro',
  'tenant-lisboa': 'Açaí da Rose — Filial Lisboa (Parque das Nações)',
  'tenant-santarem': 'Açaí da Rose — Filial Santarém',
  'tenant-torres-novas': 'Açaí da Rose — Matriz Central',
}

export default function FranchiseRequestsView({
  tenantId = 'tenant-torres-novas',
  currentUser,
  onNavigateToMenu,
}: FranchiseRequestsViewProps) {
  const [requests, setRequests] = useState<FranchisePriceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [storeFilter, setStoreFilter] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')

  // Catálogo da loja para preenchimento inteligente
  const [catalog, setCatalog] = useState<CatalogData>({ containers: [], bases: [], toppings: [] })

  // Apenas a Matriz Central (Holding) atua como Franqueadora Master deliberadora
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'
  const isMatriz = isSuperAdmin && (tenantId === 'tenant-torres-novas' || !tenantId)

  // Modais
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<FranchisePriceRequest | null>(null)
  
  // Customização de Preço Aprovado pela Holding
  const [customApprovedPrice, setCustomApprovedPrice] = useState<string>('')
  const [rejectReason, setRejectReason] = useState('Não compatível com a política de preços da rede no momento.')
  const [actionLoading, setActionLoading] = useState(false)

  // Formulário de Nova Solicitação para Filiais
  const [requestMode, setRequestMode] = useState<'REAJUSTE' | 'NOVO_PRODUTO'>('REAJUSTE')
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [newReqProduct, setNewReqProduct] = useState('')
  const [newReqCategory, setNewReqCategory] = useState('Copos Master')
  const [newReqCurrentPrice, setNewReqCurrentPrice] = useState<number>(0)
  const [newReqSuggestedPrice, setNewReqSuggestedPrice] = useState<string>('')
  const [newReqReason, setNewReqReason] = useState('')
  const [newReqManager, setNewReqManager] = useState(currentUser?.name || 'Gerente da Filial')

  const notifyPendingCount = (list: FranchisePriceRequest[]) => {
    if (typeof window !== 'undefined') {
      const count = isMatriz
        ? list.filter((r) => r.status === 'PENDING').length
        : list.filter((r) => r.tenantId === tenantId && r.status === 'PENDING').length
      window.dispatchEvent(new CustomEvent('franchise_requests_updated', { detail: { count } }))
    }
  }

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/franchise-requests')
      const data = await res.json()
      if (data.requests) {
        setRequests(data.requests)
        notifyPendingCount(data.requests)
      }
    } catch {
      toast.error('Erro ao carregar solicitações')
    } finally {
      setLoading(false)
    }
  }, [isMatriz, tenantId])

  // Carregar produtos da loja para vincular reajustes
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`/api/products?tenantId=${tenantId}`)
        const data = await res.json()
        if (data.containers) {
          setCatalog(data)
          if (data.containers.length > 0) {
            const first = data.containers[0]
            setSelectedProductId(first.id)
            setNewReqProduct(first.name)
            setNewReqCurrentPrice(first.precoBase || 0)
            setNewReqCategory('Copos Master')
          }
        }
      } catch {
        // fallback
      }
    }
    loadProducts()
    fetchRequests()
  }, [tenantId, fetchRequests])

  // Atualizar produto selecionado no dropdown
  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId)
    const prod = catalog.containers?.find((c) => c.id === prodId)
    if (prod) {
      setNewReqProduct(prod.name)
      setNewReqCurrentPrice(prod.precoBase || 0)
      setNewReqCategory('Copos Master')
    }
  }

  // Filtragem inicial: No modo Filial, exibe SOMENTE as solicitações da própria loja!
  const baseStoreRequests = useMemo(() => {
    if (isMatriz) return requests
    return requests.filter((r) => r.tenantId === tenantId)
  }, [requests, isMatriz, tenantId])

  const pendingCount = baseStoreRequests.filter((r) => r.status === 'PENDING').length
  const approvedCount = baseStoreRequests.filter((r) => r.status === 'APPROVED').length
  const rejectedCount = baseStoreRequests.filter((r) => r.status === 'REJECTED').length

  const handleOpenDetail = (req: FranchisePriceRequest) => {
    setSelectedRequest(req)
    setCustomApprovedPrice(String(req.suggestedPrice))
    setDetailModalOpen(true)
  }

  // Aprovação com sincronização real (Apenas Franqueadora)
  const handleApproveRequest = async (req: FranchisePriceRequest, finalPrice?: number) => {
    setActionLoading(true)
    const approvedValue = finalPrice !== undefined ? finalPrice : req.suggestedPrice

    try {
      const res = await fetch('/api/franchise-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: req.id,
          action: 'APPROVE',
          resolvedBy: 'Holding Açaí da Rose',
          responseNotes: `Aprovado pela Holding. Preço de ${formatCurrency(approvedValue)} sincronizado com o cardápio da loja.`,
        }),
      })

      if (!res.ok) throw new Error('Falha ao aprovar reajuste')
      const data = await res.json()

      setRequests((prev) => {
        const next = prev.map((r) => (r.id === req.id ? { ...data.request, suggestedPrice: approvedValue } : r))
        notifyPendingCount(next)
        return next
      })
      setDetailModalOpen(false)
      toast.success(
        `Preço atualizado para ${formatCurrency(approvedValue)} no cardápio de ${req.storeName}!`
      )
    } catch (err: any) {
      toast.error(err.message || 'Erro ao aprovar solicitação')
    } finally {
      setActionLoading(false)
    }
  }

  // Recusa com justificativa (Apenas Franqueadora)
  const handleRejectRequest = async () => {
    if (!selectedRequest) return
    setActionLoading(true)

    try {
      const res = await fetch('/api/franchise-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          action: 'REJECT',
          resolvedBy: 'Holding Açaí da Rose',
          responseNotes: rejectReason,
        }),
      })

      if (!res.ok) throw new Error('Falha ao recusar solicitação')
      const data = await res.json()

      setRequests((prev) => {
        const next = prev.map((r) => (r.id === selectedRequest.id ? data.request : r))
        notifyPendingCount(next)
        return next
      })
      setRejectModalOpen(false)
      setDetailModalOpen(false)
      toast.info(`Solicitação recusada. A filial foi notificada da justificativa.`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar recusa')
    } finally {
      setActionLoading(false)
    }
  }

  // Criar nova solicitação enviada pela filial
  const handleCreateNewRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)

    const storeTenant = isMatriz ? 'tenant-aveiro' : tenantId
    const storeLabel = STORE_NAMES[storeTenant] || 'Açaí da Rose — Filial'

    try {
      const res = await fetch('/api/franchise-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: storeTenant,
          storeName: storeLabel,
          managerName: newReqManager || currentUser?.name || 'Gerente da Filial',
          productId: requestMode === 'REAJUSTE' ? selectedProductId : `new-${Date.now()}`,
          productName: newReqProduct,
          category: newReqCategory,
          currentPrice: requestMode === 'REAJUSTE' ? Number(newReqCurrentPrice) : 0,
          suggestedPrice: Number(newReqSuggestedPrice),
          type: requestMode === 'REAJUSTE' ? 'PRICE_CHANGE' : 'NEW_PRODUCT',
          reason: newReqReason || 'Reajuste operacional solicitado pela loja.',
        }),
      })

      if (!res.ok) throw new Error('Falha ao criar solicitação')
      const data = await res.json()
      setRequests((prev) => {
        const next = [data.request, ...prev]
        notifyPendingCount(next)
        return next
      })
      setNewRequestModalOpen(false)
      setNewReqReason('')
      setNewReqSuggestedPrice('')
      toast.success('Solicitação submetida com sucesso à Holding!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar solicitação')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredRequests = baseStoreRequests.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    const matchesStore = !isMatriz || storeFilter === 'ALL' || r.tenantId === storeFilter
    const matchesSearch =
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.storeName.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.managerName.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesStore && matchesSearch
  })

  // Cálculo da variação do modal
  const priceVariation = useMemo(() => {
    const sug = Number(newReqSuggestedPrice) || 0
    const cur = newReqCurrentPrice || 0
    if (cur === 0 || sug === 0) return null
    const diff = sug - cur
    const pct = ((diff / cur) * 100).toFixed(1)
    return { diff, pct, isIncrease: diff > 0 }
  }, [newReqCurrentPrice, newReqSuggestedPrice])

  return (
    <div className="space-y-6">
      {/* 1. Header Principal Clean */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
              {isMatriz
                ? 'Central de Solicitações da Rede & Governança de Preços'
                : `Solicitações à Franqueadora — ${STORE_NAMES[tenantId] || 'Filial'}`}
            </h1>
            {pendingCount > 0 && (
              <Badge className="bg-pink-600 text-white font-black text-[10px] py-0.5 px-2 rounded-full border-0">
                {pendingCount} {pendingCount === 1 ? 'Pendente' : 'Pendentes'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
            {isMatriz
              ? 'Painel da Franqueadora Master: Deliberação e sincronização de reajustes solicitados pelas filiais'
              : `Acompanhamento do histórico de propostas e pareceres da Holding para ${STORE_NAMES[tenantId] || 'sua filial'}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Solicitação EXCLUSIVO PARA FILIAIS (Não aparece na Matriz) */}
          {!isMatriz && (
            <Button
              size="sm"
              onClick={() => setNewRequestModalOpen(true)}
              className="h-9 bg-purple-900 hover:bg-purple-950 dark:bg-pink-600 dark:hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer px-3.5"
            >
              + Solicitar Reajuste à Holding
            </Button>
          )}

          {onNavigateToMenu && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToMenu}
              className="h-9 border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white font-bold text-xs rounded-xl cursor-pointer px-3"
            >
              Abrir Cardápio
            </Button>
          )}
        </div>
      </div>

      {/* 2. KPIs Clean & Minimalistas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4 rounded-2xl bg-purple-900 text-white border-0 shadow-xs">
          <div className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">
            {isMatriz ? 'Solicitações Pendentes' : 'Em Análise na Holding'}
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-pink-300">
            {pendingCount} <span className="text-xs font-normal text-purple-200">pedidos</span>
          </div>
          <div className="text-[10px] text-purple-300/80 mt-1">
            {pendingCount > 0 ? (isMatriz ? 'Requer decisão da Holding' : 'Aguardando parecer da holding') : 'Nenhuma pendência'}
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 uppercase tracking-wider">
            {isMatriz ? 'Aprovadas no Mês' : 'Reajustes Aprovados'}
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-purple-950 dark:text-white">
            {approvedCount} <span className="text-xs font-normal text-purple-600 dark:text-purple-300">itens</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            {isMatriz ? 'Aplicados aos cardápios locais' : 'Ativos no cardápio desta loja'}
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 uppercase tracking-wider">
            {isMatriz ? 'Filiais na Rede' : 'Total de Propostas'}
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-purple-950 dark:text-white">
            {isMatriz ? '3' : baseStoreRequests.length} <span className="text-xs font-normal text-purple-600 dark:text-purple-300">{isMatriz ? 'filiais' : 'solicitações'}</span>
          </div>
          <div className="text-[10px] text-purple-600/70 dark:text-purple-300/70 mt-1">
            {isMatriz ? 'Lisboa, Aveiro, Santarém' : 'Histórico completo da loja'}
          </div>
        </Card>

        <Card className="p-4 rounded-2xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs">
          <div className="text-[11px] font-bold text-purple-900/80 dark:text-purple-200/80 uppercase tracking-wider">
            SLA de Resposta
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-purple-950 dark:text-white">
            &lt; 4 <span className="text-xs font-normal text-purple-600 dark:text-purple-300">horas</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            Agilidade na operação
          </div>
        </Card>
      </div>

      {/* 3. Filtros & Busca */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <Input
            placeholder={isMatriz ? 'Buscar por produto, filial ou motivo...' : 'Buscar nas minhas solicitações...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-xs rounded-xl bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white max-w-xs"
          />

          {isMatriz && (
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/40 dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-pink-500 [&>option]:bg-white dark:[&>option]:bg-[#160228]"
            >
              <option value="ALL">Todas as Filiais ({requests.length})</option>
              <option value="tenant-aveiro">Filial Aveiro ({requests.filter(r => r.tenantId === 'tenant-aveiro').length})</option>
              <option value="tenant-lisboa">Filial Lisboa ({requests.filter(r => r.tenantId === 'tenant-lisboa').length})</option>
              <option value="tenant-santarem">Filial Santarém ({requests.filter(r => r.tenantId === 'tenant-santarem').length})</option>
            </select>
          )}
        </div>

        {/* Pílulas de Status */}
        <div className="flex items-center gap-1 bg-purple-50/60 dark:bg-white/5 p-1 rounded-xl border border-purple-150 dark:border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-purple-900 dark:bg-pink-600 text-white shadow-xs'
                : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
            }`}
          >
            Todas ({baseStoreRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-purple-900 dark:bg-pink-600 text-white shadow-xs'
                : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'APPROVED'
                ? 'bg-purple-900 dark:bg-pink-600 text-white shadow-xs'
                : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
            }`}
          >
            Aprovadas ({approvedCount})
          </button>
          {rejectedCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'REJECTED'
                  ? 'bg-purple-900 dark:bg-pink-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
              }`}
            >
              Recusadas ({rejectedCount})
            </button>
          )}
        </div>
      </div>

      {/* 4. GRID COMPACTO DE SOLICITAÇÕES (2 A 3 COLUNAS) */}
      {loading ? (
        <div className="py-16 text-center text-xs text-purple-600 dark:text-purple-300 font-bold">
          A carregar solicitações...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center text-xs text-purple-700/70 dark:text-purple-200/60 font-bold bg-white dark:bg-[#160228]/95 rounded-2xl border border-dashed border-purple-200 dark:border-white/15">
          {isMatriz
            ? 'Nenhuma solicitação encontrada com os filtros atuais.'
            : 'Sua filial ainda não possui solicitações registradas. Clique em "+ Solicitar Reajuste à Holding" para propor uma alteração de preço.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const priceDiff = req.suggestedPrice - req.currentPrice
            const percentDiff = req.currentPrice > 0 ? ((priceDiff / req.currentPrice) * 100).toFixed(1) : 'Novo'
            const isIncrease = priceDiff > 0

            return (
              <Card
                key={req.id}
                className="p-4 bg-white dark:bg-[#160228]/95 border border-purple-150 dark:border-white/15 rounded-2xl shadow-xs hover:border-purple-300 dark:hover:border-white/25 transition flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-3">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-purple-100 dark:border-white/10">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-pink-400">
                        {req.storeName.replace('Açaí da Rose — ', '')}
                      </div>
                      <div className="text-[10px] text-purple-600/70 dark:text-purple-300/70">
                        {req.managerName} · {req.createdAt}
                      </div>
                    </div>

                    <div>
                      {req.status === 'PENDING' && (
                        <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-0 text-[9px] font-black py-0.5 px-2">
                          PENDENTE
                        </Badge>
                      )}
                      {req.status === 'APPROVED' && (
                        <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-0 text-[9px] font-black py-0.5 px-2">
                          APROVADO
                        </Badge>
                      )}
                      {req.status === 'REJECTED' && (
                        <Badge className="bg-red-100 dark:bg-red-500/20 text-red-900 dark:text-red-300 border-0 text-[9px] font-black py-0.5 px-2">
                          RECUSADO
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Produto & Preço */}
                  <div className="flex items-center gap-3">
                    <img
                      src={req.productImage}
                      alt={req.productName}
                      className="h-14 w-14 rounded-xl object-cover border border-purple-150 dark:border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold uppercase text-purple-500 dark:text-pink-400">
                        {req.category}
                      </div>
                      <div className="text-xs font-black text-purple-950 dark:text-white truncate">
                        {req.productName}
                      </div>
                      <div className="text-xs font-mono font-bold mt-1 text-purple-950 dark:text-white flex items-center gap-1.5 flex-wrap">
                        {req.currentPrice > 0 && (
                          <>
                            <span className="line-through text-purple-400 dark:text-purple-400 text-[11px]">
                              {formatCurrency(req.currentPrice)}
                            </span>
                            <span>→</span>
                          </>
                        )}
                        <span className="font-black text-pink-600 dark:text-pink-300 text-sm">
                          {formatCurrency(req.suggestedPrice)}
                        </span>
                        {req.currentPrice > 0 && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                              isIncrease
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300'
                            }`}
                          >
                            {isIncrease ? `+${percentDiff}%` : `${percentDiff}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Justificativa da Filial */}
                  <div className="space-y-0.5">
                    <div className="text-[9px] uppercase font-bold text-purple-700/70 dark:text-purple-300/70">
                      Justificativa enviada pelo gerente:
                    </div>
                    <div className="p-2 rounded-xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-[11px] text-purple-900/80 dark:text-purple-200/80 italic line-clamp-2">
                      "{req.reason}"
                    </div>
                  </div>

                  {/* Parecer da Holding */}
                  {req.responseNotes ? (
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-white/10 text-[10.5px] text-purple-950 dark:text-white font-medium">
                      <strong>Holding:</strong> {req.responseNotes}
                    </div>
                  ) : req.status === 'PENDING' ? (
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold italic">
                      ⏳ Em análise pela Franqueadora Master...
                    </div>
                  ) : null}
                </div>

                {/* Ações da Base do Card */}
                <div className="pt-2 border-t border-purple-100 dark:border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(req)}
                    className="text-[11px] font-bold text-purple-700 dark:text-pink-400 hover:text-purple-950 dark:hover:text-white cursor-pointer transition"
                  >
                    Analisar Detalhes
                  </button>

                  {isMatriz && req.status === 'PENDING' ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(req)
                          setRejectReason('Não compatível com a política de preços da rede no momento.')
                          setRejectModalOpen(true)
                        }}
                        className="h-7 text-[10px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/30 rounded-lg px-2.5 cursor-pointer"
                      >
                        Recusar
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(req)}
                        disabled={actionLoading}
                        className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg px-3 shadow-xs cursor-pointer"
                      >
                        Aprovar
                      </Button>
                    </div>
                  ) : (
                    <a
                      href={`/menu?tenantId=${req.tenantId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-purple-600/80 dark:text-purple-300/80 hover:text-purple-950 dark:hover:text-white"
                    >
                      Ver no Cardápio ↗
                    </a>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ========================================================
          MODAL DE ANÁLISE COMPLETA & EDIÇÃO DE VALOR
      ======================================================== */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10 text-left">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              {isMatriz ? 'Análise e Deliberação da Solicitação' : 'Detalhes da Proposta'}
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70">
              {isMatriz
                ? 'Avalie a solicitação da filial e sincronize o preço com o cardápio local'
                : 'Acompanhe a justificativa enviada e o parecer registrado pela Holding'}
            </p>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-2 text-xs">
              {/* Resumo da Filial */}
              <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase text-purple-700 dark:text-pink-400">
                    Filial Solicitante
                  </div>
                  <div className="text-sm font-black text-purple-950 dark:text-white">
                    {selectedRequest.storeName}
                  </div>
                  <div className="text-xs text-purple-800/80 dark:text-purple-200/80">
                    Gerente: <strong>{selectedRequest.managerName}</strong> · {selectedRequest.createdAt}
                  </div>
                </div>

                <Badge className="bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-purple-200 text-[10px] font-bold border-0">
                  {selectedRequest.type === 'PRICE_CHANGE' ? 'Reajuste de Preço' : 'Novo Produto'}
                </Badge>
              </div>

              {/* Detalhes do Produto */}
              <div className="flex items-center gap-4 p-3 rounded-xl border border-purple-100 dark:border-white/10">
                <img
                  src={selectedRequest.productImage}
                  alt={selectedRequest.productName}
                  className="h-20 w-20 rounded-xl object-cover border border-purple-150 dark:border-white/10 shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-purple-500 dark:text-pink-400">
                    {selectedRequest.category}
                  </span>
                  <div className="text-base font-black text-purple-950 dark:text-white">
                    {selectedRequest.productName}
                  </div>
                  {selectedRequest.currentPrice > 0 && (
                    <div className="text-xs text-purple-600/80 dark:text-purple-300/80">
                      Preço atual em vigor na loja: <strong>{formatCurrency(selectedRequest.currentPrice)}</strong>
                    </div>
                  )}
                  <div className="text-xs font-bold text-pink-600 dark:text-pink-300 font-mono">
                    Preço Proposto: <strong>{formatCurrency(selectedRequest.suggestedPrice)}</strong>
                  </div>
                </div>
              </div>

              {/* Justificativa Completa */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">
                  Justificativa do Gerente:
                </Label>
                <div className="p-3 rounded-xl bg-purple-50/40 dark:bg-white/5 border border-purple-100 dark:border-white/10 text-xs italic text-purple-900/90 dark:text-purple-200/90">
                  "{selectedRequest.reason}"
                </div>
              </div>

              {/* Campo para Ajuste de Preço pela Holding (Apenas Franqueadora no modo pendente) */}
              {isMatriz && selectedRequest.status === 'PENDING' ? (
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-emerald-950 dark:text-emerald-300">
                        Preço Sugerido pela Filial: {formatCurrency(selectedRequest.suggestedPrice)}
                      </div>
                      {selectedRequest.currentPrice > 0 && (
                        <div className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                          Variação de +{formatCurrency(selectedRequest.suggestedPrice - selectedRequest.currentPrice)} (+{(((selectedRequest.suggestedPrice - selectedRequest.currentPrice) / selectedRequest.currentPrice) * 100).toFixed(1)}%)
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <Label className="text-[10px] font-black uppercase text-emerald-900 dark:text-emerald-300">
                        Preço a Aprovar (€):
                      </Label>
                      <Input
                        type="number"
                        step="0.10"
                        value={customApprovedPrice}
                        onChange={(e) => setCustomApprovedPrice(e.target.value)}
                        className="h-8 w-24 text-sm font-mono font-black text-right bg-white dark:bg-[#160228] border-emerald-300"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/10 text-xs">
                  <strong>Parecer Registrado:</strong> {selectedRequest.responseNotes || (selectedRequest.status === 'PENDING' ? '⏳ Em análise pela Franqueadora Master.' : 'Decisão registrada pela Holding.')}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-purple-100 dark:border-white/10">
            {selectedRequest && (
              <a
                href={`/menu?tenantId=${selectedRequest.tenantId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-purple-700 dark:text-pink-400 hover:underline"
              >
                Abrir Cardápio da Loja ↗
              </a>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDetailModalOpen(false)}
                className="h-8 text-xs rounded-xl"
              >
                Fechar
              </Button>

              {isMatriz && selectedRequest?.status === 'PENDING' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRejectReason('Não compatível com a política de preços da rede no momento.')
                      setRejectModalOpen(true)
                    }}
                    className="h-8 text-xs font-bold text-red-600 dark:text-red-400 border-red-200 rounded-xl"
                  >
                    Recusar
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleApproveRequest(selectedRequest, Number(customApprovedPrice))}
                    disabled={actionLoading}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    {actionLoading ? 'A sincronizar...' : `✓ Aprovar (${formatCurrency(Number(customApprovedPrice) || selectedRequest.suggestedPrice)})`}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL DE RECUSA COM MOTIVOS
      ======================================================== */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10 text-left">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Recusar Solicitação de Reajuste
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-3 py-2 text-xs">
              <p className="text-purple-900 dark:text-purple-200">
                Selecione o motivo da recusa para <strong>{selectedRequest.storeName}</strong>:
              </p>

              <div className="space-y-1.5">
                {[
                  'Não compatível com a política de preços da rede no momento.',
                  'Impacto negativo na competitividade regional da marca.',
                  'Custo logístico já subsidiado pela franqueadora.',
                  'Preço sugerido acima do teto estipulado em contrato de franquia.',
                ].map((reasonOption) => (
                  <button
                    key={reasonOption}
                    type="button"
                    onClick={() => setRejectReason(reasonOption)}
                    className={`w-full text-left p-2 rounded-xl border text-[11px] font-semibold transition ${
                      rejectReason === reasonOption
                        ? 'bg-purple-100 dark:bg-white/15 border-purple-500 text-purple-950 dark:text-white font-bold'
                        : 'bg-purple-50/40 dark:bg-white/5 border-purple-200/60 dark:border-white/10 text-purple-900/80 dark:text-purple-200/80 hover:bg-purple-100/50'
                    }`}
                  >
                    {reasonOption}
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">
                  Justificativa:
                </Label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-purple-50/50 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              disabled={actionLoading}
              className="w-full sm:w-auto h-8 text-xs rounded-xl"
            >
              Voltar
            </Button>
            <Button
              type="button"
              onClick={handleRejectRequest}
              disabled={actionLoading}
              className="w-full sm:w-auto h-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              {actionLoading ? 'A processar...' : 'Confirmar Recusa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL DE NOVA SOLICITAÇÃO (EXCLUSIVO PARA FILIAIS)
      ======================================================== */}
      <Dialog open={newRequestModalOpen} onOpenChange={setNewRequestModalOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10 text-left">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Nova Proposta para a Holding
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70">
              Solicitação de alteração de preço ou novo produto para <strong>{STORE_NAMES[tenantId] || 'sua filial'}</strong>
            </p>
          </DialogHeader>

          {/* Seletor de Tipo de Solicitação */}
          <div className="flex rounded-xl bg-purple-50 dark:bg-white/5 p-1 border border-purple-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => setRequestMode('REAJUSTE')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                requestMode === 'REAJUSTE'
                  ? 'bg-purple-900 dark:bg-pink-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200 hover:text-purple-950'
              }`}
            >
              Reajustar Preço Existente
            </button>
            <button
              type="button"
              onClick={() => setRequestMode('NOVO_PRODUTO')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                requestMode === 'NOVO_PRODUTO'
                  ? 'bg-purple-900 dark:bg-pink-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200 hover:text-purple-950'
              }`}
            >
              Propor Novo Produto / Combo
            </button>
          </div>

          <form onSubmit={handleCreateNewRequest} className="space-y-3 py-1 text-xs">
            {requestMode === 'REAJUSTE' ? (
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
                    {catalog.containers?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — Preço Atual: {formatCurrency(c.precoBase)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço Atual (€):</Label>
                    <div className="h-9 px-3 rounded-xl bg-purple-50/70 dark:bg-white/10 border border-purple-200 dark:border-white/15 flex items-center font-mono font-bold text-purple-950 dark:text-white">
                      {formatCurrency(newReqCurrentPrice)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço Sugerido (€):</Label>
                    <Input
                      type="number"
                      step="0.10"
                      value={newReqSuggestedPrice}
                      onChange={(e) => setNewReqSuggestedPrice(e.target.value)}
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
                {/* Proposição de Novo Produto */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Nome do Novo Produto:</Label>
                  <Input
                    value={newReqProduct}
                    onChange={(e) => setNewReqProduct(e.target.value)}
                    placeholder="ex: Combo Estudante Açaí 350g"
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-purple-950 dark:text-white">Categoria:</Label>
                    <select
                      value={newReqCategory}
                      onChange={(e) => setNewReqCategory(e.target.value)}
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
                      value={newReqSuggestedPrice}
                      onChange={(e) => setNewReqSuggestedPrice(e.target.value)}
                      placeholder="ex: 8.50"
                      required
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Gerente Solicitante:</Label>
              <Input
                value={newReqManager}
                onChange={(e) => setNewReqManager(e.target.value)}
                placeholder="Nome do Gerente"
                required
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Justificativa Operacional / Regional:</Label>
              <textarea
                value={newReqReason}
                onChange={(e) => setNewReqReason(e.target.value)}
                placeholder="Explique o motivo do reajuste ou criação deste produto na sua região..."
                required
                rows={3}
                className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewRequestModalOpen(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto h-8 text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="w-full sm:w-auto h-8 bg-purple-900 hover:bg-purple-950 dark:bg-pink-600 dark:hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {actionLoading ? 'A submeter...' : 'Submeter Solicitação à Holding'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
