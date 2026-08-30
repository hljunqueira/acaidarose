'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/i18n/formatters'
import { toast } from 'sonner'
import {
  FileText,
  Search,
  RefreshCw,
  Building2,
  Check,
  X,
  TrendingUp,
  Store,
  DollarSign,
} from 'lucide-react'

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

interface StoreRequestsViewProps {
  tenantId?: string
}

export default function StoreRequestsView({ tenantId }: StoreRequestsViewProps) {
  const [requests, setRequests] = useState<FranchisePriceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Modais de Deliberação
  const [selectedRequest, setSelectedRequest] = useState<FranchisePriceRequest | null>(null)
  const [deliberateModalOpen, setDeliberateModalOpen] = useState(false)
  const [deliberateAction, setDeliberateAction] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [deliberateNotes, setDeliberateNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchRequests = useCallback(async (isManual = false) => {
    setLoading(true)
    try {
      const res = await fetch('/api/franchise-requests')
      const data = await res.json()
      if (Array.isArray(data.requests)) {
        const storeList = data.requests.filter((r: any) => r.type !== 'FRANCHISE_APPLICATION' && r.type !== 'CONTACT_REQUEST')
        setRequests(storeList)
        if (isManual) {
          toast.success('Solicitações das lojas atualizadas')
        }
      }
    } catch {
      if (isManual) {
        toast.error('Erro ao carregar solicitações das lojas')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests(false)
  }, [fetchRequests])

  const handleDeliberate = async () => {
    if (!selectedRequest) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/franchise-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          action: deliberateAction,
          responseNotes: deliberateNotes,
        }),
      })
      if (!res.ok) throw new Error('Falha ao processar solicitação')
      toast.success(
        deliberateAction === 'APPROVE'
          ? 'Solicitação aprovada e preço sincronizado no cardápio da filial!'
          : 'Solicitação de preço recusada.'
      )
      setDeliberateModalOpen(false)
      fetchRequests(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao deliberar solicitação')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.storeName.toLowerCase().includes(search.toLowerCase()) ||
      r.managerName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRequests = requests.length
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Orientador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10 shadow-xs">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
              Solicitações das Lojas & Cardápio
            </h1>
            <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium">
              Aprovação e moderação corporativa de reajustes de preços e produtos enviados pelas filiais
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchRequests(true)}
          disabled={loading}
          className="h-9 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Pedidos</span>
        </Button>
      </div>

      {/* 3 Cards de Indicadores de Moderação */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs rounded-3xl p-4">
          <div className="text-xs font-bold text-amber-900/80 dark:text-amber-300 uppercase">Pendentes de Decisão</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-800 dark:text-amber-300/70 font-medium mt-0.5">Aguardando validação</div>
        </Card>

        <Card className="border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs rounded-3xl p-4">
          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase">Preços Aprovados</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</div>
          <div className="text-[11px] text-emerald-800 dark:text-emerald-300/70 font-medium mt-0.5">Atualizados nas filiais</div>
        </Card>

        <Card className="border border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs rounded-3xl p-4">
          <div className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase">Recusados</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{rejectedCount}</div>
          <div className="text-[11px] text-rose-800 dark:text-rose-300/70 font-medium mt-0.5">Fora da política tarifária</div>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
          <Input
            placeholder="Pesquisar por nome do produto, loja ou gerente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-2xl border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] text-xs text-purple-950 dark:text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-2xl border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] px-3.5 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
        >
          <option value="ALL">Todos os Estados</option>
          <option value="PENDING">Pendentes</option>
          <option value="APPROVED">Aprovados</option>
          <option value="REJECTED">Recusados</option>
        </select>
      </div>

      {/* Tabela de Solicitações */}
      <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
            Pedidos de Alteração de Cardápio Enviados pelas Filiais
          </CardTitle>
          <span className="text-xs text-purple-700/80 dark:text-purple-300/70 font-medium">
            {filteredRequests.length} registo(s)
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                <tr>
                  <th className="py-3 px-4">Loja / Solicitante</th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Preço Atual</th>
                  <th className="py-3 px-4">Preço Sugerido</th>
                  <th className="py-3 px-4">Diferença / Margem</th>
                  <th className="py-3 px-4">Motivo Apresentado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Deliberação Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                      Nenhuma solicitação de loja encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => {
                    const diff = Number(req.suggestedPrice) - Number(req.currentPrice)
                    return (
                      <tr key={req.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                          <div>{req.storeName}</div>
                          <div className="text-[10px] text-purple-700/80 dark:text-purple-300/70 font-normal">
                            {req.managerName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-purple-900 dark:text-purple-200">
                          {req.productName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-purple-700/80 dark:text-purple-300/70">
                          {formatCurrency(req.currentPrice)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-pink-300 text-sm">
                          {formatCurrency(req.suggestedPrice)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-xs">
                          <span className={diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-300/70 text-xs max-w-xs truncate font-medium">
                          {req.reason}
                        </td>
                        <td className="py-3.5 px-4">
                          {req.status === 'PENDING' && (
                            <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                              Pendente
                            </Badge>
                          )}
                          {req.status === 'APPROVED' && (
                            <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                              Aprovado
                            </Badge>
                          )}
                          {req.status === 'REJECTED' && (
                            <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 font-bold text-[10px]">
                              Recusado
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(req)
                                  setDeliberateAction('APPROVE')
                                  setDeliberateNotes('Aprovado pela Franqueadora Master.')
                                  setDeliberateModalOpen(true)
                                }}
                                className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer shadow-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                <span>Aprovar</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedRequest(req)
                                  setDeliberateAction('REJECT')
                                  setDeliberateNotes('Preço fora da política tarifária da rede.')
                                  setDeliberateModalOpen(true)
                                }}
                                className="h-7 px-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-[11px] font-bold rounded-lg cursor-pointer"
                              >
                                <X className="h-3 w-3 mr-1" />
                                <span>Recusar</span>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-purple-700/60 dark:text-purple-300/50 font-medium">Resolvido</span>
                          )}
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

      {/* Modal de Deliberação */}
      {selectedRequest && (
        <Dialog open={deliberateModalOpen} onOpenChange={setDeliberateModalOpen}>
          <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
                {deliberateAction === 'APPROVE' ? 'Aprovar Solicitação de Preço' : 'Recusar Solicitação de Preço'}
              </DialogTitle>
              <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
                {selectedRequest.storeName} · {selectedRequest.productName}
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-purple-700/80 dark:text-purple-300/70 block text-[11px] font-bold">Preço Atual</span>
                  <span className="font-mono font-black text-purple-950 dark:text-white text-sm">
                    {formatCurrency(selectedRequest.currentPrice)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-purple-700/80 dark:text-purple-300/70 block text-[11px] font-bold">Novo Preço Sugerido</span>
                  <span className="font-mono font-black text-purple-950 dark:text-pink-300 text-base">
                    {formatCurrency(selectedRequest.suggestedPrice)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">
                  Justificativa / Parecer da Franqueadora Master
                </Label>
                <textarea
                  rows={3}
                  value={deliberateNotes}
                  onChange={(e) => setDeliberateNotes(e.target.value)}
                  className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 p-2.5 text-xs text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeliberateModalOpen(false)}
                className="rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleDeliberate}
                disabled={actionLoading}
                className={`rounded-xl font-bold text-xs text-white shadow-xs cursor-pointer ${
                  deliberateAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'A processar...' : deliberateAction === 'APPROVE' ? 'Confirmar Aprovação' : 'Confirmar Recusa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
