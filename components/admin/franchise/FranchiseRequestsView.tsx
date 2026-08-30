'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/i18n/formatters'
import { toast } from 'sonner'
import { User, CatalogData } from '@/types'
import {
  FileText,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Building2,
  Check,
  X,
  Sparkles,
  Trash2,
} from 'lucide-react'

export interface FranchiseCandidate {
  id: string
  type: 'FRANCHISE_APPLICATION' | 'CONTACT_REQUEST'
  candidateName: string
  email: string
  phone: string
  city: string
  district: string
  investment: string
  reason: string
  preferredContact: {
    whatsapp: boolean
    telefone: boolean
    email: boolean
  }
  status: 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED'
  responseNotes?: string
  createdAt: string
}

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

export default function FranchiseRequestsView({
  tenantId = '11111111-1111-1111-1111-111111111111',
  currentUser,
}: FranchiseRequestsViewProps) {
  const [activeTab, setActiveTab] = useState<'CANDIDATES' | 'STORE_REQUESTS'>('CANDIDATES')
  const [candidates, setCandidates] = useState<FranchiseCandidate[]>([])
  const [storeRequests, setStoreRequests] = useState<FranchisePriceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Modais de Gestão
  const [selectedCandidate, setSelectedCandidate] = useState<FranchiseCandidate | null>(null)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [candidateNotes, setCandidateNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Estados do CRUD Adicional
  const [newCandidateOpen, setNewCandidateOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [candidateToDelete, setCandidateToDelete] = useState<FranchiseCandidate | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cidade: '',
    distrito: '',
    investimento: '5.000€',
    motivo: '',
  })

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await fetch('/api/franchise-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'FRANCHISE_APPLICATION',
          ...formData,
        }),
      })
      if (!res.ok) throw new Error('Erro ao registrar candidatura')
      toast.success('Candidatura manual registrada com sucesso!')
      setNewCandidateOpen(false)
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cidade: '',
        distrito: '',
        investimento: '5.000€',
        motivo: '',
      })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar candidatura')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteCandidate = async () => {
    if (!candidateToDelete) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/franchise-requests?id=${candidateToDelete.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erro ao excluir candidatura')
      toast.success('Candidatura excluída definitivamente!')
      setDeleteConfirmOpen(false)
      setCandidateToDelete(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir candidatura')
    } finally {
      setActionLoading(false)
    }
  }

  // Modais de Solicitações de Lojas
  const [selectedStoreReq, setSelectedStoreReq] = useState<FranchisePriceRequest | null>(null)
  const [deliberateModalOpen, setDeliberateModalOpen] = useState(false)
  const [deliberateAction, setDeliberateAction] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [deliberateNotes, setDeliberateNotes] = useState('')

  const isMaster =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'FRANCHISOR_ADMIN' ||
    !currentUser?.tenantId ||
    currentUser?.tenantId === '11111111-1111-1111-1111-111111111111'

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/franchise-requests')
      const data = await res.json()
      if (Array.isArray(data.requests)) {
        const candList: FranchiseCandidate[] = []
        const storeList: FranchisePriceRequest[] = []

        data.requests.forEach((r: any) => {
          if (r.type === 'FRANCHISE_APPLICATION' || r.type === 'CONTACT_REQUEST') {
            candList.push(r)
          } else {
            storeList.push(r)
          }
        })

        setCandidates(candList)
        setStoreRequests(storeList)

        // Dispara evento para atualizar badge da sidebar
        const pendingCount = candList.filter((c) => c.status === 'PENDING').length + storeList.filter((s) => s.status === 'PENDING').length
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('franchise_requests_updated', { detail: { count: pendingCount } }))
        }
      }
    } catch {
      toast.error('Erro ao carregar candidaturas e solicitações')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateCandidateStatus = async (id: string, newStatus: 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED', notes?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/franchise-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          responseNotes: notes,
        }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar status')
      toast.success(`Candidatura atualizada para: ${newStatus === 'CONTACTED' ? 'Contactado' : newStatus === 'APPROVED' ? 'Aprovado' : newStatus === 'REJECTED' ? 'Arquivado' : 'Pendente'}`)
      setNotesModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar candidatura')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeliberateStoreRequest = async () => {
    if (!selectedStoreReq) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/franchise-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedStoreReq.id,
          action: deliberateAction,
          responseNotes: deliberateNotes,
        }),
      })
      if (!res.ok) throw new Error('Falha ao processar solicitação')
      toast.success(deliberateAction === 'APPROVE' ? 'Solicitação aprovada e preços sincronizados na loja!' : 'Solicitação recusada.')
      setDeliberateModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao deliberar solicitação')
    } finally {
      setActionLoading(false)
    }
  }

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    const finalPhone = cleanPhone.startsWith('351') ? cleanPhone : cleanPhone.length === 9 ? `351${cleanPhone}` : cleanPhone
    const msg = encodeURIComponent(`Olá ${name}, meu nome é José Valdair, agradecemos o seu interesse na franquia Açaí da Rose! Podemos conversar sobre a sua candidatura?`)
    window.open(`https://wa.me/${finalPhone}?text=${msg}`, '_blank')
  }

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.district.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredStoreRequests = storeRequests.filter((s) => {
    const matchesSearch =
      s.productName.toLowerCase().includes(search.toLowerCase()) ||
      s.storeName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCandidatesCount = candidates.filter((c) => c.status === 'PENDING').length
  const pendingStoreCount = storeRequests.filter((s) => s.status === 'PENDING').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10 shadow-xs">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
              Candidaturas & Solicitações da Franqueadora
            </h1>
            <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium">
              Gestão de interessados no formulário de franquia e solicitações operacionais das lojas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setNewCandidateOpen(true)}
            className="h-9 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white cursor-pointer shadow-xs"
          >
            <span>Novo Candidato</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchData}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Pílulas de Navegação por Abas */}
      <div className="flex items-center gap-1.5 p-1 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-150 dark:border-white/10 w-fit shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('CANDIDATES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'CANDIDATES'
              ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
              : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/50 dark:hover:bg-white/5'
          }`}
        >
          <span>Candidaturas de Franquias ({candidates.length})</span>
          {pendingCandidatesCount > 0 && (
            <Badge className="bg-amber-400 text-purple-950 text-[10px] font-black py-0 px-1.5">
              {pendingCandidatesCount} novos
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STORE_REQUESTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'STORE_REQUESTS'
              ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-xs'
              : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/50 dark:hover:bg-white/5'
          }`}
        >
          <span>Solicitações de Lojas ({storeRequests.length})</span>
          {pendingStoreCount > 0 && (
            <Badge className="bg-amber-400 text-purple-950 text-[10px] font-black py-0 px-1.5">
              {pendingStoreCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
          <Input
            placeholder={activeTab === 'CANDIDATES' ? 'Pesquisar candidato por nome, distrito, cidade ou e-mail...' : 'Pesquisar produto ou loja...'}
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
          <option value="CONTACTED">Contactados / Em Análise</option>
          <option value="APPROVED">Aprovados</option>
          <option value="REJECTED">Arquivados / Recusados</option>
        </select>
      </div>

      {/* ABA 1: CANDIDATURAS DE FRANQUIAS (FORMULÁRIO DO SITE) */}
      {activeTab === 'CANDIDATES' && (
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10">
            <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
              Candidaturas Recebidas pelo Formulário &quot;Seja um Franchisado&quot;
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                  <tr>
                    <th className="py-3 px-4">Candidato / Interessado</th>
                    <th className="py-3 px-4">Localidade / Distrito</th>
                    <th className="py-3 px-4">Capital Disponível</th>
                    <th className="py-3 px-4">Data de Envio</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                        Nenhuma candidatura de franquia encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((cand) => (
                      <tr key={cand.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-purple-950 dark:text-white text-xs">{cand.candidateName}</span>
                            {cand.type === 'CONTACT_REQUEST' && (
                              <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[9px] scale-90 py-0 px-1 font-bold">
                                Contacto
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-purple-700/80 dark:text-purple-300/70">{cand.email}</div>
                          <div className="text-[11px] font-mono text-purple-900/70 dark:text-purple-200/60">{cand.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-purple-950 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                            <span>{cand.city ? `${cand.city}, ${cand.district}` : cand.district}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-pink-300 text-sm">
                          {cand.investment}
                        </td>
                        <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-300/70 text-[11px]">
                          {new Date(cand.createdAt).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon', dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3.5 px-4">
                          {cand.status === 'PENDING' && (
                            <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                              Pendente
                            </Badge>
                          )}
                          {cand.status === 'CONTACTED' && (
                            <Badge className="bg-purple-500/20 text-purple-700 dark:text-pink-300 border border-purple-500/40 font-bold text-[10px]">
                              Contactado
                            </Badge>
                          )}
                          {cand.status === 'APPROVED' && (
                            <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                              Aprovado
                            </Badge>
                          )}
                          {cand.status === 'REJECTED' && (
                            <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 font-bold text-[10px]">
                              Arquivado
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {cand.phone && (
                              <Button
                                size="sm"
                                onClick={() => openWhatsApp(cand.phone, cand.candidateName)}
                                className="h-8 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 cursor-pointer shadow-xs"
                                title="Conversar no WhatsApp"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>WhatsApp</span>
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCandidate(cand)
                                setCandidateNotes(cand.responseNotes || '')
                                setNotesModalOpen(true)
                              }}
                              className="h-8 px-2.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-purple-950 dark:text-white font-bold text-xs cursor-pointer shadow-2xs"
                            >
                              <span>Gerir</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCandidateToDelete(cand)
                                setDeleteConfirmOpen(true)
                              }}
                              className="h-8 px-2 rounded-xl border-rose-250 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 font-bold text-xs cursor-pointer shadow-2xs"
                              title="Excluir Candidatura"
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
      )}

      {/* ABA 2: SOLICITAÇÕES DE LOJAS DA REDE */}
      {activeTab === 'STORE_REQUESTS' && (
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10">
            <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
              Solicitações de Ajuste de Preço e Cardápio Enviadas pelas Lojas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                  <tr>
                    <th className="py-3 px-4">Loja / Gerente</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Preço Atual</th>
                    <th className="py-3 px-4">Preço Sugerido</th>
                    <th className="py-3 px-4">Motivo</th>
                    <th className="py-3 px-4">Estado</th>
                    {isMaster && <th className="py-3 px-4 text-right">Deliberação</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                  {filteredStoreRequests.length === 0 ? (
                    <tr>
                      <td colSpan={isMaster ? 7 : 6} className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                        Nenhuma solicitação de loja encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredStoreRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                          <div>{req.storeName}</div>
                          <div className="text-[10px] text-purple-700/80 dark:text-purple-300/70 font-normal">{req.managerName}</div>
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
                        <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-300/70 text-xs max-w-xs truncate">
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
                        {isMaster && (
                          <td className="py-3.5 px-4 text-right">
                            {req.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedStoreReq(req)
                                    setDeliberateAction('APPROVE')
                                    setDeliberateNotes('Aprovado pela Franqueadora Master.')
                                    setDeliberateModalOpen(true)
                                  }}
                                  className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer shadow-xs"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  <span>Aprovar</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedStoreReq(req)
                                    setDeliberateAction('REJECT')
                                    setDeliberateNotes('Preço fora da política tarifária da rede.')
                                    setDeliberateModalOpen(true)
                                  }}
                                  className="h-7 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-[11px] font-bold rounded-lg cursor-pointer"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  <span>Recusar</span>
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-purple-700/60 dark:text-purple-300/50 font-medium">Resolvido</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Gestão de Candidatura */}
      {selectedCandidate && (
        <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
          <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
                Candidatura: {selectedCandidate.candidateName}
              </DialogTitle>
              <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
                {selectedCandidate.city ? `${selectedCandidate.city}, ` : ''}{selectedCandidate.district} · Capital: {selectedCandidate.investment}
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-1.5">
                <div className="font-bold text-purple-950 dark:text-white">Motivo / Apresentação do Interessado:</div>
                <p className="text-purple-800 dark:text-purple-200 leading-relaxed font-medium">
                  {selectedCandidate.reason}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Notas Internas da Franqueadora</Label>
                <textarea
                  rows={3}
                  value={candidateNotes}
                  onChange={(e) => setCandidateNotes(e.target.value)}
                  placeholder="Ex: Entrevista realizada, agendada visita à loja modelo..."
                  className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 p-2.5 text-xs text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Alterar Estado da Candidatura</Label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleUpdateCandidateStatus(selectedCandidate.id, 'CONTACTED', candidateNotes)}
                    disabled={actionLoading}
                    className="rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Marcar Contactado
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleUpdateCandidateStatus(selectedCandidate.id, 'APPROVED', candidateNotes)}
                    disabled={actionLoading}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Aprovar Candidato
                  </Button>
                </div>
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateCandidateStatus(selectedCandidate.id, 'REJECTED', candidateNotes)}
                    disabled={actionLoading}
                    className="w-full rounded-xl border-rose-200 dark:border-rose-500/20 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold text-xs cursor-pointer"
                  >
                    Arquivar / Recusar Candidatura
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNotesModalOpen(false)}
                className="rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white cursor-pointer"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Deliberação de Solicitação de Loja */}
      {selectedStoreReq && (
        <Dialog open={deliberateModalOpen} onOpenChange={setDeliberateModalOpen}>
          <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
                {deliberateAction === 'APPROVE' ? 'Aprovar Solicitação de Preço' : 'Recusar Solicitação de Preço'}
              </DialogTitle>
              <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
                {selectedStoreReq.storeName} · {selectedStoreReq.productName}
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-purple-700/80 dark:text-purple-300/70 block text-[11px] font-bold">Preço Atual</span>
                  <span className="font-mono font-black text-purple-950 dark:text-white text-sm">{formatCurrency(selectedStoreReq.currentPrice)}</span>
                </div>
                <div className="text-right">
                  <span className="text-purple-700/80 dark:text-purple-300/70 block text-[11px] font-bold">Novo Preço Solicitado</span>
                  <span className="font-mono font-black text-purple-950 dark:text-pink-300 text-base">{formatCurrency(selectedStoreReq.suggestedPrice)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Observação / Justificativa da Decisão</Label>
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
                onClick={handleDeliberateStoreRequest}
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

      {/* Modal de Confirmação de Exclusão (Delete) */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-black text-rose-600 dark:text-rose-400">
              Confirmar Exclusão de Candidato
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
              Esta ação é definitiva e não poderá ser desfeita.
            </p>
          </DialogHeader>

          <div className="py-3 text-xs text-purple-800 dark:text-purple-200 font-medium">
            Tem certeza de que deseja excluir permanentemente a candidatura de <strong className="text-purple-950 dark:text-white">{candidateToDelete?.candidateName}</strong>?
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteCandidate}
              disabled={actionLoading}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              {actionLoading ? 'A excluir...' : 'Sim, Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação Manual de Candidato (Create) */}
      <Dialog open={newCandidateOpen} onOpenChange={setNewCandidateOpen}>
        <DialogContent className="max-w-lg p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Adicionar Candidatura Manualmente
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
              Registre os dados de um interessado recebido fora do formulário web
            </p>
          </DialogHeader>

          <form onSubmit={handleCreateCandidate} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Nome do Candidato</Label>
                <Input
                  required
                  placeholder="Nome Completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="h-9 rounded-xl border-purple-200 dark:border-white/15 text-xs bg-purple-50/20 dark:bg-white/5"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">E-mail</Label>
                <Input
                  required
                  type="email"
                  placeholder="exemplo@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 rounded-xl border-purple-200 dark:border-white/15 text-xs bg-purple-50/20 dark:bg-white/5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Telemóvel / Telefone</Label>
                <Input
                  required
                  placeholder="ex: 912345678"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="h-9 rounded-xl border-purple-200 dark:border-white/15 text-xs bg-purple-50/20 dark:bg-white/5"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Capital Disponível</Label>
                <select
                  value={formData.investimento}
                  onChange={(e) => setFormData({ ...formData, investimento: e.target.value })}
                  className="w-full h-9 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/20 dark:bg-[#160228] px-3.5 text-xs font-medium focus:outline-none"
                >
                  <option value="5.000€">Até 5.000€</option>
                  <option value="5.000€ - 10.000€">5.000€ a 10.000€</option>
                  <option value="10.000€ - 20.000€">10.000€ a 20.000€</option>
                  <option value="20.000€ - 50.000€">20.000€ a 50.000€</option>
                  <option value="Mais de 50.000€">Mais de 50.000€</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Cidade</Label>
                <Input
                  required
                  placeholder="Cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="h-9 rounded-xl border-purple-200 dark:border-white/15 text-xs bg-purple-50/20 dark:bg-white/5"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">Distrito</Label>
                <Input
                  required
                  placeholder="Distrito"
                  value={formData.distrito}
                  onChange={(e) => setFormData({ ...formData, distrito: e.target.value })}
                  className="h-9 rounded-xl border-purple-200 dark:border-white/15 text-xs bg-purple-50/20 dark:bg-white/5"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold">Apresentação / Motivo do Interesse</Label>
              <textarea
                required
                rows={3}
                placeholder="Detalhes adicionais de contato..."
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/20 dark:bg-white/5 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewCandidateOpen(false)}
                className="rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                {actionLoading ? 'Salvando...' : 'Salvar Candidato'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
