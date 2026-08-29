'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  UserCheck,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Search,
  RefreshCw,
  MessageSquare,
  Building2,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react'

export interface FranchiseCandidate {
  id: string
  type: 'FRANCHISE_APPLICATION'
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

export default function FranchiseCandidatesView() {
  const [candidates, setCandidates] = useState<FranchiseCandidate[]>([])
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
      fetchCandidates(false)
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
      fetchCandidates(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir candidatura')
    } finally {
      setActionLoading(false)
    }
  }

  const fetchCandidates = useCallback(async (isManual = false) => {
    setLoading(true)
    try {
      const res = await fetch('/api/franchise-requests')
      const data = await res.json()
      if (Array.isArray(data.requests)) {
        const candList = data.requests.filter((r: any) => r.type === 'FRANCHISE_APPLICATION')
        setCandidates(candList)
        if (isManual) {
          toast.success('Candidaturas sincronizadas')
        }
      }
    } catch {
      if (isManual) {
        toast.error('Erro ao carregar candidaturas')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCandidates(false)
  }, [fetchCandidates])

  const handleUpdateCandidateStatus = async (
    id: string,
    newStatus: 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED',
    notes?: string
  ) => {
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
      toast.success(
        `Candidatura atualizada para: ${
          newStatus === 'CONTACTED'
            ? 'Contactado'
            : newStatus === 'APPROVED'
            ? 'Aprovado'
            : newStatus === 'REJECTED'
            ? 'Arquivado'
            : 'Pendente'
        }`
      )
      setNotesModalOpen(false)
      fetchCandidates(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar candidatura')
    } finally {
      setActionLoading(false)
    }
  }

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    const finalPhone = cleanPhone.startsWith('351')
      ? cleanPhone
      : cleanPhone.length === 9
      ? `351${cleanPhone}`
      : cleanPhone
    const msg = encodeURIComponent(
      `Olá ${name}, agradecemos o seu interesse na franquia Açaí da Rose! Podemos conversar sobre a sua candidatura?`
    )
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

  const totalLeads = candidates.length
  const pendingCount = candidates.filter((c) => c.status === 'PENDING').length
  const contactedCount = candidates.filter((c) => c.status === 'CONTACTED').length
  const approvedCount = candidates.filter((c) => c.status === 'APPROVED').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Orientador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10 shadow-xs">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
              Candidaturas & Expansão de Franquia
            </h1>
            <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium">
              Gestão de interessados recebidos pelo formulário &quot;Seja um Franchisado&quot; do site oficial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setNewCandidateOpen(true)}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white cursor-pointer shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Novo Candidato</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchCandidates(true)}
            disabled={loading}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Leads</span>
          </Button>
        </div>
      </div>

      {/* 4 Cards de Métricas do Funil de Expansão */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] shadow-xs rounded-3xl p-4">
          <div className="text-xs font-bold text-purple-900/70 dark:text-purple-300/70 uppercase">Total de Leads</div>
          <div className="text-2xl font-black text-purple-950 dark:text-white mt-1">{totalLeads}</div>
          <div className="text-[11px] text-purple-700/80 dark:text-purple-300/60 font-medium mt-0.5">Submissões no site</div>
        </Card>

        <Card className="border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs rounded-3xl p-4">
          <div className="text-xs font-bold text-amber-900/80 dark:text-amber-300 uppercase">Novos Pendentes</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-800 dark:text-amber-300/70 font-medium mt-0.5">Aguardando 1º contacto</div>
        </Card>

        <Card className="border border-purple-200 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs rounded-3xl p-4">
          <div className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase">Em Entrevista</div>
          <div className="text-2xl font-black text-purple-700 dark:text-pink-400 mt-1">{contactedCount}</div>
          <div className="text-[11px] text-purple-800 dark:text-purple-300/70 font-medium mt-0.5">Contactados / Negociação</div>
        </Card>

        <Card className="border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs rounded-3xl p-4">
          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase">Aprovados</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</div>
          <div className="text-[11px] text-emerald-800 dark:text-emerald-300/70 font-medium mt-0.5">Perfil homologado</div>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
          <Input
            placeholder="Pesquisar candidato por nome, distrito, cidade ou e-mail..."
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

      {/* Tabela de Candidaturas */}
      <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-purple-150 dark:border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black text-purple-950 dark:text-white">
            Interessados em Abrir Franquia
          </CardTitle>
          <span className="text-xs text-purple-700/80 dark:text-purple-300/70 font-medium">
            {filteredCandidates.length} registo(s)
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                <tr>
                  <th className="py-3 px-4">Candidato / Contactos</th>
                  <th className="py-3 px-4">Localidade Pretendida</th>
                  <th className="py-3 px-4">Capital Disponível</th>
                  <th className="py-3 px-4">Data (Hora de Portugal)</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ações de Gestão</th>
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
                        <div className="font-bold text-purple-950 dark:text-white text-xs">{cand.candidateName}</div>
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
                        {new Date(cand.createdAt).toLocaleString('pt-PT', {
                          timeZone: 'Europe/Lisbon',
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
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

      {/* Modal de Gestão & Entrevistas */}
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
                  placeholder="Ex: Reunião inicial realizada. Candidato possui ponto comercial em vista..."
                  className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 p-2.5 text-xs text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Atualizar Fase do Candidato</Label>
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
