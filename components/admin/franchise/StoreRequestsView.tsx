'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  Upload,
  Link2,
  Sparkles,
} from 'lucide-react'
import { useHighlightsStore } from '@/lib/stores/highlightsStore'
import { useFranchiseStore } from '@/lib/stores/franchiseStore'
import { useAuthStore } from '@/lib/stores/authStore'

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
  badgeLabel?: string
  badgeColor?: string
  videoUrl?: string
}

interface StoreRequestsViewProps {
  tenantId?: string
}

const TAG_COLOR_OPTIONS = [
  { id: 'bg-pink-600', name: 'Rosa Vibrante', class: 'bg-pink-600 text-white' },
  { id: 'bg-fuchsia-600', name: 'Fúcsia Imperial', class: 'bg-fuchsia-600 text-white' },
  { id: 'bg-purple-600', name: 'Roxo Açaí', class: 'bg-purple-600 text-white' },
  { id: 'bg-emerald-600', name: 'Verde Esmeralda', class: 'bg-emerald-600 text-white' },
  { id: 'bg-amber-600', name: 'Dourado / Âmbar', class: 'bg-amber-600 text-white' },
]

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

  // Modal de Sugestão de Destaque por Franqueado
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [mediaMode, setMediaMode] = useState<'UPLOAD' | 'URL'>('URL')
  const [uploadFileName, setUploadFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [suggestionForm, setSuggestionForm] = useState({
    title: '',
    subtitle: '',
    badgeLabel: 'PROMOÇÃO LOCAL',
    badgeColor: 'bg-pink-600',
    suggestedPrice: 9.90,
    imageUrl: '/images/official/acai_copo_500g.jpg',
    videoUrl: '',
    reason: '',
  })

  const { addHighlight } = useHighlightsStore()
  const { currentTenant } = useFranchiseStore()
  const { user } = useAuthStore()

  const fetchRequests = useCallback(async (isManual = false) => {
    setLoading(true)
    try {
      const res = await fetch('/api/franchise-requests')
      const data = await res.json()
      if (Array.isArray(data.requests)) {
        const storeList = data.requests.filter(
          (r: any) => r.type !== 'FRANCHISE_APPLICATION' && r.type !== 'CONTACT_REQUEST'
        )
        setRequests(storeList)
        if (isManual) {
          toast.success('Solicitações da rede atualizadas')
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadFileName(file.name)
    const isVideo = file.type.startsWith('video/')
    const reader = new FileReader()

    reader.onload = (event) => {
      const result = event.target?.result as string
      if (isVideo) {
        setSuggestionForm((prev) => ({
          ...prev,
          videoUrl: result,
        }))
      } else {
        setSuggestionForm((prev) => ({
          ...prev,
          imageUrl: result,
          videoUrl: '',
        }))
      }
      toast.success(`Arquivo "${file.name}" carregado com sucesso!`)
    }

    reader.readAsDataURL(file)
  }

  const handleSendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!suggestionForm.title.trim()) {
      toast.error('Informe o título do destaque ou promoção')
      return
    }

    setSuggestionLoading(true)
    try {
      const payload = {
        tenantId: currentTenant?.id || tenantId || '11111111-1111-1111-1111-111111111111',
        storeName: currentTenant?.name || 'Loja Franqueada',
        managerName: user?.name || 'Gerente de Loja',
        type: 'SPECIAL_PROMO',
        productName: suggestionForm.title.trim(),
        productImage: suggestionForm.imageUrl,
        category: 'Destaques & Stories',
        currentPrice: 0,
        suggestedPrice: Number(suggestionForm.suggestedPrice) || 0,
        reason: suggestionForm.reason.trim() || 'Sugestão de destaque para o cardápio da rede',
        badgeLabel: suggestionForm.badgeLabel.trim() || 'DESTAQUE',
        badgeColor: suggestionForm.badgeColor,
        videoUrl: suggestionForm.videoUrl,
        subtitle: suggestionForm.subtitle.trim(),
      }

      const res = await fetch('/api/franchise-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Erro ao enviar sugestão')

      toast.success('Sugestão de destaque enviada para avaliação da Franqueadora Master!')
      setSuggestionModalOpen(false)
      fetchRequests(false)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao submeter sugestão')
    } finally {
      setSuggestionLoading(false)
    }
  }

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

      // Se for uma aprovação de destaque/promoção, publica automaticamente nos highlights
      if (deliberateAction === 'APPROVE' && selectedRequest.type === 'SPECIAL_PROMO') {
        addHighlight({
          id: `hl-${Date.now()}`,
          title: selectedRequest.productName,
          subtitle: (selectedRequest as any).subtitle || selectedRequest.reason || 'Destaque Oficial da Rede',
          badgeLabel: selectedRequest.badgeLabel || 'DESTAQUE APROVADO',
          badgeColor: selectedRequest.badgeColor || 'bg-pink-600',
          price: Number(selectedRequest.suggestedPrice) || 0,
          imageUrl: selectedRequest.productImage || '/images/official/acai_copo_500g.jpg',
          videoUrl: selectedRequest.videoUrl,
          mediaType: selectedRequest.videoUrl ? 'VIDEO' : 'IMAGE',
          active: true,
          displayOrder: 99,
        })
      }

      toast.success(
        deliberateAction === 'APPROVE'
          ? 'Solicitação aprovada e publicada nos Destaques da Rede!'
          : 'Solicitação recusada.'
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#160228] p-5 rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-purple-950 dark:text-white tracking-tight">
            Solicitações da Rede & Filiais
          </h1>
          <p className="text-xs text-purple-700/80 dark:text-purple-300/70 font-semibold mt-0.5">
            Canal oficial para franqueados sugerirem novos destaques, stories ou ajustes de cardápio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchRequests(true)}
            className="h-10 px-3 rounded-2xl border-purple-200 dark:border-white/15 cursor-pointer text-xs font-bold text-purple-950 dark:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            onClick={() => setSuggestionModalOpen(true)}
            className="h-10 px-5 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-purple-700/20 cursor-pointer"
          >
            + Sugerir Novo Destaque
          </Button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400" />
          <Input
            placeholder="Pesquisar por produto, loja ou gerente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 rounded-2xl border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-xs text-purple-950 dark:text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-2xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-xs font-bold text-purple-950 dark:text-white focus:outline-none"
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
            Solicitações e Sugestões Enviadas pelas Lojas
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
                  <th className="py-3 px-4">Tipo / Item</th>
                  <th className="py-3 px-4">Preço Sugerido</th>
                  <th className="py-3 px-4">Motivo / Justificativa</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Deliberação Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-purple-700/80 dark:text-purple-300/70 text-xs font-medium">
                      Nenhuma solicitação de loja encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                        <div>{req.storeName}</div>
                        <div className="text-[10px] text-purple-700/80 dark:text-purple-300/70 font-normal">
                          {req.managerName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-900 dark:text-purple-200">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={`text-[9px] font-extrabold ${
                              req.type === 'SPECIAL_PROMO'
                                ? 'bg-pink-600 text-white'
                                : 'bg-purple-600 text-white'
                            }`}
                          >
                            {req.type === 'SPECIAL_PROMO' ? 'Destaque Sugerido' : 'Alteração Preço'}
                          </Badge>
                          <span>{req.productName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-purple-950 dark:text-pink-300 text-sm">
                        {formatCurrency(req.suggestedPrice)}
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
                                setDeliberateNotes('Aprovado e publicado nos destaques da rede.')
                                setDeliberateModalOpen(true)
                              }}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer shadow-xs"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              <span>Aprovar & Publicar</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedRequest(req)
                                setDeliberateAction('REJECT')
                                setDeliberateNotes('Sugestão fora do padrão da rede.')
                                setDeliberateModalOpen(true)
                              }}
                              className="h-7 px-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-[11px] font-bold rounded-lg cursor-pointer"
                            >
                              <X className="h-3 w-3 mr-1" />
                              <span>Recusar</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-purple-700/60 dark:text-purple-300/50 font-medium">
                            Resolvido
                          </span>
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

      {/* Modal de Sugestão de Novo Destaque pelo Franqueado */}
      <Dialog open={suggestionModalOpen} onOpenChange={setSuggestionModalOpen}>
        <DialogContent className="max-w-xl bg-white dark:bg-[#18022b] text-slate-900 dark:text-white border-purple-150 dark:border-white/15 rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              Sugerir Novo Destaque ou Promoção à Franqueadora
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-300/70 font-semibold">
              Envie a proposta comercial para a Franqueadora Master avaliar e publicar no menu visual.
            </p>
          </DialogHeader>

          <form onSubmit={handleSendSuggestion} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                Título da Promoção / Destaque *
              </Label>
              <Input
                required
                value={suggestionForm.title}
                onChange={(e) => setSuggestionForm({ ...suggestionForm, title: e.target.value })}
                placeholder="Ex: Combo Família Açaí ou Taça Especial da Semana"
                className="h-10 text-xs rounded-xl bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                Descrição do Item
              </Label>
              <Input
                value={suggestionForm.subtitle}
                onChange={(e) => setSuggestionForm({ ...suggestionForm, subtitle: e.target.value })}
                placeholder="Ex: Acompanha frutas frescas à vontade e leite condensado"
                className="h-10 text-xs rounded-xl bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15 mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Preço Sugerido (€) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={suggestionForm.suggestedPrice}
                  onChange={(e) =>
                    setSuggestionForm({ ...suggestionForm, suggestedPrice: Number(e.target.value) })
                  }
                  className="h-10 text-xs rounded-xl bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15 mt-1 font-mono font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Tag Sugerida
                </Label>
                <Input
                  value={suggestionForm.badgeLabel}
                  onChange={(e) => setSuggestionForm({ ...suggestionForm, badgeLabel: e.target.value })}
                  placeholder="Ex: PROMOÇÃO LOCAL"
                  className="h-10 text-xs rounded-xl bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15 mt-1 font-bold uppercase"
                />
              </div>
            </div>

            {/* Mídia: Upload ou URL */}
            <div className="p-3 bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">
                  Mídia Demonstrativa
                </Label>
                <div className="flex items-center gap-1 bg-purple-100 dark:bg-white/10 p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMediaMode('UPLOAD')}
                    className={`px-2 py-0.5 rounded-lg ${
                      mediaMode === 'UPLOAD' ? 'bg-purple-700 text-white' : 'text-purple-900 dark:text-purple-200'
                    }`}
                  >
                    Upload Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaMode('URL')}
                    className={`px-2 py-0.5 rounded-lg ${
                      mediaMode === 'URL' ? 'bg-purple-700 text-white' : 'text-purple-900 dark:text-purple-200'
                    }`}
                  >
                    URL
                  </button>
                </div>
              </div>

              {mediaMode === 'UPLOAD' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-purple-300 dark:border-white/20 rounded-xl p-3 text-center cursor-pointer hover:bg-purple-100/50 dark:hover:bg-white/5 transition"
                  >
                    <Upload className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-[11px] font-bold text-purple-950 dark:text-white">
                      {uploadFileName || 'Carregar Foto ou Vídeo'}
                    </p>
                  </div>
                </div>
              ) : (
                <Input
                  value={suggestionForm.imageUrl}
                  onChange={(e) => setSuggestionForm({ ...suggestionForm, imageUrl: e.target.value })}
                  placeholder="URL da Imagem..."
                  className="h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15"
                />
              )}
            </div>

            <div>
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                Justificativa Comercial da Loja
              </Label>
              <textarea
                rows={2}
                value={suggestionForm.reason}
                onChange={(e) => setSuggestionForm({ ...suggestionForm, reason: e.target.value })}
                placeholder="Por que esta promoção terá boa aceitação dos clientes na sua região?"
                className="w-full rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 p-2.5 text-xs text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 mt-1"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSuggestionModalOpen(false)}
                className="rounded-xl border-purple-200 dark:border-white/15 text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={suggestionLoading}
                className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 text-white font-bold text-xs shadow-md"
              >
                {suggestionLoading ? 'A submeter...' : 'Enviar Sugestão'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Deliberação Master */}
      {selectedRequest && (
        <Dialog open={deliberateModalOpen} onOpenChange={setDeliberateModalOpen}>
          <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
                {deliberateAction === 'APPROVE' ? 'Aprovar & Publicar Destaque' : 'Recusar Sugestão'}
              </DialogTitle>
              <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
                {selectedRequest.storeName} · {selectedRequest.productName}
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-purple-700/80 dark:text-purple-300/70 block text-[11px] font-bold">
                    Preço Sugerido
                  </span>
                  <span className="font-mono font-black text-purple-950 dark:text-pink-300 text-base">
                    {formatCurrency(selectedRequest.suggestedPrice)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-purple-700/80 dark:text-purple-300/70 block text-[11px] font-bold">
                    Tipo
                  </span>
                  <span className="font-bold text-purple-950 dark:text-white text-xs">
                    {selectedRequest.type === 'SPECIAL_PROMO' ? 'Destaque / Story' : 'Alteração Preço'}
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
                className="rounded-xl border-purple-200 dark:border-white/15 text-xs font-bold"
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
                {actionLoading
                  ? 'A processar...'
                  : deliberateAction === 'APPROVE'
                  ? 'Confirmar Aprovação'
                  : 'Confirmar Recusa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
